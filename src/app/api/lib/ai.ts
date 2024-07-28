import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { getSupabaseServiceRoleClient } from '@/app/api/lib/supabaseBE';
import { Database } from '@/types';
import { z } from 'zod';

type Submission = Database['public']['Tables']['submissions']['Row'];

export async function assessSubmission(submission: Submission) {
  console.log('Assessing submission:', submission);

  const { object } = await generateObject({
    model: anthropic('claude-3-haiku-20240307'),
    prompt: prompt + JSON.stringify(submission),
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
  - A post looking for a musician to play a gig
  - A post looking for a musician to join a band
  
  Examples of posts that should be rejected:
  - Self-promotion of any kind
  - A post looking for a musician to join a band
  - Anything not relating to music 

  Here is the submission:

`;
