import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchListings, fetchCrops } from './listingsService';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Crop,
  CropCategory,
  PakistanProvince,
  VarietyType,
  SeedCondition,
  ListingType,
  SeedListing,
} from '@/types';
import {
  Search,
  MapPin,
  X,
  ShieldCheck,
  Filter,
  RefreshCw,
  ArrowUpDown,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';

export const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read current URL filters
  const query = searchParams.get('q') || '';
  const selectedCategory = (searchParams.get('category') || 'all') as CropCategory | 'all';
  const selectedCropId = searchParams.get('cropId') || '';
  const selectedProvince = (searchParams.get('province') || 'all') as PakistanProvince | 'all';
  const districtQuery = searchParams.get('district') || '';
  const selectedType = (searchParams.get('type') || 'all') as VarietyType | 'all';
  const selectedCondition = (searchParams.get('condition') || 'all') as SeedCondition | 'all';
  const selectedTransactionType = (searchParams.get('txn') || 'all') as ListingType | 'all';
  const minPriceParam = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPriceParam = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const sortBy = (searchParams.get('sort') || 'newest') as 'newest' | 'price_asc' | 'price_desc' | 'quantity_desc';

  // Local state
  const [searchInput, setSearchInput] = useState(query);
  const [districtInput, setDistrictInput] = useState(districtQuery);
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam?.toString() || '');
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam?.toString() || '');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [listings, setListings] = useState<SeedListing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync inputs with URL changes
  useEffect(() => {
    setSearchInput(query);
    setDistrictInput(districtQuery);
    setMinPriceInput(minPriceParam?.toString() || '');
    setMaxPriceInput(maxPriceParam?.toString() || '');
  }, [query, districtQuery, minPriceParam, maxPriceParam]);

  // Load crop options
  useEffect(() => {
    let mounted = true;
    void fetchCrops().then((data) => {
      if (mounted) setCrops(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch listings from Supabase based on search params
  const loadListings = useCallback(
    async (pageToLoad: number, append = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const res = await fetchListings({
          query: query || undefined,
          cropId: selectedCropId || undefined,
          cropCategory: selectedCategory !== 'all' ? selectedCategory : undefined,
          province: selectedProvince !== 'all' ? selectedProvince : undefined,
          district: districtQuery || undefined,
          varietyType: selectedType !== 'all' ? selectedType : undefined,
          seedCondition: selectedCondition !== 'all' ? selectedCondition : undefined,
          listingType: selectedTransactionType !== 'all' ? selectedTransactionType : undefined,
          minPrice: minPriceParam,
          maxPrice: maxPriceParam,
          sortBy,
          status: 'active',
          page: pageToLoad,
          limit: 12,
        });

        if (append) {
          setListings((prev) => [...prev, ...res.data]);
        } else {
          setListings(res.data);
        }

        setTotalCount(res.total);
        setCurrentPage(res.page);
        setHasMore(res.hasMore);
      } catch (err) {
        console.error('Failed to load listings:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      query,
      selectedCropId,
      selectedCategory,
      selectedProvince,
      districtQuery,
      selectedType,
      selectedCondition,
      selectedTransactionType,
      minPriceParam,
      maxPriceParam,
      sortBy,
    ]
  );

  useEffect(() => {
    void loadListings(1, false);
  }, [loadListings]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);

    if (searchInput.trim()) nextParams.set('q', searchInput.trim());
    else nextParams.delete('q');

    if (districtInput.trim()) nextParams.set('district', districtInput.trim());
    else nextParams.delete('district');

    if (minPriceInput.trim()) nextParams.set('minPrice', minPriceInput.trim());
    else nextParams.delete('minPrice');

    if (maxPriceInput.trim()) nextParams.set('maxPrice', maxPriceInput.trim());
    else nextParams.delete('maxPrice');

    setSearchParams(nextParams);
  };

  const updateParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setDistrictInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams(new URLSearchParams());
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      void loadListings(currentPage + 1, true);
    }
  };

  const categories: Array<CropCategory | 'all'> = [
    'all',
    'cereal',
    'pulses',
    'cotton',
    'oilseeds',
    'vegetables',
    'fodder',
  ];

  const varietyTypes: Array<VarietyType | 'all'> = [
    'all',
    'heirloom',
    'desi',
    'organic',
    'opv',
    'hybrid',
  ];

  const conditions: Array<SeedCondition | 'all'> = [
    'all',
    'cleaned',
    'graded',
    'sun_dried',
    'raw',
    'treated',
  ];

  const transactionTypes: Array<ListingType | 'all'> = [
    'all',
    'sale',
    'exchange',
    'both',
  ];

  const activeFilterCount =
    (query ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedCropId ? 1 : 0) +
    (selectedProvince !== 'all' ? 1 : 0) +
    (districtQuery ? 1 : 0) +
    (selectedType !== 'all' ? 1 : 0) +
    (selectedCondition !== 'all' ? 1 : 0) +
    (selectedTransactionType !== 'all' ? 1 : 0) +
    (minPriceParam ? 1 : 0) +
    (maxPriceParam ? 1 : 0);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Search Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.4rem', color: 'var(--primary-900)' }}>
          {t('search.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          {t('search.subtitle')}
        </p>
      </div>

      {/* Main Search Bar & Quick Controls */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('search.inputPlaceholder')}
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              aria-label="Search seeds by variety or crop"
            />
          </div>

          <div style={{ flex: '0 1 180px' }}>
            <input
              type="text"
              value={districtInput}
              onChange={(e) => setDistrictInput(e.target.value)}
              placeholder="District (e.g. Swat)"
              className="form-input"
              aria-label="Filter by district"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            id="search-submit-btn"
            style={{ padding: '0.65rem 1.4rem' }}
          >
            <span>{t('nav.search')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            aria-expanded={showMobileFilters}
          >
            <Filter size={16} aria-hidden="true" />
            <span>Filters ({activeFilterCount})</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        </div>
      </form>

      {/* Verification Notice Banner */}
      <div
        role="note"
        style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.875rem',
          color: '#92400e',
        }}
      >
        <AlertTriangle size={18} style={{ flexShrink: 0, color: '#b45309' }} aria-hidden="true" />
        <span>{t('listingDetails.verificationNotice')}</span>
      </div>

      {/* Advanced Filter Panel (collapsible or always open on desktop) */}
      <div
        className="card"
        style={{
          marginBottom: '1.75rem',
          display: showMobileFilters ? 'block' : 'none',
        }}
        id="search-filter-panel"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {/* Province */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-province" className="form-label" style={{ fontSize: '0.85rem' }}>
              {t('search.province')}
            </label>
            <select
              id="filter-province"
              value={selectedProvince}
              onChange={(e) => updateParam('province', e.target.value)}
              className="form-select"
              style={{ padding: '0.45rem', fontSize: '0.85rem' }}
            >
              <option value="all">{t('search.allProvinces')}</option>
              <option value="punjab">{t('search.punjab')}</option>
              <option value="sindh">{t('search.sindh')}</option>
              <option value="khyberPakhtunkhwa">{t('search.khyberPakhtunkhwa')}</option>
              <option value="balochistan">{t('search.balochistan')}</option>
              <option value="gilgitBaltistan">{t('search.gilgitBaltistan')}</option>
              <option value="azadKashmir">{t('search.azadKashmir')}</option>
              <option value="islamabad">{t('search.islamabad')}</option>
            </select>
          </div>

          {/* Specific Crop */}
          {crops.length > 0 && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="filter-crop" className="form-label" style={{ fontSize: '0.85rem' }}>
                {t('createListing.crop')}
              </label>
              <select
                id="filter-crop"
                value={selectedCropId}
                onChange={(e) => updateParam('cropId', e.target.value)}
                className="form-select"
                style={{ padding: '0.45rem', fontSize: '0.85rem' }}
              >
                <option value="">All Crops ({crops.length})</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn} ({c.nameUr})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Seed Condition */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-condition" className="form-label" style={{ fontSize: '0.85rem' }}>
              {t('search.seedCondition')}
            </label>
            <select
              id="filter-condition"
              value={selectedCondition}
              onChange={(e) => updateParam('condition', e.target.value)}
              className="form-select"
              style={{ padding: '0.45rem', fontSize: '0.85rem' }}
            >
              {conditions.map((cond) => (
                <option key={cond} value={cond}>
                  {cond === 'all' ? t('search.allConditions') : t(`search.${cond}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-txn" className="form-label" style={{ fontSize: '0.85rem' }}>
              {t('search.transactionType')}
            </label>
            <select
              id="filter-txn"
              value={selectedTransactionType}
              onChange={(e) => updateParam('txn', e.target.value)}
              className="form-select"
              style={{ padding: '0.45rem', fontSize: '0.85rem' }}
            >
              {transactionTypes.map((txn) => (
                <option key={txn} value={txn}>
                  {txn === 'all' ? t('search.allTransactionTypes') : t(`search.${txn}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Variety Type */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-type" className="form-label" style={{ fontSize: '0.85rem' }}>
              {t('search.seedType')}
            </label>
            <select
              id="filter-type"
              value={selectedType}
              onChange={(e) => updateParam('type', e.target.value)}
              className="form-select"
              style={{ padding: '0.45rem', fontSize: '0.85rem' }}
            >
              {varietyTypes.map((vt) => (
                <option key={vt} value={vt}>
                  {vt === 'all' ? t('search.allTypes') : t(`search.${vt}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>
              {t('search.priceRange')}
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input
                type="number"
                min="0"
                placeholder={t('search.minPrice')}
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                onBlur={handleSearchSubmit}
                className="form-input"
                style={{ padding: '0.45rem', fontSize: '0.85rem' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>-</span>
              <input
                type="number"
                min="0"
                placeholder={t('search.maxPrice')}
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                onBlur={handleSearchSubmit}
                className="form-input"
                style={{ padding: '0.45rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
            <button
              type="button"
              onClick={clearAllFilters}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
            >
              <X size={14} aria-hidden="true" />
              <span>{t('search.clearFilters')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Category Chips Strip */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
          scrollbarWidth: 'none',
        }}
        role="region"
        aria-label="Crop Category Filters"
      >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => updateParam('category', cat)}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                border: isActive ? '1.5px solid var(--primary-800)' : '1px solid var(--border-medium)',
                backgroundColor: isActive ? 'var(--primary-800)' : '#ffffff',
                color: isActive ? '#ffffff' : 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {cat === 'all' ? t('search.allCategories') : t(`search.${cat}`)}
            </button>
          );
        })}
      </div>

      {/* Results Header: Count & Sorting */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          {t('search.filterResults')}:{' '}
          <strong style={{ color: 'var(--primary-900)' }}>{totalCount}</strong> seed offerings
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowUpDown size={15} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('search.sortBy')}:</span>
          <select
            value={sortBy}
            onChange={(e) => updateParam('sort', e.target.value)}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              fontSize: '0.85rem',
              backgroundColor: '#ffffff',
              color: 'var(--text-primary)',
            }}
            aria-label="Sort listings"
          >
            <option value="newest">{t('search.newest')}</option>
            <option value="price_asc">{t('search.priceAsc')}</option>
            <option value="price_desc">{t('search.priceDesc')}</option>
            <option value="quantity_desc">{t('search.quantityDesc')}</option>
          </select>
        </div>
      </div>

      {/* Listings Grid or Empty State */}
      {isLoading ? (
        <LoadingState message="Searching agricultural seeds across Pakistan..." />
      ) : listings.length === 0 ? (
        <EmptyState
          title={t('search.noResults')}
          description="Try broadening your search keywords, clearing province filters, or exploring all crop categories."
          action={{
            label: t('search.clearFilters'),
            onClick: clearAllFilters,
          }}
        />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2.5rem',
            }}
          >
            {listings.map((seed) => (
              <article
                key={seed.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  padding: '1.25rem',
                }}
              >
                <div>
                  {seed.coverImage && (
                    <div
                      style={{
                        height: '160px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        marginBottom: '0.85rem',
                        backgroundColor: '#f3f4f6',
                      }}
                    >
                      <img
                        src={seed.coverImage}
                        alt={seed.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.65rem',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="badge badge-emerald">
                      {t(`search.${seed.cropCategory}`)}
                    </span>
                    <span className="badge badge-amber">
                      {t(`search.${seed.varietyType}`)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: '#f3f4f6',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {t(`search.${seed.seedCondition}`)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                    <Link to={`/listings/${seed.id}`} style={{ color: 'var(--primary-900)' }}>
                      {seed.title}
                    </Link>
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      marginBottom: '0.65rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <MapPin size={15} aria-hidden="true" />
                    <span>
                      {seed.district}, {t(`search.${seed.province}`)}
                    </span>
                    {seed.isVerifiedKeeper && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          color: 'var(--primary-700)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          marginLeft: 'auto',
                        }}
                      >
                        <ShieldCheck size={14} aria-hidden="true" />
                        <span>{seed.sellerName}</span>
                      </span>
                    )}
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
                    {seed.description}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {seed.quantityKg.toLocaleString()} {t('common.kg')}
                      {seed.germinationRate ? ` • ${seed.germinationRate}% اگاؤ` : ''}
                    </div>

                    <div style={{ fontWeight: 700, color: 'var(--primary-800)', fontSize: '1.1rem' }}>
                      {seed.listingType === 'exchange' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-800)' }}>
                          <RefreshCw size={14} aria-hidden="true" />
                          <span style={{ fontSize: '0.9rem' }}>{t('search.exchange')}</span>
                        </div>
                      ) : (
                        <div>
                          <span>
                            {seed.pricePerKg} {t('common.pkr')} / {t('common.kg')}
                          </span>
                          {seed.listingType === 'both' && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', marginLeft: '4px' }}>
                              (+ Barter)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/listings/${seed.id}`}
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                  >
                    {t('listingDetails.title')}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="btn btn-outline"
                id="search-load-more-btn"
                style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>{t('search.loadMore')}</span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
