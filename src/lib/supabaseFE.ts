import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/generated-types';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Anon client for frontend use
let supabaseAnonClient: SupabaseClient<Database> | null = null;

export function getSupabaseAnonClient() {
  if (!supabaseAnonClient) {
    supabaseAnonClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }
  return supabaseAnonClient;
}
