import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, ShieldCheck, Heart } from 'lucide-react';

export const Footer: FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="app-footer">
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2rem',
          }}
        >
          {/* Col 1: About */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Sprout size={20} aria-hidden="true" />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                {t('app.name')}
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#a7f3d0', maxWidth: '300px', lineHeight: 1.5 }}>
              {t('app.slogan')}
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '0.75rem' }}>
              {t('nav.search')}
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <li><Link to="/search">{t('search.allCategories')}</Link></li>
              <li><Link to="/search?category=cereal">{t('search.cereal')}</Link></li>
              <li><Link to="/search?category=cotton">{t('search.cotton')}</Link></li>
              <li><Link to="/search?category=pulses">{t('search.pulses')}</Link></li>
            </ul>
          </div>

          {/* Col 3: Community & Verification */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '0.75rem' }}>
              {t('features.verifiedTitle')}
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <li><Link to="/admin">{t('nav.admin')}</Link></li>
              <li><Link to="/listings/create">{t('nav.createListing')}</Link></li>
              <li><Link to="/my-listings">{t('nav.myListings')}</Link></li>
              <li><Link to="/profile">{t('nav.profile')}</Link></li>
            </ul>
          </div>

          {/* Col 4: Platform Trust */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
              <ShieldCheck size={18} aria-hidden="true" />
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Open & Verifiable</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
              Built for Pakistani smallholders, regenerative seed keepers, and agricultural biodiversity conservation.
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.825rem',
            color: '#94a3b8',
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} Beej Dost. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Cultivated with care in Pakistan</span>
            <Heart size={14} style={{ color: '#ef4444' }} aria-hidden="true" />
          </div>
        </div>
      </div>
    </footer>
  );
};
