import { z } from 'zod';

const PLACEHOLDER_URL_PATTERNS = [
  'placeholder-project',
  'your-project',
  'example.supabase.co',
  'your-supabase-url',
];

const PLACEHOLDER_KEY_PATTERNS = [
  'placeholder-anon-key',
  'your-anon-key-here',
  'your-supabase-anon-key',
  'your-publishable-key-here',
  'your-anon-key',
  'your-key-here',
];

export const sanitizeEnvValue = (val: unknown): string => {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '');
};

export const isValidHttpUrl = (val: string): boolean => {
  if (!val) return false;
  try {
    const url = new URL(val);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// Safe access to import.meta.env even in non-Vite test runners
const metaEnv: Record<string, unknown> =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env as Record<string, unknown>)
    : {};

const rawUrl = sanitizeEnvValue(metaEnv.VITE_SUPABASE_URL);
const rawAnonKey = sanitizeEnvValue(metaEnv.VITE_SUPABASE_ANON_KEY);
const rawPublishableKey = sanitizeEnvValue(metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY);

// Determine active key with precedence: VITE_SUPABASE_ANON_KEY, then VITE_SUPABASE_PUBLISHABLE_KEY
let resolvedKey = '';
let keySource: 'ANON_KEY' | 'PUBLISHABLE_KEY' | 'NONE' = 'NONE';

if (rawAnonKey) {
  resolvedKey = rawAnonKey;
  keySource = 'ANON_KEY';
} else if (rawPublishableKey) {
  resolvedKey = rawPublishableKey;
  keySource = 'PUBLISHABLE_KEY';
}

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().default(''),
  VITE_SUPABASE_ANON_KEY: z.string().default(''),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().default(''),
  VITE_APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VITE_APP_NAME: z.string().default('Beej Dost'),
  VITE_APP_URL: z.string().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const env: EnvConfig = envSchema.parse({
  VITE_SUPABASE_URL: rawUrl,
  VITE_SUPABASE_ANON_KEY: resolvedKey,
  VITE_SUPABASE_PUBLISHABLE_KEY: resolvedKey,
  VITE_APP_ENV: sanitizeEnvValue(metaEnv.VITE_APP_ENV) || 'development',
  VITE_APP_NAME: sanitizeEnvValue(metaEnv.VITE_APP_NAME) || 'Beej Dost',
  VITE_APP_URL: sanitizeEnvValue(metaEnv.VITE_APP_URL) || 'http://localhost:5173',
});

/**
 * Diagnostic helper that checks for configuration issues.
 * Returns null if properly configured, or an exact human-readable message if misconfigured.
 */
export const getSupabaseConfigError = (
  customUrl?: string,
  customKey?: string
): string | null => {
  const urlToCheck = customUrl !== undefined ? sanitizeEnvValue(customUrl) : env.VITE_SUPABASE_URL;
  const keyToCheck = customKey !== undefined ? sanitizeEnvValue(customKey) : env.VITE_SUPABASE_ANON_KEY;

  // 1. Check URL presence
  if (!urlToCheck) {
    return 'Supabase URL is missing. Please set VITE_SUPABASE_URL in your .env file.';
  }

  // 2. Check URL validity
  if (!isValidHttpUrl(urlToCheck)) {
    return `Supabase URL is invalid ("${urlToCheck}"). It must be a valid URL starting with https:// or http://.`;
  }

  // 3. Check for placeholder URL
  if (PLACEHOLDER_URL_PATTERNS.some((p) => urlToCheck.toLowerCase().includes(p))) {
    return 'Supabase URL is set to a placeholder template. Please update VITE_SUPABASE_URL in .env with your real Supabase project URL.';
  }

  // 4. Check client key presence
  if (!keyToCheck) {
    return 'Supabase public API key is missing. Please set VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in your .env file.';
  }

  // 5. Critical security guard: detect accidental service_role / secret key leak in browser
  if (keyToCheck.toLowerCase().includes('service_role') || keyToCheck.startsWith('sb_secret_')) {
    return 'CRITICAL SECURITY ERROR: A Supabase service-role/secret key was detected in frontend environment variables. Never expose the service role key in client-side code! Replace with your public anon or publishable key.';
  }

  // 6. Check for placeholder key
  if (PLACEHOLDER_KEY_PATTERNS.some((p) => keyToCheck.toLowerCase().includes(p))) {
    return 'Supabase API key is set to a placeholder template. Please update VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in .env with your real key.';
  }

  // 7. Check key length
  if (keyToCheck.length < 20) {
    return 'Supabase API key appears too short or invalid. Please check VITE_SUPABASE_ANON_KEY in your .env file.';
  }

  return null;
};

/**
 * Validates whether Supabase client configuration is fully valid.
 */
export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfigError() === null;
};

/**
 * Returns diagnostic metadata about the current Supabase configuration.
 */
export const getSupabaseConfigStatus = () => {
  const error = getSupabaseConfigError();
  return {
    isConfigured: error === null,
    error,
    url: env.VITE_SUPABASE_URL,
    keySource,
    hasAnonKey: Boolean(rawAnonKey),
    hasPublishableKey: Boolean(rawPublishableKey),
  };
};
