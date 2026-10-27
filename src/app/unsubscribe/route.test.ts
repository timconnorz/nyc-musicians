import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.RESEND_API_KEY = 're_test';

const { GET } = await import('./route');

describe('GET /unsubscribe', () => {
  it('does not inject the token into the page', async () => {
    const token = '"><script>alert(1)</script>';
    const res = await GET(
      new Request(
        `http://localhost:3000/unsubscribe?token=${encodeURIComponent(token)}`
      )
    );
    const html = await res.text();

    assert.ok(!html.includes('<script>'));
    assert.ok(
      html.includes(`action="/unsubscribe?token=${encodeURIComponent(token)}"`)
    );
  });
});
