import { NextResponse } from 'next/server';
import {
  getUnsentApprovedSubmissions,
  markSubmissionsSent,
} from '@/lib/server/db';
import { getResend, fromString } from '@/lib/server/resend';
import { Newsletter } from '@/components/emails/Newsletter';
import { generateUnsubscribeLink } from '@/lib/server/resend';
import { assessPendingSubmissions } from '@/lib/server/ai';

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

    // Retry any submissions whose assessment failed when they were created
    console.log('Assessing pending submissions...');
    const pending = await assessPendingSubmissions();
    console.log('Pending submissions assessed:', pending);

    // Then get all submissions which have not yet been sent
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

    // The SDK returns API errors rather than throwing them
    const { data, error: contactsError } = await resend.contacts.list({
      audienceId: process.env.RESEND_AUDIENCE_ID,
    });
    if (contactsError) {
      throw new Error(
        `Resend contacts fetch failed: ${contactsError.name}: ${contactsError.message}`
      );
    }
    const contacts = (data?.data || []).filter(
      contact => !contact.unsubscribed
    );
    console.log('Resend contacts fetch successful');

    if (!contacts.length) {
      console.log('No contacts to send to');
      return NextResponse.json({
        message: 'No contacts to send to',
      });
    }

    console.log(`Found ${contacts.length} contacts to send to`);

    // Get today's date in the format "Jan 12, 2023"
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // Send in batches of 100 contacts, retrying a failed batch a couple of
    // times before giving up on it
    const sendBatch = async (batch: typeof contacts) => {
      const emails = batch.map(contact => {
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
      });

      for (let attempt = 1; attempt <= 3; attempt++) {
        const { error } = await resend.batch.send(emails);
        if (!error) return true;
        console.error(
          `Error sending batch (attempt ${attempt}): ${error.name}: ${error.message}`
        );
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
      }
      return false;
    };

    const batches = [];
    for (let i = 0; i < contacts.length; i += 100) {
      batches.push(contacts.slice(i, i + 100));
    }
    const results = await Promise.all(batches.map(sendBatch));
    const failures = results.filter(sent => !sent).length;

    // If nothing went out, leave the submissions unsent so the next run
    // retries them. Otherwise mark them sent so the batches that did go out
    // aren't sent the same newsletter again.
    if (failures === batches.length) {
      console.log('Every batch failed to send');
      return NextResponse.json(
        {
          message: 'Every batch failed to send',
        },
        { status: 500 }
      );
    }

    // Update the submissions sent_at values
    markSubmissionsSent(submissions.map(submission => submission.id));

    if (failures > 0) {
      console.log(
        `Sent ${submissions.length} submissions, but ${failures} of ${batches.length} batches failed`
      );
      return NextResponse.json(
        {
          message: `Sent ${submissions.length} submissions, but ${failures} of ${batches.length} batches failed`,
        },
        { status: 500 }
      );
    }

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
