import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/common/EmptyState';
import { PlusCircle, MapPin, Trash2 } from 'lucide-react';
import { SeedListing } from '@/types';

export const MyListingsPage: FC = () => {
  const { t } = useTranslation();
  const [listings, setListings] = useState<SeedListing[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('beej_dost_my_listings');
      if (saved) {
        setListings(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDelete = (id: string) => {
    const updated = listings.filter((item) => item.id !== id);
    setListings(updated);
    localStorage.setItem('beej_dost_my_listings', JSON.stringify(updated));
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.4rem' }}>
            {t('myListings.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            {t('myListings.subtitle')}
          </p>
        </div>

        <Link to="/listings/create" className="btn btn-primary" id="my-listings-create-btn">
          <PlusCircle size={18} aria-hidden="true" />
          <span>{t('nav.createListing')}</span>
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title={t('myListings.emptyTitle')}
          description={t('myListings.subtitle')}
          action={{
            label: t('myListings.emptyAction'),
            onClick: () => {
              window.location.href = '/listings/create';
            },
          }}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {listings.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-emerald">{t(`search.${item.cropCategory}`)}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Delete ${item.varietyName}`}
                    style={{ color: 'var(--status-error)', padding: '0.25rem' }}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                <h2 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>{item.varietyName}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <MapPin size={14} aria-hidden="true" />
                  <span>{item.district}, {t(`search.${item.province}`)}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {item.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-800)' }}>
                  {item.quantityKg} {t('common.kg')}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {item.pricePerKg === 0 ? t('common.free') : `${item.pricePerKg} ${t('common.pkr')}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
