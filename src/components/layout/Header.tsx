import type { FC } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { Sprout, PlusCircle, ShieldCheck } from 'lucide-react';

export const Header: FC = () => {
  const { t } = useTranslation();

  return (
    <header className="app-header">
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        {/* Logo & Brand */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: 'var(--primary-800)',
            textDecoration: 'none',
          }}
          aria-label={t('app.name')}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-800)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Sprout size={24} aria-hidden="true" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--primary-900)' }}>
              {t('app.name')}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
              پاکستان بیج دوست
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main Navigation"
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '1.5rem',
          }}
          className="desktop-nav"
        >
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              fontWeight: 600,
              fontSize: '0.95rem',
              color: isActive ? 'var(--primary-700)' : 'var(--text-secondary)',
              borderBottom: isActive ? '2px solid var(--primary-700)' : '2px solid transparent',
              paddingBottom: '4px',
            })}
          >
            {t('nav.home')}
          </NavLink>

          <NavLink
            to="/search"
            style={({ isActive }) => ({
              fontWeight: 600,
              fontSize: '0.95rem',
              color: isActive ? 'var(--primary-700)' : 'var(--text-secondary)',
              borderBottom: isActive ? '2px solid var(--primary-700)' : '2px solid transparent',
              paddingBottom: '4px',
            })}
          >
            {t('nav.search')}
          </NavLink>

          <NavLink
            to="/my-listings"
            style={({ isActive }) => ({
              fontWeight: 600,
              fontSize: '0.95rem',
              color: isActive ? 'var(--primary-700)' : 'var(--text-secondary)',
              borderBottom: isActive ? '2px solid var(--primary-700)' : '2px solid transparent',
              paddingBottom: '4px',
            })}
          >
            {t('nav.myListings')}
          </NavLink>

          <NavLink
            to="/messages"
            style={({ isActive }) => ({
              fontWeight: 600,
              fontSize: '0.95rem',
              color: isActive ? 'var(--primary-700)' : 'var(--text-secondary)',
              borderBottom: isActive ? '2px solid var(--primary-700)' : '2px solid transparent',
              paddingBottom: '4px',
            })}
          >
            {t('nav.messages')}
          </NavLink>

          <NavLink
            to="/admin"
            style={({ isActive }) => ({
              fontWeight: 600,
              fontSize: '0.95rem',
              color: isActive ? 'var(--primary-700)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              borderBottom: isActive ? '2px solid var(--primary-700)' : '2px solid transparent',
              paddingBottom: '4px',
            })}
          >
            <ShieldCheck size={16} aria-hidden="true" />
            <span>{t('nav.admin')}</span>
          </NavLink>
        </nav>

        {/* Right Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LanguageSwitcher />

          <Link
            to="/listings/create"
            className="btn btn-primary"
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.9rem',
              display: 'inline-flex',
            }}
          >
            <PlusCircle size={18} aria-hidden="true" />
            <span>{t('nav.createListing')}</span>
          </Link>

          <div
            className="desktop-auth"
            style={{ display: 'none', alignItems: 'center', gap: '0.5rem' }}
          >
            <Link
              to="/login"
              className="btn btn-outline"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.875rem' }}
            >
              {t('nav.login')}
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-auth {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
};
