import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { AgriStation } from '../types';
import { getCachedStations, CACHED_STATIC_MAP_URL } from '../utils/offlineCache';
import { GoogleMapsHeatmapLayer, StaticCachedHeatmapLayer } from './AgriHeatmapOverlay';
import {
  HeatmapMetric,
  HeatmapHorizon,
  RegionalClimatePoint,
  buildFallbackRegionalHeatmap,
  loadCachedRegionalHeatmap,
  saveCachedRegionalHeatmap,
  getMetricValue,
  formatMetricValue,
  getThermalRgb,
  getHeatmapLegendMeta,
} from '../utils/regionalHeatmap';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation as NavIcon,
  Phone,
  Clock,
  Star,
  Search,
  CheckCircle2,
  Compass,
  Layers,
  Store,
  Leaf,
  Sprout,
  ExternalLink,
  Edit3,
  HardDriveDownload,
  Bookmark,
  Copy,
  Check,
  Route,
  Wifi,
  WifiOff,
  RefreshCw,
  X,
  Key,
  Globe,
  AlertTriangle,
  Droplets,
  Thermometer,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

export const isValidGoogleMapsKey = (k: string | null | undefined): boolean => {
  if (!k) return false;
  const trimmed = k.trim();
  return (
    trimmed.startsWith('AIza') &&
    trimmed.length >= 35 &&
    !trimmed.includes('YOUR_') &&
    !trimmed.includes('...') &&
    !trimmed.toLowerCase().includes('demo')
  );
};

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
  onError?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GoogleMapsErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('Caught Google Maps rendering error:', error?.message);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const AgriMapView: React.FC = () => {
  const { farmLocation, setFarmLocation, isOffline, cacheMetadata, syncCache, refreshLiveWeather } = useApp();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showEditLocationModal, setShowEditLocationModal] = useState<boolean>(false);
  const [showOfflineRouteModal, setShowOfflineRouteModal] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<'missing_key' | 'invalid_key' | 'quota_exceeded' | 'runtime_error' | null>(() => {
    try {
      const saved = localStorage.getItem('nongtro_gmp_key');
      const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
      if (saved && !isValidGoogleMapsKey(saved)) return 'invalid_key';
      if (envKey && !isValidGoogleMapsKey(envKey)) return 'invalid_key';
      if (!isValidGoogleMapsKey(saved) && !isValidGoogleMapsKey(envKey)) return 'missing_key';
      return null;
    } catch {
      return 'missing_key';
    }
  });
  const [cachedMapSrc, setCachedMapSrc] = useState<string>(CACHED_STATIC_MAP_URL);
  const [staticMapImageFailed, setStaticMapImageFailed] = useState<boolean>(false);

  // Interactive Regional Climate Heat-Map State
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('humidity');
  const [heatmapHorizon, setHeatmapHorizon] = useState<HeatmapHorizon>('now');
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.68);
  const [heatmapPoints, setHeatmapPoints] = useState<RegionalClimatePoint[]>(() => {
    return loadCachedRegionalHeatmap() || buildFallbackRegionalHeatmap(farmLocation.lat, farmLocation.lng);
  });
  const [heatmapSource, setHeatmapSource] = useState<string>('Dữ liệu vùng đã lưu bộ nhớ đệm');
  const [isHeatmapLoading, setIsHeatmapLoading] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionalClimatePoint | null>(() => {
    const initial = loadCachedRegionalHeatmap() || buildFallbackRegionalHeatmap(farmLocation.lat, farmLocation.lng);
    return initial[0] || null;
  });
  const [regionSyncNotice, setRegionSyncNotice] = useState<string | null>(null);
  const [isSyncingRegionWeather, setIsSyncingRegionWeather] = useState<boolean>(false);

  const fetchRegionalHeatmap = useCallback(async () => {
    if (isOffline) {
      const cached = loadCachedRegionalHeatmap() || buildFallbackRegionalHeatmap(farmLocation.lat, farmLocation.lng);
      setHeatmapPoints(cached);
      setHeatmapSource('Dữ liệu khí hậu vùng ngoại tuyến (Cache)');
      setSelectedRegion(prev => cached.find(p => p.id === prev?.id) || cached[0] || null);
      return;
    }

    setIsHeatmapLoading(true);
    try {
      const res = await fetch('/api/weather/regional-heatmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centerLat: farmLocation.lat, centerLng: farmLocation.lng }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data?.points) && data.points.length > 0) {
        setHeatmapPoints(data.points);
        saveCachedRegionalHeatmap(data.points);
        setHeatmapSource(data.source || 'Open-Meteo Multi-Point 7-Day Forecast');
        setSelectedRegion(prev => data.points.find((p: RegionalClimatePoint) => p.id === prev?.id) || data.points[0]);
      }
    } catch {
      const fallback = loadCachedRegionalHeatmap() || buildFallbackRegionalHeatmap(farmLocation.lat, farmLocation.lng);
      setHeatmapPoints(fallback);
      setHeatmapSource('Dữ liệu khí hậu vùng dự phòng (Cache)');
      setSelectedRegion(prev => fallback.find(p => p.id === prev?.id) || fallback[0] || null);
    } finally {
      setIsHeatmapLoading(false);
    }
  }, [farmLocation.lat, farmLocation.lng, isOffline]);

  useEffect(() => {
    fetchRegionalHeatmap();
  }, [fetchRegionalHeatmap]);

  const handleSyncRegionWeather = async (region: RegionalClimatePoint) => {
    setIsSyncingRegionWeather(true);
    try {
      await refreshLiveWeather({ lat: region.lat, lng: region.lng, city: region.regionName });
      setRegionSyncNotice(`Đã đồng bộ thời tiết & cảnh báo cho ${region.regionName} vào hệ thống vườn.`);
      setTimeout(() => setRegionSyncNotice(null), 4000);
    } catch {
      setRegionSyncNotice('Không thể đồng bộ thời tiết trực tuyến ngay lúc này.');
      setTimeout(() => setRegionSyncNotice(null), 4000);
    } finally {
      setIsSyncingRegionWeather(false);
    }
  };

  // User configured or environment API Key (strictly validated to prevent InvalidKeyMapError)
  const [customKey, setCustomKey] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('nongtro_gmp_key');
      if (isValidGoogleMapsKey(saved)) {
        return saved!;
      }
      const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
      if (isValidGoogleMapsKey(envKey)) {
        return envKey;
      }
    } catch {
      return '';
    }
    return '';
  });

  // Default to static cached map unless a valid Google Maps Platform key is present
  const [mapMode, setMapMode] = useState<'google' | 'offline'>(() => {
    try {
      const saved = localStorage.getItem('nongtro_gmp_key');
      const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
      return (isValidGoogleMapsKey(saved) || isValidGoogleMapsKey(envKey)) ? 'google' : 'offline';
    } catch {
      return 'offline';
    }
  });

  // Hydrate static map asset from CacheStorage when available (offline resilience)
  React.useEffect(() => {
    let objectUrlToRevoke: string | null = null;
    const hydrateFromCache = async () => {
      if (typeof window === 'undefined' || !('caches' in window)) return;
      try {
        const cache = await caches.open('nongtro-offline-media-v1');
        const matched = await cache.match(CACHED_STATIC_MAP_URL);
        if (matched) {
          const blob = await matched.blob();
          objectUrlToRevoke = URL.createObjectURL(blob);
          setCachedMapSrc(objectUrlToRevoke);
        } else {
          const res = await fetch(CACHED_STATIC_MAP_URL);
          if (res.ok) {
            await cache.put(CACHED_STATIC_MAP_URL, res.clone());
          }
        }
      } catch {
        // Keep default public path CACHED_STATIC_MAP_URL
      }
    };
    hydrateFromCache();
    return () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, []);

  // Listen to Google Maps auth failure & quota exceeded events and switch to static cached map fallback
  React.useEffect(() => {
    const handleAuthFailed = () => {
      setFallbackReason('invalid_key');
      setAuthError('Khóa Google Maps API không hợp lệ hoặc chưa kích hoạt Maps JavaScript API. Hệ thống đã chuyển sang Bản Đồ Tĩnh Đã Lưu Cache kèm các điểm trạm địa phương.');
      setMapMode('offline');
    };
    const handleQuotaExceeded = () => {
      setFallbackReason('quota_exceeded');
      setAuthError('Đã vượt hạn mức (Quota) Google Maps Platform. Hệ thống đã tự động chuyển sang Bản Đồ Tĩnh Đã Lưu Cache với đầy đủ tọa độ trạm địa phương.');
      setMapMode('offline');
    };
    window.addEventListener('gmp-auth-failed', handleAuthFailed);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-auth-failed', handleAuthFailed);
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  const [bookmarkedStationIds, setBookmarkedStationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nongtro_bookmarked_stations');
      return saved ? JSON.parse(saved) : ['st-1', 'st-2'];
    } catch {
      return ['st-1', 'st-2'];
    }
  });

  // Load from persistent offline cache
  const cachedStations = useMemo(() => getCachedStations(), [cacheMetadata.lastUpdated]);
  const [selectedStation, setSelectedStation] = useState<AgriStation | null>(cachedStations[0] || null);
  const [infoWindowOpen, setInfoWindowOpen] = useState<boolean>(false);

  // Edit location state
  const [fieldName, setFieldName] = useState(farmLocation.name);
  const [fieldAddress, setFieldAddress] = useState(farmLocation.address);

  // Haversine formula to compute exact distance from user's farm to any station offline
  const calculateOfflineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const stationsWithLiveDistance = useMemo(() => {
    return cachedStations.map(st => {
      const dist = calculateOfflineDistance(farmLocation.lat, farmLocation.lng, st.lat, st.lng);
      return {
        ...st,
        distanceKm: dist || st.distanceKm
      };
    });
  }, [cachedStations, farmLocation.lat, farmLocation.lng]);

  const filteredStations = useMemo(() => {
    return stationsWithLiveDistance.filter(st => {
      const matchType = selectedType === 'all' || st.type === selectedType;
      const matchSearch =
        st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.services.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [stationsWithLiveDistance, selectedType, searchTerm]);

  const handleSaveFarmLocation = (e: React.FormEvent) => {
    e.preventDefault();
    setFarmLocation({
      ...farmLocation,
      name: fieldName,
      address: fieldAddress
    });
    setShowEditLocationModal(false);
  };

  const toggleBookmarkStation = (id: string) => {
    const updated = bookmarkedStationIds.includes(id)
      ? bookmarkedStationIds.filter(itemId => itemId !== id)
      : [...bookmarkedStationIds, id];
    setBookmarkedStationIds(updated);
    try {
      localStorage.setItem('nongtro_bookmarked_stations', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleSaveCustomKey = (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) {
      setCustomKey('');
      setAuthError(null);
      setFallbackReason('missing_key');
      try {
        localStorage.removeItem('nongtro_gmp_key');
      } catch {}
      setMapMode('offline');
      setShowKeyInput(false);
      return;
    }

    if (!isValidGoogleMapsKey(trimmed)) {
      setFallbackReason('invalid_key');
      setAuthError('Khóa API không đúng định dạng Google Maps Platform (phải bắt đầu bằng "AIza..." và dài ít nhất 35 ký tự). Đang hiển thị Bản Đồ Tĩnh Đã Lưu Cache.');
      setMapMode('offline');
      return;
    }

    setAuthError(null);
    setFallbackReason(null);
    setCustomKey(trimmed);
    try {
      localStorage.setItem('nongtro_gmp_key', trimmed);
    } catch (e) {
      console.error(e);
    }
    setMapMode('google');
    setShowKeyInput(false);
  };

  const handleClearKey = () => {
    setCustomKey('');
    setAuthError(null);
    setFallbackReason('missing_key');
    try {
      localStorage.removeItem('nongtro_gmp_key');
    } catch {}
    setMapMode('offline');
  };

  const getStationBadge = (type: string) => {
    switch (type) {
      case 'organic_station':
        return { label: 'Trạm Canh Tác Hữu Cơ', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'supply':
        return { label: 'Vật Tư Nông Nghiệp', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'nursery':
        return { label: 'Vườn Ươm Cây Giống', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      default:
        return { label: 'Hợp Tác Xã', color: 'bg-zinc-100 text-zinc-800' };
    }
  };

  const isGoogleKeyReady =
    isValidGoogleMapsKey(customKey) &&
    !authError &&
    fallbackReason !== 'quota_exceeded' &&
    fallbackReason !== 'invalid_key';

  // Geographic projection of farmLocation + filteredStations onto static cached map canvas (14% - 86%)
  // Outer regional climate points clamp cleanly to [8%, 92%] x [10%, 86%] so local pins remain well-spaced.
  const projectedCoordinates = useMemo(() => {
    const points = [
      { id: 'farm', lat: farmLocation.lat, lng: farmLocation.lng },
      ...filteredStations.map(st => ({ id: st.id, lat: st.lat, lng: st.lng })),
    ];

    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(maxLat - minLat, 0.08);
    const lngSpan = Math.max(maxLng - minLng, 0.08);

    const project = (lat: number, lng: number) => {
      const xPct = 14 + ((lng - minLng) / lngSpan) * 72;
      const yPct = 18 + (1 - (lat - minLat) / latSpan) * 62;
      return {
        xPct: Math.max(8, Math.min(92, Math.round(xPct * 10) / 10)),
        yPct: Math.max(10, Math.min(86, Math.round(yPct * 10) / 10)),
      };
    };

    const farmPos = project(farmLocation.lat, farmLocation.lng);
    const stationPositions: Record<string, { xPct: number; yPct: number }> = {};
    filteredStations.forEach(st => {
      stationPositions[st.id] = project(st.lat, st.lng);
    });

    return { farmPos, stationPositions, project };
  }, [farmLocation.lat, farmLocation.lng, filteredStations]);

  const renderStaticCachedMapFallback = () => {
    const selectedPos = selectedStation
      ? projectedCoordinates.stationPositions[selectedStation.id]
      : undefined;

    const reasonTitle =
      fallbackReason === 'quota_exceeded'
        ? 'Đã vượt hạn mức Google Maps API — Đang dùng Bản đồ tĩnh đã cache'
        : fallbackReason === 'invalid_key'
        ? 'API Key Google Maps không hợp lệ — Đang dùng Bản đồ tĩnh đã cache'
        : fallbackReason === 'runtime_error'
        ? 'Không thể tải Google Maps SDK — Đang dùng Bản đồ tĩnh đã cache'
        : isOffline
        ? 'Chế độ ngoại tuyến — Đang dùng Bản đồ tĩnh đã cache'
        : 'Bản đồ tĩnh đã lưu bộ nhớ đệm (Offline Ready)';

    return (
      <div className="relative w-full h-full overflow-hidden bg-emerald-50 dark:bg-slate-900 select-none">
        {/* Static, cached map tile image */}
        {!staticMapImageFailed ? (
          <img
            src={cachedMapSrc}
            alt="Bản đồ nông nghiệp tĩnh lưu bộ nhớ đệm"
            onError={() => setStaticMapImageFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100 dark:from-slate-800 dark:via-emerald-950 dark:to-slate-900" />
        )}

        {/* Subtle legibility vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/55 pointer-events-none" />

        {/* Interactive Regional Humidity & Temperature Heat-Map Overlay */}
        {showHeatmap && (
          <StaticCachedHeatmapLayer
            points={heatmapPoints}
            projectPoint={projectedCoordinates.project}
            metric={heatmapMetric}
            horizon={heatmapHorizon}
            opacity={heatmapOpacity}
            selectedRegionId={selectedRegion?.id || null}
            onSelectRegion={pt => setSelectedRegion(pt)}
          />
        )}

        {/* Dynamic SVG route connector between user's farm and selected local station */}
        {selectedPos && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line
              x1={projectedCoordinates.farmPos.xPct}
              y1={projectedCoordinates.farmPos.yPct}
              x2={selectedPos.xPct}
              y2={selectedPos.yPct}
              stroke="#059669"
              strokeWidth="0.7"
              strokeDasharray="1.8 1.2"
            />
          </svg>
        )}

        {/* Fallback Status Badge & Legend */}
        <div className="absolute top-14 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/85 text-amber-200 border border-amber-500/40 text-[11px] font-bold backdrop-blur-md pointer-events-auto">
            <HardDriveDownload className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{reasonTitle}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 px-2.5 py-1 rounded-xl bg-black/65 text-white text-[10px] font-semibold backdrop-blur-md">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white inline-block" /> Vườn bạn
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white inline-block" /> Vật tư
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 border border-white inline-block" /> Trạm hữu cơ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white inline-block" /> Vườn ươm
            </span>
          </div>
        </div>

        {/* User Farm Marker */}
        <div
          style={{
            top: `${projectedCoordinates.farmPos.yPct}%`,
            left: `${projectedCoordinates.farmPos.xPct}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer"
          onClick={() => setShowEditLocationModal(true)}
          title={farmLocation.name}
        >
          <div className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold text-[10px] shadow-md mb-1 whitespace-nowrap border border-white/50">
            Vườn: {farmLocation.name.split('-')[0].trim()}
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-emerald-500/35">
            <Sprout className="w-4 h-4" />
          </div>
        </div>

        {/* Local Cached Station Markers */}
        {filteredStations.map(st => {
          const pos = projectedCoordinates.stationPositions[st.id];
          if (!pos) return null;
          const isSelected = selectedStation?.id === st.id;
          const markerBg =
            st.type === 'organic_station'
              ? 'bg-teal-600'
              : st.type === 'nursery'
              ? 'bg-amber-600'
              : 'bg-blue-600';

          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedStation(st)}
              style={{ top: `${pos.yPct}%`, left: `${pos.xPct}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-transform ${
                isSelected ? 'z-30 scale-110' : 'z-20 hover:scale-105'
              }`}
              title={`${st.name} (~${st.distanceKm} km)`}
            >
              <div
                className={`px-2 py-0.5 rounded-md text-white font-bold text-[10px] shadow-md mb-1 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-zinc-900 border-amber-400 text-amber-300'
                    : `${markerBg} border-white/40`
                }`}
              >
                {st.name.split('-')[0].trim()} ({st.distanceKm}km)
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 ${
                  isSelected
                    ? 'bg-amber-400 text-zinc-950 border-zinc-900 ring-4 ring-amber-400/40'
                    : `${markerBg} text-white border-white`
                }`}
              >
                {st.type === 'organic_station' ? (
                  <Leaf className="w-4 h-4" />
                ) : st.type === 'nursery' ? (
                  <Sprout className="w-4 h-4" />
                ) : (
                  <Store className="w-4 h-4" />
                )}
              </div>
            </button>
          );
        })}

        {/* Bottom Floating Selected Station & Offline Route Bar */}
        <div className="absolute bottom-3 left-3 right-3 z-30 bg-black/75 backdrop-blur-md p-3 rounded-2xl text-white text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border border-white/15">
          <div className="min-w-0">
            {selectedStation ? (
              <div className="space-y-0.5">
                <div className="font-extrabold text-emerald-300 truncate">
                  {selectedStation.name} • ~{selectedStation.distanceKm} km
                </div>
                <div className="text-[11px] text-zinc-200 truncate">
                  {selectedStation.address}, {selectedStation.province} ({selectedStation.phone})
                </div>
              </div>
            ) : (
              <span className="text-[11px] text-zinc-200">
                Chạm vào một điểm trạm trên bản đồ tĩnh để xem chi tiết & chỉ đường.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowKeyInput(true)}
              className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-[11px] cursor-pointer"
            >
              Cập nhật API Key
            </button>
            {selectedStation && (
              <button
                type="button"
                onClick={() => setShowOfflineRouteModal(true)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Route className="w-3.5 h-3.5" />
                <span>Xem Lộ Trình</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* GOOGLE MAPS PLATFORM & OFFLINE CACHE STATUS BANNER */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-blue-950 rounded-3xl p-4 sm:p-5 text-white shadow-md border border-emerald-800/40 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base tracking-tight">
                  Google Maps Platform • Bản Đồ Nông Nghiệp Thông Minh
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isGoogleKeyReady ? 'Google Maps SDK Kích Hoạt' : 'Sẵn Sàng Ngoại Tuyến'}</span>
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Tích hợp Google Maps Platform (@vis.gl/react-google-maps) kết hợp cơ chế bộ nhớ đệm ngoại tuyến ({cachedStations.length} trạm vật tư & trạm hữu cơ).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
              title="Cấu hình Google Maps API Key"
            >
              <Key className="w-3.5 h-3.5 text-amber-300" />
              <span>{customKey ? 'Đổi Maps API Key' : 'Nhập API Key'}</span>
            </button>

            <button
              onClick={() => syncCache()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đồng Bộ Cache</span>
            </button>
          </div>
        </div>

        {/* Auth error notification */}
        {authError && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{authError}</span>
            </div>
            <button
              onClick={handleClearKey}
              className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-bold text-xs shrink-0 cursor-pointer"
            >
              Xóa Key & Dùng Ngoại Tuyến
            </button>
          </div>
        )}

        {/* Optional Custom API Key input drawer */}
        {showKeyInput && (
          <div className="p-3 bg-black/40 rounded-2xl border border-white/15 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-200">
                Nhập Google Maps Platform API Key (Tùy chọn):
              </span>
              <button onClick={() => setShowKeyInput(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="AIzaSy..."
                value={customKey}
                onChange={e => setCustomKey(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-400"
              />
              <button
                onClick={() => handleSaveCustomKey(customKey.trim())}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs"
              >
                Lưu Key
              </button>
              {customKey && (
                <button
                  onClick={handleClearKey}
                  className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl font-bold text-xs"
                >
                  Xóa
                </button>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              * Khi chưa có API key hoặc ở vùng mất sóng mạng, ứng dụng tự động hiển thị bản đồ vector 2.5D ngoại tuyến với chỉ đường và khoảng cách GPS đầy đủ.
            </p>
          </div>
        )}

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs text-zinc-300">
          <div>
            <span className="text-[11px] text-zinc-400 block">Trạm cung ứng trong cache:</span>
            <span className="font-bold text-teal-300">{cachedStations.length} Điểm vật tư</span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block">Chế độ hiển thị:</span>
            <span className="font-bold text-emerald-300">
              {isGoogleKeyReady && mapMode === 'google' ? 'Google Maps Trực Tuyến' : 'Bản Đồ Ngoại Tuyến'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block">Khoảng cách tới trạm gần nhất:</span>
            <span className="font-bold text-amber-300">~{filteredStations[0]?.distanceKm || 2.4} km</span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block">Địa điểm ưu tiên:</span>
            <span className="font-bold text-teal-300">{bookmarkedStationIds.length} Điểm đã ghim</span>
          </div>
        </div>
      </div>

      {/* Header & User Farm Location Box */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Compass className="w-7 h-7 text-emerald-600" />
            <span>Bản Đồ Nông Nghiệp, Vật Tư & Trạm Hữu Cơ</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Định vị cửa hàng phân bón, thuốc BVTV sinh học, vườn ươm và trạm vi sinh IMO gần nhất
          </p>
        </div>

        {/* Current Farm Location Tag */}
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 p-2.5 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
              Khu Vực Canh Tác Của Bạn
            </div>
            <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
              {farmLocation.name}
            </div>
          </div>
          <button
            onClick={() => setShowEditLocationModal(true)}
            className="p-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 cursor-pointer ml-1"
            title="Đổi địa chỉ khu vực canh tác"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Map Canvas (Google Maps or Offline 2.5D) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-slate-900 h-[380px] sm:h-[450px] shadow-lg flex flex-col justify-between">
            {/* Map Mode Switcher Top Bar */}
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
              <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-semibold pointer-events-auto">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isGoogleKeyReady && mapMode === 'google'
                    ? 'Google Maps Vệ Tinh & Giao Thông'
                    : 'Bản Đồ Tĩnh Đã Lưu Cache & Điểm Trạm Địa Phương'}
                </span>
              </div>

              {isGoogleKeyReady && (
                <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-xl text-xs text-white pointer-events-auto">
                  <button
                    onClick={() => setMapMode('google')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      mapMode === 'google' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Google Maps
                  </button>
                  <button
                    onClick={() => setMapMode('offline')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      mapMode === 'offline' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Bản Đồ Tĩnh Cache
                  </button>
                </div>
              )}
            </div>

            {/* LIVE GOOGLE MAPS PLATFORM (when valid key is configured, no auth/quota failure, and mapMode === 'google') */}
            {isGoogleKeyReady && mapMode === 'google' ? (
              <div className="w-full h-full">
                <GoogleMapsErrorBoundary
                  fallback={renderStaticCachedMapFallback()}
                  onError={() => {
                    setFallbackReason('runtime_error');
                    setAuthError('Không thể khởi tạo Google Maps Platform. Hệ thống đã chuyển sang Bản Đồ Tĩnh Đã Lưu Cache.');
                    setMapMode('offline');
                  }}
                >
                  <APIProvider apiKey={customKey} language="vi" region="VN">
                    <GoogleMap
                      style={{ width: '100%', height: '100%' }}
                      defaultCenter={{ lat: farmLocation.lat, lng: farmLocation.lng }}
                      defaultZoom={11}
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                    >
                      {/* Interactive Regional Climate Heat-Map Overlay on Google Maps */}
                      {showHeatmap && (
                        <GoogleMapsHeatmapLayer
                          points={heatmapPoints}
                          metric={heatmapMetric}
                          horizon={heatmapHorizon}
                          opacity={heatmapOpacity}
                          selectedRegionId={selectedRegion?.id || null}
                          onSelectRegion={pt => setSelectedRegion(pt)}
                        />
                      )}

                      {/* User Farm Location Advanced Marker */}
                      <AdvancedMarker
                        position={{ lat: farmLocation.lat, lng: farmLocation.lng }}
                        title={farmLocation.name}
                      >
                        <Pin
                          background="#059669"
                          borderColor="#ffffff"
                          glyphColor="#ffffff"
                          scale={1.2}
                        />
                      </AdvancedMarker>

                      {/* Agricultural Stations Advanced Markers */}
                      {cachedStations.map(st => (
                        <AdvancedMarker
                          key={st.id}
                          position={{ lat: st.lat, lng: st.lng }}
                          title={st.name}
                          onClick={() => {
                            setSelectedStation(st);
                            setInfoWindowOpen(true);
                          }}
                        >
                          <Pin
                            background={
                              st.type === 'organic_station'
                                ? '#10b981'
                                : st.type === 'nursery'
                                ? '#f59e0b'
                                : '#2563eb'
                            }
                            borderColor="#ffffff"
                            glyphColor="#ffffff"
                            scale={1.1}
                          />
                        </AdvancedMarker>
                      ))}

                      {/* InfoWindow for Selected Station */}
                      {selectedStation && infoWindowOpen && (
                        <InfoWindow
                          position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
                          onCloseClick={() => setInfoWindowOpen(false)}
                        >
                          <div className="p-2 max-w-[200px] text-zinc-900 text-xs space-y-1">
                            <h4 className="font-extrabold text-xs">{selectedStation.name}</h4>
                            <p className="text-[11px] text-zinc-600">{selectedStation.address}</p>
                            <div className="text-[11px] font-bold text-emerald-700">
                              Khoảng cách: ~{selectedStation.distanceKm} km
                            </div>
                            <a
                              href={`tel:${selectedStation.phone}`}
                              className="block text-center mt-1 py-1 px-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
                            >
                              Gọi {selectedStation.phone}
                            </a>
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  </APIProvider>
                </GoogleMapsErrorBoundary>
              </div>
            ) : (
              renderStaticCachedMapFallback()
            )}
          </div>

          {/* Interactive Heat-Map Control & Legend Bar */}
          {(() => {
            const legend = getHeatmapLegendMeta(heatmapMetric);
            return (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowHeatmap(prev => !prev)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                        showHeatmap
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{showHeatmap ? 'Lớp Nhiệt & Độ Ẩm: BẬT' : 'Lớp Nhiệt & Độ Ẩm: TẮT'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={fetchRegionalHeatmap}
                      disabled={isHeatmapLoading}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold cursor-pointer disabled:opacity-50"
                      title="Làm mới dữ liệu khí hậu vùng"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isHeatmapLoading ? 'animate-spin' : ''}`} />
                      <span>Cập nhật vùng</span>
                    </button>
                  </div>

                  {/* Metric Switcher */}
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setHeatmapMetric('humidity');
                        if (!showHeatmap) setShowHeatmap(true);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        heatmapMetric === 'humidity'
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <Droplets className="w-3.5 h-3.5" />
                      <span>Độ ẩm (%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeatmapMetric('temperature');
                        if (!showHeatmap) setShowHeatmap(true);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        heatmapMetric === 'temperature'
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <Thermometer className="w-3.5 h-3.5" />
                      <span>Nhiệt độ (°C)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeatmapMetric('planting_index');
                        if (!showHeatmap) setShowHeatmap(true);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        heatmapMetric === 'planting_index'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <Sprout className="w-3.5 h-3.5" />
                      <span>Chỉ số gieo trồng</span>
                    </button>
                  </div>
                </div>

                {/* Horizon Selector + Opacity Slider */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mr-1">
                      <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Khung thời gian:</span>
                    </span>
                    {(
                      [
                        { id: 'now', label: 'Hiện tại' },
                        { id: '24h', label: '+24 giờ' },
                        { id: '3d', label: 'Xu hướng 3 ngày' },
                        { id: '7d', label: 'Xu hướng 7 ngày' },
                      ] as const
                    ).map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setHeatmapHorizon(item.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                          heatmapHorizon === item.id
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Độ phủ:</span>
                    <input
                      type="range"
                      min={0.25}
                      max={0.95}
                      step={0.05}
                      value={heatmapOpacity}
                      onChange={e => setHeatmapOpacity(Number(e.target.value))}
                      className="w-24 accent-emerald-600 cursor-pointer"
                    />
                    <span className="w-8 text-right tabular-nums">{Math.round(heatmapOpacity * 100)}%</span>
                  </label>
                </div>

                {/* Thermal Gradient Legend Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-700 dark:text-zinc-200">{legend.title}</span>
                    <span className="text-zinc-500 dark:text-zinc-400 truncate max-w-[260px]">
                      Nguồn: {heatmapSource}
                    </span>
                  </div>
                  <div
                    className="h-2.5 w-full rounded-full border border-zinc-200 dark:border-zinc-700"
                    style={{ background: legend.gradientCss }}
                  />
                  <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                    <span>{legend.minLabel}</span>
                    <span>{legend.midLabel}</span>
                    <span>{legend.maxLabel}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Regional Microclimate & Planting Schedule Planner Card */}
          {selectedRegion && (() => {
            const horizonMetrics =
              selectedRegion.metricsByHorizon[heatmapHorizon] || selectedRegion.metricsByHorizon.now;
            const currentVal = getMetricValue(selectedRegion, heatmapMetric, heatmapHorizon);
            const [r, g, b] = getThermalRgb(heatmapMetric, currentVal);
            const riskMeta =
              selectedRegion.fungalRisk === 'high'
                ? {
                    label: 'Nguy cơ nấm bệnh CAO',
                    cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                  }
                : selectedRegion.fungalRisk === 'medium'
                ? {
                    label: 'Nguy cơ nấm bệnh TRUNG BÌNH',
                    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                  }
                : {
                    label: 'Nguy cơ nấm bệnh THẤP',
                    cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                  };

            return (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                {/* Quick Regional Selector Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {heatmapPoints.map(pt => {
                    const isActive = pt.id === selectedRegion.id;
                    const val = getMetricValue(pt, heatmapMetric, heatmapHorizon);
                    return (
                      <button
                        key={`pill-${pt.id}`}
                        type="button"
                        onClick={() => setSelectedRegion(pt)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors border ${
                          isActive
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-emerald-400'
                        }`}
                      >
                        {pt.regionName.replace('Khu Vực ', '').replace('Vùng ', '').split('(')[0].trim()} ·{' '}
                        {formatMetricValue(val, heatmapMetric)}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Region Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold text-white"
                        style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                      >
                        {formatMetricValue(currentVal, heatmapMetric)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${riskMeta.cls}`}>
                        {riskMeta.label}
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                        {selectedRegion.isLive ? 'Trực tiếp Open-Meteo' : 'Bộ nhớ đệm vùng'}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-1 flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Kế Hoạch Gieo Trồng Vùng: {selectedRegion.regionName}</span>
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSyncRegionWeather(selectedRegion)}
                    disabled={isSyncingRegionWeather}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-60"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSyncingRegionWeather ? 'Đang đồng bộ...' : 'Áp dụng thời tiết vùng'}</span>
                  </button>
                </div>

                {regionSyncNotice && (
                  <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{regionSyncNotice}</span>
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/70">
                    <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Nhiệt độ ({heatmapHorizon})</div>
                    <div className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {horizonMetrics.tempC.toFixed(1)}°C
                    </div>
                    <div className="text-[10px] font-semibold flex items-center gap-1 mt-0.5 text-zinc-600 dark:text-zinc-300">
                      {selectedRegion.tempTrendDelta > 0.3 ? (
                        <TrendingUp className="w-3 h-3 text-orange-500" />
                      ) : selectedRegion.tempTrendDelta < -0.3 ? (
                        <TrendingDown className="w-3 h-3 text-sky-500" />
                      ) : (
                        <Minus className="w-3 h-3 text-emerald-500" />
                      )}
                      <span>
                        7 ngày: {selectedRegion.tempTrendDelta >= 0 ? `+${selectedRegion.tempTrendDelta}` : selectedRegion.tempTrendDelta}°C
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/70">
                    <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Độ ẩm ({heatmapHorizon})</div>
                    <div className="text-base font-black text-cyan-700 dark:text-cyan-300 mt-0.5">
                      {Math.round(horizonMetrics.humidityPct)}%
                    </div>
                    <div className="text-[10px] font-semibold flex items-center gap-1 mt-0.5 text-zinc-600 dark:text-zinc-300">
                      {selectedRegion.humidityTrendDelta > 2 ? (
                        <TrendingUp className="w-3 h-3 text-blue-500" />
                      ) : selectedRegion.humidityTrendDelta < -2 ? (
                        <TrendingDown className="w-3 h-3 text-amber-500" />
                      ) : (
                        <Minus className="w-3 h-3 text-emerald-500" />
                      )}
                      <span>
                        7 ngày: {selectedRegion.humidityTrendDelta >= 0 ? `+${selectedRegion.humidityTrendDelta}` : selectedRegion.humidityTrendDelta}%
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/70">
                    <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Biên độ nhiệt & Mưa 7N</div>
                    <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {selectedRegion.minTemp7d}°–{selectedRegion.maxTemp7d}°C
                    </div>
                    <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                      Tổng mưa: {selectedRegion.totalRain7d} mm
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Điểm Thuận Lợi</div>
                    <div className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                      {Math.round(horizonMetrics.plantingScore)}/100
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                      {horizonMetrics.plantingScore >= 75
                        ? 'Khung giờ vàng gieo hạt'
                        : horizonMetrics.plantingScore >= 58
                        ? 'Thích hợp chăm & sang chậu'
                        : 'Cần che chắn bảo vệ'}
                    </div>
                  </div>
                </div>

                {/* 7-Day Daily Temperature & Humidity Trend Chart */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    <span>Biểu đồ xu hướng nhiệt độ & độ ẩm 7 ngày tới</span>
                    <span className="text-[10px] font-medium text-zinc-500">Cột xanh: Độ ẩm (%) · Nhãn: Nhiệt TB</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 pt-1">
                    {selectedRegion.dailySeries.map((day, idx) => {
                      const barHeightPct = Math.max(24, Math.min(100, day.humidityAvg));
                      const isRainy = day.rainMm >= 8;
                      return (
                        <div
                          key={`${selectedRegion.id}-day-${idx}`}
                          className="p-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col items-center gap-1 text-center"
                        >
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                            {day.dateLabel}
                          </span>
                          <div className="w-full h-14 bg-zinc-200/70 dark:bg-zinc-700/60 rounded-lg flex items-end overflow-hidden p-0.5">
                            <div
                              className={`w-full rounded-md transition-all ${
                                isRainy
                                  ? 'bg-gradient-to-t from-blue-600 to-cyan-400'
                                  : 'bg-gradient-to-t from-emerald-600 to-teal-400'
                              }`}
                              style={{ height: `${barHeightPct}%` }}
                              title={`Độ ẩm ${day.humidityAvg}% · Mưa ${day.rainMm}mm`}
                            />
                          </div>
                          <span className="text-[10px] font-extrabold text-zinc-800 dark:text-zinc-100">
                            {day.tempAvg}°
                          </span>
                          <span className="text-[9px] font-semibold text-cyan-700 dark:text-cyan-400">
                            {day.humidityAvg}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Planting Window Guidance & Recommended Crops */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800/70 space-y-2">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Khuyến nghị lịch canh tác:
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {selectedRegion.plantingWindow}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      Cây ưu tiên gieo trồng:
                    </span>
                    {selectedRegion.recommendedCrops.map((crop, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
                      >
                        🌱 {crop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Station Selected Details Card */}
          {selectedStation && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${getStationBadge(selectedStation.type).color}`}>
                      {getStationBadge(selectedStation.type).label}
                    </span>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-extrabold">
                      Cách vườn bạn ~{selectedStation.distanceKm || calculateOfflineDistance(farmLocation.lat, farmLocation.lng, selectedStation.lat, selectedStation.lng)} km
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                    {selectedStation.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Call Hotline */}
                  <a
                    href={`tel:${selectedStation.phone}`}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi ({selectedStation.phone})</span>
                  </a>

                  {/* Copy Hotline */}
                  <button
                    onClick={() => handleCopyPhone(selectedStation.phone)}
                    className="px-2.5 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    title="Sao chép số điện thoại"
                  >
                    {copiedPhone === selectedStation.phone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                  </button>

                  {/* Offline Route Guidance Button */}
                  <button
                    onClick={() => setShowOfflineRouteModal(true)}
                    className="px-3 py-2 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 cursor-pointer"
                  >
                    <Route className="w-3.5 h-3.5" />
                    <span>Chỉ Đường Offline</span>
                  </button>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => toggleBookmarkStation(selectedStation.id)}
                    className={`p-2 rounded-xl border cursor-pointer ${
                      bookmarkedStationIds.includes(selectedStation.id)
                        ? 'border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                        : 'border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:text-amber-500'
                    }`}
                    title="Lưu trạm vào mục ưu tiên ngoại tuyến"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${bookmarkedStationIds.includes(selectedStation.id) ? 'fill-amber-500' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{selectedStation.address}, {selectedStation.province}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Giờ mở cửa: {selectedStation.openingHours}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Dịch vụ & Vật tư có sẵn tại trạm (Lưu trong cache):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStation.services.map((svc, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium"
                    >
                      ✓ {svc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Search & Stations Directory List */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Cơ Sở Cung Ứng Trong Vùng (Cache)</span>
            </h3>

            {/* Filter tags */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'supply', label: 'Vật tư' },
                { id: 'organic_station', label: 'Trạm hữu cơ' },
                { id: 'nursery', label: 'Vườn ươm' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    selectedType === t.id
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm cửa hàng, phân bón, chế phẩm..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>

          {/* List items */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredStations.map(st => {
              const isSelected = selectedStation?.id === st.id;
              const isBookmarked = bookmarkedStationIds.includes(st.id);
              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.2 rounded-md text-[9px] font-bold ${getStationBadge(st.type).color}`}>
                      {getStationBadge(st.type).label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isBookmarked && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Đã lưu ưu tiên" />
                      )}
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        {st.distanceKm} km
                      </span>
                    </div>
                  </div>

                  <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-1">
                    {st.name}
                  </h4>
                  <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{st.address}</p>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                      <Star className="w-3 h-3 fill-amber-500" />
                      {st.rating}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                      Xem chỉ đường →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* OFFLINE ROUTE GUIDANCE MODAL */}
      {showOfflineRouteModal && selectedStation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Route className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                  Lộ Trình Ngoại Tuyến (Offline Direction Guide)
                </h3>
              </div>
              <button
                onClick={() => setShowOfflineRouteModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-zinc-700 dark:text-zinc-300">Điểm xuất phát:</span>
                <span className="text-emerald-800 dark:text-emerald-300">{farmLocation.name}</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span className="text-zinc-700 dark:text-zinc-300">Điểm đến:</span>
                <span className="text-emerald-800 dark:text-emerald-300">{selectedStation.name}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 font-black">
                <span>Khoảng cách tính toán ngoại tuyến:</span>
                <span>~{selectedStation.distanceKm || calculateOfflineDistance(farmLocation.lat, farmLocation.lng, selectedStation.lat, selectedStation.lng)} km</span>
              </div>
            </div>

            {/* Offline Steps Simulation */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                Chỉ dẫn lộ trình xe máy / xe ba gác nông vụ:
              </span>
              <div className="space-y-2 pl-1">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                    1
                  </span>
                  <div>
                    <span className="font-bold block">Khởi hành từ vườn:</span>
                    <span className="text-zinc-500 text-[11px]">
                      Di chuyển theo hướng trục đường liên xã ({farmLocation.address.split(',')[0]}).
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                    2
                  </span>
                  <div>
                    <span className="font-bold block">Rẽ vào trục lộ chính:</span>
                    <span className="text-zinc-500 text-[11px]">
                      Chạy thẳng khoảng {Math.round((selectedStation.distanceKm || 3) * 0.7 * 10) / 10} km hướng về phía {selectedStation.province}.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                    3
                  </span>
                  <div>
                    <span className="font-bold block">Đến cơ sở cung ứng:</span>
                    <span className="text-zinc-500 text-[11px]">
                      Cơ sở nằm tại {selectedStation.address}. Bấm nút gọi <strong>{selectedStation.phone}</strong> nếu cần nhân viên hướng dẫn điểm bốc dỡ phân bón.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={`tel:${selectedStation.phone}`}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Gọi Cửa Hàng Ngay</span>
              </a>
              <button
                onClick={() => setShowOfflineRouteModal(false)}
                className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT FARM LOCATION MODAL */}
      {showEditLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Cập Nhật Khu Vực Canh Tác Của Bạn</span>
            </h3>

            <form onSubmit={handleSaveFarmLocation} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Tên Vườn / Nông Trại
                </label>
                <input
                  type="text"
                  required
                  value={fieldName}
                  onChange={e => setFieldName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Địa chỉ cụ thể
                </label>
                <input
                  type="text"
                  required
                  value={fieldAddress}
                  onChange={e => setFieldAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditLocationModal(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Lưu Vị Trí Vườn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
