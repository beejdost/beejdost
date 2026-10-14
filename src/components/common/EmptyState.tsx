import type { FC, ReactNode } from 'react';
import { Sprout } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem',
        margin: '1.5rem auto',
        maxWidth: '520px',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary-700)',
          marginBottom: '1.25rem',
        }}
      >
        {icon || <Sprout size={32} aria-hidden="true" />}
      </div>

      <h3
        style={{
          fontSize: '1.2rem',
          color: 'var(--primary-900)',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.95rem',
          marginBottom: action ? '1.5rem' : '0',
          maxWidth: '380px',
        }}
      >
        {description}
      </p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="btn btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
