import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { isSupabaseConfigured, env } from '@/lib/env';
import { INITIAL_SEED_LOTS } from '../listings/seedData';
import {
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertTriangle,
  Users,
  Sprout,
  Lock,
} from 'lucide-react';

export const AdminPage: FC = () => {
  const { t } = useTranslation();
  const configured = isSupabaseConfigured();

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-900)',
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}
        >
          <ShieldCheck size={14} aria-hidden="true" />
          <span>Operations Console</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.4rem' }}>
          {t('admin.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          {t('admin.subtitle')}
        </p>
      </div>

      {/* System Status Banner */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem',
          backgroundColor: configured ? 'var(--primary-50)' : '#fffbeb',
          borderColor: configured ? 'var(--primary-400)' : '#fde68a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: configured ? 'var(--primary-700)' : 'var(--accent-amber)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Database size={22} aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary-900)' }}>
              {t('admin.systemStatus')}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Target: {env.VITE_SUPABASE_URL || 'Not specified'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {configured ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--status-success)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>{t('admin.configured')}</span>
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--accent-amber)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <AlertTriangle size={18} aria-hidden="true" />
              <span>{t('admin.notConfigured')}</span>
            </span>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <Sprout size={18} aria-hidden="true" />
            <span style={{ fontSize: '0.9rem' }}>{t('admin.totalListings')}</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-900)' }}>
            {INITIAL_SEED_LOTS.length}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <ShieldCheck size={18} aria-hidden="true" />
            <span style={{ fontSize: '0.9rem' }}>{t('admin.pendingVerification')}</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
            2
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <Users size={18} aria-hidden="true" />
            <span style={{ fontSize: '0.9rem' }}>{t('admin.activeUsers')}</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-900)' }}>
            1,854
          </div>
        </div>
      </div>

      {/* Security Advisory */}
      <div
        className="card"
        style={{
          backgroundColor: '#f8fafc',
          borderLeft: '4px solid var(--primary-700)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Lock size={18} style={{ color: 'var(--primary-700)' }} aria-hidden="true" />
          <h2 style={{ fontSize: '1.1rem' }}>Platform Security & Compliance</h2>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {t('admin.securityWarning')} Private user tables (messages, contact info, personal addresses) are isolated and protected by Row Level Security policies. The Service Worker caching layer specifically prohibits precaching or storing any API responses from Supabase Auth and private messaging channels.
        </p>
      </div>
    </div>
  );
};
