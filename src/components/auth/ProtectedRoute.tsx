import type { FC, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { LoadingState } from '@/components/common/LoadingState';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isLoading, isSuspended, isAdmin } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (isLoading) {
    return <LoadingState fullPage />;
  }

  if (!isAuthenticated) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  if (isSuspended) {
    return <Navigate to="/suspended" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: 'var(--status-error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <ShieldAlert size={32} aria-hidden="true" />
        </div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>
          {t('auth.adminRequired')}
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
          Access to platform operations console is strictly restricted to verified platform administrators.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
