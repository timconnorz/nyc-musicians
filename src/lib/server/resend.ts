import { Resend } from 'resend';
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
