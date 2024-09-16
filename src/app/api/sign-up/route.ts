import { getResend } from '@/app/api/lib/resend';
import { getSupabaseServiceRoleClient } from '@/app/api/lib/supabaseBE';
import { NextRequest, NextResponse } from 'next/server';

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
