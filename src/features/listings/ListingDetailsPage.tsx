import type { FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { INITIAL_SEED_LOTS } from './seedData';
import { NotFound } from '@/components/common/NotFound';
import {
  MapPin,
  ShieldCheck,
  Calendar,
  Percent,
  Weight,
  MessageSquare,
  ArrowLeft,
  Sparkles,
  Share2,
} from 'lucide-react';

export const ListingDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const seed = INITIAL_SEED_LOTS.find((item) => item.id === id);

  if (!seed) {
    return <NotFound />;
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${seed.varietyName} - Beej Dost`,
          text: `Check out this heritage seed lot on Beej Dost Pakistan: ${seed.varietyName}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      {/* Top back navigation */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          to="/search"
          className="btn btn-outline"
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
          <span>Share</span>
        </button>
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
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="badge badge-emerald">
                {t(`search.${seed.cropCategory}`)}
              </span>
              <span className="badge badge-amber">
                {t(`search.${seed.varietyType}`)}
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', marginBottom: '0.75rem' }}>
              {seed.varietyName}
            </h1>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
                marginBottom: '1.5rem',
              }}
            >
              <MapPin size={18} aria-hidden="true" />
              <span>
                {seed.district}, {t(`search.${seed.province}`)}
              </span>
            </div>

            {/* Metrics grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '1rem',
                backgroundColor: 'var(--bg-subtle)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <Weight size={14} aria-hidden="true" />
                  <span>{t('listingDetails.quantity')}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary-900)' }}>
                  {seed.quantityKg} {t('common.kg')}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <Percent size={14} aria-hidden="true" />
                  <span>{t('listingDetails.germinationRate')}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--status-success)' }}>
                  {seed.germinationRate}%
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <Calendar size={14} aria-hidden="true" />
                  <span>{t('listingDetails.harvestYear')}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary-900)' }}>
                  {seed.harvestYear}
                </div>
              </div>
            </div>

            {/* Description */}
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.6rem' }}>
              {t('listingDetails.description')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '1rem', whiteSpace: 'pre-line' }}>
              {seed.description}
            </p>
          </div>
        </div>

        {/* Sidebar Column: Price & Keeper Contact */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '5.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {t('listingDetails.pricePerKg')}
              </span>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--primary-800)',
                  lineHeight: 1.2,
                }}
              >
                {seed.pricePerKg === 0 ? (
                  <span style={{ color: 'var(--accent-amber)' }}>{t('common.free')}</span>
                ) : (
                  <span>
                    {seed.pricePerKg} <span style={{ fontSize: '1.1rem' }}>{t('common.pkr')} / {t('common.kg')}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Seed Keeper Card */}
            <div
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.5rem',
                backgroundColor: 'var(--bg-main)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
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
                  {seed.sellerName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-900)' }}>
                    {seed.sellerName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {seed.district}, {t(`search.${seed.province}`)}
                  </div>
                </div>
              </div>

              {seed.isVerifiedKeeper && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: 'var(--primary-700)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>{t('features.verifiedTitle')}</span>
                </div>
              )}
            </div>

            {/* Direct Contact Button */}
            <Link
              to={`/messages?listingId=${seed.id}&recipientId=${seed.sellerId}`}
              className="btn btn-primary"
              id="contact-keeper-btn"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                marginBottom: '0.75rem',
              }}
            >
              <MessageSquare size={18} aria-hidden="true" />
              <span>{t('listingDetails.contactSeller')}</span>
            </Link>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={14} aria-hidden="true" />
              <span>P2P Barter & Direct Farmer Exchange</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
