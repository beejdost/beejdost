import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const { updatePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await updatePassword(data.password);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '480px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.4rem', color: 'var(--primary-900)' }}>
          {t('auth.resetPasswordTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {t('auth.resetPasswordSubtitle')}
        </p>
      </div>

      {success ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
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

          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>
            Password Updated
          </h2>

          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
            {t('auth.passwordUpdated')}
          </p>

          <Link
            to="/login"
            className="btn btn-primary"
            id="reset-password-login-btn"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            <span>{t('auth.continueToLogin')}</span>
            <ArrowRight size={18} aria-hidden="true" />
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
            <label htmlFor="password" className="form-label">
              {t('auth.newPassword')} *
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="form-input"
              {...register('password')}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <span id="password-error" className="form-error">
                {errors.password.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              {t('auth.confirmNewPassword')} *
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="form-input"
              {...register('confirmPassword')}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            />
            {errors.confirmPassword && (
              <span id="confirmPassword-error" className="form-error">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            id="reset-password-submit-btn"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.75rem', fontSize: '1rem' }}
          >
            <Lock size={18} aria-hidden="true" />
            <span>{isLoading ? t('common.loading') : t('auth.updatePasswordButton')}</span>
          </button>
        </form>
      )}
    </div>
  );
};
