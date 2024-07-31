import { getSupabaseServiceRoleClient } from '@/app/api/lib/supabaseBE';
import { NextRequest, NextResponse } from 'next/server';
import { assessSubmission } from '@/app/api/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { headline, details, email } = await request.json();

    console.log(`New submission from ${email}`);

    // Store the submission in Supabase
    const { error, data } = await getSupabaseServiceRoleClient()
      .from('submissions')
      .insert({ headline, details, user_email: email })
      .select();

    if (error) throw error;

    // run the LLM assessment but don't wait for it
    assessSubmission(data[0]);

    // Return a success response with the analysis
    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.error('Error processing submission:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
