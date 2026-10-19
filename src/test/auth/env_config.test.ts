import { describe, it, expect } from 'vitest';
import {
  getSupabaseConfigError,
  isValidHttpUrl,
  sanitizeEnvValue,
} from '@/lib/env';

describe('Supabase Environment Configuration Contract', () => {
  const validUrl = 'https://bdvonmfzoomzrbmhqffn.supabase.co';
  const validAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiJ9.signature1234567890';
  const validPublishableKey = 'sb_publishable_qNUB1E7vZ244BxlksSJMIA_IGyKfWg0';

  describe('Sanitization & URL Validation', () => {
    it('strips whitespace and quotes from environment values', () => {
      expect(sanitizeEnvValue('  "https://example.supabase.co"  ')).toBe('https://example.supabase.co');
      expect(sanitizeEnvValue(" 'my-token-123' ")).toBe('my-token-123');
      expect(sanitizeEnvValue(undefined)).toBe('');
      expect(sanitizeEnvValue(null)).toBe('');
    });

    it('validates HTTP and HTTPS URLs correctly', () => {
      expect(isValidHttpUrl('https://example.supabase.co')).toBe(true);
      expect(isValidHttpUrl('http://localhost:54321')).toBe(true);
      expect(isValidHttpUrl('invalid-url-without-protocol')).toBe(false);
      expect(isValidHttpUrl('')).toBe(false);
    });
  });

  describe('Configuration Error Diagnosis (getSupabaseConfigError)', () => {
    it('returns null when valid URL and valid anon JWT key are provided', () => {
      const error = getSupabaseConfigError(validUrl, validAnonKey);
      expect(error).toBeNull();
    });

    it('returns null when valid URL and modern publishable key (sb_publishable_...) are provided', () => {
      const error = getSupabaseConfigError(validUrl, validPublishableKey);
      expect(error).toBeNull();
    });

    it('reports missing URL when URL is empty', () => {
      const error = getSupabaseConfigError('', validAnonKey);
      expect(error).toContain('Supabase URL is missing');
    });

    it('reports invalid URL when URL lacks valid protocol', () => {
      const error = getSupabaseConfigError('not-a-valid-url', validAnonKey);
      expect(error).toContain('Supabase URL is invalid');
    });

    it('detects placeholder project URL and advises real project configuration', () => {
      const error = getSupabaseConfigError('https://placeholder-project.supabase.co', validAnonKey);
      expect(error).toContain('placeholder template');

      const error2 = getSupabaseConfigError('https://your-project.supabase.co', validAnonKey);
      expect(error2).toContain('placeholder template');
    });

    it('reports missing API key when key is empty', () => {
      const error = getSupabaseConfigError(validUrl, '');
      expect(error).toContain('public API key is missing');
    });

    it('detects placeholder API keys', () => {
      const error = getSupabaseConfigError(validUrl, 'your-anon-key-here');
      expect(error).toContain('API key is set to a placeholder');

      const error2 = getSupabaseConfigError(validUrl, 'placeholder-anon-key');
      expect(error2).toContain('API key is set to a placeholder');
    });

    it('CRITICALLY rejects accidental service_role / secret key in frontend environment', () => {
      const error = getSupabaseConfigError(validUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role.token');
      expect(error).toContain('CRITICAL SECURITY ERROR');
      expect(error).toContain('service-role/secret key');

      const errorSecret = getSupabaseConfigError(validUrl, 'sb_secret_very_confidential_key_1234567890');
      expect(errorSecret).toContain('CRITICAL SECURITY ERROR');
    });

    it('rejects keys that are too short to be authentic', () => {
      const error = getSupabaseConfigError(validUrl, 'abc123');
      expect(error).toContain('too short or invalid');
    });
  });
});
