import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { KeyRound, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await resetPassword(data.email);
    setIsLoading(false);

    // Rule: Avoid leaking account existence.
    // Show success notice regardless, unless network error completely blocked the request.
    if (error && error.message.toLowerCase().includes('network')) {
      setErrorMessage(error.message);
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '480px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.4rem', color: 'var(--primary-900)' }}>
          {t('auth.forgotPasswordTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {t('auth.forgotPasswordSubtitle')}
        </p>
      </div>

      {submitted ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--status-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <CheckCircle2 size={32} aria-hidden="true" />
          </div>

          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
            Check Your Email
          </h2>

          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
            {t('auth.resetLinkSent')}
          </p>

          <Link
            to="/login"
            className="btn btn-outline"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{t('auth.rememberPasswordLink')}</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="card" noValidate>
          {errorMessage && (
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
              <span>{errorMessage}</span>
            </div>
          )}

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

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            id="forgot-password-submit-btn"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.75rem', fontSize: '1rem' }}
          >
            <KeyRound size={18} aria-hidden="true" />
            <span>{isLoading ? t('common.loading') : t('auth.sendResetLinkButton')}</span>
          </button>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-light)',
              textAlign: 'center',
              fontSize: '0.9rem',
            }}
          >
            <Link to="/login" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('auth.rememberPasswordLink')}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
