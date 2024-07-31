import { NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/app/api/lib/supabaseBE';
import { getResend, fromString } from '@/app/api/lib/resend';

export async function GET(request: Request) {
  try {
    console.log('STARTING NEWSLETTER CRON JOB');

    // verify CRON_KEY in request
    const { searchParams } = new URL(request.url);
    const CRON_KEY = searchParams.get('CRON_KEY');
    if (CRON_KEY !== process.env.CRON_KEY) {
      return NextResponse.json(
        {
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // First, get all submissions which have not yet been sent
    // And which have been approved by the LLM
    const { data: submissions, error } = await getSupabaseServiceRoleClient()
      .from('submissions')
      .select('*')
      .is('sent_at', null)
      .eq('approved', true);

    if (error) throw error;

    console.log(`Found ${submissions?.length} submissions to send`);

    // Get the audience contacts
    const resend = getResend();
    const { data } = await resend.contacts.list({
      audienceId: '0b871675-693d-4d17-a8e4-f03dd16dcb51',
    });
    const contacts = data?.data || [];

    console.log(`Found ${contacts?.length} contacts to send to`);

    // Get today's date in the format "Jan 12, 2023"
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // Iterate through batches of 100 contacts
    let failures = 0;
    const sends = [];
    for (let i = 0; i < contacts.length; i += 100) {
      const batch = contacts.slice(i, i + 100);

      sends.push(console.log('SENDING BATCH (not really)', batch));

      // // Send to batch
      // sends.push(resend.batch.send(batch?.map((contact) => ({
      //   to: contact.email,
      //   from: fromString,
      //   subject: `NYC Musicians Wanted: ${today}`,
      //   react: <Newsletter />,
      // }))).catch((error) => {
      //   console.error('Error sending batch:', error);
      //   failures++;
      // }));
    }

    // Wait for all sends to complete
    await Promise.all(sends);

    // Log any failures
    if (failures > 0) {
      console.log(`Weekly cron job completed with ${failures} failures`);
      return NextResponse.json(
        {
          message: `Weekly cron job completed with ${failures} failures`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Weekly cron job completed successfully',
    });
  } catch (error) {
    console.error('Error in weekly cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
