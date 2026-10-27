import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import {
  getUnassessedSubmissions,
  setSubmissionApproved,
  Submission,
} from '@/lib/server/db';
import { z } from 'zod';

export const ASSESSMENT_MODEL = 'claude-haiku-5-5';

// Posts older than this are probably stale, so don't send them out late
const REASSESS_LOOKBACK_DAYS = 30;

export async function assessSubmission(submission: Submission) {
  console.log('Assessing submission:', submission);

  const submissionString = `> Headline: ${submission.headline}\n> Details: ${submission.details}`;

  const { object } = await generateObject({
    model: anthropic(ASSESSMENT_MODEL),
    prompt: prompt + submissionString,
    schema: z.object({
      approved: z.boolean(),
    }),
  });

  console.log('Anthropic response:', object);

  setSubmissionApproved(submission.id, object.approved);
}

/**
 * Assess recent submissions whose assessment never completed, e.g. because
 * the fire-and-forget call in submitSubmission failed.
 */
export async function assessPendingSubmissions() {
  const since = new Date(
    Date.now() - REASSESS_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  const pending = getUnassessedSubmissions(since);

  let failed = 0;
  for (const submission of pending) {
    try {
      await assessSubmission(submission);
    } catch (error) {
      console.error(`Error assessing submission ${submission.id}:`, error);
      failed++;
    }
  }

  return { assessed: pending.length - failed, failed };
}

const prompt = `
  You are a classifying tool tasked with classifying user submissions into  one of two categories: "approved" or "rejected".

  Your goal to approve all submissions that appear to be a genuine opportunity for a musician and reject everything else. 
  
  Examples of posts that should be approved:
  - A post by an event organizer looking for a musician to play a gig
  - A post by an existing band looking for a new member
  - A post by a musician looking for a band to join or a musician to collaborate with
  
  Examples of posts that should be rejected:
  - Generic promotions of music, merchandise, or events, including but not limited to:
    - "check out my new song"
    - "come to my show"
    - "buy my album"
    - "listen to my podcast"
    - "watch my video"
    - "follow me on social media"
  - Anything not relating to music

  Here is the submission:

`;
