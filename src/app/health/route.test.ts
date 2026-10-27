import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Point the database at a throwaway directory before db.ts is loaded
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'health-test-'));
process.env.RAILWAY_VOLUME_MOUNT_PATH = dataDir;
const env = {
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  SESSION_SECRET: 'test',
  RESEND_API_KEY: 're_test',
  RESEND_FROM_EMAIL: 'test@example.com',
  RESEND_AUDIENCE_ID: 'audience',
  UNSUBSCRIBE_KEY: 'test',
  CRON_KEY: 'test',
  ANTHROPIC_API_KEY: 'sk-ant-test',
};

const realFetch = globalThis.fetch;
let anthropicStatus = 200;

const { GET } = await import('./route');
const { healthResponse, runChecks } = await import('@/lib/server/health');
const { getDb } = await import('@/lib/server/db');

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('GET /health', () => {
  before(() => {
    globalThis.fetch = async input => {
      const url = String(input);
      if (url.startsWith('https://api.anthropic.com/')) {
        return new Response('{}', { status: anthropicStatus });
      }
      if (url.startsWith('https://api.resend.com/')) {
        return Response.json({ id: 'audience', name: 'Newsletter' });
      }
      throw new Error(`unexpected fetch to ${url}`);
    };
  });

  after(() => {
    globalThis.fetch = realFetch;
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    Object.assign(process.env, env);
    anthropicStatus = 200;
    getDb().exec('DELETE FROM submissions');
  });

  it('returns 200 with no errors when healthy', async () => {
    const res = await GET();
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
    assert.match(res.headers.get('Content-Type') ?? '', /application\/json/);
    assert.deepEqual(await res.json(), { errors: [] });
  });

  it('returns 503 when the newsletter cron has stopped sending', async () => {
    getDb()
      .prepare(
        `INSERT INTO submissions (created_at, headline, details, user_email, approved)
         VALUES (?, 'Drummer wanted', 'Details', 'a@example.com', 1)`
      )
      .run(daysAgoIso(10));

    const res = await GET();
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), {
      errors: ['newsletter: approved post unsent for 10d, cron not running'],
    });
  });

  it('reports submissions the LLM never assessed', async () => {
    getDb()
      .prepare(
        `INSERT INTO submissions (created_at, headline, details, user_email)
         VALUES (?, 'Bassist wanted', 'Details', 'a@example.com')`
      )
      .run(daysAgoIso(1));

    const res = await GET();
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), {
      errors: ['assessment: 1 submission not assessed after 1h'],
    });
  });

  it('reports a retired model and missing env vars by name only', async () => {
    anthropicStatus = 404;
    delete process.env.CRON_KEY;

    const res = await GET();
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), {
      errors: [
        'env: CRON_KEY missing',
        'anthropic: model claude-3-haiku-20240307 not found',
      ],
    });
  });
});

describe('runChecks', () => {
  it('times out a hanging check without waiting for it', async () => {
    const started = Date.now();
    const errors = await runChecks(
      [
        ['ok', async () => {}],
        ['hang', () => new Promise(() => {})],
      ],
      50
    );
    assert.deepEqual(errors, ['hang: timeout after 50ms']);
    assert.ok(Date.now() - started < 1000);
  });

  it('never leaks secrets from a failing dependency', async () => {
    const res = await healthResponse([
      [
        'db',
        async () => {
          throw new Error(
            'connect failed: postgres://admin:hunter2@db.internal:5432/prod'
          );
        },
      ],
    ]);
    const text = await res.text();
    for (const secret of ['hunter2', 'admin', 'db.internal', '5432']) {
      assert.ok(!text.includes(secret), `response leaked ${secret}`);
    }
    assert.equal(res.status, 503);
    assert.deepEqual(JSON.parse(text), { errors: ['db: check failed'] });
  });
});
