import SubmissionConfirmed from '@/components/emails/SubmissionConfirmed';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const requestData = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: [requestData.email],
      subject: 'Your submission has been received',
      react: SubmissionConfirmed({}),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    console.log('Email sent successfully');

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
