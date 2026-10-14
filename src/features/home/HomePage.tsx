import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { INITIAL_SEED_LOTS } from '../listings/seedData';
import {
  Sprout,
  ShieldCheck,
  Compass,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const HomePage: FC = () => {
  const { t } = useTranslation();
  const featuredSeeds = INITIAL_SEED_LOTS.slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f281e 0%, #1b4332 50%, #2d6a4f 100%)',
          color: '#ffffff',
          padding: '4rem 0 4.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(217, 119, 6, 0.2) 0%, rgba(217, 119, 6, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '780px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(6px)',
                padding: '0.4rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#fde68a',
                marginBottom: '1.25rem',
              }}
            >
              <Sparkles size={16} aria-hidden="true" />
              <span>{t('app.tagline')}</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                fontWeight: 800,
                lineHeight: 1.2,
                color: '#ffffff',
                marginBottom: '1.25rem',
              }}
            >
              {t('home.heroTitle')}
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                color: '#d8f3dc',
                lineHeight: 1.6,
                marginBottom: '2rem',
                maxWidth: '680px',
              }}
            >
              {t('home.heroSubtitle')}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <Link
                to="/search"
                className="btn"
                id="hero-browse-cta"
                style={{
                  backgroundColor: 'var(--accent-amber)',
                  color: '#ffffff',
                  fontSize: '1.05rem',
                  padding: '0.75rem 1.75rem',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <span>{t('home.exploreCta')}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>

              <Link
                to="/listings/create"
                className="btn"
                id="hero-create-cta"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  fontSize: '1.05rem',
                  padding: '0.75rem 1.5rem',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <span>{t('home.listSeedCta')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* National Stats Strip */}
      <section
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-light)',
          padding: '1.75rem 0',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1.5rem',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                450+
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {t('home.stats.varieties')}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                6
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {t('home.stats.provinces')}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                1,850+
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {t('home.stats.farmers')}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                100%
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {t('home.stats.exchanges')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section style={{ padding: '3.5rem 0', backgroundColor: 'var(--bg-main)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {/* Pillar 1 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-800)',
                }}
              >
                <ShieldCheck size={26} aria-hidden="true" />
              </div>
              <h2 style={{ fontSize: '1.25rem' }}>{t('home.features.verifiedTitle')}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {t('home.features.verifiedDesc')}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-amber)',
                }}
              >
                <Compass size={26} aria-hidden="true" />
              </div>
              <h2 style={{ fontSize: '1.25rem' }}>{t('home.features.climateTitle')}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {t('home.features.climateDesc')}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7',
                }}
              >
                <Sprout size={26} aria-hidden="true" />
              </div>
              <h2 style={{ fontSize: '1.25rem' }}>{t('home.features.bilingualTitle')}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {t('home.features.bilingualDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Seed Lots */}
      <section style={{ padding: '2rem 0 4rem', backgroundColor: '#ffffff' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.75rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.65rem' }}>{t('home.recentListings')}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {t('search.subtitle')}
              </p>
            </div>
            <Link
              to="/search"
              className="btn btn-outline"
              style={{ fontSize: '0.9rem', padding: '0.45rem 1rem' }}
            >
              <span>{t('home.viewAll')}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {featuredSeeds.map((seed) => (
              <article
                key={seed.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span className="badge badge-emerald">
                      {t(`search.${seed.cropCategory}`)}
                    </span>
                    <span className="badge badge-amber">
                      {t(`search.${seed.varietyType}`)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                    <Link to={`/listings/${seed.id}`}>{seed.varietyName}</Link>
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <MapPin size={15} aria-hidden="true" />
                    <span>
                      {seed.district}, {t(`search.${seed.province}`)}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {seed.description}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {seed.quantityKg} {t('common.kg')}
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary-800)', fontSize: '1rem' }}>
                      {seed.pricePerKg === 0
                        ? t('common.free')
                        : `${seed.pricePerKg} ${t('common.pkr')} / ${t('common.kg')}`}
                    </div>
                  </div>

                  <Link
                    to={`/listings/${seed.id}`}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                  >
                    {t('listingDetails.title')}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
