import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sprout,
  Sun,
  Moon,
  Globe,
  WifiOff,
  Wifi,
  Bell,
  MapPin,
  Share2,
  AlertTriangle,
  X,
  Droplets
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab: _activeTab, setActiveTab }) => {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    isOffline,
    weather,
    weatherAlerts,
    plants,
    smartIrrigationAlerts,
    farmLocation
  } = useApp();

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Plants that need water
  const plantsNeedingWater = plants.filter(p => {
    const last = new Date(p.lastWatered).getTime();
    const diffHours = (Date.now() - last) / (1000 * 3600);
    return diffHours >= p.wateringFrequencyDays * 24;
  });

  const socialLinks = [
    { name: 'Zalo', color: 'bg-blue-600', url: 'https://zalo.me' },
    { name: 'Facebook', color: 'bg-blue-700', url: 'https://facebook.com' },
    { name: 'Telegram', color: 'bg-sky-500', url: 'https://telegram.org' },
    { name: 'WhatsApp', color: 'bg-emerald-600', url: 'https://whatsapp.com' },
    { name: 'TikTok', color: 'bg-zinc-900', url: 'https://tiktok.com' },
    { name: 'Instagram', color: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600', url: 'https://instagram.com' },
    { name: 'LINE', color: 'bg-green-600', url: 'https://line.me' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-emerald-100 dark:border-zinc-800 transition-colors shadow-xs">
      {/* Top Banner for Weather Danger or Urgent Watering Reminder */}
      {weatherAlerts.length > 0 && (
        <div className="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-300 dark:border-amber-700/50 px-3 py-1.5 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap max-w-[85%]">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
            <span className="font-semibold">{weatherAlerts[0].title}:</span>
            <span className="hidden sm:inline opacity-90">{weatherAlerts[0].recommendedAction}</span>
          </div>
          <button
            onClick={() => {
              setActiveTab('weather');
            }}
            className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline shrink-0 ml-2 cursor-pointer"
          >
            {t('viewDetails')} →
          </button>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Logo & App Name */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('garden')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg text-emerald-950 dark:text-emerald-50 tracking-tight">
                {t('appName')}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                PRO AI
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <span className="hidden md:inline">{t('tagline')}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('map');
                }}
                className="flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-medium hover:underline text-[11px]"
              >
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[120px] sm:max-w-[180px]">{farmLocation.name}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center / Action Status Indicators */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Weather Pill */}
          <button
            onClick={() => setActiveTab('weather')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-zinc-700 text-xs text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            <span className="text-amber-500 font-semibold">{weather.temp}°C</span>
            <span className="text-zinc-400">|</span>
            <span className="text-zinc-500 dark:text-zinc-400">{weather.city.split('/')[0]}</span>
          </button>

          {/* Watering Reminder Pill */}
          {plantsNeedingWater.length > 0 && (
            <button
              onClick={() => setActiveTab('garden')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 text-xs font-semibold hover:bg-sky-100 transition-colors"
            >
              <Droplets className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
              <span>{plantsNeedingWater.length} {t('needsWaterToday')}</span>
            </button>
          )}

          {/* Smart Moisture Alert Pill */}
          {smartIrrigationAlerts.length > 0 && (
            <button
              onClick={() => setActiveTab('garden')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200 text-xs font-bold hover:bg-sky-200 transition-colors"
              title="Độ ẩm đất thấp dưới ngưỡng cho phép"
            >
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              <span>{smartIrrigationAlerts.length} cây thiếu ẩm</span>
            </button>
          )}

          {/* Offline/Online Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
              isOffline
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
            }`}
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isOffline ? t('offlineMode') : t('onlineMode')}</span>
          </div>
        </div>

        {/* Right Tools: Share, Language, Dark/Light, Notifications */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Social Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            title="Kết nối mạng xã hội nông dân (Zalo, Facebook, Telegram, TikTok...)"
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
          </button>

          {/* Alerts Bell */}
          <button
            onClick={() => setShowAlertModal(true)}
            className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Thông báo nông vụ"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {weatherAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
            {weatherAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Chuyển đổi ngôn ngữ / Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span className="uppercase">{language}</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={theme === 'light' ? t('darkMode') : t('lightMode')}
          >
            {theme === 'light' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Chia sẻ & Kết Nối Mạng Xã Hội Nông Dân
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 my-3">
              Kết nối và chia sẻ hình ảnh vườn cây, bệnh cây hoặc kinh nghiệm canh tác trực tiếp lên các nền tảng:
            </p>
            <div className="grid grid-cols-2 gap-2.5 my-4">
              {socialLinks.map(s => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-white font-medium text-xs shadow-sm hover:opacity-90 transition-opacity ${s.color}`}
                >
                  <span>{s.name}</span>
                </a>
              ))}
            </div>
            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Đã sao chép liên kết ứng dụng vào bộ nhớ tạm!');
                  }
                  setShowShareModal(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                Sao Chép Đường Dẫn Ứng Dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Trung Tâm Cảnh Báo Nông Vụ
                </h3>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {weatherAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border ${
                    alert.level === 'danger'
                      ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50'
                      : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                      {alert.title}
                    </span>
                    <span className="text-[10px] text-zinc-500">{alert.timestamp}</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{alert.description}</p>
                  <div className="mt-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-white/70 dark:bg-zinc-900/60 p-2 rounded-lg">
                    💡 <strong>Hành động khuyến nghị:</strong> {alert.recommendedAction}
                  </div>
                </div>
              ))}

              {plantsNeedingWater.length > 0 && (
                <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-900/50">
                  <span className="font-bold text-xs sm:text-sm text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    Nhắc Lịch Tưới Hôm Nay
                  </span>
                  <p className="text-xs text-sky-800 dark:text-sky-300 mt-1">
                    Bạn có {plantsNeedingWater.length} cây trong vườn đã đến chu kỳ cần bổ sung nước: {plantsNeedingWater.map(p => p.name).join(', ')}.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-right">
              <button
                onClick={() => setShowAlertModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-200"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
