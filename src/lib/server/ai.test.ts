import { after, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Point the database at a throwaway directory before db.ts is loaded
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-test-'));
process.env.RAILWAY_VOLUME_MOUNT_PATH = dataDir;
process.env.ANTHROPIC_API_KEY = 'sk-ant-test';

const realFetch = globalThis.fetch;
const requestedModels: string[] = [];
let failRequests = false;

globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (!url.startsWith('https://api.anthropic.com/v1/messages')) {
    throw new Error(`unexpected fetch to ${url}`);
  }
  requestedModels.push(JSON.parse(String(init?.body)).model);
  if (failRequests) {
    return Response.json(
      { type: 'error', error: { type: 'not_found_error', message: 'model' } },
      { status: 404 }
    );
  }
  return Response.json({
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-haiku-5-5',
    content: [
      {
        type: 'tool_use',
        id: 'tool_test',
        name: 'json',
        input: { approved: true },
      },
    ],
    stop_reason: 'tool_use',
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  });
};

const { assessPendingSubmissions, ASSESSMENT_MODEL } = await import('./ai');
const { getDb } = await import('./db');

function insertSubmission(daysAgo: number, approved: number | null = null) {
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return getDb()
    .prepare(
      `INSERT INTO submissions (created_at, headline, details, user_email, approved)
       VALUES (?, 'Drummer wanted', 'Details', 'a@example.com', ?)`
    )
    .run(createdAt.toISOString(), approved).lastInsertRowid;
}

function approvedOf(id: number | bigint) {
  return getDb()
    .prepare<
      [number | bigint],
      { approved: number | null }
    >('SELECT approved FROM submissions WHERE id = ?')
    .get(id)!.approved;
}

describe('assessPendingSubmissions', () => {
  beforeEach(() => {
    getDb().exec('DELETE FROM submissions');
    requestedModels.length = 0;
    failRequests = false;
  });

  after(() => {
    globalThis.fetch = realFetch;
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  it('assesses recent unassessed submissions with the current model', async () => {
    const stuck = insertSubmission(3);
    const alreadyRejected = insertSubmission(3, 0);
    const stale = insertSubmission(45);

    const result = await assessPendingSubmissions();

    assert.deepEqual(result, { assessed: 1, failed: 0 });
    assert.deepEqual(requestedModels, [ASSESSMENT_MODEL]);
    assert.equal(approvedOf(stuck), 1);
    assert.equal(approvedOf(alreadyRejected), 0);
    assert.equal(approvedOf(stale), null);
  });

  it('counts failures and leaves those submissions unassessed', async () => {
    failRequests = true;
    const stuck = insertSubmission(1);

    const result = await assessPendingSubmissions();

    assert.deepEqual(result, { assessed: 0, failed: 1 });
    assert.equal(approvedOf(stuck), null);
  });
});
