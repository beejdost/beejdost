import type { FC, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export const LoadingState: FC<LoadingStateProps> = ({
  message,
  fullPage = false,
}) => {
  const { t } = useTranslation();
  const displayMessage = message || t('common.loading');

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '2.5rem 1rem',
    minHeight: fullPage ? '60vh' : '180px',
    width: '100%',
    color: 'var(--text-muted)',
  };

  const spinnerStyle: CSSProperties = {
    animation: 'spin 1s linear infinite',
    color: 'var(--primary-700)',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={containerStyle}
      id="loading-indicator"
    >
      <Loader2 size={36} style={spinnerStyle} aria-hidden="true" />
      <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{displayMessage}</span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
