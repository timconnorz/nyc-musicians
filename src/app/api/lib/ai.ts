import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { getSupabaseServiceRoleClient } from '@/app/api/lib/supabaseBE';
import { Database } from '@/generated-types';
import { z } from 'zod';

type Submission = Database['public']['Tables']['submissions']['Row'];

export async function assessSubmission(submission: Submission) {
  console.log('Assessing submission:', submission);

  const submissionString = `> Headline: ${submission.headline}\n> Details: ${submission.details}`;

  const { object } = await generateObject({
    model: anthropic('claude-3-haiku-20240307'),
    prompt: prompt + submissionString,
    schema: z.object({
      approved: z.boolean(),
    }),
  });

  console.log('Anthropic response:', object);

  // Update the row in supabase
  const { error } = await getSupabaseServiceRoleClient()
    .from('submissions')
    .update({ approved: object.approved })
    .eq('id', submission.id);

  if (error) throw error;
}

const prompt = `
  You are a classifying tool tasked with classifying user submissions into one of two categories: "approved" or "rejected".

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
