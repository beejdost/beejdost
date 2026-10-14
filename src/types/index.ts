export type CropCategory =
  | 'cereal'
  | 'pulses'
  | 'cotton'
  | 'oilseeds'
  | 'vegetables'
  | 'fodder'
  | 'fruits'
  | 'herbs';

export type VarietyType = 'heirloom' | 'hybrid' | 'opv' | 'organic' | 'desi';

export type SeedCondition = 'raw' | 'cleaned' | 'treated' | 'graded' | 'sun_dried';

export type ListingType = 'sale' | 'exchange' | 'both';

export type ListingStatus =
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'sold'
  | 'archived'
  | 'rejected'
  | 'suspended';

export type PakistanProvince =
  | 'punjab'
  | 'sindh'
  | 'khyberPakhtunkhwa'
  | 'balochistan'
  | 'gilgitBaltistan'
  | 'azadKashmir'
  | 'islamabad';

export type FarmingType = 'organic' | 'conventional' | 'seedSaver' | 'researcher';

export type PreferredLanguage = 'en' | 'ur' | 'pa';

export interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  province: PakistanProvince;
  district: string;
  tehsil?: string | null;
  village?: string | null;
  farmingType: FarmingType;
  preferredLanguage: PreferredLanguage;
  isVerifiedKeeper: boolean;
  isSuspended: boolean;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Backward compatibility alias
export type FarmerProfile = UserProfile;

export interface Crop {
  id: string;
  slug: string;
  nameEn: string;
  nameUr: string;
  namePa: string;
  category: CropCategory;
  scientificName?: string | null;
  descriptionEn?: string | null;
  descriptionUr?: string | null;
  descriptionPa?: string | null;
  isApproved: boolean;
}

export interface ListingImage {
  id: string;
  listingId: string;
  storagePath: string;
  displayOrder: number;
  isCover: boolean;
  publicUrl?: string;
}

export interface SeedListing {
  id: string;
  sellerId: string;
  cropId: string;
  title: string;
  varietyName: string;
  cropCategory: CropCategory;
  varietyType: VarietyType;
  seedCondition: SeedCondition;
  listingType: ListingType;
  quantityKg: number;
  pricePerKg: number | null; // null or 0 for pure exchange
  exchangeRequirements?: string | null;
  germinationRate?: number | null; // e.g. 92
  harvestYear: number;
  province: PakistanProvince;
  district: string;
  tehsil?: string | null;
  villageOrArea?: string | null;
  description: string;
  status: ListingStatus;
  claimedCertified: boolean;
  certificationDetails?: string | null;
  isVerifiedCertified: boolean;
  createdAt: string;
  updatedAt: string;

  // Joined/computed fields
  imageUrl?: string;
  coverImage?: string;
  images?: ListingImage[];
  sellerName?: string;
  sellerPhone?: string | null;
  isVerifiedKeeper?: boolean;
  crop?: Crop;
}

export interface ListingFilterCriteria {
  query?: string;
  cropId?: string;
  cropCategory?: CropCategory | 'all';
  varietyType?: VarietyType | 'all';
  seedCondition?: SeedCondition | 'all';
  listingType?: ListingType | 'all';
  province?: PakistanProvince | 'all';
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ListingStatus | 'all';
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'quantity_desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface ConversationThread {
  id: string;
  listingId: string;
  listingTitle: string;
  participantName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}
