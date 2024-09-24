import {
  fromString,
  generateUnsubscribeLink,
  getResend,
} from '@/lib/server/resend';
import { NextResponse } from 'next/server';
import { Newsletter } from '@/components/emails/Newsletter';

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

    if (!process.env.RESEND_AUDIENCE_ID) {
      throw Error('Audience ID not set');
    }

    // Get the audience contacts
    const resend = getResend();
    const { data } = await resend.contacts.list({
      audienceId: process.env.RESEND_AUDIENCE_ID,
    });
    const contacts = data?.data || [];

    const tim = contacts.filter(
      contact => contact.email === 's@timconnors.co'
    )[0];

    if (!tim) {
      throw Error('Tim not found');
    }

    // Get today's date in the format "Jan 12, 2023"
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const unsubscribeLink = generateUnsubscribeLink(tim.id);

    await resend.emails.send({
      to: tim.email,
      from: fromString,
      subject: `NYC Musicians Wanted: ${today}`,
      react: Newsletter({
        date: today,
        submissions: [
          {
            headline: 'Test Submission',
            details: 'Test Details',
            user_email: 'test@example.com',
          },
        ],
        unsubscribeLink,
      }),
      headers: {
        'List-Unsubscribe': `<${unsubscribeLink}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    return NextResponse.json({
      message: `Done`,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
