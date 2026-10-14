import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthContext';
import { createListing, fetchCrops } from './listingsService';
import { listingFormSchema, ListingFormData, MAX_QUANTITY_KG, ACCEPTED_IMAGE_TYPES } from './listingValidation';
import { Crop } from '@/types';
import {
  AlertCircle,
  Sprout,
  Upload,
  X,
  RefreshCw,
  Info,
} from 'lucide-react';

export const CreateListingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, isEmailConfirmed } = useAuth();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load available approved crops
  useEffect(() => {
    let mounted = true;
    void fetchCrops().then((data) => {
      if (mounted) setCrops(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      cropId: '',
      title: '',
      varietyName: '',
      varietyType: 'heirloom',
      seedCondition: 'cleaned',
      listingType: 'sale',
      quantityKg: 50,
      pricePerKg: 250,
      exchangeRequirements: '',
      germinationRate: 85,
      harvestYear: new Date().getFullYear(),
      province: profile?.province || 'punjab',
      district: profile?.district || '',
      tehsil: profile?.tehsil || '',
      villageOrArea: profile?.village || '',
      description: '',
      claimedCertified: false,
      certificationDetails: '',
    },
  });

  const watchListingType = watch('listingType');
  const watchCropId = watch('cropId');

  // When crop is selected, auto-populate variety name or title if blank
  useEffect(() => {
    if (watchCropId && crops.length > 0) {
      const selected = crops.find((c) => c.id === watchCropId);
      if (selected) {
        const currentVariety = watch('varietyName');
        if (!currentVariety) {
          setValue('varietyName', selected.nameEn);
          setValue('title', `${selected.nameEn} (Local Harvest)`);
        }
      }
    }
  }, [watchCropId, crops, setValue, watch]);

  // Handle image files selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 4) {
      setFileError('You can upload a maximum of 4 photos per seed lot.');
      return;
    }

    const validFiles: File[] = [];
    for (const f of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) {
        setFileError(`Invalid format for ${f.name}. Only JPEG, PNG, and WebP are supported.`);
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        setFileError(`File ${f.name} exceeds the 5MB size limit.`);
        return;
      }
      validFiles.push(f);
    }

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);

    // Generate object URLs for preview
    const previews = newFiles.map((file) => URL.createObjectURL(file));
    setFilePreviews(previews);
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, idx) => idx !== index);
    setSelectedFiles(updatedFiles);
    const updatedPreviews = filePreviews.filter((_, idx) => idx !== index);
    setFilePreviews(updatedPreviews);
  };

  const onSubmit = async (data: ListingFormData) => {
    if (!user) {
      setSubmitError('Authentication is required to publish a seed listing.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { listing, error } = await createListing(
        user.id,
        {
          cropId: data.cropId,
          title: data.title,
          varietyName: data.varietyName,
          varietyType: data.varietyType,
          seedCondition: data.seedCondition,
          listingType: data.listingType,
          quantityKg: data.quantityKg,
          pricePerKg: data.listingType === 'exchange' ? null : data.pricePerKg,
          exchangeRequirements: data.exchangeRequirements || null,
          germinationRate: data.germinationRate || null,
          harvestYear: data.harvestYear,
          province: data.province,
          district: data.district,
          tehsil: data.tehsil || null,
          villageOrArea: data.villageOrArea || null,
          description: data.description,
          claimedCertified: data.claimedCertified,
          certificationDetails: data.certificationDetails || null,
        },
        selectedFiles
      );

      if (error) {
        setSubmitError(error.message);
        setIsSubmitting(false);
      } else if (listing) {
        navigate('/my-listings');
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to publish listing');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '780px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.4rem', color: 'var(--primary-900)' }}>
          {t('createListing.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          {t('createListing.subtitle')}
        </p>
      </div>

      {/* Unconfirmed Email Notice Banner */}
      {!isEmailConfirmed && (
        <div
          role="note"
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            fontSize: '0.9rem',
            color: '#92400e',
          }}
        >
          <Info size={20} style={{ color: '#b45309', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <div>
            <strong>Email Confirmation Notice:</strong> Your email address is not yet confirmed. While you can draft listings, confirming your email ensures your seed offerings appear on the public marketplace.
          </div>
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
          <AlertCircle size={22} aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card" noValidate>
        {/* Section 1: Crop & Title */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {/* Crop Dropdown */}
          <div className="form-group">
            <label htmlFor="cropId" className="form-label">
              {t('createListing.crop')} *
            </label>
            <select
              id="cropId"
              className="form-select"
              {...register('cropId')}
              aria-invalid={!!errors.cropId}
              aria-describedby={errors.cropId ? 'cropId-error' : undefined}
            >
              <option value="">{t('createListing.selectCrop')}</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn} — {c.nameUr} ({t(`search.${c.category}`)})
                </option>
              ))}
            </select>
            {errors.cropId && (
              <span id="cropId-error" className="form-error">
                {errors.cropId.message}
              </span>
            )}
          </div>

          {/* Listing Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              {t('createListing.listingTitle')} *
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Organic Basmati 370 (Kallar Tract Harvest)"
              className="form-input"
              {...register('title')}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <span id="title-error" className="form-error">
                {errors.title.message}
              </span>
            )}
          </div>
        </div>

        {/* Variety Name & Variety Type */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label htmlFor="varietyName" className="form-label">
              {t('createListing.varietyName')} *
            </label>
            <input
              id="varietyName"
              type="text"
              placeholder="e.g. Basmati 370, Desi Gandum"
              className="form-input"
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

          <div className="form-group">
            <label htmlFor="varietyType" className="form-label">
              {t('createListing.varietyType')} *
            </label>
            <select id="varietyType" className="form-select" {...register('varietyType')}>
              <option value="heirloom">{t('search.heirloom')}</option>
              <option value="desi">{t('search.desi')}</option>
              <option value="organic">{t('search.organic')}</option>
              <option value="opv">{t('search.opv')}</option>
              <option value="hybrid">{t('search.hybrid')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="seedCondition" className="form-label">
              {t('createListing.seedCondition')} *
            </label>
            <select id="seedCondition" className="form-select" {...register('seedCondition')}>
              <option value="cleaned">{t('search.cleaned')}</option>
              <option value="graded">{t('search.graded')}</option>
              <option value="sun_dried">{t('search.sunDried')}</option>
              <option value="raw">{t('search.raw')}</option>
              <option value="treated">{t('search.treated')}</option>
            </select>
          </div>
        </div>

        {/* Transaction Type & Pricing Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label htmlFor="listingType" className="form-label">
              {t('createListing.transactionType')} *
            </label>
            <select id="listingType" className="form-select" {...register('listingType')}>
              <option value="sale">{t('search.sale')}</option>
              <option value="exchange">{t('search.exchange')}</option>
              <option value="both">{t('search.both')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quantityKg" className="form-label">
              {t('createListing.quantityKg')} *
            </label>
            <input
              id="quantityKg"
              type="number"
              step="0.5"
              min="0.5"
              max={MAX_QUANTITY_KG}
              placeholder="e.g. 50"
              className="form-input"
              {...register('quantityKg', { valueAsNumber: true })}
              aria-invalid={!!errors.quantityKg}
              aria-describedby={errors.quantityKg ? 'quantityKg-error' : undefined}
            />
            {errors.quantityKg && (
              <span id="quantityKg-error" className="form-error">
                {errors.quantityKg.message}
              </span>
            )}
          </div>

          {watchListingType !== 'exchange' && (
            <div className="form-group">
              <label htmlFor="pricePerKg" className="form-label">
                {t('createListing.pricePerKg')} *
              </label>
              <input
                id="pricePerKg"
                type="number"
                step="1"
                min="1"
                placeholder="e.g. 300"
                className="form-input"
                {...register('pricePerKg', { valueAsNumber: true })}
                aria-invalid={!!errors.pricePerKg}
                aria-describedby={errors.pricePerKg ? 'pricePerKg-error' : undefined}
              />
              {errors.pricePerKg && (
                <span id="pricePerKg-error" className="form-error">
                  {errors.pricePerKg.message}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Exchange requirements if exchange or both */}
        {(watchListingType === 'exchange' || watchListingType === 'both') && (
          <div className="form-group">
            <label htmlFor="exchangeRequirements" className="form-label">
              {t('createListing.exchangeRequirements')} {watchListingType === 'both' ? '*' : '(Optional)'}
            </label>
            <textarea
              id="exchangeRequirements"
              rows={2}
              className="form-input"
              placeholder={t('createListing.exchangePlaceholder')}
              {...register('exchangeRequirements')}
              aria-invalid={!!errors.exchangeRequirements}
              aria-describedby={errors.exchangeRequirements ? 'exchangeRequirements-error' : undefined}
            />
            {errors.exchangeRequirements && (
              <span id="exchangeRequirements-error" className="form-error">
                {errors.exchangeRequirements.message}
              </span>
            )}
          </div>
        )}

        {/* Germination & Harvest Year */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label htmlFor="germinationRate" className="form-label">
              {t('createListing.germinationRate')}
            </label>
            <input
              id="germinationRate"
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 90"
              className="form-input"
              {...register('germinationRate', { valueAsNumber: true })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="harvestYear" className="form-label">
              {t('createListing.harvestYear')} *
            </label>
            <input
              id="harvestYear"
              type="number"
              min="2000"
              max="2100"
              className="form-input"
              {...register('harvestYear', { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Location Row: Province, District, Tehsil */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label htmlFor="province" className="form-label">
              {t('createListing.province')} *
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
              {t('createListing.district')} *
            </label>
            <input
              id="district"
              type="text"
              placeholder="e.g. Gujranwala, Sukkur"
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
            <label htmlFor="tehsil" className="form-label">
              {t('createListing.tehsil')}
            </label>
            <input
              id="tehsil"
              type="text"
              placeholder="e.g. Kamoke"
              className="form-input"
              {...register('tehsil')}
            />
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
            className="form-input"
            placeholder="Describe soil suitability, climate resilience, irrigation requirements, taste, and preservation history..."
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

        {/* Seed Lot Photos Upload */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">
            {t('createListing.images')}
          </label>
          <div
            style={{
              border: '2px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              textAlign: 'center',
              backgroundColor: '#f9fafb',
              cursor: 'pointer',
            }}
          >
            <Upload size={28} style={{ color: 'var(--primary-700)', margin: '0 auto 0.5rem' }} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {t('createListing.imagesHelp')}
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              id="listing-images-input"
              style={{ display: 'block', margin: '0.75rem auto 0', fontSize: '0.85rem' }}
            />
          </div>

          {fileError && (
            <span className="form-error" style={{ display: 'block', marginTop: '0.5rem' }}>
              {fileError}
            </span>
          )}

          {/* Image Previews */}
          {filePreviews.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {filePreviews.map((preview, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <img src={preview} alt="Upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    aria-label="Remove image"
                  >
                    <X size={12} />
                  </button>
                  {idx === 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(27, 67, 50, 0.85)',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        textAlign: 'center',
                        padding: '1px',
                      }}
                    >
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certification Claim Checkbox */}
        <div
          style={{
            backgroundColor: '#f3f4f6',
            border: '1px solid var(--border-light)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
            <input
              id="claimedCertified"
              type="checkbox"
              style={{ marginTop: '3px' }}
              {...register('claimedCertified')}
            />
            <div>
              <label htmlFor="claimedCertified" style={{ fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>
                {t('createListing.claimedCertified')}
              </label>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                {t('createListing.certificationNotice')}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
          id="publish-listing-submit-btn"
          style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
        >
          {isSubmitting ? (
            <>
              <RefreshCw size={18} className="animate-spin" aria-hidden="true" />
              <span>{t('createListing.submitting')}</span>
            </>
          ) : (
            <>
              <Sprout size={18} aria-hidden="true" />
              <span>{t('createListing.submit')}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
