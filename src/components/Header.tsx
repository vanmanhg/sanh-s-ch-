import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
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
  Droplets,
  HardDriveDownload,
  RefreshCw,
  CheckCircle2,
  Settings,
  Volume2,
  Radio,
  Check,
  Bot,
  Bug,
  LogIn,
  LogOut,
  Loader2,
  Monitor
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { SUPPORTED_LANGUAGES } from '../utils/i18n';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab: _activeTab, setActiveTab }) => {
  const {
    theme,
    themePreference,
    setThemePreference,
    toggleTheme,
    language,
    setLanguage,
    t,
    autoSpeak,
    toggleAutoSpeak,
    voiceSpeed,
    setVoiceSpeed,
    isOffline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    cacheMetadata,
    syncCache,
    weather,
    weatherAlerts,
    plants,
    smartIrrigationAlerts,
    weatherPestAlerts,
    farmLocation
  } = useApp();

  const { user, isSigningIn, signInWithGoogle, signOutUser } = useFirebaseAuth();

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCacheModal, setShowCacheModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [copiedAppLink, setCopiedAppLink] = useState(false);
  const [cacheSyncedNotice, setCacheSyncedNotice] = useState(false);

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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Farm Location */}
        <div className="flex items-center gap-2.5 cursor-pointer min-w-0" onClick={() => setActiveTab('garden')}>
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
            <Sprout className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-base text-zinc-900 dark:text-zinc-50 tracking-tight block truncate">
              {t('appName')}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('map');
              }}
              className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 text-[11px] cursor-pointer"
            >
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{farmLocation.name}</span>
            </button>
          </div>
        </div>

        {/* Minimal Weather Link on Desktop */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <button
            onClick={() => setActiveTab('weather')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{weather.temp}°C</span>
            <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>{weather.city.split('/')[0]}</span>
          </button>
          {isOffline && (
            <button
              onClick={() => setShowCacheModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-semibold cursor-pointer"
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </button>
          )}
        </div>

        {/* Right Tools: Alerts Bell, Language, Dark/Light, Settings, Auth */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton />

          {/* Alerts Bell */}
          <button
            onClick={() => setShowAlertModal(true)}
            className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={t('headerAlertsBellTitle')}
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {(weatherAlerts.length + weatherPestAlerts.length + smartIrrigationAlerts.length) > 0 && (
              <span className="absolute top-1 right-1 px-1 min-w-[16px] h-4 text-[10px] font-bold rounded-full bg-rose-600 text-white flex items-center justify-center tabular-nums">
                {weatherAlerts.length + weatherPestAlerts.length + smartIrrigationAlerts.length}
              </span>
            )}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              data-testid="header-lang-toggle"
              aria-label={t('language')}
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
              title={t('language')}
            >
              <span className="text-sm">
                {SUPPORTED_LANGUAGES.find(l => l.code === language)?.flag || '🌐'}
              </span>
              <span className="uppercase text-[11px]">{language}</span>
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-1.5 z-40 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    <span>{t('language')}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{SUPPORTED_LANGUAGES.length}</span>
                  </div>
                  {SUPPORTED_LANGUAGES.map(langOpt => (
                    <button
                      key={langOpt.code}
                      onClick={() => {
                        setLanguage(langOpt.code as any);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                        language === langOpt.code
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{langOpt.flag}</span>
                        <div className="text-left">
                          <div>{langOpt.label}</div>
                          <div className="text-[10px] text-zinc-400 font-normal">{langOpt.region}</div>
                        </div>
                      </div>
                      {language === langOpt.code && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Persistent Dark / Light Theme Toggle for Night-Time Gardening */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? t('switchToDark') : t('switchToLight')}
            aria-pressed={theme === 'dark'}
            data-testid="header-theme-toggle"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              theme === 'dark'
                ? 'bg-zinc-800 border-amber-500/40 text-amber-300 hover:bg-zinc-700'
                : 'bg-zinc-100/80 border-zinc-200 text-zinc-700 hover:bg-emerald-50 hover:border-emerald-300'
            }`}
            title={theme === 'light' ? t('switchToDark') : t('switchToLight')}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="hidden sm:inline">
              {theme === 'light' ? t('themeDay') : t('themeNight')}
            </span>
          </button>

          {/* Quick Settings & Voice Assistant Modal Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={t('settings')}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Firebase Google Auth Button / User Profile */}
          {!user ? (
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={isSigningIn}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
              title="Đăng nhập Google để đồng bộ dữ liệu lên Firebase"
            >
              {isSigningIn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{t('signIn')}</span>
            </button>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(prev => !prev)}
                className="flex items-center gap-1.5 p-1 pr-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                title={user.displayName || user.email || 'Firebase'}
              >
                {user.photoURL && !avatarFailed ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    {(user.displayName || 'U').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline text-xs font-bold text-emerald-900 dark:text-emerald-200 max-w-[90px] truncate">
                  {user.displayName?.split(' ')[0] || t('signIn')}
                </span>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2.5 z-40 space-y-2">
                    <div className="px-2 py-1 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                        {user.displayName || t('appName')}
                      </div>
                      {user.email && (
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {user.email}
                        </div>
                      )}
                      <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {t('syncedCloud')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        signOutUser();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('signOut')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {t('headerShareAppTitle')}
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 my-3">
              {t('headerShareAppDesc')}
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
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href).catch(() => {});
                  }
                  setCopiedAppLink(true);
                  setTimeout(() => {
                    setCopiedAppLink(false);
                    setShowShareModal(false);
                  }, 1200);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
              >
                {copiedAppLink ? t('headerCopiedLinkBtn') : t('headerCopyLinkBtn')}
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
                  {t('headerAlertCenterTitle')}
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
              {weatherPestAlerts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-400">
                    <span className="flex items-center gap-1.5">
                      <Bug className="w-4 h-4" />
                      {t('headerPestAlertsCount', { count: weatherPestAlerts.length })}
                    </span>
                    <button
                      onClick={() => {
                        setShowAlertModal(false);
                        setActiveTab('weather');
                      }}
                      className="text-[11px] underline font-extrabold hover:text-rose-800"
                    >
                      {t('headerViewWeatherStation')}
                    </button>
                  </div>
                  {weatherPestAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>{alert.plantName}:</span>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">{alert.pestDiseaseName}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">
                          {alert.riskScore}%
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {alert.weatherCondition.description}
                      </p>
                      <div className="text-xs font-medium text-amber-900 dark:text-amber-300 bg-white/70 dark:bg-zinc-900/60 p-2 rounded-lg">
                        💡 <strong>{t('headerUrgentLabel')}</strong> {alert.immediateAction}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    💡 <strong>{t('headerRecommendedActionLabel')}</strong> {alert.recommendedAction}
                  </div>
                </div>
              ))}

              {plantsNeedingWater.length > 0 && (
                <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-900/50">
                  <span className="font-bold text-xs sm:text-sm text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    {t('headerWaterReminderToday')}
                  </span>
                  <p className="text-xs text-sky-800 dark:text-sky-300 mt-1">
                    {t('headerWaterReminderDesc', {
                      count: plantsNeedingWater.length,
                      names: plantsNeedingWater.map(p => p.name).join(', ')
                    })}
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

      {/* OFFLINE CACHE MANAGEMENT MODAL */}
      {showCacheModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <HardDriveDownload className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                  {t('headerOfflineCacheModalTitle')}
                </h3>
              </div>
              <button
                onClick={() => setShowCacheModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-zinc-700 dark:text-zinc-300">{t('headerCacheStatusLabel')}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('headerCacheReadyValue')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{t('headerCacheSizeLabel')}</span>
                  <span className="font-bold">~{cacheMetadata.cacheSizeKb} KB</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{t('headerDiseaseWikiLabel')}</span>
                  <span className="font-bold">{cacheMetadata.totalDiseases}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{t('headerVideoGuidesLabel')}</span>
                  <span className="font-bold">{cacheMetadata.totalVideos}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{t('headerStationsLabel')}</span>
                  <span className="font-bold">{cacheMetadata.totalStations}</span>
                </div>
              </div>

              {/* Simulation Toggle */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-zinc-900 dark:text-zinc-100">
                    {t('headerSimulateOfflineTitle')}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {t('headerSimulateOfflineDesc')}
                  </span>
                </div>
                <button
                  onClick={toggleSimulatedOffline}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0 ml-2 ${
                    isSimulatedOffline
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {isSimulatedOffline ? t('onLabel') : t('offLabel')}
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    syncCache();
                    setCacheSyncedNotice(true);
                    setTimeout(() => setCacheSyncedNotice(false), 2500);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {cacheSyncedNotice ? <Check className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>{cacheSyncedNotice ? t('headerCacheSyncedBtn') : t('headerSyncCacheBtn')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCacheModal(false)}
                  className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl cursor-pointer"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SETTINGS & VOICE ASSISTANT MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                  {t('settings')}
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Theme Mode Switcher (Light / Dark / System Auto) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                1. {t('displayTheme')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setThemePreference('light')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                    themePreference === 'light'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">{t('lightMode')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemePreference('dark')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                    themePreference === 'dark'
                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Moon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{t('darkMode')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemePreference('system')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                    themePreference === 'system'
                      ? 'bg-sky-500/15 border-sky-500 text-sky-900 dark:text-sky-200 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Monitor className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="truncate">{t('themeSystem')}</span>
                </button>
              </div>
            </div>

            {/* 2. Language Selector (5 Supported Languages) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  2. {t('language')}
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {SUPPORTED_LANGUAGES.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUPPORTED_LANGUAGES.map((langOpt, idx) => (
                  <button
                    key={langOpt.code}
                    type="button"
                    onClick={() => setLanguage(langOpt.code)}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-2xl border text-xs font-bold cursor-pointer transition-all text-left ${
                      idx === SUPPORTED_LANGUAGES.length - 1 && SUPPORTED_LANGUAGES.length % 2 === 1
                        ? 'sm:col-span-2'
                        : ''
                    } ${
                      language === langOpt.code
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-2xs'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{langOpt.flag}</span>
                      <div className="truncate">
                        <div>{langOpt.label}</div>
                        <div className="text-[10px] text-zinc-400 font-normal">{langOpt.region}</div>
                      </div>
                    </div>
                    {language === langOpt.code && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Voice Support Options */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                3. {t('voiceAssistant')}
              </label>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs block text-zinc-900 dark:text-zinc-100">
                      {t('voiceAutoSpeak')}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {t('voiceHandsFree')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAutoSpeak}
                    className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      autoSpeak
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {autoSpeak ? t('onLabel') : t('offLabel')}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{t('voiceSpeed')}:</span>
                  <div className="flex gap-1.5">
                    {[0.8, 1.0, 1.2].map(speed => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => setVoiceSpeed(speed)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          voiceSpeed === speed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {speed === 0.8 ? '0.8x' : speed === 1.0 ? '1.0x' : '1.2x'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Offline Storage Summary */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                4. {t('offlineCacheTitle')}
              </label>
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                    {t('cacheSavedReady')}
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t('offlineDesc')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setShowCacheModal(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shrink-0"
                >
                  {t('detailsBtn')}
                </button>
              </div>
            </div>

            {/* Quick actions: Share & Chatbot */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowShareModal(true);
                }}
                className="py-2.5 px-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>{t('shareAppBtn')}</span>
              </button>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setActiveTab('chatbot');
                }}
                className="py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>{t('quickHelp')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
