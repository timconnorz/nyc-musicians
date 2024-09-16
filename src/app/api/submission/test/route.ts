import { NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/lib/server/supabaseBE';
import { assessSubmission } from '@/lib/server/ai';
export async function POST(request: Request) {
  try {
    // verify CRON_KEY in authorization header
    const authorization = request.headers.get('Authorization');
    if (!authorization || authorization !== `Bearer ${process.env.CRON_KEY}`) {
      return NextResponse.json(
        {
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // the body is a json array of submissions
    const submissions = await request.json();

    // Assert that the submissions are of type { headline: string, details: string, email: string }[]
    if (
      !Array.isArray(submissions) ||
      !submissions.every(
        submission =>
          typeof submission.headline === 'string' &&
          typeof submission.details === 'string' &&
          typeof submission.user_email === 'string'
      )
    ) {
      return NextResponse.json(
        {
          message: 'Invalid submissions format',
        },
        { status: 400 }
      );
    }

    // Store the submissions in Supabase
    const supabase = getSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from('submissions')
      .insert(submissions)
      .select();
    if (error) throw error;

    console.log(`Successfully stored ${submissions.length} submissions`);

    // Now run the LLM assessment for each submission
    for (const submission of data) {
      console.log(`Assessing submission ${submission.id}`);
      await assessSubmission(submission);
    }

    return NextResponse.json({
      message: `Done processing ${submissions.length} submissions`,
    });
  } catch (error) {
    console.error('Error processing submissions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
