import { after, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import * as React from 'react';

// Point the database at a throwaway directory before db.ts is loaded
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'newsletter-test-'));
Object.assign(process.env, {
  RAILWAY_VOLUME_MOUNT_PATH: dataDir,
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  RESEND_API_KEY: 're_test',
  RESEND_FROM_EMAIL: 'test@example.com',
  RESEND_AUDIENCE_ID: 'audience',
  UNSUBSCRIBE_KEY: 'test',
  CRON_KEY: 'cron',
});

const realFetch = globalThis.fetch;
let contacts: { id: string; email: string; unsubscribed: boolean }[] = [];
let contactsStatus = 200;
// Batches whose first recipient is in this set fail every attempt
const failingBatches = new Set<string>();
const batchAttempts: string[][] = [];

globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.startsWith('https://api.resend.com/audiences/audience/contacts')) {
    if (contactsStatus !== 200) {
      return Response.json(
        { name: 'application_error', message: 'boom', statusCode: 500 },
        { status: contactsStatus }
      );
    }
    return Response.json({ object: 'list', data: contacts });
  }
  if (url === 'https://api.resend.com/emails/batch') {
    const emails = JSON.parse(String(init?.body)) as { to: string }[];
    const recipients = emails.map(email => email.to);
    batchAttempts.push(recipients);
    if (failingBatches.has(recipients[0])) {
      return Response.json(
        { name: 'application_error', message: 'boom', statusCode: 500 },
        { status: 500 }
      );
    }
    return Response.json({ data: recipients.map((_, i) => ({ id: `${i}` })) });
  }
  throw new Error(`unexpected fetch to ${url}`);
};

// Node can't see named exports of .tsx files loaded under tsx, so stand in
// for the email template. Rendering isn't what these tests cover.
mock.module(
  pathToFileURL(
    path.join(process.cwd(), 'src/components/emails/Newsletter.tsx')
  ).href,
  {
    namedExports: {
      Newsletter: () => React.createElement('p', null, 'Newsletter'),
    },
  }
);

const { POST } = await import('./route');
const { getDb, insertSubmission, setSubmissionApproved } = await import(
  '@/lib/server/db'
);

function cronRequest() {
  return new Request('http://localhost:3000/api/cron/newsletter', {
    method: 'POST',
    headers: { Authorization: 'Bearer cron' },
  });
}

function makeContacts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `contact-${i}`,
    email: `musician${i}@example.com`,
    unsubscribed: false,
  }));
}

function unsentCount() {
  return getDb()
    .prepare<
      [],
      { n: number }
    >('SELECT COUNT(*) AS n FROM submissions WHERE sent_at IS NULL')
    .get()!.n;
}

describe('POST /api/cron/newsletter', () => {
  beforeEach(() => {
    getDb().exec('DELETE FROM submissions');
    const submission = insertSubmission({
      headline: 'Drummer wanted',
      details: 'Details',
      user_email: 'poster@example.com',
    });
    setSubmissionApproved(submission.id, true);
    contacts = makeContacts(3);
    contactsStatus = 200;
    failingBatches.clear();
    batchAttempts.length = 0;
  });

  after(() => {
    globalThis.fetch = realFetch;
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  it('sends to subscribed contacts and marks submissions sent', async () => {
    contacts[1].unsubscribed = true;

    const res = await POST(cronRequest());

    assert.equal(res.status, 200);
    assert.deepEqual(batchAttempts, [
      ['musician0@example.com', 'musician2@example.com'],
    ]);
    assert.equal(unsentCount(), 0);
  });

  it('fails without marking sent when contacts cannot be fetched', async () => {
    contactsStatus = 500;

    const res = await POST(cronRequest());

    assert.equal(res.status, 500);
    assert.equal(batchAttempts.length, 0);
    assert.equal(unsentCount(), 1);
  });

  it('leaves submissions unsent when every batch fails', async () => {
    failingBatches.add('musician0@example.com');

    const res = await POST(cronRequest());

    assert.equal(res.status, 500);
    assert.equal(batchAttempts.length, 3);
    assert.equal(unsentCount(), 1);
  });

  it('marks sent but reports failure when only some batches fail', async () => {
    contacts = makeContacts(150);
    failingBatches.add('musician100@example.com');

    const res = await POST(cronRequest());

    assert.equal(res.status, 500);
    assert.match((await res.json()).message, /1 of 2 batches failed/);
    // First batch once, second batch three times
    assert.equal(batchAttempts.length, 4);
    assert.equal(unsentCount(), 0);
  });
});
