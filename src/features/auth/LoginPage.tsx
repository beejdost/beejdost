import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { LogIn, AlertCircle, Info, MailWarning, RefreshCw, CheckCircle2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, resendConfirmationEmail } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const redirectTo = searchParams.get('redirectTo') || '/profile';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);
    setUnconfirmedEmail(null);
    setResendSuccess(false);

    try {
      const { error, requiresEmailConfirmation, isSuspended } = await signIn(
        data.email,
        data.password
      );

      if (isSuspended) {
        navigate('/suspended');
        return;
      }

      if (requiresEmailConfirmation) {
        setUnconfirmedEmail(data.email);
        setIsLoading(false);
        return;
      }

      if (error) {
        // Anti-account-enumeration rule:
        // Do not leak whether the user exists or not.
        // If it's a network error, display that; otherwise display generic invalid credentials.
        if (error.message.toLowerCase().includes('network')) {
          setAuthError(error.message);
        } else if (!isSupabaseConfigured()) {
          setAuthError(error.message);
        } else {
          setAuthError(t('auth.invalidCredentials'));
        }
      } else {
        navigate(redirectTo);
      }
    } catch {
      setAuthError(t('auth.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail) return;

    setResending(true);
    setResendSuccess(false);

    const { error } = await resendConfirmationEmail(unconfirmedEmail);
    setResending(false);

    if (!error) {
      setResendSuccess(true);
    } else {
      setAuthError(error.message);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3.5rem', maxWidth: '480px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.4rem', color: 'var(--primary-900)' }}>
          {t('auth.loginTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {t('auth.loginSubtitle')}
        </p>
      </div>

      {!isSupabaseConfigured() && (
        <div
          role="note"
          style={{
            backgroundColor: '#eff6ff',
            color: '#1e40af',
            border: '1px solid #bfdbfe',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            fontSize: '0.85rem',
          }}
        >
          <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <span>
            Notice: Supabase credentials are not configured in <code>.env</code>. Connect live credentials for full authentication.
          </span>
        </div>
      )}

      {unconfirmedEmail && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fffbeb',
            color: '#92400e',
            border: '1px solid #fde68a',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginBottom: '0.75rem' }}>
            <MailWarning size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#b45309' }} aria-hidden="true" />
            <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
              <strong>{t('auth.checkEmailTitle')}</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>{t('auth.unconfirmedEmail')}</p>
            </div>
          </div>

          {resendSuccess ? (
            <div
              style={{
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-900)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
              }}
            >
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>{t('auth.resendSuccess')}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resending}
              className="btn btn-outline"
              id="resend-confirmation-btn"
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.85rem',
                backgroundColor: '#ffffff',
                borderColor: '#f59e0b',
                color: '#92400e',
              }}
            >
              <RefreshCw size={14} className={resending ? 'animate-spin' : ''} aria-hidden="true" />
              <span>{resending ? t('auth.resending') : t('auth.resendConfirmationButton')}</span>
            </button>
          )}
        </div>
      )}

      {authError && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fee2e2',
            color: 'var(--status-error)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.9rem',
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card" noValidate>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            {t('auth.email')} *
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="form-input"
              placeholder="farmer@punjab.pk"
              {...register('email')}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
          </div>
          {errors.email && (
            <span id="email-error" className="form-error">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label htmlFor="password" className="form-label" style={{ marginBottom: 0 }}>
              {t('auth.password')} *
            </label>
            <Link
              to="/forgot-password"
              style={{ fontSize: '0.8rem', color: 'var(--primary-700)', textDecoration: 'none' }}
            >
              {t('auth.forgotPasswordLink')}
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="form-input"
              {...register('password')}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
          </div>
          {errors.password && (
            <span id="password-error" className="form-error">
              {errors.password.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
          id="login-submit-btn"
          style={{ width: '100%', padding: '0.75rem', marginTop: '0.75rem', fontSize: '1rem' }}
        >
          <LogIn size={18} aria-hidden="true" />
          <span>{isLoading ? t('common.loading') : t('auth.signInButton')}</span>
        </button>

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>{t('auth.noAccount')} </span>
          <Link to="/register" style={{ fontWeight: 600 }}>
            {t('auth.registerButton')}
          </Link>
        </div>
      </form>
    </div>
  );
};
