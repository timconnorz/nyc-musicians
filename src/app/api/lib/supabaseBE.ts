import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

// Service role client for backend use
let supabaseServiceRoleClient: SupabaseClient<Database> | null = null;

export function getSupabaseServiceRoleClient() {
  if (!supabaseServiceRoleClient) {
    supabaseServiceRoleClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return supabaseServiceRoleClient;
}
