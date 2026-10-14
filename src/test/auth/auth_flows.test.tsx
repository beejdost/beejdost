import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '@/i18n/config';

import { RegisterPage } from '@/features/auth/RegisterPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SuspendedAccountPage } from '@/features/auth/SuspendedAccountPage';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';

// Mock Supabase client
vi.mock('@/lib/supabase', () => {
  return {
    isSupabaseConfigured: () => true,
    supabase: {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        resend: vi.fn().mockResolvedValue({ error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      }),
    },
  };
});

describe('Phase 3: Auth & Profiles Test Suite', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { supabase } = await import('@/lib/supabase');
    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    await i18n.changeLanguage('en');
  });

  describe('1. Registration Validation Flow', () => {
    it('validates required fields, password length, and password match', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <RegisterPage />
          </AuthProvider>
        </MemoryRouter>
      );

      const submitBtn = screen.getByRole('button', { name: /Create Account/i });
      fireEvent.click(submitBtn);

      // Validation errors should appear
      expect(await screen.findByText(/Name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/District is required/i)).toBeInTheDocument();
    });

    it('rejects mismatched password and confirm password', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AuthProvider>
            <RegisterPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await user.type(screen.getByLabelText(/^Full Name/i), 'Tariq Mehmood');
      await user.type(screen.getByLabelText(/^Email Address/i), 'tariq@punjab.pk');
      await user.type(screen.getByLabelText(/^Password/i), 'password123');
      await user.type(screen.getByLabelText(/^Confirm Password/i), 'mismatch456');
      await user.type(screen.getByLabelText(/^Home District/i), 'Faisalabad');

      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  describe('2. Login Error Handling & Anti-Enumeration', () => {
    it('shows generic invalid credentials error without leaking account existence', async () => {
      const { supabase } = await import('@/lib/supabase');
      (supabase.auth.signInWithPassword as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid login credentials'),
      });

      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await user.type(screen.getByLabelText(/^Email Address/i), 'unknown@farmer.pk');
      await user.type(screen.getByLabelText(/^Password/i), 'someSecretPassword');

      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      // Generic error message should be displayed
      expect(
        await screen.findByText(/Invalid email or password\. Please try again\./i)
      ).toBeInTheDocument();
    });

    it('handles unconfirmed email accounts by displaying warning banner and resend action', async () => {
      const { supabase } = await import('@/lib/supabase');
      (supabase.auth.signInWithPassword as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Email not confirmed'),
      });

      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await user.type(screen.getByLabelText(/^Email Address/i), 'unconfirmed@farmer.pk');
      await user.type(screen.getByLabelText(/^Password/i), 'password123');

      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      // Warning banner for unconfirmed email should show up with resend button
      expect(
        await screen.findByText(/Your email address has not been confirmed yet/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Resend Confirmation Email/i })
      ).toBeInTheDocument();
    });
  });

  describe('3. Password Reset Flow', () => {
    it('sends password reset link and shows non-leaking confirmation message', async () => {
      const { supabase } = await import('@/lib/supabase');
      (supabase.auth.resetPasswordForEmail as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
        error: null,
      });

      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AuthProvider>
            <ForgotPasswordPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await user.type(screen.getByLabelText(/^Email Address/i), 'farmer@punjab.pk');
      fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

      expect(
        await screen.findByText(
          /If an account exists with this email address, a password reset link has been sent\./i
        )
      ).toBeInTheDocument();
    });

    it('validates password requirements on ResetPasswordPage', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AuthProvider>
            <ResetPasswordPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await user.type(screen.getByLabelText(/^New Password/i), 'short');
      await user.type(screen.getByLabelText(/^Confirm New Password/i), 'short');

      fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

      expect(
        await screen.findByText(/Password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });
  });

  describe('4. Session Restoration & Profile State', () => {
    it('restores authenticated user session and displays profile', async () => {
      const { supabase } = await import('@/lib/supabase');
      const fakeUser = {
        id: 'usr-123',
        email: 'seedkeeper@punjab.pk',
        email_confirmed_at: '2026-02-16T12:00:00Z',
        app_metadata: { role: 'authenticated' },
        user_metadata: { full_name: 'Akram Khan', district: 'Multan' },
      };

      (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token',
            user: fakeUser,
          },
        },
        error: null,
      });

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'usr-123',
            full_name: 'Akram Khan',
            district: 'Multan',
            province: 'punjab',
            preferred_language: 'en',
            is_verified_keeper: true,
            is_suspended: false,
          },
          error: null,
        }),
      });

      const SessionConsumer: React.FC = () => {
        const { user, profile, isAuthenticated, isEmailConfirmed } = useAuth();
        if (!isAuthenticated) return <div>Checking session...</div>;
        return (
          <div>
            <div data-testid="user-email">{user?.email}</div>
            <div data-testid="profile-name">{profile?.fullName}</div>
            <div data-testid="email-confirmed">{String(isEmailConfirmed)}</div>
          </div>
        );
      };

      render(
        <MemoryRouter>
          <AuthProvider>
            <SessionConsumer />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(await screen.findByTestId('user-email')).toHaveTextContent('seedkeeper@punjab.pk');
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Akram Khan');
      expect(screen.getByTestId('email-confirmed')).toHaveTextContent('true');
    });
  });

  describe('5. Route Protection & Authorization Boundaries', () => {
    it('redirects unauthenticated users to /login with redirectTo param', async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>Secret Dashboard</div>
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      // Should redirect to login
      expect(await screen.findByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
    });

    it('renders suspended account notice and appeal info on /suspended', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <SuspendedAccountPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        /Account Suspended/i
      );
      expect(screen.getByText(/support@beejdost.pk/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
    });

    it('blocks non-admin users from admin routes with requireAdmin', async () => {
      const { supabase } = await import('@/lib/supabase');
      (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          session: {
            access_token: 'user-token',
            user: {
              id: 'non-admin-usr',
              email: 'regular@farmer.pk',
              email_confirmed_at: '2026-02-16T12:00:00Z',
              app_metadata: { role: 'authenticated' }, // NOT admin!
            },
          },
        },
        error: null,
      });

      render(
        <MemoryRouter initialEntries={['/admin-console']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/admin-console"
                element={
                  <ProtectedRoute requireAdmin>
                    <div>Super Secret Admin Area</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      expect(await screen.findByText(/Administrator access required/i)).toBeInTheDocument();
      expect(screen.queryByText('Super Secret Admin Area')).not.toBeInTheDocument();
    });
  });

  describe('6. Email Confirmation Callback Flow', () => {
    it('handles expired confirmation link with resend action', async () => {
      render(
        <MemoryRouter initialEntries={['/auth/callback?error_code=otp_expired']}>
          <AuthProvider>
            <AuthCallbackPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
        /Verification Link Expired/i
      );
      expect(screen.getByRole('button', { name: /Resend Confirmation Email/i })).toBeInTheDocument();
    });
  });

  describe('7. Trilingual Localization & RTL/LTR Synchronization', () => {
    it('switches document direction to rtl for Urdu and sets lang="ur"', async () => {
      await i18n.changeLanguage('ur');

      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('ur');
      expect(document.documentElement.classList.contains('rtl')).toBe(true);
      expect(document.documentElement.classList.contains('ltr')).toBe(false);
    });

    it('switches document direction to rtl for Punjabi (Shahmukhi) and sets lang="pa"', async () => {
      await i18n.changeLanguage('pa');

      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('pa');
      expect(document.documentElement.classList.contains('rtl')).toBe(true);
      expect(document.documentElement.classList.contains('ltr')).toBe(false);
    });

    it('switches document direction back to ltr for English and sets lang="en"', async () => {
      await i18n.changeLanguage('en');

      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.classList.contains('ltr')).toBe(true);
      expect(document.documentElement.classList.contains('rtl')).toBe(false);
    });
  });
});
