import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { ShieldBan, LogOut, Mail } from 'lucide-react';

export const SuspendedAccountPage: React.FC = () => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="container" style={{ paddingTop: '3.5rem', paddingBottom: '4rem', maxWidth: '540px' }}>
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
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
          <ShieldBan size={36} aria-hidden="true" />
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--status-error)' }}>
          {t('auth.suspendedTitle')}
        </h1>

        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {t('auth.suspendedDesc')}
        </p>

        <div
          style={{
            backgroundColor: 'var(--bg-subtle, #f9fafb)',
            border: '1px solid var(--border-light)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '2rem',
            fontSize: '0.9rem',
            lineHeight: 1.6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
            <Mail size={16} aria-hidden="true" />
            <span>Appeal or Inquiries</span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {t('auth.appealNotice')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="btn btn-outline"
          id="suspended-signout-btn"
          style={{ width: '100%', padding: '0.75rem' }}
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
