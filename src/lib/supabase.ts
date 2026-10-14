import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from './env';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    const url = env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
    const key = env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseClient;
};

export const supabase = getSupabaseClient();
export { isSupabaseConfigured };
