import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getDb } from './db';

const CODE_TTL_MS = 10 * 60 * 1000;
// Don't send another code to the same inbox within this window
const CODE_COOLDOWN_MS = 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

interface SessionJWTPayload {
  email: string;
}

interface LoginCodeRow {
  code_hash: string;
  created_at: number;
  attempts: number;
}

function getSessionSecret() {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is not set');
  }
  return process.env.SESSION_SECRET;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashCode(email: string, code: string) {
  return crypto.createHash('sha256').update(`${email}:${code}`).digest('hex');
}

/**
 * Create a one time code for the email.
 * Returns null if a code was sent within the cooldown window,
 * in which case that earlier code is still valid.
 */
export function createLoginCode(email: string) {
  const db = getDb();
  const existing = db
    .prepare<[string], LoginCodeRow>(
      'SELECT * FROM login_codes WHERE email = ?'
    )
    .get(email);

  if (existing && Date.now() - existing.created_at < CODE_COOLDOWN_MS) {
    return null;
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  db.prepare<[string, string, number]>(
    `INSERT OR REPLACE INTO login_codes (email, code_hash, created_at, attempts)
     VALUES (?, ?, ?, 0)`
  ).run(email, hashCode(email, code), Date.now());

  return code;
}

/**
 * Check a one time code. Codes are single use, expire after CODE_TTL_MS,
 * and are discarded after MAX_CODE_ATTEMPTS wrong guesses.
 */
export function checkLoginCode(email: string, code: string) {
  const db = getDb();
  const row = db
    .prepare<[string], LoginCodeRow>(
      'SELECT * FROM login_codes WHERE email = ?'
    )
    .get(email);

  if (!row) return false;

  const deleteCode = () =>
    db.prepare<[string]>('DELETE FROM login_codes WHERE email = ?').run(email);

  if (
    Date.now() - row.created_at > CODE_TTL_MS ||
    row.attempts >= MAX_CODE_ATTEMPTS
  ) {
    deleteCode();
    return false;
  }

  const matches = crypto.timingSafeEqual(
    Buffer.from(row.code_hash, 'hex'),
    Buffer.from(hashCode(email, code.trim()), 'hex')
  );

  if (!matches) {
    db.prepare<[string]>(
      'UPDATE login_codes SET attempts = attempts + 1 WHERE email = ?'
    ).run(email);
    return false;
  }

  deleteCode();
  return true;
}

export function setSessionEmail(email: string) {
  const payload: SessionJWTPayload = { email };
  const token = jwt.sign(payload, getSessionSecret(), {
    expiresIn: SESSION_MAX_AGE_SECONDS,
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function readSessionEmail() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getSessionSecret()) as SessionJWTPayload;
    return decoded.email;
  } catch {
    return null;
  }
}

export function requireSessionEmail() {
  const email = readSessionEmail();
  if (!email) {
    throw new Error('Not signed in');
  }
  return email;
}
