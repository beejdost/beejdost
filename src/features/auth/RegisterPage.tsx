import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured, getSupabaseConfigError } from '@/lib/supabase';
import { PakistanProvince, PreferredLanguage } from '@/types';
import { UserPlus, Mail, AlertCircle, CheckCircle2, RefreshCw, Info } from 'lucide-react';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    province: z.enum([
      'punjab',
      'sindh',
      'khyberPakhtunkhwa',
      'balochistan',
      'gilgitBaltistan',
      'azadKashmir',
      'islamabad',
    ] as const),
    district: z.string().min(2, 'District is required'),
    tehsil: z.string().optional(),
    village: z.string().optional(),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\+?[0-9\s-]{10,16}$/.test(val),
        'Invalid phone number format (e.g. 03001234567)'
      ),
    preferredLanguage: z.enum(['en', 'ur', 'pa'] as const),
    farmingType: z.enum(['organic', 'conventional', 'seedSaver', 'researcher'] as const),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { signUp, resendConfirmationEmail } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const currentLang = (i18n.language || 'en').split('-')[0] as PreferredLanguage;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      province: 'punjab',
      district: '',
      tehsil: '',
      village: '',
      phone: '',
      preferredLanguage: currentLang,
      farmingType: 'conventional',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setResendMessage(null);

    const { error, unconfirmed } = await signUp({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      province: data.province,
      district: data.district,
      tehsil: data.tehsil || undefined,
      village: data.village || undefined,
      phone: data.phone || undefined,
      preferredLanguage: data.preferredLanguage,
      farmingType: data.farmingType,
    });

    setIsSubmitting(false);

    if (error) {
      setSubmitError(error.message);
    } else if (unconfirmed) {
      setRegisteredEmail(data.email);
    }
  };

  const handleResendConfirmation = async () => {
    if (!registeredEmail) return;
    setResending(true);
    setResendMessage(null);
    const { error } = await resendConfirmationEmail(registeredEmail);
    setResending(false);
    if (error) {
      setSubmitError(error.message);
    } else {
      setResendMessage(t('auth.resendSuccess'));
    }
  };

  // Confirmation email sent view
  if (registeredEmail) {
    return (
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '520px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <Mail size={32} aria-hidden="true" />
          </div>

          <h1 style={{ fontSize: '1.65rem', marginBottom: '0.5rem' }}>
            {t('auth.checkEmailTitle')}
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            {t('auth.checkEmailSubtitle')}
          </p>

          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              color: 'var(--primary-900)',
              marginBottom: '1.5rem',
              wordBreak: 'break-all',
            }}
          >
            {registeredEmail}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            {t('auth.confirmationSentDesc')}
          </p>

          {resendMessage && (
            <div
              role="status"
              style={{
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-900)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={16} aria-hidden="true" style={{ color: 'var(--status-success)' }} />
              <span>{resendMessage}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              disabled={resending}
              onClick={() => void handleResendConfirmation()}
              className="btn btn-outline"
              id="resend-confirmation-btn"
            >
              <RefreshCw size={16} className={resending ? 'spin' : ''} aria-hidden="true" />
              <span>{resending ? t('auth.resending') : t('auth.resendConfirmationButton')}</span>
            </button>

            <Link to="/login" className="btn btn-primary" id="confirm-go-to-login-btn">
              {t('auth.continueToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const provinces: PakistanProvince[] = [
    'punjab',
    'sindh',
    'khyberPakhtunkhwa',
    'balochistan',
    'gilgitBaltistan',
    'azadKashmir',
    'islamabad',
  ];

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3.5rem', maxWidth: '640px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.4rem' }}>
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
          <div>
            <strong>Configuration Notice:</strong>{' '}
            {getSupabaseConfigError() || 'Supabase credentials are not configured in .env.'}
            <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#1e3a8a' }}>
              Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (or <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>) in your root <code>.env</code> file, then restart Vite.
            </div>
          </div>
        </div>
      )}

      {submitError && (
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
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card" noValidate>
        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="fullName" className="form-label">
            {t('auth.fullName')} *
          </label>
          <input
            id="fullName"
            type="text"
            className="form-input"
            placeholder="e.g. Chaudhry Tariq Mehmood"
            {...register('fullName')}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          {errors.fullName && (
            <span id="fullName-error" className="form-error">
              {errors.fullName.message}
            </span>
          )}
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            {t('auth.email')} *
          </label>
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
          {errors.email && (
            <span id="email-error" className="form-error">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Passwords */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              {t('auth.password')} *
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
        </div>

        {/* Location: Province & District */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="province" className="form-label">
              {t('auth.province')} *
            </label>
            <select id="province" className="form-select" {...register('province')}>
              {provinces.map((prov) => (
                <option key={prov} value={prov}>
                  {t(`search.${prov}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="district" className="form-label">
              {t('auth.district')} *
            </label>
            <input
              id="district"
              type="text"
              className="form-input"
              placeholder="e.g. Gujranwala, Matiari, Swat"
              {...register('district')}
              aria-invalid={!!errors.district}
              aria-describedby={errors.district ? 'district-error' : undefined}
            />
            {errors.district && (
              <span id="district-error" className="form-error">
                {errors.district.message}
              </span>
            )}
          </div>
        </div>

        {/* Optional Location: Tehsil & Village */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="tehsil" className="form-label">
              {t('auth.tehsil')}
            </label>
            <input
              id="tehsil"
              type="text"
              className="form-input"
              placeholder="e.g. Wazirabad"
              {...register('tehsil')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="village" className="form-label">
              {t('auth.village')}
            </label>
            <input
              id="village"
              type="text"
              className="form-input"
              placeholder="e.g. Chak 42-RB"
              {...register('village')}
            />
          </div>
        </div>

        {/* Contact & Language Preferences */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              {t('auth.phone')}
            </label>
            <input
              id="phone"
              type="tel"
              className="form-input"
              placeholder="03001234567"
              {...register('phone')}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <span id="phone-error" className="form-error">
                {errors.phone.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="preferredLanguage" className="form-label">
              {t('auth.preferredLanguage')} *
            </label>
            <select id="preferredLanguage" className="form-select" {...register('preferredLanguage')}>
              <option value="en">English</option>
              <option value="ur">اردو (Urdu)</option>
              <option value="pa">شاہ مکھی پنجابی (Shahmukhi Punjabi)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
          id="register-submit-btn"
          style={{ width: '100%', padding: '0.8rem', marginTop: '1rem', fontSize: '1rem' }}
        >
          <UserPlus size={18} aria-hidden="true" />
          <span>{isSubmitting ? t('common.loading') : t('auth.registerButton')}</span>
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
