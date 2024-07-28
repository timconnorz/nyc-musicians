import SignUpConfirmed from '@/components/emails/SignUpConfirmed';
import { getResend } from '@/app/api/lib/resend';

export async function POST(request: Request) {
  try {
    const requestData = await request.json();

    const { data, error } = await getResend().emails.send({
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
