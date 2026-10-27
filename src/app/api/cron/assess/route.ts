import { NextResponse } from 'next/server';
import { assessPendingSubmissions } from '@/lib/server/ai';

// Re-runs the LLM assessment for recent submissions that were never
// approved or rejected. The newsletter cron does this too before sending.
export async function POST(request: Request) {
  try {
    // verify CRON_KEY in authorization header
    const authorization = request.headers.get('Authorization');
    if (!authorization || authorization !== `Bearer ${process.env.CRON_KEY}`) {
      return NextResponse.json(
        {
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const { assessed, failed } = await assessPendingSubmissions();

    return NextResponse.json(
      {
        message: `Assessed ${assessed} submissions, ${failed} failed`,
      },
      { status: failed ? 500 : 200 }
    );
  } catch (error) {
    console.error('Error assessing pending submissions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
