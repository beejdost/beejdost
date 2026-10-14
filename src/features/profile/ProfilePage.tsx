import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthContext';
import { PakistanProvince, PreferredLanguage, FarmingType } from '@/types';
import {
  ShieldCheck,
  CheckCircle2,
  Save,
  AlertCircle,
  MailCheck,
  MailWarning,
  ShieldAlert,
  Shield,
  RefreshCw,
} from 'lucide-react';

const profileUpdateSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[0-9\s-]{10,16}$/.test(val),
      'Invalid phone number format (e.g. 03001234567)'
    ),
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
  farmingType: z.enum(['organic', 'conventional', 'seedSaver', 'researcher'] as const),
  preferredLanguage: z.enum(['en', 'ur', 'pa'] as const),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
});

type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

export const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    user,
    profile,
    updateProfile,
    isEmailConfirmed,
    isAdmin,
    resendConfirmationEmail,
  } = useAuth();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: profile?.fullName || user?.user_metadata?.full_name || '',
      phone: profile?.phone || user?.user_metadata?.phone || '',
      province: (profile?.province as PakistanProvince) || (user?.user_metadata?.province as PakistanProvince) || 'punjab',
      district: profile?.district || user?.user_metadata?.district || '',
      tehsil: profile?.tehsil || user?.user_metadata?.tehsil || '',
      village: profile?.village || user?.user_metadata?.village || '',
      farmingType: (profile?.farmingType as FarmingType) || (user?.user_metadata?.farming_type as FarmingType) || 'conventional',
      preferredLanguage:
        (profile?.preferredLanguage as PreferredLanguage) ||
        (user?.user_metadata?.preferred_language as PreferredLanguage) ||
        ((i18n.language?.split('-')[0] as PreferredLanguage) || 'en'),
      bio: profile?.bio || '',
    },
  });

  // Re-sync form defaults when profile loads or updates
  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        province: profile.province || 'punjab',
        district: profile.district || '',
        tehsil: profile.tehsil || '',
        village: profile.village || '',
        farmingType: profile.farmingType || 'conventional',
        preferredLanguage: profile.preferredLanguage || 'en',
        bio: profile.bio || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileUpdateFormData) => {
    setIsSubmitting(true);
    setUpdateError(null);
    setSavedSuccess(false);

    const { error } = await updateProfile({
      fullName: data.fullName,
      phone: data.phone || null,
      province: data.province,
      district: data.district,
      tehsil: data.tehsil || null,
      village: data.village || null,
      farmingType: data.farmingType,
      preferredLanguage: data.preferredLanguage,
      bio: data.bio || null,
    });

    setIsSubmitting(false);

    if (error) {
      setUpdateError(error.message);
    } else {
      setSavedSuccess(true);
      // Auto-switch language if preferredLanguage changed
      if (data.preferredLanguage && data.preferredLanguage !== i18n.language) {
        void i18n.changeLanguage(data.preferredLanguage);
      }
      setTimeout(() => setSavedSuccess(false), 4000);
    }
  };

  const handleResend = async () => {
    if (!user?.email) return;
    setResending(true);
    setResendNotice(null);
    const { error } = await resendConfirmationEmail(user.email);
    setResending(false);
    if (!error) {
      setResendNotice(t('auth.resendSuccess'));
    } else {
      setUpdateError(error.message);
    }
  };

  const displayName = profile?.fullName || user?.user_metadata?.full_name || user?.email || 'Farmer';
  const displayDistrict = profile?.district || user?.user_metadata?.district || 'Pakistan';

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem', maxWidth: '680px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.4rem', color: 'var(--primary-900)' }}>
          {t('profile.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          {t('profile.subtitle')}
        </p>
      </div>

      {savedSuccess && (
        <div
          role="status"
          style={{
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-900)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <CheckCircle2 size={22} style={{ color: 'var(--status-success)' }} aria-hidden="true" />
          <span>{t('profile.saved')}</span>
        </div>
      )}

      {updateError && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fee2e2',
            color: 'var(--status-error)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={22} aria-hidden="true" />
          <span>{updateError}</span>
        </div>
      )}

      {/* Header Profile Badge Card */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1.25rem',
          marginBottom: '1.5rem',
          backgroundColor: 'var(--primary-50)',
          border: '1px solid var(--primary-200)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-700)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: '1 1 240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>{displayName}</h2>

            {profile?.isVerifiedKeeper && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  backgroundColor: 'var(--primary-700)',
                  color: '#ffffff',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
                title={t('auth.verifiedKeeperBadge')}
              >
                <ShieldCheck size={14} aria-hidden="true" />
                <span>{t('auth.verifiedKeeperBadge')}</span>
              </span>
            )}

            {isAdmin && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  backgroundColor: '#374151',
                  color: '#f9fafb',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                <Shield size={14} aria-hidden="true" />
                <span>{t('auth.adminBadge')}</span>
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
            {displayDistrict} • {user?.email}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {/* Email Confirmation Status Badge */}
            {isEmailConfirmed ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  backgroundColor: 'var(--primary-100)',
                  color: 'var(--status-success)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                <MailCheck size={14} aria-hidden="true" />
                <span>{t('auth.emailConfirmedBadge')}</span>
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  backgroundColor: '#fffbeb',
                  color: '#b45309',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                <MailWarning size={14} aria-hidden="true" />
                <span>{t('auth.emailUnconfirmedBadge')}</span>
              </span>
            )}

            {/* Account Standing Badge */}
            {profile?.isSuspended ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  backgroundColor: '#fee2e2',
                  color: 'var(--status-error)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                <ShieldAlert size={14} aria-hidden="true" />
                <span>{t('profile.suspended')}</span>
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  backgroundColor: '#eff6ff',
                  color: '#1e40af',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                <CheckCircle2 size={14} aria-hidden="true" />
                <span>{t('profile.active')}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Unconfirmed email action banner */}
      {!isEmailConfirmed && user?.email && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
            <MailWarning size={20} style={{ color: '#b45309', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
            <div>
              <strong style={{ color: '#92400e', fontSize: '0.95rem' }}>
                {t('auth.checkEmailTitle')}
              </strong>
              <p style={{ margin: '0.25rem 0 0 0', color: '#78350f', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {t('auth.confirmationSentDesc')}
              </p>
            </div>
          </div>

          {resendNotice ? (
            <div
              style={{
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-900)',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
              }}
            >
              {resendNotice}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="btn btn-outline"
              id="profile-resend-btn"
              style={{
                alignSelf: 'flex-start',
                padding: '0.4rem 0.9rem',
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

      {/* Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card" noValidate>
        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="fullName" className="form-label">
            {t('profile.fullName')} *
          </label>
          <input
            id="fullName"
            type="text"
            className="form-input"
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

        {/* Email (Read-only for security) */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            {t('profile.email')}
          </label>
          <input
            id="email"
            type="email"
            disabled
            value={user?.email || ''}
            className="form-input"
            style={{ backgroundColor: 'var(--bg-subtle, #f3f4f6)', cursor: 'not-allowed' }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Email address is managed securely via Supabase Auth.
          </span>
        </div>

        {/* Phone */}
        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            {t('profile.phone')}
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="03001234567"
            className="form-input"
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

        {/* Location Row: Province & District */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="province" className="form-label">
              {t('profile.province')} *
            </label>
            <select id="province" className="form-select" {...register('province')}>
              <option value="punjab">{t('search.punjab')}</option>
              <option value="sindh">{t('search.sindh')}</option>
              <option value="khyberPakhtunkhwa">{t('search.khyberPakhtunkhwa')}</option>
              <option value="balochistan">{t('search.balochistan')}</option>
              <option value="gilgitBaltistan">{t('search.gilgitBaltistan')}</option>
              <option value="azadKashmir">{t('search.azadKashmir')}</option>
              <option value="islamabad">{t('search.islamabad')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="district" className="form-label">
              {t('profile.district')} *
            </label>
            <input
              id="district"
              type="text"
              placeholder="e.g. Sargodha, Larkana, Swat"
              className="form-input"
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

        {/* Optional Tehsil & Village */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="tehsil" className="form-label">
              {t('profile.tehsil')}
            </label>
            <input
              id="tehsil"
              type="text"
              placeholder="e.g. Bhalwal"
              className="form-input"
              {...register('tehsil')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="village" className="form-label">
              {t('profile.village')}
            </label>
            <input
              id="village"
              type="text"
              placeholder="e.g. Chak 10-NB"
              className="form-input"
              {...register('village')}
            />
          </div>
        </div>

        {/* Farming Practice & Preferred Language */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="farmingType" className="form-label">
              {t('profile.farmingType')} *
            </label>
            <select id="farmingType" className="form-select" {...register('farmingType')}>
              <option value="conventional">{t('profile.conventional')}</option>
              <option value="organic">{t('profile.organic')}</option>
              <option value="seedSaver">{t('profile.seedSaver')}</option>
              <option value="researcher">{t('profile.researcher')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="preferredLanguage" className="form-label">
              {t('profile.preferredLanguage')} *
            </label>
            <select id="preferredLanguage" className="form-select" {...register('preferredLanguage')}>
              <option value="en">English (انگریزی)</option>
              <option value="ur">اردو (Urdu)</option>
              <option value="pa">شاہ مکھی پنجابی (Punjabi)</option>
            </select>
          </div>
        </div>

        {/* Farmer Bio */}
        <div className="form-group">
          <label htmlFor="bio" className="form-label">
            {t('profile.bio')}
          </label>
          <textarea
            id="bio"
            rows={3}
            className="form-input"
            placeholder="Share your experience preserving heritage seeds, local climate conditions, etc."
            {...register('bio')}
            aria-invalid={!!errors.bio}
            aria-describedby={errors.bio ? 'bio-error' : undefined}
          />
          {errors.bio && (
            <span id="bio-error" className="form-error">
              {errors.bio.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
          id="profile-save-btn"
          style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '1rem' }}
        >
          <Save size={18} aria-hidden="true" />
          <span>{isSubmitting ? t('common.loading') : t('profile.saveProfile')}</span>
        </button>
      </form>
    </div>
  );
};
