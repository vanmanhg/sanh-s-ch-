import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Plant,
  GrowthEntry,
  CareLog,
  CommunityPost,
  SeedExchangeItem,
  MarketItem,
  WeatherCondition,
  WeatherAlert,
  FarmTransaction,
  Language,
  ThemeMode,
  ThemePreference,
  SmartIrrigationAlert,
  WeatherPestRiskAlert,
  ProductReview,
  MarketOrder,
  ExpertThread,
  ExpertMessage,
  ExpertMessageAttachment,
  ExpertQAQuestion,
  AgriculturalExpert,
  WeatherAlertThresholds
} from '../types';
import { evaluateWeatherPestRisks } from '../utils/weatherPestAdvisor';
import {
  isPestPushEnabled as checkPestPushEnabled,
  setPestPushEnabled,
  isWeatherPushEnabled as checkWeatherPushEnabled,
  setWeatherPushEnabled,
  getPushNotificationPermission,
  requestPushNotificationPermission,
  sendBatchPestRiskSummary,
  sendPestRiskNotification,
  sendExtremeWeatherNotification,
  sendBatchExtremeWeatherNotification,
  sendDailyWateringReminderNotification
} from '../utils/pushNotificationService';
import { useFirebaseAuth } from './FirebaseAuthContext';
import {
  DEFAULT_WEATHER_THRESHOLDS,
  sanitizeWeatherThresholds,
  saveWeatherPreferences,
  subscribeWeatherPreferences
} from '../lib/firebaseWeatherAlerts';
import {
  getUserDisplayPreferences,
  saveUserThemePreference,
  saveUserLanguagePreference
} from '../lib/firebaseTheme';
import {
  INITIAL_PLANTS,
  INITIAL_POSTS,
  SEED_EXCHANGE_ITEMS,
  MARKET_ITEMS,
  INITIAL_ORDERS,
  CURRENT_WEATHER,
  WEATHER_ALERTS,
  INITIAL_TRANSACTIONS,
  AGRI_EXPERTS,
  INITIAL_EXPERT_THREADS,
  INITIAL_EXPERT_QA
} from '../data/mockData';
import { translations } from '../utils/i18n';
import {
  initializeOfflineCache,
  refreshOfflineCache,
  getBookmarkedDiseaseIds,
  toggleBookmarkDisease as toggleBookmarkUtil,
  precacheOfflineMedia,
  CacheMetadata
} from '../utils/offlineCache';

