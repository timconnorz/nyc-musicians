import { healthResponse } from '@/lib/server/health';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Contract for the project monitor: { errors: [] } with 200 when healthy,
// 503 when any check fails. Always JSON, never cached.
export function GET() {
  return healthResponse();
}
