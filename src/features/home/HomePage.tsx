import { useState, useEffect, type FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchListings } from '@/features/listings/listingsService';
import { SeedListing, PakistanProvince } from '@/types';
import {
  Sprout,
  ShieldCheck,
  Compass,
  ArrowRight,
  MapPin,
  Sparkles,
  Search,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';

export const HomePage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [featuredSeeds, setFeaturedSeeds] = useState<SeedListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<PakistanProvince | 'all'>('all');

  useEffect(() => {
    let mounted = true;

    const loadFeatured = async () => {
      try {
        const res = await fetchListings({ limit: 6, status: 'active', sortBy: 'newest' });
        if (mounted) {
          setFeaturedSeeds(res.data);
        }
      } catch (err) {
        console.error('Failed to load featured seeds:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadFeatured();

    return () => {
      mounted = false;
    };
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedProvince !== 'all') params.set('province', selectedProvince);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f281e 0%, #1b4332 50%, #2d6a4f 100%)',
          color: '#ffffff',
          padding: '3.5rem 0 4.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
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
          <div style={{ maxWidth: '820px' }}>
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

            {/* Quick Marketplace Search Box */}
            <form
              onSubmit={handleHeroSearch}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg, 12px)',
                padding: '0.6rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-lg)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ flex: '1 1 240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.inputPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                  }}
                  aria-label="Search seeds by variety or crop"
                />
              </div>

              <div style={{ flex: '0 1 180px' }}>
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value as PakistanProvince | 'all')}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    backgroundColor: '#f9fafb',
                  }}
                  aria-label="Filter by province"
                >
                  <option value="all">{t('search.allProvinces')}</option>
                  <option value="punjab">{t('search.punjab')}</option>
                  <option value="sindh">{t('search.sindh')}</option>
                  <option value="khyberPakhtunkhwa">{t('search.khyberPakhtunkhwa')}</option>
                  <option value="balochistan">{t('search.balochistan')}</option>
                  <option value="gilgitBaltistan">{t('search.gilgitBaltistan')}</option>
                  <option value="azadKashmir">{t('search.azadKashmir')}</option>
                  <option value="islamabad">{t('search.islamabad')}</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                id="hero-search-submit-btn"
                style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}
              >
                <span>{t('nav.search')}</span>
              </button>
            </form>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                to="/search"
                className="btn"
                id="hero-browse-cta"
                style={{
                  backgroundColor: 'var(--accent-amber)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  padding: '0.65rem 1.5rem',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <span>{t('home.exploreCta')}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <Link
                to="/listings/create"
                className="btn"
                id="hero-create-cta"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  fontSize: '0.95rem',
                  padding: '0.65rem 1.4rem',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <span>{t('home.listSeedCta')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Notice Disclaimer Banner */}
      <section style={{ backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '0.85rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.875rem', color: '#92400e' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, color: '#b45309' }} aria-hidden="true" />
            <span>{t('listingDetails.verificationNotice')}</span>
          </div>
        </div>
      </section>

      {/* Featured Seed Lots from Supabase */}
      <section style={{ padding: '3rem 0 4rem', backgroundColor: '#ffffff' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.75rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.65rem', margin: 0 }}>{t('home.recentListings')}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
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

          {isLoading ? (
            <LoadingState message="Loading seed offerings from verified farmers across Pakistan..." />
          ) : featuredSeeds.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <Sprout size={48} style={{ color: 'var(--primary-600)', margin: '0 auto 1rem' }} aria-hidden="true" />
              <h3>No seed lots listed yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Be the first farmer to list your heirloom or certified seeds in your district.
              </p>
              <Link to="/listings/create" className="btn btn-primary">
                {t('createListing.title')}
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
                    padding: '1.25rem',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  <div>
                    {seed.coverImage ? (
                      <div
                        style={{
                          height: '180px',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          marginBottom: '1rem',
                          backgroundColor: '#f3f4f6',
                        }}
                      >
                        <img
                          src={seed.coverImage}
                          alt={seed.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </div>
                    ) : null}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span className="badge badge-emerald">
                        {t(`search.${seed.cropCategory}`)}
                      </span>
                      <span className="badge badge-amber">
                        {t(`search.${seed.varietyType}`)}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                      <Link to={`/listings/${seed.id}`} style={{ color: 'var(--primary-900)' }}>
                        {seed.title}
                      </Link>
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
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        marginBottom: '1.25rem',
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
                      {seed.listingType === 'exchange' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-800)', fontWeight: 700, fontSize: '0.9rem' }}>
                          <RefreshCw size={15} aria-hidden="true" />
                          <span>{t('search.exchange')}</span>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-900)' }}>
                              PKR {seed.pricePerKg}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ kg</span>
                          </div>
                          {seed.listingType === 'both' && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                              + Barter
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {seed.quantityKg.toLocaleString()} kg available
                      </div>
                    </div>

                    <Link
                      to={`/listings/${seed.id}`}
                      className="btn btn-outline"
                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                    >
                      <span>Details</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
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

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#fef3c7',
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
    </div>
  );
};
