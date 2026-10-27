import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDb } from './db';

// Read-only checks behind GET /health, polled daily by the project monitor.
// Every error string can wake someone up, so only report things that mean
// the app is broken for users, and never include secrets, paths or PII.

export type Check = [name: string, run: () => Promise<void>];

const CHECK_TIMEOUT_MS = 3000;
const HOUR_MS = 60 * 60 * 1000;

// The newsletter cron runs weekly, so an approved post should never wait
// longer than a week. Allow an extra day of slack before alerting.
const NEWSLETTER_MAX_PENDING_HOURS = 8 * 24;
// Submissions are assessed by the LLM right after they are created
const ASSESSMENT_GRACE_HOURS = 1;
// Ignore unassessed submissions older than this so a single historical
// failure doesn't alert forever
const ASSESSMENT_LOOKBACK_HOURS = 7 * 24;

// Must match the model used in ./ai.ts
const ASSESSMENT_MODEL = 'claude-3-haiku-20240307';

const REQUIRED_ENV = [
  'NEXT_PUBLIC_APP_URL',
  'SESSION_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'RESEND_AUDIENCE_ID',
  'UNSUBSCRIBE_KEY',
  'CRON_KEY',
  'ANTHROPIC_API_KEY',
];

const RESEND_KEY_ERRORS = new Set<string>([
  'missing_api_key',
  'invalid_api_key',
  'invalid_api_Key',
  'restricted_api_key',
  'validation_error',
]);

/** An error whose message is safe to show in the health response */
class HealthError extends Error {}

function hoursSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / HOUR_MS;
}

function hoursAgoIso(hours: number) {
  return new Date(Date.now() - hours * HOUR_MS).toISOString();
}

export const checks: Check[] = [
  [
    'env',
    async () => {
      const missing = REQUIRED_ENV.filter(name => !process.env[name]);
      // Without the volume, the database is wiped on every deploy
      if (
        process.env.RAILWAY_ENVIRONMENT_NAME &&
        !process.env.RAILWAY_VOLUME_MOUNT_PATH
      ) {
        missing.push('RAILWAY_VOLUME_MOUNT_PATH');
      }
      if (missing.length) {
        throw new HealthError(`${missing.join(', ')} missing`);
      }
    },
  ],
  [
    'db',
    async () => {
      getDb().prepare('SELECT 1').get();
    },
  ],
  [
    'newsletter',
    async () => {
      const oldest = getDb()
        .prepare<[], { created_at: string }>(
          `SELECT created_at FROM submissions
           WHERE sent_at IS NULL AND approved = 1
           ORDER BY created_at ASC LIMIT 1`
        )
        .get();
      if (!oldest) return;
      const hours = hoursSince(oldest.created_at);
      if (hours > NEWSLETTER_MAX_PENDING_HOURS) {
        throw new HealthError(
          `approved post unsent for ${Math.floor(hours / 24)}d, cron not running`
        );
      }
    },
  ],
  [
    'assessment',
    async () => {
      const { count } = getDb()
        .prepare<[string, string], { count: number }>(
          `SELECT COUNT(*) AS count FROM submissions
           WHERE approved IS NULL AND created_at < ? AND created_at > ?`
        )
        .get(
          hoursAgoIso(ASSESSMENT_GRACE_HOURS),
          hoursAgoIso(ASSESSMENT_LOOKBACK_HOURS)
        )!;
      if (count > 0) {
        throw new HealthError(
          `${count} submission${count === 1 ? '' : 's'} not assessed after ${ASSESSMENT_GRACE_HOURS}h`
        );
      }
    },
  ],
  [
    'anthropic',
    async () => {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new HealthError('no API key');
      // Free metadata lookup: confirms the key works and the model still exists
      const res = await fetch(
        `https://api.anthropic.com/v1/models/${ASSESSMENT_MODEL}`,
        {
          headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
          cache: 'no-store',
        }
      );
      if (res.status === 404) {
        throw new HealthError(`model ${ASSESSMENT_MODEL} not found`);
      }
      if (res.status === 401 || res.status === 403) {
        throw new HealthError('API key rejected');
      }
      if (!res.ok) throw new Error(`Anthropic responded ${res.status}`);
    },
  ],
  [
    'resend',
    async () => {
      const key = process.env.RESEND_API_KEY;
      const audienceId = process.env.RESEND_AUDIENCE_ID;
      if (!key || !audienceId) throw new HealthError('not configured');
      // Read-only: confirms the key works and the newsletter audience exists
      const { error } = await new Resend(key).audiences.get(audienceId);
      if (!error) return;
      if (error.name === 'not_found') {
        throw new HealthError('newsletter audience not found');
      }
      // The SDK's types lag the API, which also returns invalid_api_key,
      // restricted_api_key, and validation_error for a malformed key
      if (RESEND_KEY_ERRORS.has(error.name)) {
        throw new HealthError('API key rejected');
      }
      throw new Error(`Resend error ${error.name}`);
    },
  ],
];

function withTimeout<T>(promise: Promise<T>, ms: number) {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new HealthError(`timeout after ${ms}ms`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function runChecks(
  toRun: Check[] = checks,
  timeoutMs = CHECK_TIMEOUT_MS
) {
  const results = await Promise.allSettled(
    toRun.map(([, run]) => withTimeout(Promise.resolve().then(run), timeoutMs))
  );
  return results.flatMap((result, i) => {
    if (result.status === 'fulfilled') return [];
    const name = toRun[i][0];
    // Only a HealthError's message reaches the response, and it is always
    // written by us. Driver and SDK errors can carry hostnames or
    // credentials, so they are logged to Railway and reported generically.
    if (result.reason instanceof HealthError) {
      return [`${name}: ${result.reason.message}`.slice(0, 100)];
    }
    console.error(`health check "${name}" failed`, result.reason);
    return [`${name}: check failed`];
  });
}

export async function healthResponse(toRun: Check[] = checks) {
  let errors: string[];
  try {
    errors = await runChecks(toRun);
  } catch (error) {
    console.error('health check runner failed', error);
    errors = ['health: check failed'];
  }
  return NextResponse.json(
    { errors },
    {
      status: errors.length ? 503 : 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
