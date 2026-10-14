import { useState, useEffect, type FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchListingById } from './listingsService';
import { SeedListing } from '@/types';
import { NotFound } from '@/components/common/NotFound';
import { LoadingState } from '@/components/common/LoadingState';
import {
  MapPin,
  ShieldCheck,
  Calendar,
  Percent,
  Weight,
  MessageSquare,
  ArrowLeft,
  Share2,
  AlertTriangle,
  RefreshCw,
  Phone,
} from 'lucide-react';

export const ListingDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [seed, setSeed] = useState<SeedListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!id) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchListingById(id);
        if (mounted) {
          setSeed(data);
        }
      } catch (err) {
        console.error('Failed to load listing:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (isLoading) {
    return <LoadingState fullPage message="Loading seed lot details..." />;
  }

  if (!seed) {
    return <NotFound />;
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${seed.title} - Beej Dost Pakistan`,
          text: `Check out this heritage seed offering: ${seed.title} in ${seed.district}, ${seed.province}`,
          url: window.location.href,
        });
        return;
      } catch {
        // User dismissed share dialog
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const images = seed.images || [];
  const currentImage = images[activeImageIndex]?.publicUrl || seed.coverImage || seed.imageUrl;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      {/* Top back navigation & Share */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <Link
          to="/search"
          className="btn btn-outline"
          id="back-to-search-btn"
          style={{ minHeight: '38px', padding: '0.35rem 0.85rem', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>{t('listingDetails.backToSearch')}</span>
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="btn btn-secondary"
          style={{ minHeight: '38px', padding: '0.35rem 0.85rem', fontSize: '0.875rem' }}
          aria-label="Share seed listing"
        >
          <Share2 size={16} aria-hidden="true" />
          <span>{copiedShare ? 'Link Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Mandatory Verification & Safety Notice */}
      <div
        role="alert"
        style={{
          backgroundColor: '#fffbeb',
          border: '1.5px solid #fde68a',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          fontSize: '0.9rem',
          color: '#92400e',
          lineHeight: 1.5,
        }}
      >
        <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: '2px', color: '#b45309' }} aria-hidden="true" />
        <div>
          <strong style={{ display: 'block', marginBottom: '0.2rem' }}>
            {t('listingDetails.verificationNotice')}
          </strong>
          <span>
            Beej Dost provides a peer-to-peer connection platform for Pakistani seed keepers. Always inspect physical seed germination, purity, and payment terms directly with the keeper.
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}
      >
        {/* Main Details Column */}
        <div>
          {/* Image Showcase */}
          {currentImage ? (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
              <div
                style={{
                  width: '100%',
                  height: '320px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  backgroundColor: '#f3f4f6',
                  marginBottom: images.length > 1 ? '0.75rem' : 0,
                }}
              >
                <img
                  src={currentImage}
                  alt={seed.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        border: idx === activeImageIndex ? '2px solid var(--primary-700)' : '1px solid var(--border-light)',
                        padding: 0,
                        cursor: 'pointer',
                        backgroundColor: '#f3f4f6',
                      }}
                      aria-label={`View photo ${idx + 1}`}
                    >
                      <img
                        src={img.publicUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge badge-emerald">
                {t(`search.${seed.cropCategory}`)}
              </span>
              <span className="badge badge-amber">
                {t(`search.${seed.varietyType}`)}
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#f3f4f6',
                  color: 'var(--text-secondary)',
                }}
              >
                {t(`search.${seed.seedCondition}`)}
              </span>
              {seed.claimedCertified && (
                <span
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: seed.isVerifiedCertified ? 'var(--primary-100)' : '#fef3c7',
                    color: seed.isVerifiedCertified ? 'var(--primary-800)' : '#92400e',
                    fontWeight: 600,
                  }}
                >
                  {seed.isVerifiedCertified ? 'FSC&RD Verified Certified' : 'Claimed Certified (Pending Review)'}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', marginBottom: '0.5rem', color: 'var(--primary-900)' }}>
              {seed.title}
            </h1>

            {seed.varietyName !== seed.title && (
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                {t('listingDetails.variety')}: <strong>{seed.varietyName}</strong>
              </p>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
              }}
            >
              <MapPin size={18} aria-hidden="true" />
              <span>
                {seed.villageOrArea ? `${seed.villageOrArea}, ` : ''}
                {seed.tehsil ? `${seed.tehsil}, ` : ''}
                {seed.district}, {t(`search.${seed.province}`)}
              </span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.65rem' }}>
                {t('listingDetails.description')}
              </h2>
              <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                {seed.description}
              </p>
            </div>

            {/* Exchange Requirements Notice if applicable */}
            {(seed.listingType === 'exchange' || seed.listingType === 'both') && (
              <div
                style={{
                  marginTop: '1.5rem',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1e40af', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <RefreshCw size={16} aria-hidden="true" />
                  <span>{t('listingDetails.exchangeRequirements')}</span>
                </div>
                <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {seed.exchangeRequirements || 'Farmer is open to barter with heritage or local climate-resilient varieties.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Action / Specs Column */}
        <div>
          {/* Pricing & Order Card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                {t('listingDetails.pricePerKg')}
              </div>

              {seed.listingType === 'exchange' ? (
                <div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                    {t('common.free')}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Barter / Seed Swap Only
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                      PKR {seed.pricePerKg}
                    </span>
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>/ {t('common.kg')}</span>
                  </div>
                  {seed.listingType === 'both' && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                      {t('listingDetails.bothNotice')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Specs Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                backgroundColor: 'var(--bg-main)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <Weight size={14} aria-hidden="true" />
                  <span>{t('listingDetails.quantity')}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>
                  {seed.quantityKg.toLocaleString()} {t('common.kg')}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <Percent size={14} aria-hidden="true" />
                  <span>{t('listingDetails.germinationRate')}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>
                  {seed.germinationRate ? `${seed.germinationRate}%` : 'Unreported'}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <Calendar size={14} aria-hidden="true" />
                  <span>{t('listingDetails.harvestYear')}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>
                  {seed.harvestYear}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {t('listingDetails.seedCondition')}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>
                  {t(`search.${seed.seedCondition}`)}
                </div>
              </div>
            </div>

            {/* Contact Action */}
            <Link
              to={`/messages?listingId=${seed.id}&sellerId=${seed.sellerId}`}
              className="btn btn-primary"
              id="contact-seller-btn"
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', display: 'flex', justifyContent: 'center' }}
            >
              <MessageSquare size={18} aria-hidden="true" />
              <span>{t('listingDetails.contactSeller')}</span>
            </Link>
          </div>

          {/* Seed Keeper / Seller Profile Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>
              {t('listingDetails.seller')}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-700)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                }}
              >
                {seed.sellerName?.charAt(0) || 'F'}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{seed.sellerName}</span>
                  {seed.isVerifiedKeeper && (
                    <ShieldCheck size={16} style={{ color: 'var(--primary-700)' }} aria-hidden="true" />
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {seed.isVerifiedKeeper ? 'Verified Seed Keeper' : 'Community Farmer'} • {seed.district}
                </div>
              </div>
            </div>

            {seed.sellerPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <Phone size={14} aria-hidden="true" />
                <span>Contact: {seed.sellerPhone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
