import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, Home, Search } from 'lucide-react';

export const NotFound: FC = () => {
  const { t } = useTranslation();

  return (
    <div
      className="container"
      style={{
        paddingTop: '4rem',
        paddingBottom: '4rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-amber)',
          marginBottom: '1.5rem',
        }}
      >
        <Compass size={44} aria-hidden="true" />
      </div>

      <span
        style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          color: 'var(--primary-800)',
          lineHeight: 1,
          marginBottom: '0.5rem',
        }}
      >
        404
      </span>

      <h1
        style={{
          fontSize: '1.75rem',
          marginBottom: '0.75rem',
        }}
      >
        {t('common.pageNotFound')}
      </h1>

      <p
        style={{
          color: 'var(--text-muted)',
          maxWidth: '460px',
          marginBottom: '2rem',
          fontSize: '1.05rem',
        }}
      >
        {t('common.pageNotFoundDesc')}
      </p>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <Link to="/" className="btn btn-primary" id="not-found-home-btn">
          <Home size={18} aria-hidden="true" />
          <span>{t('common.goHome')}</span>
        </Link>
        <Link to="/search" className="btn btn-outline" id="not-found-search-btn">
          <Search size={18} aria-hidden="true" />
          <span>{t('nav.search')}</span>
        </Link>
      </div>
    </div>
  );
};
