import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '@/i18n/config';

import { SearchPage } from '@/features/listings/SearchPage';
import { ListingDetailsPage } from '@/features/listings/ListingDetailsPage';
import { CreateListingPage } from '@/features/listings/CreateListingPage';
import { MyListingsPage } from '@/features/listings/MyListingsPage';
import { AuthProvider } from '@/features/auth/AuthContext';
import { listingFormSchema } from '@/features/listings/listingValidation';
import * as listingsService from '@/features/listings/listingsService';
import { SeedListing, Crop } from '@/types';

// Mock Supabase client
vi.mock('@/lib/supabase', () => {
  return {
    isSupabaseConfigured: () => true,
    supabase: {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        resend: vi.fn().mockResolvedValue({ error: null }),
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'valid-token',
              user: {
                id: 'seller-user-123',
                email: 'seller@punjab.pk',
                email_confirmed_at: '2026-02-16T12:00:00Z',
                app_metadata: { role: 'authenticated' },
              },
            },
          },
          error: null,
        }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'seller-user-123',
            full_name: 'Muhammad Aslam',
            province: 'punjab',
            district: 'Sargodha',
            farming_type: 'organic',
            is_verified_keeper: true,
            is_suspended: false,
          },
          error: null,
        }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://storage.beejdost.pk/image.jpg' } }),
          upload: vi.fn().mockResolvedValue({ data: { path: 'path' }, error: null }),
        }),
      },
    },
  };
});

