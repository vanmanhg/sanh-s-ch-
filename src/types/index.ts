export type Language = 'vi' | 'en' | 'zh' | 'km' | 'ja';
export type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';

export interface Plant {
  id: string;
  name: string;
  scientificName: string;
  category: 'indoor' | 'vegetable' | 'fruit' | 'flower' | 'herb' | 'bonsai';
  imageUrl: string;
  wateringFrequencyDays: number;
  lastWatered: string; // ISO date string
  lastFertilized?: string;
  sunlight: 'full_sun' | 'partial_sun' | 'shade' | 'indirect';
  soilType: string;
  difficulty: 'easy' | 'medium' | 'hard';
  healthScore: number; // 0 - 100
  soilMoisturePercent?: number; // e.g. 32%
  minMoistureThreshold?: number; // e.g. 50%
  maxMoistureThreshold?: number; // e.g. 80%
  recommendedWaterAmount?: string; // e.g. '500ml' or '30 Lít'
  notes?: string;
  location?: string;
  createdAt: string;
  growthHistory: GrowthEntry[];
  careLogs: CareLog[];
}

export interface SmartIrrigationAlert {
  id: string;
  plantId: string;
  plantName: string;
  plantImage: string;
  soilMoisture: number;
  minThreshold: number;
  currentTemp: number;
  urgency: 'urgent' | 'warning' | 'optimal';
  reason: string;
  recommendedAction: string;
  timestamp: string;
}

export interface WeatherPestRiskAlert {
  id: string;
  plantId: string;
  plantName: string;
  plantScientificName?: string;
  plantImage: string;
  plantCategory: string;
  pestDiseaseName: string;
  pathogenType: 'Nấm' | 'Vi khuẩn' | 'Côn trùng' | 'Môi trường';
  scientificPathogen?: string;
  riskLevel: 'critical' | 'high' | 'medium';
  riskScore: number; // 0 - 100%
  weatherCondition: {
    temp: number;
    humidity: number;
    rainfallMm: number;
    windSpeedKmH: number;
    condition: string;
    description: string;
  };
  triggerReason: string;
  symptomsToWatch: string[];
  immediateAction: string;
  organicRemedies: string[];
  preventionAdvice: string[];
  timestamp: string;
}

export interface CareLog {
  id: string;
  plantId: string;
  date: string;
  type: 'water' | 'fertilize' | 'prune' | 'pest_control' | 'repot';
  notes?: string;
  amount?: string;
}

export interface GrowthEntry {
  id: string;
  plantId: string;
  date: string;
  heightCm: number;
  leafCount: number;
  healthScore: number;
  photoUrl?: string;
  notes?: string;
}

export interface WeatherForecastHour {
  time: string;
  temp: number;
  humidity: number;
  precipitationMm: number;
  windSpeedKmH: number;
  uvIndex: number;
  weatherCode: number;
  conditionLabel: string;
}

export interface WeatherAlertThresholds {
  heatThresholdC: number;
  rainThresholdMm: number;
  windThresholdKmH: number;
  coldThresholdC: number;
}

export interface WeatherCondition {
  city: string;
  temp: number;
  humidity: number;
  rainfallMm: number;
  windSpeedKmH: number;
  uvIndex: number;
  condition: 'sunny' | 'rainy' | 'storm' | 'cloudy' | 'heatwave' | 'frost';
  forecastSummary: string;
  lat?: number;
  lng?: number;
  isLive?: boolean;
  dataSource?: string;
  syncedAt?: string;
  forecast24h?: WeatherForecastHour[];
}

export interface WeatherAlert {
  id: string;
  level: 'info' | 'warning' | 'danger';
  hazardType?: 'storm' | 'heatwave' | 'frost' | 'wind' | 'fungal_humidity' | 'uv';
  title: string;
  description: string;
  affectedPlants: string;
  vulnerablePlantIds?: string[];
  recommendedAction: string;
  peakMetricLabel?: string;
  timestamp: string;
}

export type ForumCategory = 'qa' | 'seed_exchange' | 'experience' | 'showcase';

export interface ForumSeedDetails {
  seedName: string;
  quantity: string;
  deliveryMethod: 'direct' | 'post' | 'both';
  phone: string;
  location: string;
  claimedCount: number;
  maxClaims: number;
}

export interface PostComment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
  isExpert?: boolean;
  isHelpfulSolution?: boolean;
  likes?: number;
  isLiked?: boolean;
  images?: string[];
}

export interface CommunityPost {
  id: string;
  category?: ForumCategory;
  title?: string;
  author: {
    name: string;
    avatar: string;
    badge: string;
    location: string;
  };
  createdAt: string;
  content: string;
  images: string[];
  tags: string[];
  likes: number;
  isLiked?: boolean;
  isSolved?: boolean;
  seedDetails?: ForumSeedDetails;
  comments: PostComment[];
}

export interface SeedExchangeItem {
  id: string;
  title: string;
  variety: string;
  category: 'vegetable' | 'flower' | 'fruit' | 'herb';
  giverName: string;
  giverPhone: string;
  location: string;
  quantity: string;
  shippingOption: 'direct' | 'post' | 'both';
  imageUrl: string;
  description: string;
  status: 'available' | 'claimed';
  dateListed: string;
}

