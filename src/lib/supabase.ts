import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  env,
  isSupabaseConfigured,
  getSupabaseConfigError,
  getSupabaseConfigStatus,
} from './env';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    if (isSupabaseConfigured()) {
      supabaseClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } else {
      // Safe non-routable unconfigured client so top-level imports do not crash
      // the application at module evaluation time. Operations are guarded by isSupabaseConfigured().
      supabaseClient = createClient('http://127.0.0.1:54321', 'missing-configuration-key', {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
    }
  }

  return supabaseClient;
};

export const supabase = getSupabaseClient();
export { isSupabaseConfigured, getSupabaseConfigError, getSupabaseConfigStatus };

