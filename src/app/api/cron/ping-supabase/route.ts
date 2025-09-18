import { NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/lib/server/supabaseBE';

export async function POST(request: Request) {
  try {
    console.log('STARTING SUPABASE PING CRON JOB');

    // verify CRON_KEY in authorization header
    const authorization = request.headers.get('Authorization');
    if (!authorization || authorization !== `Bearer ${process.env.CRON_KEY}`) {
      console.log('Authorization failed');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Simple lightweight query to keep Supabase active
    const supabase = getSupabaseServiceRoleClient();
    console.log('Pinging Supabase...');

    const { error } = await supabase.from('submissions').select('id').limit(1);

    if (error) {
      console.error('Supabase ping failed:', error);
      return NextResponse.json(
        {
          error: 'Ping failed',
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log('Supabase ping successful');
    return NextResponse.json({
      message: 'Supabase ping successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in ping cron job:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
