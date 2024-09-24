import { getResend, UnsubscribeRequestJWTPayload } from '@/lib/server/resend';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const contactId = await extractContactIdFromRequest(request);

    await unsubscribeContact(contactId);

    return new Response(
      `
      <html>
        <body style="display: flex; justify-content: center">
          <div style="text-align: center;">
            <h2>Unsubscribe Successful</h2>
            <p>You have been successfully unsubscribed from our newsletter.</p>
            <a href="/">Return to Homepage</a>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('Error handling POST request:', error);
    return new Response(
      JSON.stringify({ message: 'Error processing request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tokenParam = url.searchParams.get('token');
    // Return an HTML form for unsubscribing with only a button
    return new Response(
      `
      <html>
        <body style="display: flex; justify-content: center;">
          <div style="text-align: center;">
            <h2>Unsubscribe from Newsletter</h2>
            <form method="POST" action="/unsubscribe?token=${tokenParam}">
              <button type="submit">Unsubscribe</button>
            </form>
          </div>
        </body>
      </html>
    `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('Error handling GET request:', error);
    return new Response(
      JSON.stringify({ message: 'Error processing request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function extractContactIdFromRequest(request: Request) {
  if (!process.env.UNSUBSCRIBE_KEY) {
    throw new Error('UNSUBSCRIBE_KEY is not set');
  }
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    throw new Error('Token is not set');
  }
  const decoded = jwt.verify(
    token,
    process.env.UNSUBSCRIBE_KEY
  ) as UnsubscribeRequestJWTPayload;
  return decoded.contactId;
}

async function unsubscribeContact(contactId: string) {
  if (!process.env.RESEND_AUDIENCE_ID) {
    throw new Error('RESEND_AUDIENCE_ID is not set');
  }
  const resend = getResend();
  const { error: unsubscribeError } = await resend.contacts.remove({
    audienceId: process.env.RESEND_AUDIENCE_ID,
    id: contactId,
  });
  if (unsubscribeError) {
    console.error('Error unsubscribing contact:', unsubscribeError);
    throw new Error('Error unsubscribing contact');
  }
}
