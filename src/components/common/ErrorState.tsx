import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  actionLabel?: string;
}

export const ErrorState: FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  actionLabel,
}) => {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2.5rem 1.5rem',
        margin: '1.5rem auto',
        maxWidth: '540px',
        borderColor: 'rgba(220, 38, 38, 0.25)',
        backgroundColor: '#fffaf8',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--status-error)',
          marginBottom: '1rem',
        }}
      >
        <AlertCircle size={28} aria-hidden="true" />
      </div>

      <h3
        style={{
          color: 'var(--status-error)',
          fontSize: '1.25rem',
          marginBottom: '0.5rem',
        }}
      >
        {title || t('common.error')}
      </h3>

      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          marginBottom: onRetry ? '1.5rem' : '0',
          maxWidth: '400px',
        }}
      >
        {message || t('common.pageNotFoundDesc')}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-primary"
          style={{
            backgroundColor: 'var(--status-error)',
            gap: '0.5rem',
          }}
        >
          <RefreshCw size={16} aria-hidden="true" />
          <span>{actionLabel || t('common.retry')}</span>
        </button>
      )}
    </div>
  );
};
