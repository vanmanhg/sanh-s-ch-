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

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedMoisturePlantId, setSelectedMoisturePlantId] = useState<string | null>(null);
  const [tempMoistureInput, setTempMoistureInput] = useState<number>(30);

  if (smartIrrigationAlerts.length === 0) {
    return null;
  }

  const handleUpdateMoisture = (plantId: string) => {
    updateSoilMoisture(plantId, tempMoistureInput);
    setSelectedMoisturePlantId(null);
  };

  return (
    <div className="bg-sky-50 dark:bg-sky-950/40 border-y border-sky-200 dark:border-sky-900/60 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        {/* Top Header line */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 animate-pulse shadow-sm shadow-sky-500/30">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-sky-950 dark:text-sky-100">
                  Cảnh Báo Tưới Nước Thông Minh Theo Độ Ẩm & Thời Tiết
                </span>
                <span className="px-2 py-0.2 rounded-md bg-rose-500 text-white text-[10px] font-bold">
                  {smartIrrigationAlerts.length} cây thiếu ẩm
                </span>
              </div>
              <p className="text-[11px] text-sky-800 dark:text-sky-300 hidden md:block">
                Nhiệt độ hiện tại: {weather.temp}°C tại {weather.city.split('/')[0]} làm tăng tốc độ bốc hơi rễ cây
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Button to test/trigger local push notification */}
            <button
              onClick={() => triggerMoistureNotificationCheck(true)}
              className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Phát thông báo đẩy ra màn hình thiết bị"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Phát Thông Báo Đẩy</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
