import Anthropic from '@anthropic-ai/sdk';
import {
  getUnassessedSubmissions,
  setSubmissionApproved,
  Submission,
} from '@/lib/server/db';

export const ASSESSMENT_MODEL = 'claude-haiku-5-5';

// Posts older than this are probably stale, so don't send them out late
const REASSESS_LOOKBACK_DAYS = 30;

let client: Anthropic;

// Reads ANTHROPIC_API_KEY. Uses the global fetch so tests can mock it.
function getClient() {
  if (!client) client = new Anthropic({ fetch: globalThis.fetch });
  return client;
}

/** Ask the model whether a submission is a genuine musician opportunity */
export async function classifySubmission(headline: string, details: string) {
  const submissionString = `> Headline: ${headline}\n> Details: ${details}`;

  // Newer models reject `temperature`, so leave sampling at the defaults
  const message = await getClient().messages.create({
    model: ASSESSMENT_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt + submissionString }],
    tools: [
      {
        name: 'classify',
        description: 'Record whether the submission is approved',
        input_schema: {
          type: 'object',
          properties: { approved: { type: 'boolean' } },
          required: ['approved'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'classify' },
  });

  const toolUse = message.content.find(block => block.type === 'tool_use');
  const approved =
    toolUse?.type === 'tool_use'
      ? (toolUse.input as { approved?: unknown }).approved
      : undefined;
  if (typeof approved !== 'boolean') {
    throw new Error('Anthropic response did not include a classification');
  }
  return approved;
}

export async function assessSubmission(submission: Submission) {
  console.log('Assessing submission:', submission);

  const approved = await classifySubmission(
    submission.headline,
    submission.details
  );

  console.log('Anthropic response:', { approved });

  setSubmissionApproved(submission.id, approved);
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
