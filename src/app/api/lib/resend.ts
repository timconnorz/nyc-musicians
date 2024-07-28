import { Resend } from 'resend';

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
