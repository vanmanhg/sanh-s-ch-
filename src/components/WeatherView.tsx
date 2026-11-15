import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import {
  CloudSun,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  Sparkles,
  MapPin,
  Bell,
  CheckCircle2,
  Bug,
  RefreshCw,
  Navigation as NavigationIcon,
  ThermometerSun,
  Snowflake,
  CloudLightning,
  SlidersHorizontal,
  Cloud,
  BookmarkCheck,
  Stethoscope,
  Clock,
  Check,
  X,
} from 'lucide-react';

interface WeatherViewProps {
  onPlantSelect?: (cropName: string) => void;
  onNavigateToDiagnosis?: () => void;
}

const CITIES = [
  'Đồng Bằng Sông Cửu Long / TP.HCM',
  'Hà Nội & Miền Bắc',
  'Đà Lạt & Tây Nguyên',
  'Cần Thơ & Miền Tây',
  'Đà Nẵng & Miền Trung',
];

export const WeatherView: React.FC<WeatherViewProps> = ({ onNavigateToDiagnosis }) => {
  const {
    weather,
    setWeatherCity,
    weatherAlerts,
    dismissAlert,
    liveCropRecommendations,
    weatherAlertThresholds,
    updateWeatherAlertThresholds,
    weatherPushEnabled,
    toggleWeatherPushEnabled,
    isWeatherLoading,
    lastWeatherSyncAt,
    weatherError,
    activeWeatherPreset,
    refreshLiveWeather,
    triggerExtremeWeatherPushCheck,
    simulateExtremeWeather,
    weatherPestAlerts,
    triggerPestPushCheck,
    requestPushPermission,
    pushNotificationPermission,
    plants,
    addCareLog,
    t,
    localeTag,
  } = useApp();
  const { user } = useFirebaseAuth();

  const [pestNotifFeedback, setPestNotifFeedback] = useState<string | null>(null);
  const [weatherNotifFeedback, setWeatherNotifFeedback] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [loggedAlertIds, setLoggedAlertIds] = useState<Record<string, boolean>>({});

  // Editable thresholds state synced from context
  const [draftThresholds, setDraftThresholds] = useState(weatherAlertThresholds);
  const [isSavingThresholds, setIsSavingThresholds] = useState(false);
  const [thresholdSavedNotice, setThresholdSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setDraftThresholds(weatherAlertThresholds);
  }, [weatherAlertThresholds]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }
    setIsLocating(true);
    setGpsStatus('Đang lấy tọa độ GPS vườn của bạn...');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        await refreshLiveWeather({
          lat,
          lng,
          city: `Vị trí GPS vườn (${lat}, ${lng})`,
        });
        setGpsStatus(`Đã đồng bộ thời tiết tại tọa độ vườn (${lat}, ${lng}).`);
        setIsLocating(false);
      },
      () => {
        setGpsStatus('Không thể truy cập vị trí GPS (vui lòng cấp quyền vị trí hoặc chọn vùng).');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleTestPestNotification = async () => {
    const sent = await triggerPestPushCheck(true);
    setPestNotifFeedback(
      sent
        ? 'Đã gửi thông báo đẩy sâu bệnh!'
        : 'Vui lòng cấp quyền Thông báo trên trình duyệt để nhận cảnh báo.'
    );
    setTimeout(() => setPestNotifFeedback(null), 3500);
  };

  const handleTestExtremeWeatherNotification = async () => {
    const sent = await triggerExtremeWeatherPushCheck(true);
    setWeatherNotifFeedback(
      sent
        ? 'Đã phát thông báo đẩy cảnh báo thời tiết khắc nghiệt!'
        : 'Vui lòng cấp quyền Thông báo trên trình duyệt để nhận cảnh báo đẩy.'
    );
    setTimeout(() => setWeatherNotifFeedback(null), 4000);
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingThresholds(true);
    setThresholdSavedNotice(null);
    try {
      await updateWeatherAlertThresholds(draftThresholds);
      setThresholdSavedNotice(
        user
          ? 'Đã lưu ngưỡng cảnh báo lên Firebase Firestore & áp dụng kiểm tra tự động.'
          : 'Đã lưu ngưỡng cảnh báo trên thiết bị.'
      );
    } catch {
      setThresholdSavedNotice('Đã áp dụng trên thiết bị (chưa đồng bộ được Firebase).');
    } finally {
      setIsSavingThresholds(false);
      setTimeout(() => setThresholdSavedNotice(null), 4000);
    }
  };

  const handleLogProtectionAction = (alertId: string, title: string, action: string, vulnerableIds?: string[]) => {
    const targetIds =
      vulnerableIds && vulnerableIds.length > 0
        ? vulnerableIds
        : plants.slice(0, 2).map(p => p.id);
    const nowIso = new Date().toISOString();
    targetIds.forEach(pid => {
      addCareLog(pid, {
        date: nowIso,
        type: 'pest_control',
        notes: `[Bảo vệ thời tiết: ${title}] ${action}`,
      });
    });
    setLoggedAlertIds(prev => ({ ...prev, [alertId]: true }));
  };

  const conditionGradient =
    weather.condition === 'storm'
      ? 'from-slate-800 via-indigo-900 to-slate-900'
      : weather.condition === 'heatwave'
      ? 'from-amber-700 via-orange-700 to-rose-800'
      : weather.condition === 'frost'
      ? 'from-sky-800 via-cyan-900 to-slate-900'
      : 'from-emerald-700 via-teal-700 to-emerald-900';

  const conditionLabel =
    weather.condition === 'storm'
      ? 'Cảnh báo mưa bão / dông mạnh'
      : weather.condition === 'heatwave'
      ? 'Nắng nóng cực đoan'
      : weather.condition === 'frost'
      ? 'Rét đậm / Sương muối'
      : weather.condition === 'rainy'
      ? 'Có mưa rào rải rác'
      : weather.condition === 'sunny'
      ? 'Trời quang nắng ấm'
      : 'Nhiều mây ôn hòa';

  const syncedTimeFormatted = lastWeatherSyncAt
    ? new Date(lastWeatherSyncAt).toLocaleTimeString(localeTag, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : t('onlineMode');

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Title & Region selector */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CloudSun className="w-7 h-7 text-amber-500" />
            <span>{t('weatherTitle')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {t('weatherSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          {CITIES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setWeatherCity(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                weather.city === c
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              {c.split('/')[0].trim()}
            </button>
          ))}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900 flex items-center gap-1 cursor-pointer disabled:opacity-60"
          >
            <NavigationIcon className="w-3.5 h-3.5" />
            <span>{isLocating ? t('weatherLocatingBtn') : t('weatherGpsBtn')}</span>
          </button>
        </div>
      </div>

      {gpsStatus && (
        <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 px-4 py-2.5 text-xs text-sky-800 dark:text-sky-200 font-semibold flex items-center justify-between gap-2">
          <span>{gpsStatus}</span>
          <button type="button" onClick={() => setGpsStatus(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {weatherError && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 font-semibold">
          {weatherError}
        </div>
      )}

      {/* Main Live Weather Card */}
      <div
        className={`bg-gradient-to-tr ${conditionGradient} rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-emerald-100 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>{weather.city}</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-white/15 text-[11px] font-bold">
                {activeWeatherPreset !== 'live'
                  ? 'Đang mô phỏng tình huống khẩn cấp'
                  : weather.isLive
                  ? `Trực tuyến • ${syncedTimeFormatted}`
                  : 'Dữ liệu dự phòng'}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black">{weather.temp}°C</span>
              <span className="text-sm sm:text-base font-semibold text-white/90">
                {conditionLabel}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/90 max-w-xl leading-relaxed">
              {weather.forecastSummary}
            </p>
          </div>

          {/* Meteorological Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-black/25 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs">
            <div className="space-y-0.5">
              <span className="text-white/75 text-[10px] flex items-center gap-1">
                <Droplets className="w-3 h-3 text-sky-300" /> {t('weatherHumLabel')}
              </span>
              <span className="font-extrabold text-sm">{weather.humidity}%</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-white/75 text-[10px] flex items-center gap-1">
                <CloudRain className="w-3 h-3 text-sky-300" /> {t('weatherRainLabel')}
              </span>
              <span className="font-extrabold text-sm">{weather.rainfallMm} mm</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-white/75 text-[10px] flex items-center gap-1">
                <Wind className="w-3 h-3 text-emerald-300" /> {t('weatherWindLabel')}
              </span>
              <span className="font-extrabold text-sm">{weather.windSpeedKmH} km/h</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-white/75 text-[10px] flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-300" /> {t('weatherUvLabel')}
              </span>
              <span className="font-extrabold text-sm">{weather.uvIndex}</span>
            </div>
          </div>
        </div>

        {/* 24h Hourly Forecast Timeline */}
        {weather.forecast24h && weather.forecast24h.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/15">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/75 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{t('weatherForecast24h')}</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {weather.forecast24h.map((slot, idx) => (
                <div
                  key={idx}
                  className="bg-black/20 border border-white/10 rounded-xl p-2 text-center space-y-0.5"
                >
                  <div className="text-[10px] font-bold text-white/75">{slot.time}</div>
                  <div className="text-sm font-black">{slot.temp}°C</div>
                  <div className="text-[10px] text-sky-200">{slot.precipitationMm}mm</div>
                  <div className="text-[10px] text-white/70">{slot.windSpeedKmH} km/h</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync & Push actions bar */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-white/85">
            {weather.dataSource || 'Open-Meteo'} • {syncedTimeFormatted}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => refreshLiveWeather()}
              disabled={isWeatherLoading}
              className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isWeatherLoading ? 'animate-spin' : ''}`} />
              <span>{isWeatherLoading ? t('weatherSyncingBtn') : t('weatherRefreshBtn')}</span>
            </button>

            <button
              type="button"
              onClick={handleTestExtremeWeatherNotification}
              className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-950 font-bold hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('weatherSendPushBtn')}</span>
            </button>
          </div>
        </div>

        {weatherNotifFeedback && (
          <div className="mt-3 rounded-xl bg-black/30 border border-white/20 px-3 py-2 text-xs font-semibold text-white">
            {weatherNotifFeedback}
          </div>
        )}
      </div>

      {/* Extreme Weather Threshold & Push Configuration + Simulation Presets */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex flex-wrap items-center gap-2">
                <span>{t('weatherPushSystemTitle')}</span>
                {user && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 dark:text-sky-400">
                    <Cloud className="w-3.5 h-3.5" />
                    {t('syncedCloud')}
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('weatherPushSystemDesc')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pushNotificationPermission !== 'granted' ? (
              <button
                type="button"
                onClick={requestPushPermission}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{t('weatherGrantPushBtn')}</span>
              </button>
            ) : (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('weatherPushGranted')}</span>
              </span>
            )}

            <button
              type="button"
              onClick={toggleWeatherPushEnabled}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                weatherPushEnabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {weatherPushEnabled ? t('weatherAutoPushOn') : t('weatherAutoPushOff')}
            </button>
          </div>
        </div>

        {/* Editable threshold form */}
        <form onSubmit={handleSaveThresholds} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              Nắng nóng (&ge; °C)
            </label>
            <input
              type="number"
              min={30}
              max={45}
              value={draftThresholds.heatThresholdC}
              onChange={e =>
                setDraftThresholds(prev => ({
                  ...prev,
                  heatThresholdC: Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              Mưa lớn 24h (&ge; mm)
            </label>
            <input
              type="number"
              min={5}
              max={200}
              value={draftThresholds.rainThresholdMm}
              onChange={e =>
                setDraftThresholds(prev => ({
                  ...prev,
                  rainThresholdMm: Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              Gió giật (&ge; km/h)
            </label>
            <input
              type="number"
              min={15}
              max={120}
              value={draftThresholds.windThresholdKmH}
              onChange={e =>
                setDraftThresholds(prev => ({
                  ...prev,
                  windThresholdKmH: Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              Rét đậm (&le; °C)
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={draftThresholds.coldThresholdC}
              onChange={e =>
                setDraftThresholds(prev => ({
                  ...prev,
                  coldThresholdC: Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <button
            type="submit"
            disabled={isSavingThresholds}
            className="col-span-2 md:col-span-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer disabled:opacity-60"
          >
            {isSavingThresholds ? t('weatherSavingBtn') : t('weatherSaveThresholdsBtn')}
          </button>
        </form>

        {thresholdSavedNotice && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
            {thresholdSavedNotice}
          </div>
        )}

        {/* Extreme weather scenario simulator */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
            {t('weatherSimPrompt')}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => simulateExtremeWeather('storm')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                activeWeatherPreset === 'storm'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-indigo-50'
              }`}
            >
              <CloudLightning className="w-3.5 h-3.5 text-indigo-500" />
              <span>Thử Bão 48mm</span>
            </button>

            <button
              type="button"
              onClick={() => simulateExtremeWeather('heatwave')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                activeWeatherPreset === 'heatwave'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-orange-50'
              }`}
            >
              <ThermometerSun className="w-3.5 h-3.5 text-orange-500" />
              <span>Thử Nắng 39°C</span>
            </button>

            <button
              type="button"
              onClick={() => simulateExtremeWeather('frost')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                activeWeatherPreset === 'frost'
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-sky-50'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5 text-sky-500" />
              <span>Thử Rét 9°C</span>
            </button>

            {activeWeatherPreset !== 'live' && (
              <button
                type="button"
                onClick={() => simulateExtremeWeather('live')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
              >
                Khôi phục Thời Tiết Thực Tế
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Weather Warnings List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Cảnh Báo Khí Tượng & Phương Án Bảo Vệ Cây Trồng ({weatherAlerts.length})</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weatherAlerts.map(alert => {
            const isLogged = Boolean(loggedAlertIds[alert.id]);
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border ${
                  alert.level === 'danger'
                    ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50'
                    : alert.level === 'warning'
                    ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50'
                    : 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50'
                } space-y-3 flex flex-col justify-between`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                      {alert.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {alert.peakMetricLabel && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-white/80 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                          {alert.peakMetricLabel}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => dismissAlert(alert.id)}
                        title="Ẩn cảnh báo"
                        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {alert.description}
                  </p>
                  <div className="text-xs bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      <strong>Cây cần bảo vệ:</strong> {alert.affectedPlants}
                    </div>
                    <div className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                      <strong>Biện pháp ngay:</strong> {alert.recommendedAction}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-zinc-500">{alert.timestamp}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {plants.length > 0 && (
                      <button
                        type="button"
                        disabled={isLogged}
                        onClick={() =>
                          handleLogProtectionAction(
                            alert.id,
                            alert.title,
                            alert.recommendedAction,
                            alert.vulnerablePlantIds
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                          isLogged
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90'
                        }`}
                      >
                        {isLogged ? <Check className="w-3 h-3" /> : <BookmarkCheck className="w-3 h-3" />}
                        <span>{isLogged ? 'Đã ghi nhật ký' : 'Ghi nhật ký bảo vệ'}</span>
                      </button>
                    )}

                    {onNavigateToDiagnosis && (
                      <button
                        type="button"
                        onClick={onNavigateToDiagnosis}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Stethoscope className="w-3 h-3" />
                        <span>Chẩn đoán lá ngay</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weather Pest & Disease Early Warnings for user's tracked plants */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Dự Báo & Cảnh Báo Sâu Bệnh Theo Thời Tiết</span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-600 text-white">
                  {weatherPestAlerts.length} rủi ro
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                Phân tích dịch tễ học nông nghiệp theo nhiệt độ {weather.temp}°C và độ ẩm {weather.humidity}% đối với các cây trong vườn của bạn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestPestNotification}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{pestNotifFeedback || 'Gửi Cảnh Báo Sâu Bệnh'}</span>
            </button>
          </div>
        </div>

        {weatherPestAlerts.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 text-xs">
            Điều kiện thời tiết hiện tại thuận lợi, chưa phát hiện nguy cơ bùng phát dịch bệnh cao trên các cây trồng bạn đang theo dõi.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {weatherPestAlerts.map(alert => (
              <div
                key={alert.id}
                className="p-4 rounded-2xl border border-rose-200 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/20 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <img
                      src={alert.plantImage}
                      alt={alert.plantName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {alert.plantName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white shrink-0">
                          Nguy cơ {alert.riskScore}%
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 mt-0.5 line-clamp-1">
                        {alert.pestDiseaseName}
                      </h4>
                      <p className="text-[11px] text-zinc-500 italic">
                        {alert.scientificPathogen || alert.pathogenType}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-white/80 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 leading-relaxed">
                    <strong>Cơ chế thời tiết:</strong> {alert.weatherCondition.description}
                  </p>

                  <div className="text-xs bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
                    <strong>Hành động khẩn cấp:</strong> {alert.immediateAction}
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">Độ ẩm kích hoạt: {alert.weatherCondition.humidity}%</span>
                  {onNavigateToDiagnosis ? (
                    <button
                      type="button"
                      onClick={onNavigateToDiagnosis}
                      className="text-rose-700 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                    >
                      Chụp ảnh kiểm tra bệnh &rarr;
                    </button>
                  ) : (
                    <span className="text-rose-700 dark:text-rose-400 font-bold">Cần kiểm tra tán lá</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Crop Recommendation Engine */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
              Gợi Ý Cây Trồng Phù Hợp Với Thời Tiết Hiện Tại
            </h3>
            <p className="text-xs text-zinc-500">
              Phân tích trực tiếp theo nhiệt độ {weather.temp}°C, độ ẩm {weather.humidity}% tại {weather.city}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {liveCropRecommendations.map((crop, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-2 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {crop.season}
                </span>
                <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 mt-1.5">
                  {crop.crop}
                </h4>
                <div className="text-[11px] text-zinc-500 mt-1">
                  Thu hoạch: <strong>{crop.growthDays}</strong>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                  {crop.tip}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Độ khó: {crop.difficulty}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Phù hợp cao</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
