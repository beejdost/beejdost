import { useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { CropCategory, PakistanProvince, VarietyType } from '@/types';
import { CheckCircle2, AlertCircle, Sprout } from 'lucide-react';

const listingSchema = z.object({
  varietyName: z.string().min(3, 'Variety name must be at least 3 characters'),
  cropCategory: z.enum(['cereal', 'pulses', 'cotton', 'oilseeds', 'vegetables', 'fodder'] as const),
  varietyType: z.enum(['heirloom', 'hybrid', 'organic'] as const),
  province: z.enum([
    'punjab',
    'sindh',
    'khyberPakhtunkhwa',
    'balochistan',
    'gilgitBaltistan',
    'azadKashmir',
  ] as const),
  district: z.string().min(2, 'District / Tehsil is required'),
  quantityKg: z.coerce.number().positive('Quantity must be greater than 0 kg'),
  pricePerKg: z.coerce.number().min(0, 'Price must be 0 (for free exchange) or positive'),
  germinationRate: z.coerce
    .number()
    .min(1, 'Germination rate must be between 1 and 100%')
    .max(100, 'Germination rate cannot exceed 100%'),
  harvestYear: z.coerce
    .number()
    .min(2020, 'Year must be 2020 or newer')
    .max(new Date().getFullYear() + 1, 'Invalid harvest year'),
  description: z.string().min(10, 'Please provide at least 10 characters of agronomic information'),
});

type ListingFormData = z.infer<typeof listingSchema>;

export const CreateListingPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      cropCategory: 'cereal',
      varietyType: 'heirloom',
      province: 'punjab',
      district: '',
      pricePerKg: 0,
      germinationRate: 85,
      harvestYear: new Date().getFullYear(),
      description: '',
    },
  });

  const onSubmit = async (data: ListingFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('seed_listings').insert([
          {
            variety_name: data.varietyName,
            crop_category: data.cropCategory,
            variety_type: data.varietyType,
            province: data.province,
            district: data.district,
            quantity_kg: data.quantityKg,
            price_per_kg: data.pricePerKg,
            germination_rate: data.germinationRate,
            harvest_year: data.harvestYear,
            description: data.description,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) {
          throw new Error(error.message);
        }
      } else {
        // Safe local persistence fallback when Supabase credentials are not set
        const existingLocal = JSON.parse(localStorage.getItem('beej_dost_my_listings') || '[]');
        const newListing = {
          id: `local-${Date.now()}`,
          ...data,
          sellerName: 'Current User',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('beej_dost_my_listings', JSON.stringify([newListing, ...existingLocal]));
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/my-listings');
      }, 1200);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to publish listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: CropCategory[] = [
    'cereal',
    'pulses',
    'cotton',
    'oilseeds',
    'vegetables',
    'fodder',
  ];

  const provinces: PakistanProvince[] = [
    'punjab',
    'sindh',
    'khyberPakhtunkhwa',
    'balochistan',
    'gilgitBaltistan',
    'azadKashmir',
  ];

  const varietyTypes: VarietyType[] = ['heirloom', 'hybrid', 'organic'];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem', maxWidth: '720px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.4rem' }}>
          {t('createListing.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          {t('createListing.subtitle')}
        </p>
      </div>

      {success && (
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
          <CheckCircle2 size={24} style={{ color: 'var(--status-success)' }} aria-hidden="true" />
          <span style={{ fontWeight: 600 }}>{t('createListing.successMessage')}</span>
        </div>
      )}

      {submitError && (
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
          <AlertCircle size={24} aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card" noValidate>
        {/* Variety Name */}
        <div className="form-group">
          <label htmlFor="varietyName" className="form-label">
            {t('createListing.varietyName')} *
          </label>
          <input
            id="varietyName"
            type="text"
            className="form-input"
            placeholder="e.g. Desi Multani Cotton, Super Basmati, Swat Red Rice"
            {...register('varietyName')}
            aria-invalid={!!errors.varietyName}
            aria-describedby={errors.varietyName ? 'varietyName-error' : undefined}
          />
          {errors.varietyName && (
            <span id="varietyName-error" className="form-error">
              {errors.varietyName.message}
            </span>
          )}
        </div>

        {/* Crop Category & Variety Type */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          <div className="form-group">
            <label htmlFor="cropCategory" className="form-label">
              {t('createListing.cropType')} *
            </label>
            <select id="cropCategory" className="form-select" {...register('cropCategory')}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`search.${cat}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="varietyType" className="form-label">
              {t('search.seedType')} *
            </label>
            <select id="varietyType" className="form-select" {...register('varietyType')}>
              {varietyTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`search.${type}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Province & District */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          <div className="form-group">
            <label htmlFor="province" className="form-label">
              {t('createListing.province')} *
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
              {t('createListing.district')} *
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

        {/* Quantity & Price */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          <div className="form-group">
            <label htmlFor="quantityKg" className="form-label">
              {t('createListing.quantityKg')} *
            </label>
            <input
              id="quantityKg"
              type="number"
              step="any"
              className="form-input"
              placeholder="e.g. 50"
              {...register('quantityKg')}
              aria-invalid={!!errors.quantityKg}
              aria-describedby={errors.quantityKg ? 'quantityKg-error' : undefined}
            />
            {errors.quantityKg && (
              <span id="quantityKg-error" className="form-error">
                {errors.quantityKg.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="pricePerKg" className="form-label">
              {t('createListing.pricePerKg')} *
            </label>
            <input
              id="pricePerKg"
              type="number"
              step="any"
              className="form-input"
              placeholder="0 for free barter swap"
              {...register('pricePerKg')}
              aria-invalid={!!errors.pricePerKg}
              aria-describedby={errors.pricePerKg ? 'pricePerKg-error' : undefined}
            />
            {errors.pricePerKg && (
              <span id="pricePerKg-error" className="form-error">
                {errors.pricePerKg.message}
              </span>
            )}
          </div>
        </div>

        {/* Germination Rate & Harvest Year */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          <div className="form-group">
            <label htmlFor="germinationRate" className="form-label">
              {t('createListing.germinationRate')} *
            </label>
            <input
              id="germinationRate"
              type="number"
              min="1"
              max="100"
              className="form-input"
              placeholder="e.g. 90"
              {...register('germinationRate')}
              aria-invalid={!!errors.germinationRate}
              aria-describedby={errors.germinationRate ? 'germinationRate-error' : undefined}
            />
            {errors.germinationRate && (
              <span id="germinationRate-error" className="form-error">
                {errors.germinationRate.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="harvestYear" className="form-label">
              {t('createListing.harvestYear')} *
            </label>
            <input
              id="harvestYear"
              type="number"
              className="form-input"
              placeholder="e.g. 2025"
              {...register('harvestYear')}
              aria-invalid={!!errors.harvestYear}
              aria-describedby={errors.harvestYear ? 'harvestYear-error' : undefined}
            />
            {errors.harvestYear && (
              <span id="harvestYear-error" className="form-error">
                {errors.harvestYear.message}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            {t('createListing.description')} *
          </label>
          <textarea
            id="description"
            rows={4}
            className="form-textarea"
            placeholder="Describe soil suitability, climate resilience, drought or pest tolerance, seed lineage..."
            {...register('description')}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'description-error' : undefined}
          />
          {errors.description && (
            <span id="description-error" className="form-error">
              {errors.description.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
          id="publish-listing-btn"
          style={{ width: '100%', padding: '0.8rem', fontSize: '1.05rem', marginTop: '0.5rem' }}
        >
          <Sprout size={18} aria-hidden="true" />
          <span>{isSubmitting ? t('createListing.submitting') : t('createListing.submit')}</span>
        </button>
      </form>
    </div>
  );
};
