import { Contact, Resend } from 'resend';
import jwt from 'jsonwebtoken';
if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set');
}

let resend: Resend;

export const getResend = () => {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

export const fromString = `NYC Musicians Wanted <${process.env.RESEND_FROM_EMAIL}>`;

// Resend renamed Audiences to Segments and kept the IDs, so the env var
// still holds the newsletter's audience ID, which is now its segment ID
export function getSegmentId() {
  if (!process.env.RESEND_AUDIENCE_ID) {
    throw new Error('RESEND_AUDIENCE_ID is not set');
  }
  return process.env.RESEND_AUDIENCE_ID;
}

/** Every contact in the newsletter segment, following pagination */
export async function listSegmentContacts() {
  const segmentId = getSegmentId();
  const contacts: Contact[] = [];
  let after: string | undefined;
  for (;;) {
    // The SDK returns API errors rather than throwing them
    const { data, error } = await getResend().contacts.list({
      segmentId,
      limit: 100,
      ...(after ? { after } : {}),
    });
    if (error) {
      throw new Error(
        `Resend contacts fetch failed: ${error.name}: ${error.message}`
      );
    }
    contacts.push(...data.data);
    if (!data.has_more || !data.data.length) return contacts;
    after = data.data[data.data.length - 1].id;
  }
}

export interface UnsubscribeRequestJWTPayload {
  contactId: string;
}

export function generateUnsubscribeLink(contactId: string) {
  if (!process.env.UNSUBSCRIBE_KEY) {
    throw new Error('UNSUBSCRIBE_KEY is not set');
  }
  const payload: UnsubscribeRequestJWTPayload = {
    contactId,
  };
  const token = jwt.sign(payload, process.env.UNSUBSCRIBE_KEY, {
    expiresIn: '30d',
  });
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set');
  }
  return `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${token}`;
}
