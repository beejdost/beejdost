import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().catch(''),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).catch(''),
  VITE_APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VITE_APP_NAME: z.string().default('Beej Dost'),
  VITE_APP_URL: z.string().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const env: EnvConfig = envSchema.parse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'Beej Dost',
  VITE_APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
});

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(env.VITE_SUPABASE_URL) &&
    Boolean(env.VITE_SUPABASE_ANON_KEY) &&
    !env.VITE_SUPABASE_URL.includes('placeholder-project')
  );
};
