import { useState, type FC } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { User, ShieldCheck, CheckCircle2, Save } from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid Pakistani phone number required (e.g. 03001234567)'),
  district: z.string().min(2, 'District is required'),
  farmingType: z.enum(['organic', 'conventional', 'seedSaver']),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfilePage: FC = () => {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);

  const initialProfile = (() => {
    try {
      const data = localStorage.getItem('beej_dost_farmer_profile');
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return {
      fullName: 'Muhammad Aslam',
      phone: '0301-5551234',
      district: 'Sargodha',
      farmingType: 'seedSaver' as const,
    };
  })();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialProfile,
  });

  const onSubmit = (data: ProfileFormData) => {
    localStorage.setItem('beej_dost_farmer_profile', JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem', maxWidth: '640px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.4rem' }}>
          {t('profile.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          {t('profile.subtitle')}
        </p>
      </div>

      {saved && (
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

      {/* Header Profile Badge */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          marginBottom: '1.5rem',
          backgroundColor: 'var(--primary-50)',
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
          }}
        >
          <User size={32} aria-hidden="true" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>{initialProfile.fullName}</h2>
            <ShieldCheck size={18} style={{ color: 'var(--primary-700)' }} aria-hidden="true" />
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Verified Community Seed Keeper • {initialProfile.district}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card" noValidate>
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

        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            {t('profile.phone')} *
          </label>
          <input
            id="phone"
            type="tel"
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

        <div className="form-group">
          <label htmlFor="district" className="form-label">
            {t('profile.district')} *
          </label>
          <input
            id="district"
            type="text"
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

        <div className="form-group">
          <label htmlFor="farmingType" className="form-label">
            {t('profile.farmingType')} *
          </label>
          <select id="farmingType" className="form-select" {...register('farmingType')}>
            <option value="seedSaver">{t('profile.seedSaver')}</option>
            <option value="organic">{t('profile.organic')}</option>
            <option value="conventional">{t('profile.conventional')}</option>
          </select>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          id="profile-save-btn"
          style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
        >
          <Save size={18} aria-hidden="true" />
          <span>{t('profile.saveProfile')}</span>
        </button>
      </form>
    </div>
  );
};
