'use server';

import { assessSubmission } from '../lib/server/ai';
import { insertSubmission } from '../lib/server/db';
import {
  checkLoginCode,
  createLoginCode,
  normalizeEmail,
  readSessionEmail,
  requireSessionEmail,
  setSessionEmail,
} from '../lib/server/auth';
import { getResend, fromString } from '../lib/server/resend';
import SubmissionConfirmed from '@/components/emails/SubmissionConfirmed';
import SignUpConfirmed from '@/components/emails/SignUpConfirmed';
import LoginCode from '@/components/emails/LoginCode';

// AUTH

export async function getSessionEmail() {
  return readSessionEmail();
}

export async function sendLoginCode(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const code = createLoginCode(normalizedEmail);

  // A code was sent moments ago and is still valid
  if (!code) return;

  const { data, error } = await getResend().emails.send({
    from: fromString,
    to: [normalizedEmail],
    subject: `Your NYC Musicians Wanted code: ${code}`,
    react: LoginCode({ code }),
  });

  if (error) throw error;
}

export async function verifyLoginCode(email: string, code: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!checkLoginCode(normalizedEmail, code)) return false;

  setSessionEmail(normalizedEmail);
  return true;
}

// NEWSLETTER

export async function newsletterSignUp() {
  const email = requireSessionEmail();

  const { data, error } = await getResend().contacts.create({
    email: email,
    unsubscribed: false,
    audienceId: '0b871675-693d-4d17-a8e4-f03dd16dcb51',
  });

  if (error) throw error;
}

export async function submitSubmission(headline: string, details: string) {
  const email = requireSessionEmail();

  console.log(`New submission from ${email}`);

  const submission = insertSubmission({
    headline,
    details,
    user_email: email,
  });

  // run the LLM assessment but don't wait for it
  assessSubmission(submission);
}

// EMAILS

export async function sendSubmissionConfirmationEmail() {
  const email = requireSessionEmail();

  const { data, error } = await getResend().emails.send({
    from: fromString,
    to: [email],
    subject: 'Your submission has been received',
    react: SubmissionConfirmed({}),
  });

  if (error) throw error;
}

export async function sendSignUpConfirmationEmail() {
  const email = requireSessionEmail();

  const { data, error } = await getResend().emails.send({
    from: fromString,
    to: [email],
    subject: 'You have signed up!',
    react: SignUpConfirmed({}),
  });

  if (error) throw error;
}
