export type CropCategory =
  | 'cereal'
  | 'pulses'
  | 'cotton'
  | 'oilseeds'
  | 'vegetables'
  | 'fodder';

export type VarietyType = 'heirloom' | 'hybrid' | 'organic';

export type PakistanProvince =
  | 'punjab'
  | 'sindh'
  | 'khyberPakhtunkhwa'
  | 'balochistan'
  | 'gilgitBaltistan'
  | 'azadKashmir';

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

export interface FarmerProfile {
  id: string;
  fullName: string;
  phone: string;
  district: string;
  province: PakistanProvince;
  farmingType: 'organic' | 'conventional' | 'seedSaver';
  verifiedKeeper: boolean;
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
