import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  SeedListing,
  Crop,
  ListingImage,
  ListingFilterCriteria,
  PaginatedResult,
  ListingStatus,
  PakistanProvince,
  CropCategory,
  VarietyType,
  SeedCondition,
  ListingType,
} from '@/types';
import { INITIAL_SEED_LOTS } from './seedData';

export interface CreateListingDTO {
  cropId: string;
  title: string;
  varietyName?: string | null;
  varietyType: VarietyType;
  seedCondition: SeedCondition;
  listingType: ListingType;
  quantityKg: number;
  pricePerKg?: number | null;
  exchangeRequirements?: string | null;
  germinationRate?: number | null;
  harvestYear: number;
  province: PakistanProvince;
  district: string;
  tehsil?: string | null;
  villageOrArea?: string | null;
  description?: string | null;
  claimedCertified?: boolean;
  certificationDetails?: string | null;
}

export interface UpdateListingDTO {
  title?: string;
  varietyName?: string;
  varietyType?: VarietyType;
  seedCondition?: SeedCondition;
  listingType?: ListingType;
  quantityKg?: number;
  pricePerKg?: number | null;
  exchangeRequirements?: string | null;
  germinationRate?: number | null;
  harvestYear?: number;
  province?: PakistanProvince;
  district?: string;
  tehsil?: string | null;
  villageOrArea?: string | null;
  description?: string;
  status?: ListingStatus;
  claimedCertified?: boolean;
  certificationDetails?: string | null;
}

const STORAGE_BUCKET = 'listing-images';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Helper to build public image URL from storage path
 */
export function getStorageImageUrl(storagePath: string): string {
  if (!storagePath) return '';
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }
  if (!isSupabaseConfigured()) {
    return storagePath;
  }
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Maps raw database row to application SeedListing domain model
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDatabaseListing(row: any): SeedListing {
  const images: ListingImage[] = Array.isArray(row.listing_images)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? row.listing_images.map((img: any) => ({
        id: img.id,
        listingId: img.listing_id,
        storagePath: img.storage_path,
        displayOrder: img.display_order ?? 0,
        isCover: Boolean(img.is_cover),
        publicUrl: getStorageImageUrl(img.storage_path),
      }))
    : [];

  const coverImg = images.find((i) => i.isCover) || images[0];

  const cropData: Crop | undefined = row.crops
    ? {
        id: row.crops.id,
        slug: row.crops.slug,
        nameEn: row.crops.name_en,
        nameUr: row.crops.name_ur,
        namePa: row.crops.name_pa,
        category: row.crops.category,
        scientificName: row.crops.scientific_name,
        descriptionEn: row.crops.description_en,
        descriptionUr: row.crops.description_ur,
        descriptionPa: row.crops.description_pa,
        isApproved: Boolean(row.crops.is_approved),
      }
    : undefined;

  const sellerData = row.profiles;

  return {
    id: row.id,
    sellerId: row.seller_id,
    cropId: row.crop_id,
    title: row.title || row.variety_name,
    varietyName: row.variety_name,
    cropCategory: (cropData?.category || row.crop_category || 'cereal') as CropCategory,
    varietyType: (row.variety_type || 'desi') as VarietyType,
    seedCondition: (row.seed_condition || 'cleaned') as SeedCondition,
    listingType: (row.listing_type || 'sale') as ListingType,
    quantityKg: Number(row.quantity_kg),
    pricePerKg: row.price_per_kg !== null && row.price_per_kg !== undefined ? Number(row.price_per_kg) : null,
    exchangeRequirements: row.exchange_requirements,
    germinationRate: row.germination_rate_pct !== null && row.germination_rate_pct !== undefined ? Number(row.germination_rate_pct) : null,
    harvestYear: row.harvest_year || 2025,
    province: row.province as PakistanProvince,
    district: row.district,
    tehsil: row.tehsil,
    villageOrArea: row.village_or_area,
    description: row.description,
    status: row.status as ListingStatus,
    claimedCertified: Boolean(row.claimed_certified),
    certificationDetails: row.certification_details,
    isVerifiedCertified: Boolean(row.is_verified_certified),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    imageUrl: coverImg?.publicUrl,
    coverImage: coverImg?.publicUrl,
    images,
    sellerName: sellerData?.full_name || 'Verified Seed Grower',
    sellerPhone: sellerData?.phone || null,
    isVerifiedKeeper: Boolean(sellerData?.is_verified_keeper),
    crop: cropData,
  };
}

