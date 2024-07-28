import SignUpConfirmed from '@/components/emails/SignUpConfirmed';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const requestData = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: [requestData.email],
      subject: "You've Signed Up!",
      react: SignUpConfirmed({}),
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
