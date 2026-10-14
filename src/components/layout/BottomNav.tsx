import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Search, PlusCircle, MessageSquare, User } from 'lucide-react';

export const BottomNav: FC = () => {
  const { t } = useTranslation();

  return (
    <nav className="bottom-nav" aria-label="Mobile Navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Home size={22} aria-hidden="true" />
        <span>{t('nav.home')}</span>
      </NavLink>

      <NavLink
        to="/search"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Search size={22} aria-hidden="true" />
        <span>{t('nav.search')}</span>
      </NavLink>

      <NavLink
        to="/listings/create"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        style={{ color: 'var(--primary-700)' }}
      >
        <PlusCircle size={26} aria-hidden="true" style={{ color: 'var(--primary-700)' }} />
        <span style={{ fontWeight: 700 }}>{t('nav.createListing')}</span>
      </NavLink>

      <NavLink
        to="/messages"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <MessageSquare size={22} aria-hidden="true" />
        <span>{t('nav.messages')}</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <User size={22} aria-hidden="true" />
        <span>{t('nav.profile')}</span>
      </NavLink>
    </nav>
  );
};