/**
 * Fetch approved agricultural crops for selection and filtering
 */
export async function fetchCrops(): Promise<Crop[]> {
  if (!isSupabaseConfigured()) {
    return [
      { id: 'crop-001', slug: 'basmati-rice', nameEn: 'Basmati Rice', nameUr: 'باسمتی چاول', namePa: 'باسمتی چول', category: 'cereal', isApproved: true },
      { id: 'crop-002', slug: 'desi-wheat', nameEn: 'Heritage Wheat (Gandum)', nameUr: 'روایتی گندم', namePa: 'دیسی کݨک', category: 'cereal', isApproved: true },
      { id: 'crop-003', slug: 'desi-cotton', nameEn: 'Desi Tree Cotton', nameUr: 'دیسی کپاس', namePa: 'دیسی کپا', category: 'cotton', isApproved: true },
      { id: 'crop-004', slug: 'mung-bean', nameEn: 'Mung Bean (Green Gram)', nameUr: 'مونگ دال', namePa: 'مونگی دال', category: 'pulses', isApproved: true },
      { id: 'crop-005', slug: 'desi-chickpea', nameEn: 'Desi Black Chickpea', nameUr: 'دیسی کالا چنا', namePa: 'کالا چھولا', category: 'pulses', isApproved: true },
      { id: 'crop-006', slug: 'sarson-mustard', nameEn: 'Mustard Seed (Sarson)', nameUr: 'روایتی سرسوں', namePa: 'دیسی سرھوں', category: 'oilseeds', isApproved: true },
      { id: 'crop-007', slug: 'til-sesame', nameEn: 'Sesame Seed (Til)', nameUr: 'تل بیج', namePa: 'تل بیج', category: 'oilseeds', isApproved: true },
      { id: 'crop-008', slug: 'guar-cluster-bean', nameEn: 'Cluster Bean (Guar)', nameUr: 'گوارا بیج', namePa: 'گوارا', category: 'fodder', isApproved: true },
      { id: 'crop-009', slug: 'swat-red-rice', nameEn: 'Mountain Red Rice', nameUr: 'سواتی لال چاول', namePa: 'سواتی لال چول', category: 'cereal', isApproved: true },
      { id: 'crop-010', slug: 'karez-melon', nameEn: 'Karez Sweet Melon', nameUr: 'پشین میٹھا خربوزہ', namePa: 'میٹھا خربوزہ', category: 'vegetables', isApproved: true },
      { id: 'crop-011', slug: 'skardu-buckwheat', nameEn: 'Buckwheat (Ogla)', nameUr: 'کٹو / باک ویٹ', namePa: 'اوگلا اناج', category: 'cereal', isApproved: true },
    ];
  }

  try {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .eq('is_approved', true)
      .order('name_en', { ascending: true });

    if (error) {
      console.error('Error fetching crops:', error.message);
      return [];
    }

    return (data || []).map((c) => ({
      id: c.id,
      slug: c.slug,
      nameEn: c.name_en,
      nameUr: c.name_ur,
      namePa: c.name_pa,
      category: c.category as CropCategory,
      scientificName: c.scientific_name,
      descriptionEn: c.description_en,
      descriptionUr: c.description_ur,
      descriptionPa: c.description_pa,
      isApproved: Boolean(c.is_approved),
    }));
  } catch (err) {
    console.error('Failed to load crops from database:', err);
    return [];
  }
}

/**
 * Fetch public seed listings with advanced filtering and pagination
 */
