export type CropCategory =
  | 'cereal'
  | 'pulses'
  | 'cotton'
  | 'oilseeds'
  | 'vegetables'
  | 'fodder';

export type VarietyType = 'heirloom' | 'hybrid' | 'opv' | 'organic' | 'desi';

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

export interface SeedListing {
  id: string;
  varietyName: string;
  cropCategory: CropCategory;
  varietyType: VarietyType;
  province: PakistanProvince;
  district: string;
  sellerId: string;
  sellerName: string;
  quantityKg: number;
  pricePerKg: number; // 0 indicates free barter/exchange
  germinationRate: number; // Percentage, e.g. 88
  harvestYear: number;
  description: string;
  createdAt: string;
  imageUrl?: string;
  isVerifiedKeeper?: boolean;
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
