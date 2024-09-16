// use
// TODO: Migrate api endpoints to server actions

import { assessSubmission } from './api/lib/ai';
import { getSupabaseServiceRoleClient } from './api/lib/supabaseBE';
import { getResend, fromString } from './api/lib/resend';
import SubmissionConfirmed from '@/components/emails/SubmissionConfirmed';
import SignUpConfirmed from '@/components/emails/SignUpConfirmed';

export async function newsletterSignUp(email: string) {
  const { data, error } = await getResend().contacts.create({
    email: email,
    unsubscribed: false,
    audienceId: '0b871675-693d-4d17-a8e4-f03dd16dcb51',
  });

  if (error) throw error;
}

export async function submitSubmission(
  email: string,
  headline: string,
  details: string
) {
  console.log(`New submission from ${email}`);

  // Store the submission in Supabase
  const { error, data } = await getSupabaseServiceRoleClient()
    .from('submissions')
    .insert({ headline, details, user_email: email })
    .select();

  if (error) throw error;

  // run the LLM assessment but don't wait for it
  assessSubmission(data[0]);
}

// EMAILS

export async function sendSubmissionConfirmationEmail(email: string) {
  const { data, error } = await getResend().emails.send({
    from: fromString,
    to: [email],
    subject: 'Your submission has been received',
    react: SubmissionConfirmed({}),
  });

  if (error) throw error;
}

export async function sendSignUpConfirmationEmail(email: string) {
  const { data, error } = await getResend().emails.send({
    from: fromString,
    to: [email],
    subject: 'You have signed up!',
    react: SignUpConfirmed({}),
  });

  if (error) throw error;
}
