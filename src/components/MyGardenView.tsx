import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plant } from '../types';
import {
  Droplets,
  Plus,
  Heart,
  Calendar,
  Sparkles,
  TrendingUp,
  History,
  Trash2,
  X,
  Sun,
  Activity,
  Layers,
  ChevronRight,
  ScanLine,
  FileText,
  Printer,
  Sliders,
  Share2
} from 'lucide-react';
import { PlantReportPdfModal } from './PlantReportPdfModal';
import { ShareJournalModal } from './ShareJournalModal';

interface MyGardenViewProps {
  onGoToIdentify: () => void;
  onNavigateToCommunity?: () => void;
}

export const MyGardenView: React.FC<MyGardenViewProps> = ({ onGoToIdentify, onNavigateToCommunity }) => {
  const { plants, waterPlant, fertilizePlant, deletePlant, addGrowthEntry, updateSoilMoisture, t } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [selectedPlantForReport, setSelectedPlantForReport] = useState<Plant | null>(null);
  const [selectedPlantForShare, setSelectedPlantForShare] = useState<Plant | null>(null);
  const [showAddLogModal, setShowAddLogModal] = useState<boolean>(false);

  // New Growth Entry inputs
  const [newHeight, setNewHeight] = useState<number>(30);
  const [newLeafCount, setNewLeafCount] = useState<number>(10);
  const [newHealthScore, setNewHealthScore] = useState<number>(95);
  const [newGrowthNotes, setNewGrowthNotes] = useState<string>('');

  // Filtering
  const filteredPlants = plants.filter(p => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const plantsNeedingWater = plants.filter(p => {
    const last = new Date(p.lastWatered).getTime();
    const diffHours = (Date.now() - last) / (1000 * 3600);
    return diffHours >= p.wateringFrequencyDays * 24;
  });

  const handleWaterAll = () => {
    plantsNeedingWater.forEach(p => {
      waterPlant(p.id, 'Tưới nước đồng loạt');
    });
  };

  const calculateDaysUntilWatering = (plant: Plant) => {
    const last = new Date(plant.lastWatered).getTime();
    const nextTime = last + plant.wateringFrequencyDays * 24 * 3600 * 1000;
    const diffHours = (nextTime - Date.now()) / (1000 * 3600);
    if (diffHours <= 0) return 0;
    return Math.ceil(diffHours / 24);
  };

  const handleSaveGrowthEntry = () => {
    if (!selectedPlant) return;
    addGrowthEntry(selectedPlant.id, {
      date: new Date().toISOString(),
      heightCm: Number(newHeight),
      leafCount: Number(newLeafCount),
      healthScore: Number(newHealthScore),
      notes: newGrowthNotes || 'Cập nhật chỉ số sinh trưởng định kỳ'
    });
    // refresh selected plant from updated state
    const updated = plants.find(p => p.id === selectedPlant.id);
    if (updated) setSelectedPlant(updated);
    setShowAddLogModal(false);
    setNewGrowthNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Quick Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">{plants.length}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('totalPlants')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-sky-600 dark:text-sky-400">
              {plantsNeedingWater.length}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('needsWaterToday')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-teal-600 dark:text-teal-400">
              {plants.length > 0
                ? Math.round(plants.reduce((acc, p) => acc + (p.healthScore || 90), 0) / plants.length)
                : 100}
              %
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('healthyRate')}</div>
          </div>
        </div>

        <div className="bg-gradient-to-tr from-emerald-600 to-teal-600 p-4 rounded-2xl text-white shadow-md shadow-emerald-700/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-90">Hành Động Nhanh</span>
            <Sparkles className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="flex gap-2 mt-2">
            {plantsNeedingWater.length > 0 ? (
              <button
                onClick={handleWaterAll}
                className="w-full py-1.5 px-2 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                {t('waterAll')}
              </button>
            ) : (
              <button
                onClick={onGoToIdentify}
                className="w-full py-1.5 px-2 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ScanLine className="w-3.5 h-3.5" />
                Thêm Cây Bằng AI
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar: Filter & Add Plant button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tất cả cây' },
            { id: 'vegetable', label: 'Rau & Củ' },
            { id: 'fruit', label: 'Cây Ăn Trái' },
            { id: 'indoor', label: 'Cây Trong Nhà' },
            { id: 'flower', label: 'Hoa & Kiểng' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === c.id
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {plants.length > 0 && (
            <button
              onClick={() => setSelectedPlantForReport(plants[0])}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 border border-emerald-600 text-emerald-700 dark:text-emerald-300 dark:border-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
              title="Xuất hồ sơ sinh trưởng và lịch sử tưới cây dạng file PDF / A4"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Xuất Báo Cáo PDF</span>
            </button>
          )}

          <button
            onClick={onGoToIdentify}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addPlantBtn')}</span>
          </button>
        </div>
      </div>

      {/* Plants Grid */}
      {filteredPlants.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-dashed border-zinc-300 dark:border-zinc-700">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 mb-3">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Chưa có cây nào trong mục này</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Hãy dùng tính năng Nhận Diện AI để chụp ảnh cây trồng và tự động lưu vào vườn với lịch tưới thông minh!
          </p>
          <button
            onClick={onGoToIdentify}
            className="mt-4 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Chụp Ảnh Nhận Diện Cây Ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlants.map(plant => {
            const daysLeft = calculateDaysUntilWatering(plant);
            const isDueToday = daysLeft === 0;

            return (
              <div
                key={plant.id}
                onClick={() => setSelectedPlant(plant)}
                className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Plant Image & Quick Badges */}
                  <div className="relative h-44 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img
                      src={plant.imageUrl}
                      alt={plant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                        {plant.location || 'Vườn nhà'}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-600/90 text-white backdrop-blur-xs">
                        {plant.healthScore || 90}% Khỏe
                      </span>
                    </div>

                    {isDueToday && (
                      <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-rose-500 text-white shadow-md animate-pulse flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5" />
                        Cần tưới ngay
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {plant.name}
                      </h4>
                      <p className="text-xs italic text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {plant.scientificName}
                      </p>
                    </div>

                    {/* Care Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl text-zinc-600 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">Tưới {plant.wateringFrequencyDays} ngày/lần</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">Nắng {plant.sunlight === 'full_sun' ? 'trực tiếp' : 'bán phần'}</span>
                      </div>
                    </div>

                    {/* Soil Moisture Level Bar */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-sky-500" />
                          Độ ẩm đất:
                        </span>
                        <span
                          className={`font-bold ${
                            (plant.soilMoisturePercent || 50) <= (plant.minMoistureThreshold || 45)
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {plant.soilMoisturePercent || 50}%{' '}
                          {(plant.soilMoisturePercent || 50) <= (plant.minMoistureThreshold || 45)
                            ? '(Cần tưới)'
                            : '(Tối ưu)'}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, plant.soilMoisturePercent || 50)}%` }}
                          className={`h-full rounded-full transition-all ${
                            (plant.soilMoisturePercent || 50) <= (plant.minMoistureThreshold || 45)
                              ? 'bg-rose-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Progress / Status */}
                    <div className="text-[11px] text-zinc-500 flex items-center justify-between">
                      <span>Lần tưới gần nhất:</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {new Date(plant.lastWatered).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      waterPlant(plant.id);
                    }}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isDueToday
                        ? 'bg-sky-500 text-white hover:bg-sky-600'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300'
                    }`}
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>{isDueToday ? 'Tưới Ngay' : 'Đã Tưới'}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fertilizePlant(plant.id);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-200 transition-colors cursor-pointer"
                    title="Ghi chép bón phân"
                  >
                    Bón Phân
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlantForShare(plant);
                    }}
                    className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                    title="Chia sẻ thẻ ảnh nhật ký tăng trưởng"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlant(plant);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                    title="Xem chi tiết nhật ký"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PLANT DETAIL MODAL (Growth Journal, History Logs & Analytics) */}
      {selectedPlant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header image */}
            <div className="relative h-48 sm:h-56 w-full">
              <img
                src={selectedPlant.imageUrl}
                alt={selectedPlant.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedPlant(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-white">
                  <h3 className="font-extrabold text-base sm:text-lg">{selectedPlant.name}</h3>
                  <p className="text-xs italic opacity-90">{selectedPlant.scientificName}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setSelectedPlantForReport(selectedPlant)}
                    className="px-3 py-2 bg-white text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md hover:bg-emerald-50 cursor-pointer"
                    title="Xuất hồ sơ sinh trưởng và lịch tưới dạng PDF"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Xuất PDF</span>
                  </button>
                  <button
                    onClick={() => waterPlant(selectedPlant.id)}
                    className="px-3 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md hover:bg-sky-600 cursor-pointer"
                  >
                    <Droplets className="w-4 h-4" />
                    Tưới Nước
                  </button>
                  <button
                    onClick={() => fertilizePlant(selectedPlant.id)}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md hover:bg-emerald-700 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Bón Phân
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Care Metrics Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs">
                  <span className="text-zinc-500 block text-[10px]">Tần suất tưới</span>
                  <strong className="text-zinc-800 dark:text-zinc-200">{selectedPlant.wateringFrequencyDays} ngày / lần</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs">
                  <span className="text-zinc-500 block text-[10px]">Ánh sáng</span>
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {selectedPlant.sunlight === 'full_sun' ? 'Nắng toàn phần' : 'Bóng râm mát'}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs">
                  <span className="text-zinc-500 block text-[10px]">Độ khó</span>
                  <strong className="text-zinc-800 dark:text-zinc-200 capitalize">{selectedPlant.difficulty}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs">
                  <span className="text-zinc-500 block text-[10px]">Chỉ số sức khỏe</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{selectedPlant.healthScore}% Tốt</strong>
                </div>
              </div>

              {/* SOIL MOISTURE GAUGE & SENSOR SIMULATOR */}
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-sky-600" />
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-sky-950 dark:text-sky-100">
                        Giám Sát Độ Ẩm Đất Canh Tác (Soil Moisture Sensor)
                      </h4>
                      <p className="text-[11px] text-sky-800 dark:text-sky-300">
                        Ngưỡng chuẩn của cây: {selectedPlant.minMoistureThreshold || 45}% - {selectedPlant.maxMoistureThreshold || 75}%
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                    (selectedPlant.soilMoisturePercent || 50) <= (selectedPlant.minMoistureThreshold || 45)
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {selectedPlant.soilMoisturePercent || 50}%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-500">
                    <span>Khô hạn (&lt;30%)</span>
                    <span className="text-emerald-700 font-bold">Thích hợp (50-70%)</span>
                    <span>Ngập úng (&gt;85%)</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    value={selectedPlant.soilMoisturePercent || 50}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updateSoilMoisture(selectedPlant.id, val);
                      setSelectedPlant({ ...selectedPlant, soilMoisturePercent: val });
                    }}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <div className="flex justify-between items-center text-[10px] text-zinc-400">
                    <span>Kéo thanh trượt để cập nhật chỉ số đo đất thực tế</span>
                    <span className="text-sky-600 font-semibold">Tự động cảnh báo tưới khi &le;{selectedPlant.minMoistureThreshold || 45}%</span>
                  </div>
                </div>
              </div>

              {selectedPlant.notes && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/50">
                  <strong>Ghi chú chăm sóc:</strong> {selectedPlant.notes}
                </div>
              )}

              {/* GROWTH ANALYTICS & JOURNAL */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Trình Phân Tích & Nhật Ký Tăng Trưởng
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedPlantForShare(selectedPlant)}
                      className="px-2.5 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 dark:text-emerald-300 dark:border-emerald-700 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1 cursor-pointer"
                      title="Chia sẻ thẻ ảnh nhật ký tăng trưởng lên cộng đồng hoặc mạng xã hội"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Chia Sẻ Nhật Ký</span>
                    </button>
                    <button
                      onClick={() => setShowAddLogModal(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ghi Số Liệu Hôm Nay
                    </button>
                  </div>
                </div>

                {/* Growth Visual progression */}
                <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="text-xs text-zinc-500 flex justify-between">
                    <span>Chiều cao phát triển qua các mốc đo:</span>
                    <span className="text-emerald-600 font-semibold">Tăng trưởng ổn định</span>
                  </div>
                  <div className="flex items-end gap-3 h-28 pt-4 pb-2 px-2 border-b border-zinc-100 dark:border-zinc-800">
                    {selectedPlant.growthHistory.map((g, idx) => {
                      const maxHeight = Math.max(...selectedPlant.growthHistory.map(item => item.heightCm), 80);
                      const heightPercent = Math.max(15, Math.min(100, (g.heightCm / maxHeight) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            {g.heightCm}cm
                          </span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 transition-all"
                          />
                          <span className="text-[9px] text-zinc-400 truncate max-w-[45px]">
                            {new Date(g.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-zinc-500 italic">
                    AI Đánh giá: Cây đang trong chu kỳ phân hóa chồi lá tích cực, mức hấp thụ phân bón đạt 94%.
                  </p>
                </div>
              </div>

              {/* TIMELINE OF CARE LOGS */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <History className="w-4 h-4 text-zinc-500" />
                  <span>Lịch Sử Tưới Nước & Bón Phân Gần Nhất</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedPlant.careLogs.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {log.type === 'water' && <Droplets className="w-3.5 h-3.5 text-sky-500" />}
                        {log.type === 'fertilize' && <Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
                        {log.type === 'prune' && <Activity className="w-3.5 h-3.5 text-amber-500" />}
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {log.type === 'water' ? 'Tưới nước' : log.type === 'fertilize' ? 'Bón phân' : 'Chăm sóc'}
                        </span>
                        <span className="text-zinc-500 text-[11px]">({log.notes || 'Đầy đủ'})</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(log.date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-between">
              <button
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xóa cây ${selectedPlant.name} khỏi vườn?`)) {
                    deletePlant(selectedPlant.id);
                    setSelectedPlant(null);
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                Xóa cây này
              </button>
              <button
                onClick={() => setSelectedPlant(null)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl hover:bg-zinc-300"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD GROWTH LOG MODAL */}
      {showAddLogModal && selectedPlant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Ghi Số Liệu Sinh Trưởng: {selectedPlant.name}
              </h3>
              <button onClick={() => setShowAddLogModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Chiều cao hiện tại (cm)
                </label>
                <input
                  type="number"
                  value={newHeight}
                  onChange={e => setNewHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Số lượng lá / chồi mới
                </label>
                <input
                  type="number"
                  value={newLeafCount}
                  onChange={e => setNewLeafCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Đánh giá sức khỏe ({newHealthScore}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={newHealthScore}
                  onChange={e => setNewHealthScore(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Ghi chú quan sát (màu lá, nụ hoa, đọt non...)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Đọt non vươn nhanh 5cm, lá xanh mướt không có dấu hiệu sâu bọ."
                  value={newGrowthNotes}
                  onChange={e => setNewGrowthNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddLogModal(false)}
                className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveGrowthEntry}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
              >
                Lưu Số Liệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF REPORT EXPORT MODAL */}
      {selectedPlantForReport && (
        <PlantReportPdfModal
          plant={selectedPlantForReport}
          onClose={() => setSelectedPlantForReport(null)}
        />
      )}

      {/* SHARE GROWTH JOURNAL MODAL */}
      {selectedPlantForShare && (
        <ShareJournalModal
          plant={selectedPlantForShare}
          onClose={() => setSelectedPlantForShare(null)}
          onNavigateToCommunity={onNavigateToCommunity}
        />
      )}
    </div>
  );
};
