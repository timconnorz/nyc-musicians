import { NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/lib/server/supabaseBE';
import { getResend, fromString } from '@/lib/server/resend';
import { Newsletter } from '@/components/emails/Newsletter';
import { generateUnsubscribeLink } from '@/lib/server/resend';

export async function POST(request: Request) {
  try {
    console.log('STARTING NEWSLETTER CRON JOB');

    // verify CRON_KEY in authorization header
    console.log('Checking authorization...');
    const authorization = request.headers.get('Authorization');
    if (!authorization || authorization !== `Bearer ${process.env.CRON_KEY}`) {
      console.log('Authorization failed:', {
        hasAuth: !!authorization,
        hasCronKey: !!process.env.CRON_KEY,
      });
      return NextResponse.json(
        {
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }
    console.log('Authorization successful');

    console.log('Checking environment variables...');
    if (!process.env.RESEND_AUDIENCE_ID) {
      console.log('RESEND_AUDIENCE_ID not set');
      return NextResponse.json(
        {
          message: 'Audience ID not set',
        },
        { status: 500 }
      );
    }
    console.log('Environment variables OK');

    // Always make a keepalive query to prevent Supabase from pausing
    console.log('Initializing Supabase client...');
    const supabase = getSupabaseServiceRoleClient();
    console.log(
      'Making keepalive query to prevent Supabase pause (with retry logic)...'
    );

    // Retry logic for waking up paused Supabase
    let keepaliveSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Keepalive attempt ${attempt}/3...`);
        const { error: keepaliveError } = await supabase
          .from('submissions')
          .select('id')
          .limit(1);

        if (keepaliveError) {
          console.error(`Keepalive attempt ${attempt} failed:`, keepaliveError);
          if (attempt === 3) {
            throw new Error(
              `Supabase keepalive failed after 3 attempts: ${keepaliveError.message}`
            );
          }
        } else {
          console.log(`Keepalive attempt ${attempt} successful`);
          keepaliveSuccess = true;
          break;
        }
      } catch (error) {
        console.error(`Error during keepalive attempt ${attempt}:`, error);
        if (attempt === 3) {
          throw error;
        }
        // Wait before retrying (exponential backoff: 2s, 4s)
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    if (!keepaliveSuccess) {
      throw new Error('Failed to wake up Supabase after 3 attempts');
    }

    // First, get all submissions which have not yet been sent
    // And which have been approved by the LLM
    console.log('Querying submissions...');
    let submissions;
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .is('sent_at', null)
        .eq('approved', true)
        // oldest first
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Submissions query failed:', error);
        throw new Error(`Supabase submissions query failed: ${error.message}`);
      }
      submissions = data;
      console.log('Submissions query successful');
    } catch (error) {
      console.error('Error during submissions query:', error);
      throw error;
    }

    if (!submissions?.length) {
      console.log('No submissions to send, but keepalive query completed');
      return NextResponse.json({
        message: 'No submissions to send, but keepalive query completed',
      });
    }

    console.log(`Found ${submissions?.length} submissions to send`);

    // Get the audience contacts
    console.log('Initializing Resend client...');
    const resend = getResend();
    console.log('Fetching contacts from Resend...');

    let contacts;
    try {
      const { data } = await resend.contacts.list({
        audienceId: process.env.RESEND_AUDIENCE_ID,
      });
      contacts = data?.data || [];
      console.log('Resend contacts fetch successful');
    } catch (error) {
      console.error('Error fetching contacts from Resend:', error);
      throw new Error(
        `Resend contacts fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (!contacts?.length) {
      console.log('No contacts to send to');
      return NextResponse.json({
        message: 'No contacts to send to',
      });
    }

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
      // Send to batch
      sends.push(
        resend.batch
          .send(
            batch?.map(contact => {
              const unsubscribeLink = generateUnsubscribeLink(contact.id);
              return {
                to: contact.email,
                from: fromString,
                subject: `NYC Musicians Wanted: ${today}`,
                react: Newsletter({
                  date: today,
                  submissions,
                  unsubscribeLink,
                }),
                headers: {
                  'List-Unsubscribe': `<${unsubscribeLink}>`,
                  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                },
              };
            })
          )
          .catch(error => {
            console.error('Error sending batch:', error);
            failures++;
          })
      );
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

    // Update the submissions sent_at values
    await getSupabaseServiceRoleClient()
      .from('submissions')
      .update({ sent_at: new Date().toISOString() })
      .in(
        'id',
        submissions.map(submission => submission.id)
      );

    console.log(`Successfully sent out ${submissions?.length} submissions`);
    return NextResponse.json({
      message: `Cron Completed! Sent ${submissions?.length} submissions`,
    });
  } catch (error) {
    console.error('Error in weekly cron job:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type',
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
