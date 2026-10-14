import { useState, type FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { UserPlus, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setAuthError(null);
    setSuccessMessage(null);

    try {
      if (!isSupabaseConfigured()) {
        setAuthError(
          'Supabase credentials are not configured in .env. Real registration requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
        );
        return;
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setAuthError(error.message);
      } else if (authData.user && !authData.session) {
        setSuccessMessage('Registration successful! Please check your email for the confirmation link.');
      } else {
        navigate('/profile');
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3.5rem', maxWidth: '480px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.4rem' }}>
          {t('auth.registerTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {t('auth.registerSubtitle')}
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
            Notice: Live account registration connects to Supabase. Configure <code>.env</code> with real project keys.
          </span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          style={{
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-900)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.9rem',
          }}
        >
          <CheckCircle2 size={20} style={{ color: 'var(--status-success)' }} aria-hidden="true" />
          <span>{successMessage}</span>
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
          <label htmlFor="register-email" className="form-label">
            {t('auth.email')} *
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            className="form-input"
            placeholder="farmer@punjab.pk"
            {...register('email')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
          />
          {errors.email && (
            <span id="register-email-error" className="form-error">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="register-password" className="form-label">
            {t('auth.password')} *
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            className="form-input"
            {...register('password')}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'register-password-error' : undefined}
          />
          {errors.password && (
            <span id="register-password-error" className="form-error">
              {errors.password.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            {t('auth.confirmPassword')} *
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
          id="register-submit-btn"
          style={{ width: '100%', padding: '0.75rem', marginTop: '0.75rem', fontSize: '1rem' }}
        >
          <UserPlus size={18} aria-hidden="true" />
          <span>{isLoading ? t('common.loading') : t('auth.registerButton')}</span>
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
          <span>{t('auth.haveAccount')} </span>
          <Link to="/login" style={{ fontWeight: 600 }}>
            {t('auth.signInButton')}
          </Link>
        </div>
      </form>
    </div>
  );
};
