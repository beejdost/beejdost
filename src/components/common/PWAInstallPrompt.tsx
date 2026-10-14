import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X } from 'lucide-react';

export const PWAInstallPrompt: FC = () => {
  const { t } = useTranslation();
  const { isInstallable, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="PWA Installation"
      style={{
        backgroundColor: 'var(--primary-800)',
        color: '#ffffff',
        padding: '0.65rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.9rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Download size={18} aria-hidden="true" style={{ color: 'var(--accent-gold)' }} />
        <span>{t('common.pwaInstall')}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="btn"
          style={{
            backgroundColor: 'var(--accent-amber)',
            color: '#ffffff',
            minHeight: '36px',
            padding: '0.35rem 0.85rem',
            fontSize: '0.85rem',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {t('common.pwaInstall')}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={t('common.dismiss')}
          style={{
            color: '#ffffff',
            padding: '0.25rem',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};
