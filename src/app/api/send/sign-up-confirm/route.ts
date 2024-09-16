import SignUpConfirmed from '@/components/emails/SignUpConfirmed';
import { getResend, fromString } from '@/app/api/lib/resend';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/app/api/lib/supabaseBE';

export async function POST(request: NextRequest) {
  try {
    // Check for the authorization header
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token
    const {
      data: { user },
      error: authError,
    } = await getSupabaseServiceRoleClient().auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();

    const { data, error } = await getResend().emails.send({
      from: fromString,
      to: [requestData.email],
      subject: "You've Signed Up!",
      react: SignUpConfirmed({}),
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    console.log('Email sent successfully');

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
