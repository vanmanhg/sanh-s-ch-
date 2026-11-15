import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CloudLightning,
  AlertTriangle,
  Bell,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  X,
  CheckCircle2,
  Droplets
} from 'lucide-react';

interface AdverseWeatherAlertBannerProps {
  onNavigateToWeather: () => void;
}

export const AdverseWeatherAlertBanner: React.FC<AdverseWeatherAlertBannerProps> = ({
  onNavigateToWeather
}) => {
  const {
    weather,
    weatherAlerts,
    dismissAlert,
    triggerExtremeWeatherPushCheck,
    weatherPushEnabled,
    plants,
    addCareLog,
    inAppToast,
    dismissToast,
    t
  } = useApp();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [protectedAlertIds, setProtectedAlertIds] = useState<Record<string, boolean>>({});

  const adverseAlerts = weatherAlerts.filter(
    a => a.level === 'danger' || a.level === 'warning'
  );

  const handleLogProtection = (alertId: string, title: string, action: string, vulnerableIds?: string[]) => {
    const targetIds =
      vulnerableIds && vulnerableIds.length > 0
        ? vulnerableIds
        : plants.slice(0, 2).map(p => p.id);
    const nowIso = new Date().toISOString();
    targetIds.forEach(pid => {
      addCareLog(pid, {
        date: nowIso,
        type: 'pest_control',
        notes: `[Bảo vệ thời tiết bất lợi: ${title}] ${action}`
      });
    });
    setProtectedAlertIds(prev => ({ ...prev, [alertId]: true }));
  };

  return (
    <>
      {/* Direct In-App Toast Notification for Watering / Weather Alerts */}
      {inAppToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            role="status"
            className={`rounded-2xl p-4 shadow-2xl border backdrop-blur-md flex items-start gap-3 ${
              inAppToast.level === 'danger'
                ? 'bg-rose-950/95 border-rose-500/60 text-white'
                : inAppToast.level === 'warning'
                ? 'bg-amber-950/95 border-amber-500/60 text-white'
                : inAppToast.level === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/60 text-white'
                : 'bg-sky-950/95 border-sky-500/60 text-white'
            }`}
          >
            <div className="p-2 rounded-xl bg-white/15 shrink-0">
              {inAppToast.level === 'danger' || inAppToast.level === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-300" />
              ) : inAppToast.level === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <Droplets className="w-4 h-4 text-sky-300" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="font-extrabold text-xs sm:text-sm leading-snug">
                {inAppToast.title}
              </div>
              <p className="text-[11px] text-white/85 leading-relaxed">
                {inAppToast.body}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissToast}
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label={t('close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Persistent Top Adverse Weather Warning Bar */}
      {adverseAlerts.length > 0 && (
        <div
          className={`border-b transition-colors ${
            adverseAlerts.some(a => a.level === 'danger')
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
          }`}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className={`w-7 h-7 rounded-xl text-white flex items-center justify-center shrink-0 ${
                    adverseAlerts.some(a => a.level === 'danger') ? 'bg-rose-600' : 'bg-amber-600'
                  }`}
                >
                  <CloudLightning className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      {t('bannerWeatherTitle', { count: adverseAlerts.length })}
                    </span>
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-300 font-mono tabular-nums">
                      {weather.city.split('/')[0].trim()} · {weather.temp}°C · {weather.rainfallMm}mm · {weather.windSpeedKmH} km/h
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-700 dark:text-zinc-300 truncate max-w-3xl">
                    <strong>{adverseAlerts[0].title}:</strong> {adverseAlerts[0].recommendedAction}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => triggerExtremeWeatherPushCheck(true)}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Bell className="w-3 h-3" />
                  <span className="hidden sm:inline">
                    {weatherPushEnabled ? t('bannerWeatherNotify') : t('bannerWeatherEnableNotify')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToWeather}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span>{t('detailsBtn')}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpanded(prev => !prev)}
                  className="p-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                  aria-label={isExpanded ? t('close') : t('viewDetails')}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-rose-200/70 dark:border-rose-900/50">
                {adverseAlerts.map(alert => {
                  const isDone = Boolean(protectedAlertIds[alert.id]);
                  return (
                    <div
                      key={alert.id}
                      className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-zinc-200 dark:border-zinc-800 space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                            {alert.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => dismissAlert(alert.id)}
                            className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                            title={t('close')}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{alert.description}</p>
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {t('bannerWeatherQuickSolution')} {alert.recommendedAction}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {t('bannerWeatherAffectedPlants')} {alert.affectedPlants}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-zinc-400">{alert.timestamp}</span>
                        <button
                          type="button"
                          disabled={isDone}
                          onClick={() =>
                            handleLogProtection(
                              alert.id,
                              alert.title,
                              alert.recommendedAction,
                              alert.vulnerablePlantIds
                            )
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                            isDone
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isDone ? t('bannerWeatherProtectedBtn') : t('bannerWeatherProtectBtn')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
