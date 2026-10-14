import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { CheckCircle2, AlertCircle, RefreshCw, LogIn, ArrowRight } from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';

export const AuthCallbackPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { refreshProfile, resendConfirmationEmail } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      // Check for error parameters in query string or URL hash
      const error = searchParams.get('error');
      const errorCode = searchParams.get('error_code');
      const errorDescription = searchParams.get('error_description');

      // Check hash fragment for errors (e.g. #error=access_denied&error_code=otp_expired)
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
      const hashError = hashParams.get('error');
      const hashErrorCode = hashParams.get('error_code');
      const hashErrorDescription = hashParams.get('error_description');

      const isExpired =
        errorCode === 'otp_expired' ||
        hashErrorCode === 'otp_expired' ||
        (errorDescription && errorDescription.toLowerCase().includes('expired')) ||
        (hashErrorDescription && hashErrorDescription.toLowerCase().includes('expired'));

      if (isExpired) {
        if (mounted) {
          setStatus('expired');
          setErrorMessage(errorDescription || hashErrorDescription || t('auth.confirmExpiredDesc'));
        }
        return;
      }

      if (error || hashError) {
        if (mounted) {
          setStatus('error');
          setErrorMessage(errorDescription || hashErrorDescription || error || hashError || 'Authentication failed');
        }
        return;
      }

      if (!isSupabaseConfigured()) {
        if (mounted) {
          setStatus('success');
        }
        return;
      }

      try {
        const code = searchParams.get('code');
        if (code) {
          // PKCE code exchange
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (mounted) {
              if (exchangeError.message.toLowerCase().includes('expired')) {
                setStatus('expired');
                setErrorMessage(t('auth.confirmExpiredDesc'));
              } else {
                setStatus('error');
                setErrorMessage(exchangeError.message);
              }
            }
            return;
          }
        }

        // Verify current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (mounted) {
            setStatus('error');
            setErrorMessage(sessionError.message);
          }
          return;
        }

        if (session?.user) {
          await refreshProfile();
          if (mounted) {
            setStatus('success');
          }
        } else {
          // Hash-based tokens might already have been processed by Supabase client
          if (mounted) {
            setStatus('success');
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : 'Failed to complete confirmation');
        }
      }
    };

    void handleCallback();

    return () => {
      mounted = false;
    };
  }, [searchParams, refreshProfile, t]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResending(true);
    setResendSuccess(false);

    const { error } = await resendConfirmationEmail(resendEmail);
    setResending(false);

    if (!error) {
      setResendSuccess(true);
    } else {
      setErrorMessage(error.message);
    }
  };

  if (status === 'loading') {
    return <LoadingState fullPage />;
  }

  return (
    <div className="container" style={{ paddingTop: '3.5rem', paddingBottom: '4rem', maxWidth: '520px' }}>
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
        {status === 'success' && (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--status-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <CheckCircle2 size={36} aria-hidden="true" />
            </div>

            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--primary-900)' }}>
              {t('auth.confirmSuccessTitle')}
            </h1>

            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
              {t('auth.confirmSuccessDesc')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                to="/profile"
                className="btn btn-primary"
                id="callback-go-profile-btn"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                <span>{t('auth.goToProfile')}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>

              <Link
                to="/login"
                className="btn btn-outline"
                id="callback-go-login-btn"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                <span>{t('auth.continueToLogin')}</span>
              </Link>
            </div>
          </div>
        )}

        {status === 'expired' && (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fffbeb',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <AlertCircle size={36} aria-hidden="true" />
            </div>

            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              {t('auth.confirmExpiredTitle')}
            </h1>

            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              {errorMessage || t('auth.confirmExpiredDesc')}
            </p>

            {resendSuccess ? (
              <div
                role="status"
                style={{
                  backgroundColor: 'var(--primary-100)',
                  color: 'var(--primary-900)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                }}
              >
                {t('auth.resendSuccess')}
              </div>
            ) : (
              <form onSubmit={handleResend} style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <div className="form-group">
                  <label htmlFor="resend-email" className="form-label">
                    {t('auth.email')}
                  </label>
                  <input
                    id="resend-email"
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="farmer@punjab.pk"
                    className="form-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resending || !resendEmail}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  <RefreshCw size={16} className={resending ? 'animate-spin' : ''} aria-hidden="true" />
                  <span>{resending ? t('auth.resending') : t('auth.resendConfirmationButton')}</span>
                </button>
              </form>
            )}

            <Link
              to="/login"
              className="btn btn-outline"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              <LogIn size={18} aria-hidden="true" />
              <span>{t('auth.continueToLogin')}</span>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: 'var(--status-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <AlertCircle size={36} aria-hidden="true" />
            </div>

            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--status-error)' }}>
              Verification Failed
            </h1>

            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
              {errorMessage || 'We could not verify your email address. The link may have expired or is invalid.'}
            </p>

            <Link
              to="/login"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              <span>{t('auth.continueToLogin')}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
