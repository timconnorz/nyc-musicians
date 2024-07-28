import { getResend } from '@/app/api/lib/resend';

export async function POST(request: Request) {
  try {
    const requestData = await request.json();

    const { data, error } = await getResend().contacts.create({
      email: requestData.email,
      unsubscribed: false,
      audienceId: '0b871675-693d-4d17-a8e4-f03dd16dcb51',
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    console.log('New sign up added to audience!');

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
