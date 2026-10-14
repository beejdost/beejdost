import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthContext';
import { fetchMyListings, updateListingStatus, updateListing, deleteListing } from './listingsService';
import { SeedListing, ListingStatus } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import {
  PlusCircle,
  MapPin,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Save,
} from 'lucide-react';

export const MyListingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [listings, setListings] = useState<SeedListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editing state
  const [editingListing, setEditingListing] = useState<SeedListing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editQuantity, setEditQuantity] = useState(0);
  const [editPrice, setEditPrice] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadListings = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchMyListings(user.id);
      setListings(data);
    } catch (err) {
      console.error('Failed to load user listings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const handleStatusChange = async (listingId: string, newStatus: ListingStatus) => {
    if (!user) return;
    setErrorMessage(null);
    const { error } = await updateListingStatus(listingId, user.id, newStatus);
    if (error) {
      setErrorMessage(error.message);
    } else {
      setActionMessage(`Listing status updated to ${newStatus}.`);
      void loadListings();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleDelete = async (listingId: string, title: string) => {
    if (!user) return;
    const confirmed = window.confirm(t('myListings.deleteConfirm'));
    if (!confirmed) return;

    setErrorMessage(null);
    const { error } = await deleteListing(listingId, user.id);
    if (error) {
      setErrorMessage(error.message);
    } else {
      setActionMessage(`Listing "${title}" was deleted.`);
      void loadListings();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const startEditing = (listing: SeedListing) => {
    setEditingListing(listing);
    setEditTitle(listing.title);
    setEditQuantity(listing.quantityKg);
    setEditPrice(listing.pricePerKg);
    setEditDescription(listing.description);
    setErrorMessage(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingListing) return;

    setIsUpdating(true);
    setErrorMessage(null);

    const { error } = await updateListing(
      editingListing.id,
      user.id,
      {
        title: editTitle,
        quantityKg: editQuantity,
        pricePerKg: editPrice,
        description: editDescription,
      },
      // Pass the original updatedAt for optimistic concurrency check
      editingListing.updatedAt
    );

    setIsUpdating(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setEditingListing(null);
      setActionMessage('Listing updated successfully!');
      void loadListings();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-emerald">{t('listingDetails.active')}</span>;
      case 'sold':
        return <span className="badge badge-amber">{t('listingDetails.sold')}</span>;
      case 'archived':
        return <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#e5e7eb', color: '#4b5563' }}>{t('listingDetails.archived')}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
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
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.4rem', color: 'var(--primary-900)' }}>
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

      {actionMessage && (
        <div
          role="status"
          style={{
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-900)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.9rem',
          }}
        >
          <CheckCircle2 size={18} style={{ color: 'var(--status-success)' }} aria-hidden="true" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fee2e2',
            color: 'var(--status-error)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.9rem',
          }}
        >
          <AlertCircle size={18} aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Edit Modal Dialog */}
      {editingListing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
          }}
          role="dialog"
          aria-labelledby="edit-dialog-title"
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              padding: '2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 id="edit-dialog-title" style={{ fontSize: '1.35rem', margin: 0 }}>
                {t('myListings.edit')}
              </h2>
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label htmlFor="edit-title" className="form-label">
                  {t('createListing.listingTitle')}
                </label>
                <input
                  id="edit-title"
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="edit-qty" className="form-label">
                    {t('listingDetails.quantity')} (kg)
                  </label>
                  <input
                    id="edit-qty"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50000"
                    required
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                    className="form-input"
                  />
                </div>

                {editingListing.listingType !== 'exchange' && (
                  <div className="form-group">
                    <label htmlFor="edit-price" className="form-label">
                      {t('listingDetails.pricePerKg')} (PKR)
                    </label>
                    <input
                      id="edit-price"
                      type="number"
                      step="1"
                      min="1"
                      required
                      value={editPrice ?? ''}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-desc" className="form-label">
                  {t('listingDetails.description')}
                </label>
                <textarea
                  id="edit-desc"
                  rows={4}
                  required
                  minLength={10}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn btn-primary"
                  id="save-edit-btn"
                >
                  <Save size={16} aria-hidden="true" />
                  <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Loading your seed offerings..." />
      ) : listings.length === 0 ? (
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
            <div
              key={item.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  {getStatusBadge(item.status)}
                  <span className="badge badge-emerald">{t(`search.${item.cropCategory}`)}</span>
                </div>

                {item.coverImage && (
                  <div
                    style={{
                      height: '140px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      marginBottom: '0.75rem',
                      backgroundColor: '#f3f4f6',
                    }}
                  >
                    <img src={item.coverImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                <h2 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', color: 'var(--primary-900)' }}>
                  <Link to={`/listings/${item.id}`}>{item.title}</Link>
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.65rem' }}>
                  <MapPin size={14} aria-hidden="true" />
                  <span>{item.district}, {t(`search.${item.province}`)}</span>
                </div>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '1rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.description}
                </p>
              </div>

              <div>
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {item.quantityKg.toLocaleString()} {t('common.kg')}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-800)', fontSize: '1.05rem' }}>
                      {item.listingType === 'exchange' ? t('search.exchange') : `PKR ${item.pricePerKg} / kg`}
                    </span>
                  </div>
                </div>

                {/* Management Action Buttons */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-light)', paddingTop: '0.65rem' }}>
                  <Link
                    to={`/listings/${item.id}`}
                    className="btn btn-outline"
                    style={{ flex: '1 1 auto', padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                  >
                    <Eye size={13} aria-hidden="true" />
                    <span>View</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => startEditing(item)}
                    className="btn btn-outline"
                    style={{ flex: '1 1 auto', padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                  >
                    <Edit3 size={13} aria-hidden="true" />
                    <span>{t('myListings.edit')}</span>
                  </button>

                  {/* Status Toggle Button */}
                  {item.status === 'active' ? (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, 'sold')}
                      className="btn btn-outline"
                      style={{ flex: '1 1 auto', padding: '0.35rem 0.6rem', fontSize: '0.8rem', color: '#b45309' }}
                    >
                      <span>{t('myListings.markSold')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, 'active')}
                      className="btn btn-outline"
                      style={{ flex: '1 1 auto', padding: '0.35rem 0.6rem', fontSize: '0.8rem', color: 'var(--status-success)' }}
                    >
                      <span>{t('myListings.markAvailable')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.title)}
                    aria-label={`Delete ${item.title}`}
                    style={{ padding: '0.35rem 0.6rem', color: 'var(--status-error)', border: '1px solid #fee2e2', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
