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
  SmartIrrigationAlert
} from '../types';
import {
  INITIAL_PLANTS,
  INITIAL_POSTS,
  SEED_EXCHANGE_ITEMS,
  MARKET_ITEMS,
  CURRENT_WEATHER,
  WEATHER_ALERTS,
  INITIAL_TRANSACTIONS
} from '../data/mockData';
import { translations } from '../utils/i18n';

interface AppContextType {
  // Theme & Language
  theme: ThemeMode;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.vi) => string;
  isOffline: boolean;

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

  // Market & Cart
  marketItems: MarketItem[];
  cart: { item: MarketItem; quantity: number }[];
  addToCart: (item: MarketItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;

  // Finance
  transactions: FarmTransaction[];
  addTransaction: (tx: Omit<FarmTransaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;

  // Weather
  weather: WeatherCondition;
  setWeatherCity: (city: string) => void;
  weatherAlerts: WeatherAlert[];
  dismissAlert: (id: string) => void;

  // Farm Location
  farmLocation: { name: string; address: string; lat: number; lng: number };
  setFarmLocation: (loc: { name: string; address: string; lat: number; lng: number }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('nongtro_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  // Language state
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('nongtro_lang');
    return saved === 'en' ? 'en' : 'vi';
  });

  // Offline detection
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('nongtro_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('nongtro_lang', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
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

  // Market & Cart
  const [marketItems] = useState<MarketItem[]>(MARKET_ITEMS);
  const [cart, setCart] = useState<{ item: MarketItem; quantity: number }[]>([]);

  const addToCart = (item: MarketItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const clearCart = () => setCart([]);

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

  // Weather
  const [weather, setWeather] = useState<WeatherCondition>(CURRENT_WEATHER);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>(WEATHER_ALERTS);

  const setWeatherCity = (city: string) => {
    const cityMap: Record<string, WeatherCondition> = {
      'Hà Nội & Miền Bắc': {
        city: 'Hà Nội & Miền Bắc',
        temp: 24,
        humidity: 82,
        rainfallMm: 5,
        windSpeedKmH: 12,
        uvIndex: 4,
        condition: 'cloudy',
        forecastSummary: 'Thời tiết se lạnh dễ chịu, sương mù nhẹ buổi sáng, thích hợp cho rau củ ôn đới và hoa màu vụ đông.'
      },
      'Đà Lạt & Tây Nguyên': {
        city: 'Đà Lạt & Tây Nguyên',
        temp: 19,
        humidity: 85,
        rainfallMm: 12,
        windSpeedKmH: 8,
        uvIndex: 6,
        condition: 'cloudy',
        forecastSummary: 'Khí hậu mát mẻ, biên độ nhiệt ngày đêm cao, lý tưởng cho dâu tây, cà chua, hoa hồng và atiso.'
      },
      'Đồng Bằng Sông Cửu Long / TP.HCM': CURRENT_WEATHER,
      'Cần Thơ & Miền Tây': {
        city: 'Cần Thơ & Miền Tây',
        temp: 32,
        humidity: 75,
        rainfallMm: 18,
        windSpeedKmH: 15,
        uvIndex: 8,
        condition: 'sunny',
        forecastSummary: 'Nắng ấm buổi sáng, chiều có mưa dông cục bộ, thích hợp cho cây ăn trái và lúa nước.'
      }
    };
    if (cityMap[city]) {
      setWeather(cityMap[city]);
    } else {
      setWeather(prev => ({ ...prev, city }));
    }
  };

  const dismissAlert = (id: string) => {
    setWeatherAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Farm Location
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
        alert('🌿 Tuyệt vời! Tất cả cây trong vườn đều đang có độ ẩm đất tối ưu và thời tiết thuận lợi.');
      }
      return;
    }

    const topAlert = smartIrrigationAlerts[0];
    const notifTitle = `💧 Cảnh Báo Tưới Cây: ${topAlert.plantName}`;
    const notifBody = `Độ ẩm đất chỉ còn ${topAlert.soilMoisture}% (chuẩn: ${topAlert.minThreshold}%), thời tiết ${topAlert.currentTemp}°C. ${topAlert.recommendedAction}`;

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

    if (manual) {
      alert(`🔔 [CẢNH BÁO TƯỚI TỰ ĐỘNG THEO ĐỘ ẨM & THỜI TIẾT]\n\n${notifTitle}\n${notifBody}`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        language,
        setLanguage,
        t,
        isOffline,

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
        cart,
        addToCart,
        removeFromCart,
        clearCart,

        transactions,
        addTransaction,
        deleteTransaction,

        weather,
        setWeatherCity,
        weatherAlerts,
        dismissAlert,

        farmLocation,
        setFarmLocation
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