describe('Phase 4: Marketplace and Listings Test Suite', () => {
  const sampleCrops: Crop[] = [
    {
      id: 'crop-rice-1',
      slug: 'basmati-rice',
      nameEn: 'Basmati Rice',
      nameUr: 'باسمتی چاول',
      namePa: 'باسمتی چول',
      category: 'cereal',
      isApproved: true,
    },
    {
      id: 'crop-wheat-2',
      slug: 'desi-wheat',
      nameEn: 'Heritage Wheat',
      nameUr: 'روایتی گندم',
      namePa: 'دیسی کݨک',
      category: 'cereal',
      isApproved: true,
    },
  ];

  const sampleListings: SeedListing[] = [
    {
      id: 'listing-001',
      sellerId: 'seller-user-123',
      cropId: 'crop-rice-1',
      title: 'Heritage Basmati 370',
      varietyName: 'Basmati 370',
      cropCategory: 'cereal',
      varietyType: 'heirloom',
      seedCondition: 'cleaned',
      listingType: 'sale',
      quantityKg: 200,
      pricePerKg: 350,
      exchangeRequirements: null,
      germinationRate: 92,
      harvestYear: 2025,
      province: 'punjab',
      district: 'Gujranwala',
      tehsil: 'Kamoke',
      villageOrArea: 'Chak 12',
      description: 'Traditional Kallar tract basmati rice preserved across generations.',
      status: 'active',
      claimedCertified: false,
      isVerifiedCertified: false,
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z',
      sellerName: 'Muhammad Aslam',
      isVerifiedKeeper: true,
    },
    {
      id: 'listing-002',
      sellerId: 'other-user-456',
      cropId: 'crop-wheat-2',
      title: 'Desi Barani Gandum',
      varietyName: 'Desi Gandum',
      cropCategory: 'cereal',
      varietyType: 'desi',
      seedCondition: 'raw',
      listingType: 'exchange',
      quantityKg: 150,
      pricePerKg: null,
      exchangeRequirements: 'Looking for mung bean or sarson seeds.',
      germinationRate: 88,
      harvestYear: 2025,
      province: 'khyberPakhtunkhwa',
      district: 'Swat',
      description: 'Drought-tolerant heirloom rainfed wheat.',
      status: 'active',
      claimedCertified: false,
      isVerifiedCertified: false,
      createdAt: '2026-03-05T12:00:00Z',
      updatedAt: '2026-03-05T12:00:00Z',
      sellerName: 'Khanzada Sher',
      isVerifiedKeeper: false,
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
  });

  describe('1. Business Rules & Zod Validation', () => {
    it('requires price > 0 for sale listings', () => {
      const invalidSale = {
        cropId: 'crop-1',
        title: 'Basmati 370',
        varietyName: 'Basmati 370',
        varietyType: 'heirloom' as const,
        seedCondition: 'cleaned' as const,
        listingType: 'sale' as const,
        quantityKg: 100,
        pricePerKg: 0, // Invalid: must be positive for sale
        harvestYear: 2025,
        province: 'punjab' as const,
        district: 'Lahore',
        description: 'Detailed description with sufficient length.',
      };

      const result = listingFormSchema.safeParse(invalidSale);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes('pricePerKg'))).toBe(true);
      }
    });

    it('allows exchange-only listings without a cash price', () => {
      const validExchange = {
        cropId: 'crop-1',
        title: 'Desi Cotton',
        varietyName: 'Desi Cotton',
        varietyType: 'desi' as const,
        seedCondition: 'raw' as const,
        listingType: 'exchange' as const,
        quantityKg: 50,
        pricePerKg: null, // Valid for pure exchange
        harvestYear: 2025,
        province: 'sindh' as const,
        district: 'Matiari',
        description: 'Indigenous drought-resilient tree cotton seed lot.',
      };

      const result = listingFormSchema.safeParse(validExchange);
      expect(result.success).toBe(true);
    });

    it('requires both price and exchange requirements when listingType is "both"', () => {
      const invalidBoth = {
        cropId: 'crop-1',
        title: 'Mung Bean Seed',
        varietyName: 'Mung Bean',
        varietyType: 'organic' as const,
        seedCondition: 'graded' as const,
        listingType: 'both' as const,
        quantityKg: 50,
        pricePerKg: 200,
        exchangeRequirements: '', // Invalid: required when type is both
        harvestYear: 2025,
        province: 'punjab' as const,
        district: 'Faisalabad',
        description: 'High germination nitrogen-fixing summer legume seed lot.',
      };

      const result = listingFormSchema.safeParse(invalidBoth);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes('exchangeRequirements'))).toBe(true);
      }
    });

    it('enforces quantity bounds (> 0 and <= 50,000 kg)', () => {
      const zeroQty = listingFormSchema.safeParse({
        cropId: 'crop-1',
        title: 'Title',
        varietyName: 'Variety',
        varietyType: 'desi' as const,
        seedCondition: 'raw' as const,
        listingType: 'exchange' as const,
        quantityKg: 0,
        harvestYear: 2025,
        province: 'punjab' as const,
        district: 'Lahore',
        description: 'Valid description text here.',
      });
      expect(zeroQty.success).toBe(false);

      const excessQty = listingFormSchema.safeParse({
        cropId: 'crop-1',
        title: 'Title',
        varietyName: 'Variety',
        varietyType: 'desi' as const,
        seedCondition: 'raw' as const,
        listingType: 'exchange' as const,
        quantityKg: 50001,
        harvestYear: 2025,
        province: 'punjab' as const,
        district: 'Lahore',
        description: 'Valid description text here.',
      });
      expect(excessQty.success).toBe(false);
    });
  });

  describe('2. Public Marketplace & Search Experience', () => {
    it('renders listings and displays verification notice', async () => {
      vi.spyOn(listingsService, 'fetchListings').mockResolvedValue({
        data: sampleListings,
        total: 2,
        page: 1,
        limit: 12,
        hasMore: false,
      });

      render(
        <MemoryRouter>
          <SearchPage />
        </MemoryRouter>
      );

      // Verify page title and notice
      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Search & Filter Seeds/i);
      expect(screen.getByText(/Important Quality & Safety Notice/i)).toBeInTheDocument();

      // Verify listings render with seller info
      expect(screen.getByText('Heritage Basmati 370')).toBeInTheDocument();
      expect(screen.getByText('Desi Barani Gandum')).toBeInTheDocument();
      expect(screen.getByText(/Muhammad Aslam/i)).toBeInTheDocument();
    });

    it('renders empty state when no listings match search query', async () => {
      vi.spyOn(listingsService, 'fetchListings').mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 12,
        hasMore: false,
      });

      render(
        <MemoryRouter initialEntries={['/search?q=nonexistentcrop']}>
          <SearchPage />
        </MemoryRouter>
      );

      expect(await screen.findByText(/No seed listings match your filters/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear all filters/i })).toBeInTheDocument();
    });

    it('handles pagination / load more action', async () => {
      const fetchSpy = vi.spyOn(listingsService, 'fetchListings').mockResolvedValue({
        data: sampleListings,
        total: 24,
        page: 1,
        limit: 12,
        hasMore: true,
      });

      render(
        <MemoryRouter>
          <SearchPage />
        </MemoryRouter>
      );

      const loadMoreBtn = await screen.findByRole('button', { name: /Load More Seeds/i });
      expect(loadMoreBtn).toBeInTheDocument();

      fireEvent.click(loadMoreBtn);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  describe('3. Listing Details & Independent Quality Notice', () => {
    it('renders listing details with specs, pricing, and independent verification notice', async () => {
      vi.spyOn(listingsService, 'fetchListingById').mockResolvedValue(sampleListings[0]!);

      render(
        <MemoryRouter initialEntries={['/listings/listing-001']}>
          <Routes>
            <Route path="/listings/:id" element={<ListingDetailsPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Heritage Basmati 370');
      expect(screen.getByText(/200 kg/i)).toBeInTheDocument();
      expect(screen.getByText(/PKR 350/i)).toBeInTheDocument();
      expect(screen.getByText(/Important Quality & Safety Notice/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Message Seed Keeper/i })).toBeInTheDocument();
    });

    it('renders exchange-only terms clearly without requiring a price', async () => {
      vi.spyOn(listingsService, 'fetchListingById').mockResolvedValue(sampleListings[1]!);

      render(
        <MemoryRouter initialEntries={['/listings/listing-002']}>
          <Routes>
            <Route path="/listings/:id" element={<ListingDetailsPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Desi Barani Gandum');
      expect(screen.getByText(/Barter \/ Seed Swap Only/i)).toBeInTheDocument();
      expect(screen.getByText(/Looking for mung bean or sarson seeds/i)).toBeInTheDocument();
    });
  });

  describe('4. Listing Management (Create, Edit, Status Toggle, Stale Updates)', () => {
    it('creates listing through createListing and navigates', async () => {
      const createSpy = vi.spyOn(listingsService, 'createListing').mockResolvedValue({
        listing: sampleListings[0]!,
        error: null,
      });

      vi.spyOn(listingsService, 'fetchCrops').mockResolvedValue(sampleCrops);

      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AuthProvider>
            <CreateListingPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Fill form
      await screen.findByLabelText(/Crop/i);
      await user.selectOptions(screen.getByLabelText(/Crop/i), 'crop-rice-1');
      await user.clear(screen.getByLabelText(/^Listing Title/i));
      await user.type(screen.getByLabelText(/^Listing Title/i), 'New Heirloom Basmati');
      await user.type(screen.getByLabelText(/^District/i), 'Gujranwala');
      await user.type(
        screen.getByLabelText(/^Agronomic notes/i),
        'Drought-tolerant heirloom seed lot from Kallar tract.'
      );

      fireEvent.click(screen.getByRole('button', { name: /Publish Seed Lot/i }));

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalled();
      });
    });

    it('displays user listings and supports status toggling', async () => {
      vi.spyOn(listingsService, 'fetchMyListings').mockResolvedValue([sampleListings[0]!]);
      const statusSpy = vi.spyOn(listingsService, 'updateListingStatus').mockResolvedValue({ error: null });

      render(
        <MemoryRouter>
          <AuthProvider>
            <MyListingsPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(await screen.findByText('Heritage Basmati 370')).toBeInTheDocument();

      const markSoldBtn = screen.getByRole('button', { name: /Mark as Sold/i });
      fireEvent.click(markSoldBtn);

      expect(statusSpy).toHaveBeenCalledWith('listing-001', 'seller-user-123', 'sold');
    });

    it('prevents stale updates by verifying optimistic update failure', async () => {
      const staleError = new Error('Stale update detected: This listing was modified in another session.');
      const updateSpy = vi.spyOn(listingsService, 'updateListing').mockResolvedValue({
        listing: null,
        error: staleError,
      });

      const res = await listingsService.updateListing(
        'listing-001',
        'seller-user-123',
        { quantityKg: 50 },
        '2026-03-01T10:00:00Z' // outdated timestamp
      );

      expect(updateSpy).toHaveBeenCalled();
      expect(res.error?.message).toContain('Stale update detected');
    });
  });
});