interface AppContextType {
  // Theme & Language & Voice
  theme: ThemeMode;
  themePreference: ThemePreference;
  setTheme: (mode: ThemeMode) => void;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.vi) => string;
  autoSpeak: boolean;
  toggleAutoSpeak: () => void;
  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => void;
  isOffline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  cacheMetadata: CacheMetadata;
  syncCache: () => void;
  bookmarkedDiseases: string[];
  toggleBookmarkDisease: (id: string) => void;

  // Plants
  plants: Plant[];
  addPlant: (plant: Omit<Plant, 'id' | 'createdAt' | 'careLogs' | 'growthHistory'> & { growthHistory?: GrowthEntry[] }) => Plant;
  updatePlant: (plant: Plant) => void;
  deletePlant: (id: string) => void;
  waterPlant: (id: string, notes?: string) => void;
  fertilizePlant: (id: string, notes?: string) => void;
  addGrowthEntry: (plantId: string, entry: Omit<GrowthEntry, 'id' | 'plantId'>) => void;
  addCareLog: (plantId: string, log: Omit<CareLog, 'id' | 'plantId'>) => void;
  updateSoilMoisture: (plantId: string, moisturePercent: number) => void;
  smartIrrigationAlerts: SmartIrrigationAlert[];
  triggerMoistureNotificationCheck: (manual?: boolean) => void;

  // Weather-based Pest & Disease Early Warnings (Push Notifications)
  weatherPestAlerts: WeatherPestRiskAlert[];
  isPestPushEnabled: boolean;
  togglePestPushNotifications: () => void;
  pushNotificationPermission: NotificationPermission;
  requestPushPermission: () => Promise<boolean>;
  triggerPestPushCheck: (manual?: boolean) => Promise<boolean>;

  // Community & Seeds
  posts: CommunityPost[];
  addPost: (post: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'comments'>) => void;
  likePost: (id: string) => void;
  togglePostSolved: (id: string) => void;
  claimPostSeed: (postId: string) => boolean;
  addComment: (
    postId: string,
    content: string,
    authorName?: string,
    options?: { isExpert?: boolean; isHelpfulSolution?: boolean; images?: string[] }
  ) => void;
  toggleCommentSolution: (postId: string, commentId: string) => void;
  likeComment: (postId: string, commentId: string) => void;
  seedItems: SeedExchangeItem[];
  addSeedItem: (item: Omit<SeedExchangeItem, 'id' | 'status' | 'dateListed'>) => void;
  claimSeedItem: (id: string) => void;

  // Market & Cart & E-Commerce
  marketItems: MarketItem[];
  addMarketItem: (item: Omit<MarketItem, 'id' | 'rating' | 'reviewsCount' | 'soldCount'>) => void;
  cart: { item: MarketItem; quantity: number }[];
  addToCart: (item: MarketItem, quantity?: number) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  marketOrders: MarketOrder[];
  placeMarketOrder: (orderData: Omit<MarketOrder, 'id' | 'createdAt' | 'trackingCode' | 'escrowProtectionCode'>) => MarketOrder;
  updateOrderStatus: (orderId: string, status: MarketOrder['orderStatus']) => void;
  addProductReview: (itemId: string, review: Omit<ProductReview, 'id' | 'date'>) => void;

  // Finance
  transactions: FarmTransaction[];
  addTransaction: (tx: Omit<FarmTransaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;

  // Weather & Extreme Hazard Push System
  weather: WeatherCondition;
  setWeatherCity: (city: string) => void;
  weatherAlerts: WeatherAlert[];
  dismissAlert: (id: string) => void;
  liveCropRecommendations: Array<{
    crop: string;
    season: string;
    growthDays: string;
    difficulty: string;
    tip: string;
  }>;
  weatherAlertThresholds: WeatherAlertThresholds;
  updateWeatherAlertThresholds: (next: Partial<WeatherAlertThresholds>) => Promise<void>;
  weatherPushEnabled: boolean;
  toggleWeatherPushEnabled: () => Promise<void>;
  isWeatherLoading: boolean;
  lastWeatherSyncAt: string | null;
  weatherError: string | null;
  activeWeatherPreset: 'live' | 'storm' | 'heatwave' | 'frost';
  refreshLiveWeather: (coords?: { lat: number; lng: number; city?: string }) => Promise<void>;
  triggerExtremeWeatherPushCheck: (manual?: boolean) => Promise<boolean>;
  simulateExtremeWeather: (preset: 'storm' | 'heatwave' | 'frost' | 'live') => Promise<void>;

  // Daily Watering Reminder Scheduler & In-App Direct Notifications
  dailyWateringReminder: {
    enabled: boolean;
    time: string;
    lastTriggeredDate: string | null;
  };
  updateDailyWateringReminder: (next: { enabled?: boolean; time?: string }) => void;
  plantsDueForWatering: Plant[];
  triggerDailyWateringNotification: (manual?: boolean) => Promise<boolean>;
  inAppToast: {
    id: string;
    level: 'info' | 'warning' | 'danger' | 'success';
    title: string;
    body: string;
  } | null;
  dismissToast: () => void;

  // Farm Location
  farmLocation: { name: string; address: string; lat: number; lng: number };
  setFarmLocation: (loc: { name: string; address: string; lat: number; lng: number }) => void;

  // Agricultural Experts Direct Messaging & Personalized Q&A
  expertThreads: ExpertThread[];
  unreadExpertCount: number;
  sendingExpertId: string | null;
  sendExpertMessage: (
    expertId: string,
    content: string,
    options?: { imageUrl?: string; plant?: Plant }
  ) => Promise<void>;
  markExpertThreadRead: (expertId: string) => void;
  toggleExpertThreadResolved: (expertId: string) => void;
  expertQAQuestions: ExpertQAQuestion[];
  isSubmittingQA: boolean;
  createExpertQAQuestion: (payload: {
    title: string;
    category: ExpertQAQuestion['category'];
    content: string;
    targetExpertId?: string;
    plant?: Plant;
    images?: string[];
  }) => Promise<ExpertQAQuestion>;
  addQAFollowUp: (questionId: string, content: string) => Promise<void>;
  toggleQAHelpful: (questionId: string, answerId: string) => void;
  toggleQAResolved: (questionId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CITY_COORDS_MAP: Record<string, { lat: number; lng: number }> = {
  'Đồng Bằng Sông Cửu Long / TP.HCM': { lat: 10.8231, lng: 106.6297 },
  'Hà Nội & Miền Bắc': { lat: 21.0285, lng: 105.8542 },
  'Đà Lạt & Tây Nguyên': { lat: 11.9404, lng: 108.4583 },
  'Cần Thơ & Miền Tây': { lat: 10.0452, lng: 105.7469 },
  'Đà Nẵng & Miền Trung': { lat: 16.0544, lng: 108.2022 },
};

const DEFAULT_CROP_RECOMMENDATIONS = [
  {
    crop: 'Rau Muống & Mồng Tơi Nước',
    season: 'Mùa mưa ẩm ấm',
    growthDays: '25 - 30 ngày',
    difficulty: 'Cực kỳ dễ',
    tip: 'Chịu ẩm tốt, phát triển nhanh trong điều kiện nhiệt độ 28-32°C và mưa rải rác.'
  },
  {
    crop: 'Cà Chua Bi Chịu Nhiệt',
    season: 'Nắng ấm',
    growthDays: '65 - 75 ngày',
    difficulty: 'Trung bình',
    tip: 'Cần che bạt phần gốc tránh mưa dập hoa, thụ phấn tốt khi ban ngày có nắng nhẹ.'
  },
  {
    crop: 'Cải Kale & Xà Lách Đà Lạt',
    season: 'Mát mẻ ẩm độ cao',
    growthDays: '40 - 50 ngày',
    difficulty: 'Dễ',
    tip: 'Thích hợp với thời tiết se lạnh 18-24°C, lá giòn ngọt không bị đắng.'
  },
  {
    crop: 'Dưa Leo Gai Baby F1',
    season: 'Nắng ấm thoát nước tốt',
    growthDays: '35 - 40 ngày',
    difficulty: 'Dễ',
    tip: 'Leo giàn nhanh, cần lượng nước tưới đều đặn và giàn đỡ thông thoáng.'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authReady } = useFirebaseAuth();

  // Theme state (persisted in localStorage + optional Firestore profile, with system dark-mode fallback)
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    try {
      const saved = localStorage.getItem('nongtro_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'system';
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
    } catch {
      return false;
    }
  });

  const theme: ThemeMode = themePreference === 'system' ? (systemDark ? 'dark' : 'light') : themePreference;
  const hasUserToggledThemeRef = React.useRef(false);

  // Language state (up to 5 supported languages: vi, en, zh, km, ja)
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('nongtro_lang') as Language;
      if (saved === 'en' || saved === 'zh' || saved === 'km' || saved === 'ja' || saved === 'vi') return saved;
    } catch {}
    return 'vi';
  });
  const hasUserSelectedLanguageRef = React.useRef(false);

  // Voice Assistance Settings
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    return localStorage.getItem('nongtro_autospeak') === 'true';
  });
  const [voiceSpeed, setVoiceSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('nongtro_voicespeed');
    return saved ? parseFloat(saved) : 1.0;
  });

  const toggleAutoSpeak = () => {
    setAutoSpeak(prev => {
      const next = !prev;
      localStorage.setItem('nongtro_autospeak', String(next));
      return next;
    });
  };

  const handleSetVoiceSpeed = (speed: number) => {
    setVoiceSpeed(speed);
    localStorage.setItem('nongtro_voicespeed', String(speed));
  };

  // Offline detection and Simulation
  const [networkOffline, setNetworkOffline] = useState<boolean>(!navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const isOffline = networkOffline || isSimulatedOffline;

  // Offline Cache Metadata & Bookmarks
  const [cacheMetadata, setCacheMetadata] = useState<CacheMetadata>(() => initializeOfflineCache());
  const [bookmarkedDiseases, setBookmarkedDiseases] = useState<string[]>(() => getBookmarkedDiseaseIds());

  useEffect(() => {
    const handleOnline = () => setNetworkOffline(false);
    const handleOffline = () => setNetworkOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Warm up offline image media cache in background
    precacheOfflineMedia().catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline(prev => !prev);
  };

  const syncCache = () => {
    const updated = refreshOfflineCache();
    setCacheMetadata(updated);
    precacheOfflineMedia().catch(() => {});
  };

  const toggleBookmarkDisease = (id: string) => {
    const updated = toggleBookmarkUtil(id);
    setBookmarkedDiseases(updated);
  };

  // Listen to OS color-scheme changes when themePreference === 'system'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    setSystemDark(mq.matches);
    mq.addEventListener?.('change', handleChange);
    return () => mq.removeEventListener?.('change', handleChange);
  }, []);

  useEffect(() => {
    try {
      if (themePreference === 'system') {
        localStorage.removeItem('nongtro_theme');
      } else {
        localStorage.setItem('nongtro_theme', themePreference);
      }
    } catch {}
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', theme === 'dark' ? '#09090b' : '#059669');
    }
  }, [theme, themePreference]);

  // Cross-tab persistence for theme and language changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nongtro_theme') {
        if (e.newValue === 'light' || e.newValue === 'dark') {
          setThemePreferenceState(e.newValue);
        } else if (e.newValue === null) {
          setThemePreferenceState('system');
        }
      }
      if (
        e.key === 'nongtro_lang' &&
        (e.newValue === 'vi' || e.newValue === 'en' || e.newValue === 'zh' || e.newValue === 'km' || e.newValue === 'ja')
      ) {
        setLanguageState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Hydrate theme & language preferences from Firestore profile when authenticated
  useEffect(() => {
    if (!authReady || !user) return;
    let cancelled = false;
    getUserDisplayPreferences(user.uid)
      .then(prefs => {
        if (cancelled) return;
        if (prefs.theme && !hasUserToggledThemeRef.current) {
          setThemePreferenceState(prefs.theme);
        }
        if (prefs.language && !hasUserSelectedLanguageRef.current) {
          setLanguageState(prefs.language);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  useEffect(() => {
    try {
      localStorage.setItem('nongtro_lang', language);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (nextLang: Language) => {
    hasUserSelectedLanguageRef.current = true;
    setLanguageState(nextLang);
    try {
      localStorage.setItem('nongtro_lang', nextLang);
    } catch {}
    if (user) {
      saveUserLanguagePreference(user, nextLang).catch(() => {});
    }
  };

  const setTheme = (nextMode: ThemeMode) => {
    hasUserToggledThemeRef.current = true;
    setThemePreferenceState(nextMode);
    try {
      localStorage.setItem('nongtro_theme', nextMode);
    } catch {}
    if (user) {
      saveUserThemePreference(user, nextMode).catch(() => {});
    }
  };

  const setThemePreference = (nextPref: ThemePreference) => {
    hasUserToggledThemeRef.current = true;
    setThemePreferenceState(nextPref);
    try {
      if (nextPref === 'system') {
        localStorage.removeItem('nongtro_theme');
      } else {
        localStorage.setItem('nongtro_theme', nextPref);
      }
    } catch {}
    if (user) {
      const resolved: ThemeMode = nextPref === 'system' ? (systemDark ? 'dark' : 'light') : nextPref;
      saveUserThemePreference(user, resolved).catch(() => {});
    }
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(nextMode);
  };

  const t = (key: keyof typeof translations.vi): string => {
    const langDict = translations[language] || translations.vi;
    return langDict[key] || translations.vi[key] || (key as string);
  };

  // Plants state
  const [plants, setPlants] = useState<Plant[]>(() => {
    try {
      const saved = localStorage.getItem('nongtro_plants');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PLANTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('nongtro_plants', JSON.stringify(plants));
    } catch (e) {
      console.error(e);
    }
  }, [plants]);

  const addPlant = (newPlantData: Omit<Plant, 'id' | 'createdAt' | 'careLogs' | 'growthHistory'> & { growthHistory?: GrowthEntry[] }): Plant => {
    const newPlant: Plant = {
      ...newPlantData,
      id: `plant-${Date.now()}`,
      createdAt: new Date().toISOString(),
      careLogs: [
        {
          id: `cl-${Date.now()}`,
          plantId: `plant-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'water',
          notes: 'Tưới cây lần đầu sau khi thêm vào vườn'
        }
      ],
      growthHistory: newPlantData.growthHistory || [
        {
          id: `g-${Date.now()}`,
          plantId: `plant-${Date.now()}`,
          date: new Date().toISOString(),
          heightCm: 15,
          leafCount: 6,
          healthScore: newPlantData.healthScore || 90,
          notes: 'Khởi tạo hồ sơ theo dõi sinh trưởng'
        }
      ]
    };
    setPlants(prev => [newPlant, ...prev]);
    return newPlant;
  };

  const updatePlant = (updated: Plant) => {
    setPlants(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const deletePlant = (id: string) => {
    setPlants(prev => prev.filter(p => p.id !== id));
  };

  const waterPlant = (id: string, notes?: string) => {
    const now = new Date().toISOString();
    setPlants(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const newLog: CareLog = {
          id: `cl-${Date.now()}`,
          plantId: id,
          date: now,
          type: 'water',
          amount: p.recommendedWaterAmount || '500ml',
          notes: notes || 'Tưới nước đều vào gốc'
        };
        return {
          ...p,
          lastWatered: now,
          soilMoisturePercent: Math.min(85, Math.max(70, p.maxMoistureThreshold || 75)),
          healthScore: Math.min(100, (p.healthScore || 85) + 2),
          careLogs: [newLog, ...(p.careLogs || [])]
        };
      })
    );
  };

  const updateSoilMoisture = (plantId: string, moisturePercent: number) => {
    setPlants(prev =>
      prev.map(p => {
        if (p.id !== plantId) return p;
        return {
          ...p,
          soilMoisturePercent: Math.max(0, Math.min(100, moisturePercent))
        };
      })
    );
  };

  const fertilizePlant = (id: string, notes?: string) => {
    const now = new Date().toISOString();
    setPlants(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const newLog: CareLog = {
          id: `cl-${Date.now()}`,
          plantId: id,
          date: now,
          type: 'fertilize',
          notes: notes || 'Bón phân hữu cơ vi sinh'
        };
        return {
          ...p,
          lastFertilized: now,
          healthScore: Math.min(100, (p.healthScore || 85) + 4),
          careLogs: [newLog, ...(p.careLogs || [])]
        };
      })
    );
  };

  const addGrowthEntry = (plantId: string, entry: Omit<GrowthEntry, 'id' | 'plantId'>) => {
    setPlants(prev =>
      prev.map(p => {
        if (p.id !== plantId) return p;
        const newEntry: GrowthEntry = {
          ...entry,
          id: `g-${Date.now()}`,
          plantId
        };
        return {
          ...p,
          healthScore: entry.healthScore,
          growthHistory: [...(p.growthHistory || []), newEntry]
        };
      })
    );
  };

  const addCareLog = (plantId: string, log: Omit<CareLog, 'id' | 'plantId'>) => {
    setPlants(prev =>
      prev.map(p => {
        if (p.id !== plantId) return p;
        const newLog: CareLog = {
          ...log,
          id: `cl-${Date.now()}`,
          plantId
        };
        return {
          ...p,
          careLogs: [newLog, ...(p.careLogs || [])]
        };
      })
    );
  };

  // Community Posts
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    try {
      const saved = localStorage.getItem('nongtro_posts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_POSTS;
  });

  useEffect(() => {
    localStorage.setItem('nongtro_posts', JSON.stringify(posts));
  }, [posts]);

  const addPost = (newPostData: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
    const newPost: CommunityPost = {
      ...newPostData,
      id: `post-${Date.now()}`,
      createdAt: 'Vừa xong',
      likes: 1,
      isLiked: true,
      comments: []
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const likePost = (id: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const isLiked = !p.isLiked;
        return {
          ...p,
          isLiked,
          likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1)
        };
      })
    );
  };

  const togglePostSolved = (id: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          isSolved: !p.isSolved
        };
      })
    );
  };

  const claimPostSeed = (postId: string): boolean => {
    let success = false;
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId || !p.seedDetails) return p;
        if (p.seedDetails.claimedCount >= p.seedDetails.maxClaims) return p;
        success = true;
        return {
          ...p,
          seedDetails: {
            ...p.seedDetails,
            claimedCount: p.seedDetails.claimedCount + 1
          }
        };
      })
    );
    return success;
  };

  const addComment = (
    postId: string,
    content: string,
    authorName: string = 'Tôi (Nhà nông)',
    options?: { isExpert?: boolean; isHelpfulSolution?: boolean; images?: string[] }
  ) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const newC = {
          id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          author: authorName,
          avatar: options?.isExpert
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          content,
          createdAt: 'Vừa xong',
          isExpert: options?.isExpert || false,
          isHelpfulSolution: options?.isHelpfulSolution || false,
          likes: 0,
          isLiked: false,
          images: options?.images || []
        };
        return {
          ...p,
          comments: [...p.comments, newC]
        };
      })
    );
  };

  const toggleCommentSolution = (postId: string, commentId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const updatedComments = p.comments.map(c => {
          if (c.id === commentId) {
            return { ...c, isHelpfulSolution: !c.isHelpfulSolution };
          }
          return c;
        });
        const hasSolvedComment = updatedComments.some(c => c.isHelpfulSolution);
        return {
          ...p,
          isSolved: hasSolvedComment,
          comments: updatedComments
        };
      })
    );
  };

  const likeComment = (postId: string, commentId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: p.comments.map(c => {
            if (c.id !== commentId) return c;
            const isLiked = !c.isLiked;
            return {
              ...c,
              isLiked,
              likes: isLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 0) - 1)
            };
          })
        };
      })
    );
  };

  // Seed Items
  const [seedItems, setSeedItems] = useState<SeedExchangeItem[]>(() => {
    try {
      const saved = localStorage.getItem('nongtro_seeds');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return SEED_EXCHANGE_ITEMS;
  });

  useEffect(() => {
    localStorage.setItem('nongtro_seeds', JSON.stringify(seedItems));
  }, [seedItems]);

  const addSeedItem = (itemData: Omit<SeedExchangeItem, 'id' | 'status' | 'dateListed'>) => {
    const newItem: SeedExchangeItem = {
      ...itemData,
      id: `seed-${Date.now()}`,
      status: 'available',
      dateListed: 'Vừa đăng'
    };
    setSeedItems(prev => [newItem, ...prev]);
  };

  const claimSeedItem = (id: string) => {
    setSeedItems(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'claimed' } : s))
    );
  };

  // Market & Cart & E-Commerce
  const [marketItems, setMarketItems] = useState<MarketItem[]>(() => {
    try {
      const saved = localStorage.getItem('nongtro_market_items');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return MARKET_ITEMS;
  });

  useEffect(() => {
    localStorage.setItem('nongtro_market_items', JSON.stringify(marketItems));
  }, [marketItems]);

  const addMarketItem = (newItemData: Omit<MarketItem, 'id' | 'rating' | 'reviewsCount' | 'soldCount'>) => {
    const newItem: MarketItem = {
      ...newItemData,
      id: `prod-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 0,
      soldCount: 0,
      reviews: []
    };
    setMarketItems(prev => [newItem, ...prev]);
  };

  const [cart, setCart] = useState<{ item: MarketItem; quantity: number }[]>(() => {
    try {
      const saved = localStorage.getItem('nongtro_cart');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('nongtro_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: MarketItem, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => (c.item.id === item.id ? { ...c, quantity: c.quantity + quantity } : c));
      }
      return [...prev, { item, quantity }];
    });
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(c => (c.item.id === itemId ? { ...c, quantity } : c)));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const clearCart = () => setCart([]);

  // Market Orders state with localStorage
  const [marketOrders, setMarketOrders] = useState<MarketOrder[]>(() => {
    try {
      const saved = localStorage.getItem('nongtro_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ORDERS;
  });

  useEffect(() => {
    localStorage.setItem('nongtro_orders', JSON.stringify(marketOrders));
  }, [marketOrders]);

  const placeMarketOrder = (orderData: Omit<MarketOrder, 'id' | 'createdAt' | 'trackingCode' | 'escrowProtectionCode'>): MarketOrder => {
    const prefix = orderData.shippingCarrier.toUpperCase();
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newOrder: MarketOrder = {
      ...orderData,
      id: `ORD-${new Date().getFullYear()}-${randomId}`,
      createdAt: dateStr,
      trackingCode: `${prefix}-VN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      escrowProtectionCode: `ESCROW-${randomId}-SAFE`
    };

    setMarketOrders(prev => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: MarketOrder['orderStatus']) => {
    setMarketOrders(prev =>
      prev.map(ord => (ord.id === orderId ? { ...ord, orderStatus: status } : ord))
    );
  };

  const addProductReview = (itemId: string, review: Omit<ProductReview, 'id' | 'date'>) => {
    const newRev: ProductReview = {
      ...review,
      id: `rev-${Date.now()}`,
      date: new Date().toLocaleDateString('vi-VN')
    };

    setMarketItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        const currentReviews = item.reviews || [];
        const updatedReviews = [newRev, ...currentReviews];
        const totalStars = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = parseFloat((totalStars / updatedReviews.length).toFixed(1));
        return {
          ...item,
          reviews: updatedReviews,
          reviewsCount: updatedReviews.length,
          rating: avgRating
        };
      })
    );
  };

  // Farm Transactions & Financials
  const [transactions, setTransactions] = useState<FarmTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('nongtro_txs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    localStorage.setItem('nongtro_txs', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (tx: Omit<FarmTransaction, 'id'>) => {
    const newTx: FarmTransaction = {
      ...tx,
      id: `tx-${Date.now()}`
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Farm Location (defined before weather so live weather uses coordinates)
  const [farmLocation, setFarmLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('nongtro_loc');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      name: 'Vườn Nhà Xanh - Khu Vực Canh Tác Hóc Môn',
      address: 'Đường Song Hành, Huyện Hóc Môn, TP. Hồ Chí Minh',
      lat: 10.8872,
      lng: 106.5921
    };
  });

  // Real-time Weather & Extreme Hazard Monitoring
  const [weather, setWeather] = useState<WeatherCondition>(CURRENT_WEATHER);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>(WEATHER_ALERTS);
  const [liveCropRecommendations, setLiveCropRecommendations] = useState(DEFAULT_CROP_RECOMMENDATIONS);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [lastWeatherSyncAt, setLastWeatherSyncAt] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [activeWeatherPreset, setActiveWeatherPreset] = useState<'live' | 'storm' | 'heatwave' | 'frost'>('live');
  const [weatherPushEnabledState, setWeatherPushEnabledState] = useState<boolean>(() => checkWeatherPushEnabled());
  const [weatherAlertThresholds, setWeatherAlertThresholds] = useState<WeatherAlertThresholds>(() => {
    try {
      const saved = localStorage.getItem('nongtro_weather_thresholds');
      if (saved) return sanitizeWeatherThresholds(JSON.parse(saved));
    } catch {}
    return DEFAULT_WEATHER_THRESHOLDS;
  });

  // Persist thresholds locally
  useEffect(() => {
    try {
      localStorage.setItem('nongtro_weather_thresholds', JSON.stringify(weatherAlertThresholds));
    } catch {}
  }, [weatherAlertThresholds]);

  // Sync weather preferences with Firebase Firestore when authenticated
  useEffect(() => {
    if (!authReady || !user) return;
    const unsub = subscribeWeatherPreferences(
      user.uid,
      pref => {
        if (!pref) return;
        setWeatherAlertThresholds({
          heatThresholdC: pref.heatThresholdC,
          rainThresholdMm: pref.rainThresholdMm,
          windThresholdKmH: pref.windThresholdKmH,
          coldThresholdC: pref.coldThresholdC,
        });
        setWeatherPushEnabledState(pref.autoPushEnabled);
        setWeatherPushEnabled(pref.autoPushEnabled);
      },
      err => {
        console.warn('Weather preferences Firestore sync warning:', err.message);
      }
    );
    return () => unsub();
  }, [authReady, user]);

  const refreshLiveWeather = async (coords?: { lat: number; lng: number; city?: string }) => {
    const targetCity = coords?.city || weather.city;
    const mappedCoords = CITY_COORDS_MAP[targetCity];
    const targetLat = coords?.lat ?? mappedCoords?.lat ?? farmLocation.lat ?? 10.8872;
    const targetLng = coords?.lng ?? mappedCoords?.lng ?? farmLocation.lng ?? 106.5921;

    if (isOffline) {
      setWeatherError('Đang ở chế độ ngoại tuyến — hiển thị dữ liệu gần nhất.');
      return;
    }

    setIsWeatherLoading(true);
    setWeatherError(null);
    setActiveWeatherPreset('live');

    try {
      const response = await fetch('/api/weather/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: targetLat,
          lng: targetLng,
          city: targetCity,
          thresholds: weatherAlertThresholds,
          plants: plants.map(p => ({ id: p.id, name: p.name, category: p.category })),
        }),
      });
      if (!response.ok) throw new Error('Không thể lấy dữ liệu thời tiết thực tế.');
      const data = await response.json();
      if (data?.weather) {
        setWeather(data.weather);
      }
      if (Array.isArray(data?.alerts)) {
        setWeatherAlerts(data.alerts);
      }
      if (Array.isArray(data?.recommendedCrops) && data.recommendedCrops.length > 0) {
        setLiveCropRecommendations(data.recommendedCrops);
      }
      setLastWeatherSyncAt(data?.syncedAt || new Date().toISOString());
    } catch (err: any) {
      setWeatherError(err?.message || 'Không thể kết nối trạm thời tiết lúc này.');
    } finally {
      setIsWeatherLoading(false);
    }
  };

  // Auto-sync live weather on startup and every 10 minutes
  useEffect(() => {
    if (isOffline || activeWeatherPreset !== 'live') return;
    refreshLiveWeather();
    const interval = window.setInterval(() => {
      refreshLiveWeather();
    }, 10 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [isOffline, weather.city, weatherAlertThresholds.heatThresholdC, weatherAlertThresholds.rainThresholdMm, weatherAlertThresholds.windThresholdKmH, weatherAlertThresholds.coldThresholdC]);

  const setWeatherCity = (city: string) => {
    const coords = CITY_COORDS_MAP[city] || { lat: farmLocation.lat, lng: farmLocation.lng };
    setWeather(prev => ({ ...prev, city, lat: coords.lat, lng: coords.lng }));
    setActiveWeatherPreset('live');
    if (user) {
      saveWeatherPreferences(user, {
        autoPushEnabled: weatherPushEnabledState,
        ...weatherAlertThresholds,
        city,
        lat: coords.lat,
        lng: coords.lng,
      }).catch(() => {});
    }
  };

  const updateWeatherAlertThresholds = async (next: Partial<WeatherAlertThresholds>) => {
    const merged = sanitizeWeatherThresholds({ ...weatherAlertThresholds, ...next });
    setWeatherAlertThresholds(merged);
    if (user) {
      await saveWeatherPreferences(user, {
        autoPushEnabled: weatherPushEnabledState,
        ...merged,
        city: weather.city,
        lat: weather.lat ?? farmLocation.lat,
        lng: weather.lng ?? farmLocation.lng,
      });
    }
  };

  const toggleWeatherPushEnabled = async () => {
    const next = !weatherPushEnabledState;
    setWeatherPushEnabledState(next);
    setWeatherPushEnabled(next);
    if (next) {
      await requestPushPermission();
    }
    if (user) {
      await saveWeatherPreferences(user, {
        autoPushEnabled: next,
        ...weatherAlertThresholds,
        city: weather.city,
        lat: weather.lat ?? farmLocation.lat,
        lng: weather.lng ?? farmLocation.lng,
      });
    }
  };

  const triggerExtremeWeatherPushCheck = async (manual: boolean = false): Promise<boolean> => {
    const sent = await sendBatchExtremeWeatherNotification(weatherAlerts, weather, { force: manual });
    const topAlert = weatherAlerts.find(a => a.level === 'danger') || weatherAlerts[0];
    if (manual && topAlert) {
      pushInAppToast({
        level: topAlert.level === 'danger' ? 'danger' : 'warning',
        title: topAlert.title,
        body: `${topAlert.recommendedAction} (${weather.city.split('/')[0].trim()} · ${weather.temp}°C)`
      });
    }
    return sent;
  };

  const simulateExtremeWeather = async (preset: 'storm' | 'heatwave' | 'frost' | 'live') => {
    if (preset === 'live') {
      await refreshLiveWeather();
      return;
    }

    setActiveWeatherPreset(preset);
    const nowTimeLabel = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const plantNames = plants.slice(0, 4).map(p => p.name).join(', ') || 'Rau ăn lá, cây ăn trái, chậu ban công';
    const plantIds = plants.slice(0, 4).map(p => p.id);

    if (preset === 'storm') {
      const simWeather: WeatherCondition = {
        ...weather,
        temp: 25,
        humidity: 94,
        rainfallMm: 48,
        windSpeedKmH: 58,
        uvIndex: 2,
        condition: 'storm',
        isLive: false,
        dataSource: 'Kịch bản mô phỏng Bão & Mưa Lớn',
        syncedAt: new Date().toISOString(),
        forecastSummary: 'Cảnh báo khẩn cấp: Mưa dông kéo dài kèm gió giật 58 km/h trong 6 giờ tới, nguy cơ ngập úng cục bộ rất cao.',
      };
      const simAlert: WeatherAlert = {
        id: 'sim-hazard-storm',
        level: 'danger',
        hazardType: 'storm',
        title: 'KHẨN CẤP: Bão Mưa Lớn 48mm & Gió Giật 58 km/h',
        description: 'Mưa xối xả kết hợp gió giật mạnh dễ làm gãy cành, đổ ngã chậu cao và ngập úng rễ cây trong 2 giờ tới.',
        affectedPlants: plantNames,
        vulnerablePlantIds: plantIds,
        recommendedAction: 'Chuyển ngay chậu nhỏ vào mái hiên, khơi thông rãnh thoát nước, cắm cọc gia cố giàn leo và ngưng tưới nước.',
        peakMetricLabel: 'Mưa 48mm · Gió 58 km/h',
        timestamp: `Mô phỏng ${nowTimeLabel}`,
      };
      setWeather(simWeather);
      setWeatherAlerts([simAlert]);
      pushInAppToast({ level: 'danger', title: simAlert.title, body: simAlert.recommendedAction });
      await sendExtremeWeatherNotification(simAlert, simWeather, { force: true });
      return;
    }

    if (preset === 'heatwave') {
      const simWeather: WeatherCondition = {
        ...weather,
        temp: 39,
        humidity: 38,
        rainfallMm: 0,
        windSpeedKmH: 14,
        uvIndex: 11.2,
        condition: 'heatwave',
        isLive: false,
        dataSource: 'Kịch bản mô phỏng Nắng Nóng 39°C',
        syncedAt: new Date().toISOString(),
        forecastSummary: 'Cảnh báo nắng nóng gay gắt 39°C, chỉ số UV 11.2 cực đại từ 10h đến 16h khiến đất bốc hơi cực nhanh.',
      };
      const simAlert: WeatherAlert = {
        id: 'sim-hazard-heatwave',
        level: 'danger',
        hazardType: 'heatwave',
        title: 'KHẨN CẤP: Nắng Nóng Cực Đoan 39°C & Chỉ Số UV 11.2',
        description: 'Nhiệt độ vượt ngưỡng an toàn làm cháy mép lá, héo rũ đột ngột và sốc nhiệt bộ rễ cây trồng chậu.',
        affectedPlants: plantNames,
        vulnerablePlantIds: plantIds,
        recommendedAction: 'Căng lưới đen giảm nắng 60%, phủ lớp xơ dừa/rơm ẩm lên mặt chậu, tưới bổ sung vào lúc 6h sáng và 17h30 chiều.',
        peakMetricLabel: 'Nhiệt độ 39°C · UV 11.2',
        timestamp: `Mô phỏng ${nowTimeLabel}`,
      };
      setWeather(simWeather);
      setWeatherAlerts([simAlert]);
      pushInAppToast({ level: 'danger', title: simAlert.title, body: simAlert.recommendedAction });
      await sendExtremeWeatherNotification(simAlert, simWeather, { force: true });
      return;
    }

    const simWeather: WeatherCondition = {
      ...weather,
      temp: 9,
      humidity: 88,
      rainfallMm: 2,
      windSpeedKmH: 22,
      uvIndex: 2.5,
      condition: 'frost',
      isLive: false,
      dataSource: 'Kịch bản mô phỏng Rét Đậm & Sương Muối',
      syncedAt: new Date().toISOString(),
      forecastSummary: 'Cảnh báo không khí lạnh tràn về khiến nhiệt độ ban đêm giảm sâu xuống 9°C kèm sương muối buổi sớm.',
    };
    const simAlert: WeatherAlert = {
      id: 'sim-hazard-frost',
      level: 'danger',
      hazardType: 'frost',
      title: 'KHẨN CẤP: Rét Đậm 9°C & Nguy Cơ Sương Muối',
      description: 'Nhiệt độ giảm sâu đột ngột gây co mạch rễ, táp cháy lá non và rụng hoa trên cây nhiệt đới.',
      affectedPlants: plantNames,
      vulnerablePlantIds: plantIds,
      recommendedAction: 'Phủ màng nilon giữ ấm ban đêm, bón bổ sung Kali giúp tăng sức chịu rét và tưới rửa sương muối lúc bình minh.',
      peakMetricLabel: 'Nhiệt độ 9°C',
      timestamp: `Mô phỏng ${nowTimeLabel}`,
    };
    setWeather(simWeather);
    setWeatherAlerts([simAlert]);
    pushInAppToast({ level: 'danger', title: simAlert.title, body: simAlert.recommendedAction });
    await sendExtremeWeatherNotification(simAlert, simWeather, { force: true });
  };

  // In-App Direct Toast Notification state
  const [inAppToast, setInAppToast] = useState<{
    id: string;
    level: 'info' | 'warning' | 'danger' | 'success';
    title: string;
    body: string;
  } | null>(null);

  const dismissToast = () => setInAppToast(null);

  const pushInAppToast = (toast: {
    level: 'info' | 'warning' | 'danger' | 'success';
    title: string;
    body: string;
  }) => {
    const id = `toast-${Date.now()}`;
    setInAppToast({ id, ...toast });
    window.setTimeout(() => {
      setInAppToast(prev => (prev?.id === id ? null : prev));
    }, 6500);
  };

  // Daily Watering Reminder Scheduler
  const [dailyWateringReminder, setDailyWateringReminder] = useState<{
    enabled: boolean;
    time: string;
    lastTriggeredDate: string | null;
  }>(() => {
    try {
      const saved = localStorage.getItem('nongtro_daily_watering_reminder');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          enabled: parsed.enabled !== false,
          time: typeof parsed.time === 'string' ? parsed.time : '07:00',
          lastTriggeredDate: parsed.lastTriggeredDate || null,
        };
      }
    } catch {}
    return { enabled: true, time: '07:00', lastTriggeredDate: null };
  });

  useEffect(() => {
    try {
      localStorage.setItem('nongtro_daily_watering_reminder', JSON.stringify(dailyWateringReminder));
    } catch {}
  }, [dailyWateringReminder]);

  const updateDailyWateringReminder = (next: { enabled?: boolean; time?: string }) => {
    setDailyWateringReminder(prev => ({
      ...prev,
      ...(typeof next.enabled === 'boolean' ? { enabled: next.enabled } : {}),
      ...(typeof next.time === 'string' && /^\d{2}:\d{2}$/.test(next.time) ? { time: next.time } : {}),
    }));
  };

  const plantsDueForWatering = React.useMemo(() => {
    const nowMs = Date.now();
    return plants.filter(p => {
      const lastMs = new Date(p.lastWatered).getTime();
      const hoursSince = Number.isFinite(lastMs) ? (nowMs - lastMs) / (1000 * 3600) : 999;
      const freqHours = Math.max(1, p.wateringFrequencyDays || 1) * 24;
      const isScheduleDue = hoursSince >= freqHours;
      const isDry = (p.soilMoisturePercent ?? 60) <= (p.minMoistureThreshold ?? 45);
      return isScheduleDue || isDry;
    });
  }, [plants]);

  const triggerDailyWateringNotification = async (manual: boolean = false): Promise<boolean> => {
    const targets = plantsDueForWatering;
    if (targets.length === 0) {
      if (manual) {
        pushInAppToast({
          level: 'success',
          title: 'Vườn cây đã đủ ẩm hôm nay',
          body: 'Tất cả cây trồng trong vườn đều đã được tưới đúng lịch trình.',
        });
      }
      return false;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    setDailyWateringReminder(prev => ({ ...prev, lastTriggeredDate: todayStr }));

    const names = targets.slice(0, 3).map(p => p.name).join(', ');
    pushInAppToast({
      level: 'info',
      title: `Nhắc Tưới Nước Hàng Ngày (${targets.length} cây đến hạn)`,
      body: `Cần tưới: ${names}${targets.length > 3 ? ` và ${targets.length - 3} cây khác` : ''}.`,
    });

    return await sendDailyWateringReminderNotification(
      targets.map(p => ({
        id: p.id,
        name: p.name,
        soilMoisturePercent: p.soilMoisturePercent,
        recommendedWaterAmount: p.recommendedWaterAmount,
      })),
      { force: manual }
    );
  };

  // Periodic daily reminder check (every 30s)
  useEffect(() => {
    if (!dailyWateringReminder.enabled || plantsDueForWatering.length === 0) return;

    const checkSchedule = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      if (dailyWateringReminder.lastTriggeredDate === todayStr) return;
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      if (`${hh}:${mm}` >= dailyWateringReminder.time) {
        triggerDailyWateringNotification(false).catch(() => {});
      }
    };

    checkSchedule();
    const timer = window.setInterval(checkSchedule, 30 * 1000);
    return () => window.clearInterval(timer);
  }, [dailyWateringReminder.enabled, dailyWateringReminder.time, dailyWateringReminder.lastTriggeredDate, plantsDueForWatering.length]);

  // Auto-dispatch extreme weather push notification on danger alerts
  useEffect(() => {
    if (!weatherPushEnabledState || activeWeatherPreset !== 'live') return;
    const dangerAlerts = weatherAlerts.filter(a => a.level === 'danger');
    if (dangerAlerts.length > 0) {
      sendBatchExtremeWeatherNotification(dangerAlerts, weather, { force: false }).catch(() => {});
    }
  }, [weather.city, weather.temp, weather.rainfallMm, weather.windSpeedKmH, weatherPushEnabledState, weatherAlerts, activeWeatherPreset]);

  const dismissAlert = (id: string) => {
    setWeatherAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Smart Soil Moisture & Weather Irrigation Evaluation
  const smartIrrigationAlerts: SmartIrrigationAlert[] = plants
    .filter(p => {
      const moisture = p.soilMoisturePercent ?? 50;
      const minThreshold = p.minMoistureThreshold ?? 45;
      const isHotWeather = weather.temp >= 30;
      const isDry = moisture <= minThreshold;
      return isDry || (moisture <= minThreshold + 8 && isHotWeather);
    })
    .map(p => {
      const moisture = p.soilMoisturePercent ?? 50;
      const minThreshold = p.minMoistureThreshold ?? 45;
      const isVeryDry = moisture < minThreshold - 8;
      const isHot = weather.temp >= 31;
      return {
        id: `irr-alert-${p.id}`,
        plantId: p.id,
        plantName: p.name,
        plantImage: p.imageUrl,
        soilMoisture: moisture,
        minThreshold: minThreshold,
        currentTemp: weather.temp,
        urgency: isVeryDry || (moisture <= minThreshold && isHot) ? 'urgent' : 'warning',
        reason: `Độ ẩm đất đo được ${moisture}% (thấp hơn ngưỡng tối thiểu ${minThreshold}%). Nhiệt độ môi trường ${weather.temp}°C tại ${weather.city.split('/')[0]} đang làm đất bốc hơi nhanh.`,
        recommendedAction: `Cần tưới ngay ${p.recommendedWaterAmount || '500ml - 1 lít nước'} vào vùng rễ trước khi cây héo rũ.`,
        timestamp: 'Hôm nay'
      };
    });

  const triggerMoistureNotificationCheck = (manual: boolean = false) => {
    if (smartIrrigationAlerts.length === 0) {
      if (manual) {
        pushInAppToast({
          level: 'success',
          title: 'Độ ẩm đất đang ổn định',
          body: 'Không có cây nào bị thiếu ẩm dưới ngưỡng an toàn.',
        });
      }
      return;
    }

    const topAlert = smartIrrigationAlerts[0];
    const notifTitle = `💧 Cảnh Báo Tưới Cây: ${topAlert.plantName}`;
    const notifBody = `Độ ẩm đất chỉ còn ${topAlert.soilMoisture}% (chuẩn: ${topAlert.minThreshold}%), thời tiết ${topAlert.currentTemp}°C. ${topAlert.recommendedAction}`;

    if (manual) {
      pushInAppToast({ level: 'warning', title: notifTitle, body: notifBody });
    }

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notifTitle, {
          body: notifBody,
          icon: topAlert.plantImage,
          tag: topAlert.id
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            new Notification(notifTitle, {
              body: notifBody,
              icon: topAlert.plantImage,
              tag: topAlert.id
            });
          }
        });
      }
    }
  };

  // Weather Pest Risk Early Warnings & Push Notifications
  const [isPestPushEnabledState, setIsPestPushEnabledState] = useState<boolean>(() => checkPestPushEnabled());
  const [pushNotificationPermission, setPushNotificationPermission] = useState<NotificationPermission>(() => getPushNotificationPermission());

  useEffect(() => {
    setPushNotificationPermission(getPushNotificationPermission());
    const onFocus = () => setPushNotificationPermission(getPushNotificationPermission());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const togglePestPushNotifications = () => {
    setIsPestPushEnabledState(prev => {
      const next = !prev;
      setPestPushEnabled(next);
      return next;
    });
  };

  const requestPushPermission = async (): Promise<boolean> => {
    const granted = await requestPushNotificationPermission();
    setPushNotificationPermission(getPushNotificationPermission());
    return granted;
  };

  // Dynamically calculate weather pest risks for user's tracked plants
  const weatherPestAlerts = React.useMemo(() => {
    return evaluateWeatherPestRisks(plants, weather);
  }, [plants, weather]);

  // Trigger check / dispatch
  const triggerPestPushCheck = async (manual: boolean = false): Promise<boolean> => {
    if (weatherPestAlerts.length === 0) return false;
    return await sendBatchPestRiskSummary(weatherPestAlerts, { force: manual });
  };

  // Auto-evaluate when weather or plants change
  useEffect(() => {
    if (isPestPushEnabledState && weatherPestAlerts.length > 0) {
      const criticalAlerts = weatherPestAlerts.filter(a => a.riskLevel === 'critical');
      if (criticalAlerts.length > 0) {
        sendPestRiskNotification(criticalAlerts[0], { force: false }).catch(() => {});
      }
    }
  }, [weather.city, weather.temp, weather.humidity, isPestPushEnabledState, weatherPestAlerts.length]);

  // Agricultural Experts Direct Messaging & Personalized Q&A
  const [expertThreads, setExpertThreads] = useState<ExpertThread[]>(() => {
    try {
      const saved = localStorage.getItem('nongtro_expert_threads');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EXPERT_THREADS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('nongtro_expert_threads', JSON.stringify(expertThreads));
    } catch (e) {
      console.error(e);
    }
  }, [expertThreads]);

  const [sendingExpertId, setSendingExpertId] = useState<string | null>(null);

  const unreadExpertCount = React.useMemo(
    () => expertThreads.reduce((sum, th) => sum + (th.unreadCount || 0), 0),
    [expertThreads]
  );

  const markExpertThreadRead = (expertId: string) => {
    setExpertThreads(prev =>
      prev.map(th =>
        th.expertId === expertId
          ? {
              ...th,
              unreadCount: 0,
              messages: th.messages.map(m => ({ ...m, isRead: true }))
            }
          : th
      )
    );
  };

  const toggleExpertThreadResolved = (expertId: string) => {
    setExpertThreads(prev =>
      prev.map(th =>
        th.expertId === expertId
          ? { ...th, status: th.status === 'resolved' ? 'active' : 'resolved' }
          : th
      )
    );
  };

  const fetchExpertAdvice = async (
    expert: AgriculturalExpert,
    userMessage: string,
    history: Array<{ sender: 'user' | 'expert'; content: string }>,
    options?: { imageUrl?: string; plant?: Plant; mode?: 'dm' | 'qa' }
  ) => {
    if (isOffline) {
      const pName = options?.plant?.name || 'cây trồng của bạn';
      return {
        reply: `[Chế độ ngoại tuyến] Cảm ơn bạn đã gửi thông tin về ${pName}. Khi mất mạng, tôi khuyến nghị bạn kiểm tra độ ẩm đất quanh gốc (${options?.plant?.soilMoisturePercent ?? 50}%), giữ thoát nước tốt và ưu tiên dùng chế phẩm sinh học Trichoderma / dầu Neem. Câu hỏi đã được lưu để đồng bộ ngay khi có mạng.`,
        prescriptionTitle: `Hướng dẫn nhanh cho ${pName}`,
        recommendations: [
          'Kiểm tra mặt dưới lá và vùng cổ rễ vào buổi sáng mát.',
          'Chỉ tưới nước khi 2-3cm đất mặt đã se khô để tránh úng rễ.',
          'Bổ sung phân trùn quế hoặc vi sinh đối kháng định kỳ 14 ngày/lần.'
        ],
        suggestedCareType: 'pest_control' as const,
        followUpDays: 5
      };
    }

    try {
      const res = await fetch('/api/experts/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expert,
          messages: history,
          userMessage,
          imageBase64: options?.imageUrl,
          plantContext: options?.plant,
          weatherContext: weather,
          mode: options?.mode || 'dm'
        })
      });
      if (!res.ok) throw new Error('Consult request failed');
      const data = await res.json();
      return data.result;
    } catch {
      const pName = options?.plant?.name || 'cây trồng của bạn';
      return {
        reply: `Chào bạn, tôi là ${expert.name}. Tôi đã tiếp nhận câu hỏi về ${pName}. Bạn hãy theo dõi độ ẩm đất và áp dụng các bước chăm sóc hữu cơ bên dưới rồi báo lại tiến triển cho tôi sau vài ngày nhé.`,
        prescriptionTitle: `Khuyến nghị từ ${expert.name}`,
        recommendations: [
          'Kiểm tra độ thông thoáng tán lá và khả năng thoát nước của chậu/luống.',
          'Ưu tiên bổ sung phân hữu cơ hoai mục hoặc chế phẩm vi sinh Trichoderma.',
          'Theo dõi sát diễn biến lá non trong 3-5 ngày tới.'
        ],
        suggestedCareType: 'fertilize' as const,
        followUpDays: 5
      };
    }
  };

  const sendExpertMessage = async (
    expertId: string,
    content: string,
    options?: { imageUrl?: string; plant?: Plant }
  ) => {
    const expert = AGRI_EXPERTS.find(e => e.id === expertId) || AGRI_EXPERTS[0];
    const nowTime = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const threadId = `thread-${expertId}`;

    const attachments: ExpertMessageAttachment[] = [];
    if (options?.imageUrl) {
      attachments.push({ type: 'image', url: options.imageUrl });
    }
    if (options?.plant) {
      const p = options.plant;
      const latest = p.growthHistory[p.growthHistory.length - 1];
      attachments.push({
        type: 'plant_report',
        plantId: p.id,
        plantName: p.name,
        summary: `Sức khỏe ${p.healthScore}% · Độ ẩm đất ${p.soilMoisturePercent ?? 50}%${latest ? ` · Cao ${latest.heightCm}cm` : ''}`
      });
    }

    const userMsg: ExpertMessage = {
      id: `em-${Date.now()}-u`,
      threadId,
      sender: 'user',
      senderName: 'Tôi (Nhà nông)',
      content,
      timestamp: nowTime,
      isRead: true,
      attachments: attachments.length > 0 ? attachments : undefined
    };

    const existingThread = expertThreads.find(t => t.expertId === expertId);
    const historyForApi = (existingThread?.messages || []).map(m => ({
      sender: m.sender,
      content: m.content
    }));

    setExpertThreads(prev => {
      const exists = prev.some(t => t.expertId === expertId);
      if (exists) {
        return prev.map(t =>
          t.expertId === expertId
            ? {
                ...t,
                status: 'active',
                lastMessageAt: 'Vừa xong',
                linkedPlantId: options?.plant?.id || t.linkedPlantId,
                unreadCount: 0,
                messages: [...t.messages, userMsg]
              }
            : t
        );
      }
      const newThread: ExpertThread = {
        id: threadId,
        expertId,
        lastMessageAt: 'Vừa xong',
        unreadCount: 0,
        status: 'active',
        linkedPlantId: options?.plant?.id,
        messages: [userMsg]
      };
      return [newThread, ...prev];
    });

    setSendingExpertId(expertId);
    try {
      const advice = await fetchExpertAdvice(expert, content, historyForApi, {
        imageUrl: options?.imageUrl,
        plant: options?.plant,
        mode: 'dm'
      });

      const replyTime = new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const expertAttachments: ExpertMessageAttachment[] = [];
      if (Array.isArray(advice?.recommendations) && advice.recommendations.length > 0) {
        expertAttachments.push({
          type: 'care_prescription',
          plantId: options?.plant?.id || existingThread?.linkedPlantId,
          plantName: options?.plant?.name,
          title: advice.prescriptionTitle || 'Phác đồ chăm sóc cá nhân hóa',
          recommendations: advice.recommendations,
          suggestedCareType: advice.suggestedCareType || 'pest_control'
        });
      }

      const expertMsg: ExpertMessage = {
        id: `em-${Date.now()}-e`,
        threadId,
        sender: 'expert',
        senderName: expert.name,
        senderAvatar: expert.avatar,
        content: advice?.reply || 'Tôi đã xem thông tin của bạn và gửi kèm hướng dẫn chăm sóc chi tiết bên dưới.',
        timestamp: replyTime,
        isRead: true,
        attachments: expertAttachments.length > 0 ? expertAttachments : undefined
      };

      setExpertThreads(prev =>
        prev.map(t =>
          t.expertId === expertId
            ? {
                ...t,
                lastMessageAt: 'Vừa xong',
                messages: [...t.messages, expertMsg]
              }
            : t
        )
      );
    } finally {
      setSendingExpertId(null);
    }
  };

  // Expert Q&A Questions Board
  const [expertQAQuestions, setExpertQAQuestions] = useState<ExpertQAQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('nongtro_expert_qa');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EXPERT_QA;
  });

  useEffect(() => {
    try {
      localStorage.setItem('nongtro_expert_qa', JSON.stringify(expertQAQuestions));
    } catch (e) {
      console.error(e);
    }
  }, [expertQAQuestions]);

  const [isSubmittingQA, setIsSubmittingQA] = useState<boolean>(false);

  const createExpertQAQuestion = async (payload: {
    title: string;
    category: ExpertQAQuestion['category'];
    content: string;
    targetExpertId?: string;
    plant?: Plant;
    images?: string[];
  }): Promise<ExpertQAQuestion> => {
    const chosenExpert =
      AGRI_EXPERTS.find(e => e.id === payload.targetExpertId) || AGRI_EXPERTS[0];
    const latest = payload.plant?.growthHistory[payload.plant.growthHistory.length - 1];
    const reportSummary = payload.plant
      ? `${latest ? `Chiều cao: ${latest.heightCm}cm · ${latest.leafCount} lá · ` : ''}Sức khỏe: ${payload.plant.healthScore}% · Độ ẩm đất: ${payload.plant.soilMoisturePercent ?? 50}%`
      : undefined;

    const newQ: ExpertQAQuestion = {
      id: `qa-exp-${Date.now()}`,
      title: payload.title,
      category: payload.category,
      plantId: payload.plant?.id,
      plantName: payload.plant?.name,
      authorName: 'Tôi (Chủ Vườn ' + farmLocation.name.split('-')[0].trim() + ')',
      location: farmLocation.address.split(',')[0],
      createdAt: 'Vừa xong',
      content: payload.content,
      images: payload.images || (payload.plant ? [payload.plant.imageUrl] : undefined),
      attachedReportSummary: reportSummary,
      targetExpertId: chosenExpert.id,
      status: 'pending',
      answers: []
    };

    setExpertQAQuestions(prev => [newQ, ...prev]);
    setIsSubmittingQA(true);

    try {
      const advice = await fetchExpertAdvice(
        chosenExpert,
        `${payload.title}\n${payload.content}`,
        [],
        {
          imageUrl: payload.images?.[0],
          plant: payload.plant,
          mode: 'qa'
        }
      );

      const newAnswer = {
        id: `ans-${Date.now()}`,
        expertId: chosenExpert.id,
        expertName: chosenExpert.name,
        expertTitle: chosenExpert.title,
        expertAvatar: chosenExpert.avatar,
        organization: chosenExpert.organization,
        content: advice?.reply || 'Cảm ơn câu hỏi của bạn. Dưới đây là hướng dẫn xử lý từ chuyên gia.',
        recommendations: advice?.recommendations || [],
        followUpDays: advice?.followUpDays || 5,
        createdAt: 'Vừa xong',
        helpfulCount: 1,
        isMarkedHelpful: false
      };

      setExpertQAQuestions(prev =>
        prev.map(q =>
          q.id === newQ.id
            ? { ...q, status: 'answered', answers: [newAnswer] }
            : q
        )
      );
      return { ...newQ, status: 'answered', answers: [newAnswer] };
    } finally {
      setIsSubmittingQA(false);
    }
  };

  const addQAFollowUp = async (questionId: string, content: string) => {
    const question = expertQAQuestions.find(q => q.id === questionId);
    if (!question) return;
    const expert =
      AGRI_EXPERTS.find(e => e.id === question.targetExpertId) || AGRI_EXPERTS[0];
    const linkedPlant = plants.find(p => p.id === question.plantId);

    setIsSubmittingQA(true);
    try {
      const history = question.answers.map(a => ({
        sender: 'expert' as const,
        content: a.content
      }));
      const advice = await fetchExpertAdvice(
        expert,
        `Câu hỏi bổ sung cho chủ đề "${question.title}": ${content}`,
        history,
        { plant: linkedPlant, mode: 'qa' }
      );

      const followUpAnswer = {
        id: `ans-${Date.now()}`,
        expertId: expert.id,
        expertName: expert.name,
        expertTitle: expert.title,
        expertAvatar: expert.avatar,
        organization: expert.organization,
        content: `Phản hồi câu hỏi bổ sung ("${content}"):\n${advice?.reply || ''}`,
        recommendations: advice?.recommendations || [],
        followUpDays: advice?.followUpDays || 3,
        createdAt: 'Vừa xong',
        helpfulCount: 0,
        isMarkedHelpful: false
      };

      setExpertQAQuestions(prev =>
        prev.map(q =>
          q.id === questionId
            ? { ...q, answers: [...q.answers, followUpAnswer] }
            : q
        )
      );
    } finally {
      setIsSubmittingQA(false);
    }
  };

  const toggleQAHelpful = (questionId: string, answerId: string) => {
    setExpertQAQuestions(prev =>
      prev.map(q => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          answers: q.answers.map(a => {
            if (a.id !== answerId) return a;
            const nextMarked = !a.isMarkedHelpful;
            return {
              ...a,
              isMarkedHelpful: nextMarked,
              helpfulCount: nextMarked ? a.helpfulCount + 1 : Math.max(0, a.helpfulCount - 1)
            };
          })
        };
      })
    );
  };

  const toggleQAResolved = (questionId: string) => {
    setExpertQAQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? { ...q, status: q.status === 'resolved' ? 'answered' : 'resolved' }
          : q
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        themePreference,
        setTheme,
        setThemePreference,
        toggleTheme,
        language,
        setLanguage,
        t,
        autoSpeak,
        toggleAutoSpeak,
        voiceSpeed,
        setVoiceSpeed: handleSetVoiceSpeed,
        isOffline,
        isSimulatedOffline,
        toggleSimulatedOffline,
        cacheMetadata,
        syncCache,
        bookmarkedDiseases,
        toggleBookmarkDisease,

        plants,
        addPlant,
        updatePlant,
        deletePlant,
        waterPlant,
        fertilizePlant,
        addGrowthEntry,
        addCareLog,
        updateSoilMoisture,
        smartIrrigationAlerts,
        triggerMoistureNotificationCheck,

        posts,
        addPost,
        likePost,
        togglePostSolved,
        claimPostSeed,
        addComment,
        toggleCommentSolution,
        likeComment,
        seedItems,
        addSeedItem,
        claimSeedItem,

        marketItems,
        addMarketItem,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        marketOrders,
        placeMarketOrder,
        updateOrderStatus,
        addProductReview,

        transactions,
        addTransaction,
        deleteTransaction,

        weather,
        setWeatherCity,
        weatherAlerts,
        dismissAlert,
        liveCropRecommendations,
        weatherAlertThresholds,
        updateWeatherAlertThresholds,
        weatherPushEnabled: weatherPushEnabledState,
        toggleWeatherPushEnabled,
        isWeatherLoading,
        lastWeatherSyncAt,
        weatherError,
        activeWeatherPreset,
        refreshLiveWeather,
        triggerExtremeWeatherPushCheck,
        simulateExtremeWeather,
        dailyWateringReminder,
        updateDailyWateringReminder,
        plantsDueForWatering,
        triggerDailyWateringNotification,
        inAppToast,
        dismissToast,

        weatherPestAlerts,
        isPestPushEnabled: isPestPushEnabledState,
        togglePestPushNotifications,
        pushNotificationPermission,
        requestPushPermission,
        triggerPestPushCheck,

        farmLocation,
        setFarmLocation,

        expertThreads,
        unreadExpertCount,
        sendingExpertId,
        sendExpertMessage,
        markExpertThreadRead,
        toggleExpertThreadResolved,
        expertQAQuestions,
        isSubmittingQA,
        createExpertQAQuestion,
        addQAFollowUp,
        toggleQAHelpful,
        toggleQAResolved
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
