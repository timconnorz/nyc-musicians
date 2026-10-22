import { NextResponse } from 'next/server';
import {
  getUnsentApprovedSubmissions,
  markSubmissionsSent,
} from '@/lib/server/db';
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

    // First, get all submissions which have not yet been sent
    // And which have been approved by the LLM
    console.log('Querying submissions...');
    const submissions = getUnsentApprovedSubmissions();

    if (!submissions.length) {
      console.log('No submissions to send');
      return NextResponse.json({
        message: 'No submissions to send',
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
    markSubmissionsSent(submissions.map(submission => submission.id));

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