export interface ProductReview {
  id: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  date: string;
  content: string;
  images?: string[];
  verifiedPurchase: boolean;
  sellerReply?: string;
}

export interface MarketItem {
  id: string;
  title: string;
  category: 'plant' | 'seed' | 'produce' | 'fertilizer' | 'tool' | 'supplies';
  price: number;
  originalPrice?: number;
  unit: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerPhone: string;
  sellerZalo: string;
  sellerBadge?: string;
  sellerResponseRate?: number;
  sellerJoinYear?: number;
  location: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  secondaryImages?: string[];
  description: string;
  specifications?: Record<string, string>;
  stock: number;
  soldCount?: number;
  isOrganic?: boolean;
  shippingCarriers?: ('ghtk' | 'viettel' | 'express' | 'pickup')[];
  reviews?: ProductReview[];
}

export interface MarketOrder {
  id: string;
  createdAt: string;
  items: {
    item: MarketItem;
    quantity: number;
    selectedPrice: number;
  }[];
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  shippingCarrier: 'ghtk' | 'viettel' | 'express' | 'pickup';
  shippingFee: number;
  paymentMethod: 'cod' | 'vietqr' | 'momo' | 'vnpay';
  paymentStatus: 'pending' | 'escrow_holding' | 'paid';
  orderStatus: 'processing' | 'packing' | 'shipping' | 'delivered' | 'cancelled';
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  voucherCode?: string;
  escrowProtectionCode: string;
  trackingCode: string;
  notes?: string;
  hasReviewed?: boolean;
}

export interface CareBookingService {
  id: string;
  title: string;
  pricePerSession: number;
  unit: string;
  description: string;
  iconName: string;
  highlights: string[];
}

export interface AgriculturalExpert {
  id: string;
  name: string;
  title: string;
  organization: string;
  experienceYears: number;
  specialty: string[];
  rating: number;
  reviewsCount: number;
  avatar: string;
  phone: string;
  zalo: string;
  isOnline: boolean;
  consultationFee: string;
  responseTimeLabel?: string;
}

export interface ExpertMessageAttachment {
  type: 'image' | 'plant_report' | 'care_prescription';
  url?: string;
  plantId?: string;
  plantName?: string;
  title?: string;
  summary?: string;
  recommendations?: string[];
  suggestedCareType?: 'water' | 'fertilize' | 'prune' | 'pest_control';
}

export interface ExpertMessage {
  id: string;
  threadId: string;
  sender: 'user' | 'expert';
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isRead?: boolean;
  attachments?: ExpertMessageAttachment[];
}

export interface ExpertThread {
  id: string;
  expertId: string;
  lastMessageAt: string;
  unreadCount: number;
  status: 'active' | 'resolved';
  linkedPlantId?: string;
  messages: ExpertMessage[];
}

export interface ExpertQAAnswer {
  id: string;
  expertId: string;
  expertName: string;
  expertTitle: string;
  expertAvatar: string;
  organization: string;
  content: string;
  recommendations?: string[];
  followUpDays?: number;
  createdAt: string;
  helpfulCount: number;
  isMarkedHelpful?: boolean;
}

export interface ExpertQAQuestion {
  id: string;
  title: string;
  category: 'disease' | 'soil' | 'nutrition' | 'pruning' | 'pest' | 'general';
  plantId?: string;
  plantName?: string;
  authorName: string;
  location: string;
  createdAt: string;
  content: string;
  images?: string[];
  attachedReportSummary?: string;
  targetExpertId?: string;
  status: 'pending' | 'answered' | 'resolved';
  answers: ExpertQAAnswer[];
}

export interface AgriStation {
  id: string;
  name: string;
  type: 'supply' | 'organic_station' | 'nursery' | 'cooperative';
  address: string;
  province: string;
  lat: number;
  lng: number;
  distanceKm: number;
  phone: string;
  openingHours: string;
  rating: number;
  services: string[];
}

export interface FarmTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: 'seeds' | 'fertilizer' | 'pesticide' | 'labor' | 'irrigation' | 'harvest_sale' | 'equipment' | 'other';
  amount: number;
  cropName: string;
  description: string;
}

export interface CommodityPriceItem {
  id: string;
  name: string;
  variety: string;
  region: string;
  currentPrice: number;
  unit: string;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  history: { day: string; price: number }[];
  marketAnalysis: string;
}

export interface DiseaseEncyclopediaItem {
  id: string;
  diseaseName: string;
  cropType: string;
  pathogenType: 'Nấm' | 'Vi khuẩn' | 'Virus' | 'Côn trùng' | 'Thiếu chất';
  severity: 'Nhẹ' | 'Trung bình' | 'Nghiêm trọng';
  imageUrl: string;
  symptoms: string[];
  organicSolution: string[];
  chemicalSolution: string[];
  prevention: string[];
}

export interface VideoGuideItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl?: string;
  summary: string;
  steps: string[];
}
