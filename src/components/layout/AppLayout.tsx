import type { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';
import { PWAInstallPrompt } from '../common/PWAInstallPrompt';

export const AppLayout: FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <a href="#main-content" className="skip-link">
        {t('nav.skipToContent')}
      </a>

      <PWAInstallPrompt />

      <Header />

      <main id="main-content" className="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      <Footer />

      <BottomNav />
    </>
  );
};
