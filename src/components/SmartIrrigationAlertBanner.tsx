import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Droplets,
  AlertTriangle,
  Sun,
  Bell,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

export const SmartIrrigationAlertBanner: React.FC = () => {
  const {
    smartIrrigationAlerts,
    weather,
    waterPlant,
    updateSoilMoisture,
    triggerMoistureNotificationCheck,
    t
  } = useApp();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [selectedMoisturePlantId, setSelectedMoisturePlantId] = useState<string | null>(null);
  const [tempMoistureInput, setTempMoistureInput] = useState<number>(30);

  if (smartIrrigationAlerts.length === 0 || isDismissed) {
    return null;
  }

  const handleUpdateMoisture = (plantId: string) => {
    updateSoilMoisture(plantId, tempMoistureInput);
    setSelectedMoisturePlantId(null);
  };

  return (
    <div className="bg-sky-50/80 dark:bg-sky-950/30 border-b border-sky-200/80 dark:border-sky-900/50 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5">
        {/* Top Header line */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Droplets className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <p className="text-xs text-sky-950 dark:text-sky-100 truncate">
              <span className="font-bold">{t('bannerIrrigationLabel')}</span>{' '}
              <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                {t('bannerIrrigationLowCount', { count: smartIrrigationAlerts.length })}
              </span>
              <span className="hidden md:inline text-sky-800/80 dark:text-sky-300/80">
                {' '}· {weather.temp}°C · {weather.city.split('/')[0].trim()}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => triggerMoistureNotificationCheck(true)}
              className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-semibold hover:bg-sky-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Bell className="w-3 h-3" />
              <span className="hidden sm:inline">{t('bannerIrrigationNotifyBtn')}</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors cursor-pointer"
              aria-label={isExpanded ? t('close') : t('viewDetails')}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg text-sky-700/70 dark:text-sky-300/70 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors cursor-pointer"
              aria-label={t('close')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expanded Plant Alert Cards */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-sky-200/60 dark:border-sky-900/60">
            {smartIrrigationAlerts.map(alert => (
              <div
                key={alert.id}
                className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-sky-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={alert.plantImage}
                    alt={alert.plantName}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-sky-300"
                  />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                        {alert.plantName}
                      </h4>
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        Độ ẩm: {alert.soilMoisture}% (Chuẩn &gt;{alert.minThreshold}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-snug">
                      {alert.reason}
                    </p>
                    <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      💡 {alert.recommendedAction}
                    </div>
                  </div>
                </div>

                {/* Actions: Water Now or Update Moisture sensor reading */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedMoisturePlantId(selectedMoisturePlantId === alert.plantId ? null : alert.plantId);
                      setTempMoistureInput(alert.soilMoisture);
                    }}
                    className="text-[11px] text-zinc-500 hover:text-sky-600 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Cập nhật độ ẩm đất</span>
                  </button>

                  <button
                    onClick={() => waterPlant(alert.plantId, 'Tưới nước bổ sung do độ ẩm đất giảm và thời tiết nắng')}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-600 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Tưới Cây Này Ngay</span>
                  </button>
                </div>

                {/* Quick Moisture Update Slider form */}
                {selectedMoisturePlantId === alert.plantId && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2 mt-2 text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <span>Chỉ số đo độ ẩm đất hôm nay:</span>
                      <strong className="text-sky-600 font-extrabold">{tempMoistureInput}%</strong>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="95"
                      value={tempMoistureInput}
                      onChange={e => setTempMoistureInput(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedMoisturePlantId(null)}
                        className="px-2 py-1 text-zinc-500 font-semibold"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handleUpdateMoisture(alert.plantId)}
                        className="px-3 py-1 bg-sky-600 text-white rounded-lg font-bold"
                      >
                        Lưu Chỉ Số
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