export async function fetchListings(
  criteria: ListingFilterCriteria = {}
): Promise<PaginatedResult<SeedListing>> {
  const page = Math.max(1, criteria.page || 1);
  const limit = Math.max(1, Math.min(criteria.limit || 12, 50));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  if (!isSupabaseConfigured()) {
    // Fallback to local memory seed data when running in dev configuration without credentials
    let results: SeedListing[] = INITIAL_SEED_LOTS.map((lot) => ({
      ...lot,
      title: lot.varietyName,
      seedCondition: 'cleaned' as SeedCondition,
      listingType: (lot.pricePerKg === 0 ? 'exchange' : 'sale') as ListingType,
      status: 'active' as ListingStatus,
      claimedCertified: false,
      isVerifiedCertified: false,
      updatedAt: lot.createdAt,
    }));

    if (criteria.query) {
      const q = criteria.query.toLowerCase();
      results = results.filter(
        (l) =>
          l.varietyName.toLowerCase().includes(q) ||
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.district.toLowerCase().includes(q)
      );
    }
    if (criteria.cropCategory && criteria.cropCategory !== 'all') {
      results = results.filter((l) => l.cropCategory === criteria.cropCategory);
    }
    if (criteria.province && criteria.province !== 'all') {
      results = results.filter((l) => l.province === criteria.province);
    }
    if (criteria.varietyType && criteria.varietyType !== 'all') {
      results = results.filter((l) => l.varietyType === criteria.varietyType);
    }
    if (criteria.listingType && criteria.listingType !== 'all') {
      results = results.filter((l) => l.listingType === criteria.listingType);
    }
    if (criteria.minPrice !== undefined && criteria.minPrice > 0) {
      results = results.filter((l) => (l.pricePerKg ?? 0) >= (criteria.minPrice || 0));
    }
    if (criteria.maxPrice !== undefined && criteria.maxPrice > 0) {
      results = results.filter((l) => (l.pricePerKg ?? 0) <= (criteria.maxPrice || Infinity));
    }

    const total = results.length;
    const paged = results.slice(from, to + 1);

    return {
      data: paged,
      total,
      page,
      limit,
      hasMore: to + 1 < total,
    };
  }

  try {
    let query = supabase
      .from('listings')
      .select(
        `
        *,
        crops (*),
        profiles:seller_id (*),
        listing_images (*)
      `,
        { count: 'exact' }
      );

    // Filter by listing status: default to 'active' for public marketplace
    if (criteria.status && criteria.status !== 'all') {
      query = query.eq('status', criteria.status);
    } else {
      query = query.eq('status', 'active');
    }

    // Keyword search across title, variety_name, and description
    if (criteria.query && criteria.query.trim().length > 0) {
      const sanitized = criteria.query.trim();
      query = query.or(
        `title.ilike.%${sanitized}%,variety_name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`
      );
    }

    // Specific crop filter
    if (criteria.cropId) {
      query = query.eq('crop_id', criteria.cropId);
    }

    // Province filter
    if (criteria.province && criteria.province !== 'all') {
      query = query.eq('province', criteria.province);
    }

    // District filter
    if (criteria.district && criteria.district.trim().length > 0) {
      query = query.ilike('district', `%${criteria.district.trim()}%`);
    }

    // Variety type filter
    if (criteria.varietyType && criteria.varietyType !== 'all') {
      query = query.eq('variety_type', criteria.varietyType);
    }

    // Seed condition filter
    if (criteria.seedCondition && criteria.seedCondition !== 'all') {
      query = query.eq('seed_condition', criteria.seedCondition);
    }

    // Transaction type filter ('sale', 'exchange', 'both')
    if (criteria.listingType && criteria.listingType !== 'all') {
      query = query.eq('listing_type', criteria.listingType);
    }

    // Price range filters
    if (criteria.minPrice !== undefined && criteria.minPrice >= 0) {
      query = query.gte('price_per_kg', criteria.minPrice);
    }
    if (criteria.maxPrice !== undefined && criteria.maxPrice > 0) {
      query = query.lte('price_per_kg', criteria.maxPrice);
    }

    // Sorting
    switch (criteria.sortBy) {
      case 'price_asc':
        query = query.order('price_per_kg', { ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        query = query.order('price_per_kg', { ascending: false, nullsFirst: false });
        break;
      case 'quantity_desc':
        query = query.order('quantity_kg', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error querying listings:', error.message);
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      };
    }

    const mapped = (data || []).map(mapDatabaseListing);

    // If cropCategory was specified, apply in-memory filter if crop relation join was used
    const filtered = criteria.cropCategory && criteria.cropCategory !== 'all'
      ? mapped.filter((l) => l.cropCategory === criteria.cropCategory)
      : mapped;

    const total = count ?? filtered.length;

    return {
      data: filtered,
      total,
      page,
      limit,
      hasMore: to + 1 < total,
    };
  } catch (err) {
    console.error('Failed to fetch marketplace listings:', err);
    return {
      data: [],
      total: 0,
      page,
      limit,
      hasMore: false,
    };
  }
}

/**
 * Fetch a single listing by its UUID
 */
export async function fetchListingById(id: string): Promise<SeedListing | null> {
  if (!id) return null;

  const foundLocal = INITIAL_SEED_LOTS.find((l) => l.id === id);
  if (foundLocal) {
    return {
      ...foundLocal,
      title: foundLocal.varietyName,
      seedCondition: 'cleaned' as SeedCondition,
      listingType: (foundLocal.pricePerKg === 0 ? 'exchange' : 'sale') as ListingType,
      status: 'active' as ListingStatus,
      claimedCertified: false,
      isVerifiedCertified: false,
      updatedAt: foundLocal.createdAt,
    };
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('listings')
      .select(
        `
        *,
        crops (*),
        profiles:seller_id (*),
        listing_images (*)
      `
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching listing details:', error.message);
      return null;
    }

    if (!data) return null;

    return mapDatabaseListing(data);
  } catch (err) {
    console.error('Failed to load listing details:', err);
    return null;
  }
}

/**
 * Fetch all listings owned by a specific seller
 */
export async function fetchMyListings(userId: string): Promise<SeedListing[]> {
  if (!userId) return [];

  if (!isSupabaseConfigured()) {
    const local = localStorage.getItem('beej_dost_my_listings');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // ignore
      }
    }
    return INITIAL_SEED_LOTS.slice(0, 2).map((l) => ({
      ...l,
      sellerId: userId,
      title: l.varietyName,
      seedCondition: 'cleaned' as SeedCondition,
      listingType: 'sale' as ListingType,
      status: 'active' as ListingStatus,
      claimedCertified: false,
      isVerifiedCertified: false,
      updatedAt: l.createdAt,
    }));
  }

  try {
    const { data, error } = await supabase
      .from('listings')
      .select(
        `
        *,
        crops (*),
        profiles:seller_id (*),
        listing_images (*)
      `
      )
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user listings:', error.message);
      return [];
    }

    return (data || []).map(mapDatabaseListing);
  } catch (err) {
    console.error('Failed to fetch user listings:', err);
    return [];
  }
}

