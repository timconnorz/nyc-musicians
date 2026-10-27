import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// On Railway the volume is mounted at RAILWAY_VOLUME_MOUNT_PATH (/data).
// Locally the database lives in ./data, which is gitignored.
const dataDir =
  process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), 'data');

export interface Submission {
  id: number;
  created_at: string;
  headline: string;
  details: string;
  user_email: string;
  approved: boolean | null;
  sent_at: string | null;
}

// SQLite has no boolean type, so approved is stored as 0/1
type SubmissionRow = Omit<Submission, 'approved'> & { approved: number | null };

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    fs.mkdirSync(dataDir, { recursive: true });
    db = new Database(path.join(dataDir, 'nyc-musicians.db'));
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        headline TEXT NOT NULL,
        details TEXT NOT NULL,
        user_email TEXT NOT NULL,
        approved INTEGER,
        sent_at TEXT
      );

      CREATE TABLE IF NOT EXISTS login_codes (
        email TEXT PRIMARY KEY,
        code_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0
      );
    `);
  }
  return db;
}

function toSubmission(row: SubmissionRow): Submission {
  return {
    ...row,
    approved: row.approved === null ? null : row.approved === 1,
  };
}

export function insertSubmission(
  submission: Pick<Submission, 'headline' | 'details' | 'user_email'>
) {
  const row = getDb()
    .prepare<[string, string, string], SubmissionRow>(
      `INSERT INTO submissions (headline, details, user_email)
       VALUES (?, ?, ?)
       RETURNING *`
    )
    .get(submission.headline, submission.details, submission.user_email);

  if (!row) throw new Error('Failed to insert submission');
  return toSubmission(row);
}

export function setSubmissionApproved(id: number, approved: boolean) {
  getDb()
    .prepare<[number, number]>(
      'UPDATE submissions SET approved = ? WHERE id = ?'
    )
    .run(approved ? 1 : 0, id);
}

// Approved submissions which have not yet been sent, oldest first
export function getUnsentApprovedSubmissions() {
  return getDb()
    .prepare<[], SubmissionRow>(
      `SELECT * FROM submissions
       WHERE sent_at IS NULL AND approved = 1
       ORDER BY created_at ASC`
    )
    .all()
    .map(toSubmission);
}

// Submissions created after `since` that were never approved or rejected
export function getUnassessedSubmissions(since: string) {
  return getDb()
    .prepare<[string], SubmissionRow>(
      `SELECT * FROM submissions
       WHERE approved IS NULL AND created_at > ?
       ORDER BY created_at ASC`
    )
    .all(since)
    .map(toSubmission);
}

export function markSubmissionsSent(ids: number[]) {
  const markSent = getDb().prepare<[string, number]>(
    'UPDATE submissions SET sent_at = ? WHERE id = ?'
  );
  const sentAt = new Date().toISOString();
  getDb().transaction(() => {
    for (const id of ids) markSent.run(sentAt, id);
  })();
}
