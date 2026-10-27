import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { pathToFileURL } from 'url';
import * as React from 'react';

Object.assign(process.env, {
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  RESEND_API_KEY: 're_test',
  RESEND_FROM_EMAIL: 'test@example.com',
  RESEND_AUDIENCE_ID: 'audience',
  UNSUBSCRIBE_KEY: 'test',
  CRON_KEY: 'cron',
});

let sendStatus = 200;

globalThis.fetch = async input => {
  const url = String(input);
  if (url.startsWith('https://api.resend.com/segments/audience/contacts')) {
    return Response.json({
      object: 'list',
      data: [{ id: 'tim', email: 's@timconnors.co', unsubscribed: false }],
      has_more: false,
    });
  }
  if (url === 'https://api.resend.com/emails') {
    if (sendStatus !== 200) {
      return Response.json(
        { name: 'validation_error', message: 'bad from', statusCode: 422 },
        { status: sendStatus }
      );
    }
    return Response.json({ id: 'email' });
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

function testRequest() {
  return new Request('http://localhost:3000/api/test-newsletter', {
    method: 'POST',
    headers: { Authorization: 'Bearer cron' },
  });
}

describe('POST /api/test-newsletter', () => {
  beforeEach(() => {
    sendStatus = 200;
  });

  it('returns 200 when Resend accepts the email', async () => {
    const res = await POST(testRequest());
    assert.equal(res.status, 200);
  });

  it('returns 500 when Resend rejects the email', async () => {
    sendStatus = 422;
    const res = await POST(testRequest());
    assert.equal(res.status, 500);
  });
});