/**
 * Validate and upload a listing image to Supabase Storage
 */
export async function uploadListingImageFile(
  userId: string,
  listingId: string,
  file: File,
  isCover = false,
  displayOrder = 0
): Promise<{ image: ListingImage | null; error: Error | null }> {
  // Validate file size (max 5 MB)
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      image: null,
      error: new Error(`Image ${file.name} exceeds the 5MB size limit.`),
    };
  }

  // Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      image: null,
      error: new Error(`Image ${file.name} has invalid format. Only JPEG, PNG, and WebP are accepted.`),
    };
  }

  if (!isSupabaseConfigured()) {
    // Mock image for development without credentials
    const mockImage: ListingImage = {
      id: `img-${Date.now()}`,
      listingId,
      storagePath: URL.createObjectURL(file),
      displayOrder,
      isCover,
      publicUrl: URL.createObjectURL(file),
    };
    return { image: mockImage, error: null };
  }

  try {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
    const storagePath = `${userId}/${listingId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { image: null, error: uploadError };
    }

    // Insert record in listing_images table
    const { data: dbData, error: dbError } = await supabase
      .from('listing_images')
      .insert({
        listing_id: listingId,
        storage_path: storagePath,
        display_order: displayOrder,
        is_cover: isCover,
      })
      .select()
      .single();

    if (dbError) {
      return { image: null, error: dbError };
    }

    return {
      image: {
        id: dbData.id,
        listingId: dbData.listing_id,
        storagePath: dbData.storage_path,
        displayOrder: dbData.display_order,
        isCover: dbData.is_cover,
        publicUrl: getStorageImageUrl(dbData.storage_path),
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      image: null,
      error: err instanceof Error ? err : new Error('Image upload failed'),
    };
  }
}

/**
 * Create a new seed lot listing with optional image uploads
 */
export async function createListing(
  userId: string,
  dto: CreateListingDTO,
  imageFiles?: File[]
): Promise<{ listing: SeedListing | null; error: Error | null }> {
  // Business rule: Quantity must be positive and bounded by 50,000 kg
  if (dto.quantityKg <= 0 || dto.quantityKg > 50000) {
    return {
      listing: null,
      error: new Error('Quantity must be greater than 0 and cannot exceed 50,000 kg.'),
    };
  }

  // Business rule: Sale listings need a defined positive price
  if ((dto.listingType === 'sale' || dto.listingType === 'both') && (!dto.pricePerKg || dto.pricePerKg <= 0)) {
    return {
      listing: null,
      error: new Error('A defined positive price per kilogram is required for sale listings.'),
    };
  }

  // Business rule: Exchange-only listings must not have a cash price
  const cleanPrice = dto.listingType === 'exchange' ? null : dto.pricePerKg;

  // Business rule: Both listings must define exchange requirements
  if (dto.listingType === 'both' && (!dto.exchangeRequirements || dto.exchangeRequirements.trim().length === 0)) {
    return {
      listing: null,
      error: new Error('Please specify exchange requirements for dual sale/exchange offerings.'),
    };
  }

  if (!isSupabaseConfigured()) {
    const newId = `listing-${Date.now()}`;
    const newListing: SeedListing = {
      id: newId,
      sellerId: userId,
      cropId: dto.cropId,
      title: dto.title || dto.varietyName || '',
      varietyName: dto.varietyName || dto.title || '',
      cropCategory: 'cereal',
      varietyType: dto.varietyType,
      seedCondition: dto.seedCondition,
      listingType: dto.listingType,
      quantityKg: dto.quantityKg,
      pricePerKg: cleanPrice ?? null,
      exchangeRequirements: dto.exchangeRequirements || null,
      germinationRate: dto.germinationRate || null,
      harvestYear: dto.harvestYear,
      province: dto.province,
      district: dto.district,
      tehsil: dto.tehsil || null,
      villageOrArea: dto.villageOrArea || null,
      description: dto.description || '',
      status: 'active',
      claimedCertified: Boolean(dto.claimedCertified),
      isVerifiedCertified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('beej_dost_my_listings') || '[]');
    localStorage.setItem('beej_dost_my_listings', JSON.stringify([newListing, ...existing]));

    return { listing: newListing, error: null };
  }

  try {
    const payload = {
      seller_id: userId,
      crop_id: dto.cropId,
      title: dto.title || dto.varietyName || '',
      variety_name: dto.varietyName || dto.title || '',
      variety_type: dto.varietyType,
      seed_condition: dto.seedCondition,
      listing_type: dto.listingType,
      quantity_kg: dto.quantityKg,
      price_per_kg: cleanPrice,
      exchange_requirements: dto.exchangeRequirements || null,
      germination_rate_pct: dto.germinationRate || null,
      harvest_year: dto.harvestYear,
      province: dto.province,
      district: dto.district,
      tehsil: dto.tehsil || null,
      village_or_area: dto.villageOrArea || null,
      description: dto.description || '',
      status: 'active',
      claimed_certified: Boolean(dto.claimedCertified),
      certification_details: dto.certificationDetails || null,
      // Security: Client CANNOT set is_verified_certified
      is_verified_certified: false,
    };

    const { data, error } = await supabase
      .from('listings')
      .insert(payload)
      .select('*, crops (*), profiles:seller_id (*)')
      .single();

    if (error) {
      return { listing: null, error };
    }

    const createdListingId = data.id;

    // Upload images if supplied
    if (imageFiles && imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        if (file) {
          await uploadListingImageFile(userId, createdListingId, file, i === 0, i);
        }
      }
    }

    const fullListing = await fetchListingById(createdListingId);
    return { listing: fullListing || mapDatabaseListing(data), error: null };
  } catch (err: unknown) {
    return {
      listing: null,
      error: err instanceof Error ? err : new Error('Failed to create listing'),
    };
  }
}

/**
 * Update an existing listing with optimistic concurrency / staleness check
 */
export async function updateListing(
  listingId: string,
  userId: string,
  dto: UpdateListingDTO,
  expectedUpdatedAt?: string
): Promise<{ listing: SeedListing | null; error: Error | null }> {
  // Validate quantity if provided
  if (dto.quantityKg !== undefined && (dto.quantityKg <= 0 || dto.quantityKg > 50000)) {
    return {
      listing: null,
      error: new Error('Quantity must be greater than 0 and cannot exceed 50,000 kg.'),
    };
  }

  // Validate price policy if provided
  if (dto.listingType === 'sale' && dto.pricePerKg !== undefined && (dto.pricePerKg === null || dto.pricePerKg <= 0)) {
    return {
      listing: null,
      error: new Error('A defined positive price per kilogram is required for sale listings.'),
    };
  }

  if (!isSupabaseConfigured()) {
    return { listing: null, error: null };
  }

  try {
    // Build update object
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) payload.title = dto.title;
    if (dto.varietyName !== undefined) payload.variety_name = dto.varietyName;
    if (dto.varietyType !== undefined) payload.variety_type = dto.varietyType;
    if (dto.seedCondition !== undefined) payload.seed_condition = dto.seedCondition;
    if (dto.listingType !== undefined) {
      payload.listing_type = dto.listingType;
      payload.price_per_kg = dto.listingType === 'exchange' ? null : dto.pricePerKg;
    } else if (dto.pricePerKg !== undefined) {
      payload.price_per_kg = dto.pricePerKg;
    }
    if (dto.quantityKg !== undefined) payload.quantity_kg = dto.quantityKg;
    if (dto.exchangeRequirements !== undefined) payload.exchange_requirements = dto.exchangeRequirements;
    if (dto.germinationRate !== undefined) payload.germination_rate_pct = dto.germinationRate;
    if (dto.harvestYear !== undefined) payload.harvest_year = dto.harvestYear;
    if (dto.province !== undefined) payload.province = dto.province;
    if (dto.district !== undefined) payload.district = dto.district;
    if (dto.tehsil !== undefined) payload.tehsil = dto.tehsil;
    if (dto.villageOrArea !== undefined) payload.village_or_area = dto.villageOrArea;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.status !== undefined) payload.status = dto.status;
    if (dto.claimedCertified !== undefined) payload.claimed_certified = dto.claimedCertified;
    if (dto.certificationDetails !== undefined) payload.certification_details = dto.certificationDetails;

    let query = supabase
      .from('listings')
      .update(payload)
      .eq('id', listingId)
      .eq('seller_id', userId);

    // Stale update prevention: match expectedUpdatedAt timestamp if provided
    if (expectedUpdatedAt) {
      query = query.eq('updated_at', expectedUpdatedAt);
    }

    const { data, error } = await query
      .select('*, crops (*), profiles:seller_id (*), listing_images (*)')
      .maybeSingle();

    if (error) {
      return { listing: null, error };
    }

    if (!data && expectedUpdatedAt) {
      return {
        listing: null,
        error: new Error('Stale update detected: This listing was modified in another session. Please refresh.'),
      };
    }

    return { listing: data ? mapDatabaseListing(data) : null, error: null };
  } catch (err: unknown) {
    return {
      listing: null,
      error: err instanceof Error ? err : new Error('Failed to update listing'),
    };
  }
}

/**
 * Change listing availability status (e.g. mark as sold, archived, or active)
 */
export async function updateListingStatus(
  listingId: string,
  userId: string,
  newStatus: ListingStatus
): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('listings')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .eq('seller_id', userId);

    return { error };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err : new Error('Failed to update listing status'),
    };
  }
}

/**
 * Archive or delete an existing listing
 */
export async function deleteListing(
  listingId: string,
  userId: string
): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('seller_id', userId);

    return { error };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err : new Error('Failed to delete listing'),
    };
  }
}
