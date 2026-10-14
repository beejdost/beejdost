import { useState, useMemo, type FC, type FormEvent, type ChangeEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { INITIAL_SEED_LOTS } from './seedData';
import { EmptyState } from '@/components/common/EmptyState';
import { CropCategory, PakistanProvince, VarietyType } from '@/types';
import { Search, MapPin, X, ShieldCheck } from 'lucide-react';

export const SearchPage: FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const selectedCategory = (searchParams.get('category') || 'all') as CropCategory | 'all';
  const selectedProvince = (searchParams.get('province') || 'all') as PakistanProvince | 'all';
  const selectedType = (searchParams.get('type') || 'all') as VarietyType | 'all';

  const [searchInput, setSearchInput] = useState(query);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      nextParams.set('q', searchInput.trim());
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams);
  };

  const handleCategoryChange = (cat: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (cat === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', cat);
    }
    setSearchParams(nextParams);
  };

  const handleProvinceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const prov = e.target.value;
    const nextParams = new URLSearchParams(searchParams);
    if (prov === 'all') {
      nextParams.delete('province');
    } else {
      nextParams.set('province', prov);
    }
    setSearchParams(nextParams);
  };

  const handleTypeChange = (type: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (type === 'all') {
      nextParams.delete('type');
    } else {
      nextParams.set('type', type);
    }
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const filteredSeeds = useMemo(() => {
    return INITIAL_SEED_LOTS.filter((seed) => {
      // Keyword search
      if (query) {
        const qLower = query.toLowerCase();
        const matchesName = seed.varietyName.toLowerCase().includes(qLower);
        const matchesDesc = seed.description.toLowerCase().includes(qLower);
        const matchesDistrict = seed.district.toLowerCase().includes(qLower);
        const matchesSeller = seed.sellerName.toLowerCase().includes(qLower);
        if (!matchesName && !matchesDesc && !matchesDistrict && !matchesSeller) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && seed.cropCategory !== selectedCategory) {
        return false;
      }

      // Province filter
      if (selectedProvince !== 'all' && seed.province !== selectedProvince) {
        return false;
      }

      // Variety type filter
      if (selectedType !== 'all' && seed.varietyType !== selectedType) {
        return false;
      }

      return true;
    });
  }, [query, selectedCategory, selectedProvince, selectedType]);

  const categories: Array<CropCategory | 'all'> = [
    'all',
    'cereal',
    'pulses',
    'cotton',
    'oilseeds',
    'vegetables',
    'fodder',
  ];

  const provinces: Array<PakistanProvince | 'all'> = [
    'all',
    'punjab',
    'sindh',
    'khyberPakhtunkhwa',
    'balochistan',
    'gilgitBaltistan',
    'azadKashmir',
  ];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.4rem' }}>
          {t('search.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          {t('search.subtitle')}
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1.5px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.35rem 0.6rem 0.35rem 1rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Search size={20} style={{ color: 'var(--primary-700)', flexShrink: 0 }} aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('search.inputPlaceholder')}
            aria-label={t('search.inputPlaceholder')}
            id="seed-search-input"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              backgroundColor: 'transparent',
              color: 'var(--text-main)',
            }}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                const nextParams = new URLSearchParams(searchParams);
                nextParams.delete('q');
                setSearchParams(nextParams);
              }}
              aria-label="Clear search input"
              style={{ color: 'var(--text-muted)', padding: '0.25rem' }}
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
          <button type="submit" className="btn btn-primary" id="search-submit-btn">
            {t('nav.search')}
          </button>
        </div>
      </form>

      {/* Filters Strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          backgroundColor: 'var(--bg-subtle)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Province Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label htmlFor="province-filter" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('search.province')}:
            </label>
            <select
              id="province-filter"
              value={selectedProvince}
              onChange={handleProvinceChange}
              className="form-select"
              style={{ minHeight: '38px', padding: '0.3rem 0.6rem', fontSize: '0.85rem', width: 'auto' }}
            >
              {provinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov === 'all' ? t('search.allProvinces') : t(`search.${prov}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Seed Type Filter */}
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            {(['all', 'heirloom', 'organic'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className="btn"
                style={{
                  minHeight: '36px',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: selectedType === type ? 'var(--primary-700)' : 'var(--bg-surface)',
                  color: selectedType === type ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                }}
              >
                {type === 'all' ? t('search.allTypes') : t(`search.${type}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Clear filters action */}
        {(query || selectedCategory !== 'all' || selectedProvince !== 'all' || selectedType !== 'all') && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="btn btn-outline"
            style={{ minHeight: '36px', padding: '0.25rem 0.75rem', fontSize: '0.825rem' }}
          >
            <X size={14} aria-hidden="true" />
            <span>{t('search.clearFilters')}</span>
          </button>
        )}
      </div>

      {/* Category Horizontal Pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.75rem',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryChange(cat)}
            className="btn"
            style={{
              minHeight: '38px',
              padding: '0.4rem 1rem',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              borderRadius: 'var(--radius-full)',
              backgroundColor: selectedCategory === cat ? 'var(--primary-800)' : 'var(--bg-surface)',
              color: selectedCategory === cat ? '#ffffff' : 'var(--text-main)',
              border: '1px solid var(--border-light)',
              boxShadow: selectedCategory === cat ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {cat === 'all' ? t('search.allCategories') : t(`search.${cat}`)}
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        {t('search.filterResults')}: <strong>{filteredSeeds.length}</strong>
      </div>

      {/* Results Grid or Empty State */}
      {filteredSeeds.length === 0 ? (
        <EmptyState
          title={t('search.noResults')}
          description={t('search.subtitle')}
          action={{
            label: t('search.clearFilters'),
            onClick: clearAllFilters,
          }}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredSeeds.map((seed) => (
            <article
              key={seed.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span className="badge badge-emerald">
                    {t(`search.${seed.cropCategory}`)}
                  </span>
                  <span className="badge badge-amber">
                    {t(`search.${seed.varietyType}`)}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  <Link to={`/listings/${seed.id}`}>{seed.varietyName}</Link>
                </h2>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    marginBottom: '0.75rem',
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
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '1rem',
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {seed.quantityKg} {t('common.kg')} • {seed.germinationRate}% {t('listingDetails.germinationRate')}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-800)', fontSize: '1.1rem' }}>
                    {seed.pricePerKg === 0
                      ? t('common.free')
                      : `${seed.pricePerKg} ${t('common.pkr')} / ${t('common.kg')}`}
                  </div>
                </div>

                <Link
                  to={`/listings/${seed.id}`}
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}
                >
                  {t('listingDetails.title')}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
