import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarClock,
  Sparkles,
  Droplets,
  Sprout,
  Scissors,
  Bug,
  MapPin,
  Sun,
  Thermometer,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sliders,
  Trash2,
  Bell,
  BellOff,
  BellRing,
  RotateCcw,
  Check,
  ChevronRight,
  Info,
  TrendingUp,
  Send
} from 'lucide-react';
import { SoilNutrientTrendChart } from './SoilNutrientTrendChart';
import {
  CustomTelemetryReading,
  getTrendChartCopy,
  loadTelemetryReadings,
  saveTelemetryReading
} from '../utils/soilTrendData';

interface CarePlan {
  id: number;
  userId: string;
  plantName: string;
  scientificName?: string;
  plantCategory?: string;
  location: string;
  sunlight: string;
  environmentNotes?: string;
  temperatureRange?: string;
  humidityLevel?: string;
  wateringFrequencyDays: number;
  fertilizingFrequencyDays: number;
  pruningFrequencyDays: number;
  pestCheckFrequencyDays: number;
  recommendedWaterAmount?: string;
  recommendedFertilizer?: string;
  pruningInstructions?: string;
  specialCareNotes?: string;
  isActive: boolean;
  notificationEnabled: boolean;
  notificationTime?: string;
  createdAt?: string;
}

interface CareTask {
  id: number;
  planId: number;
  userId: string;
  taskType: string;
  title: string;
  description?: string;
  scheduledDate: string;
  frequencyDays: number;
  status: 'pending' | 'completed' | 'skipped';
  completedAt?: string;
  notes?: string;
  plantName?: string;
  location?: string;
}

export const AutoCarePlannerView: React.FC = () => {
  const {
    t,
    language,
    isOffline,
    plants,
    plantsDueForWatering,
    waterPlant,
    dailyWateringReminder,
    updateDailyWateringReminder,
    triggerDailyWateringNotification
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'create' | 'tasks' | 'plans' | 'trends'>('create');
  const [plans, setPlans] = useState<CarePlan[]>([]);
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'today' | 'completed'>('today');
  const [customReadings, setCustomReadings] = useState<CustomTelemetryReading[]>(() =>
    loadTelemetryReadings()
  );
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDeletePlanId, setConfirmDeletePlanId] = useState<number | null>(null);
  const trendCopy = getTrendChartCopy(language);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setStatusNotice({ type, text });
    setTimeout(() => {
      setStatusNotice(prev => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Form State
  const [plantName, setPlantName] = useState<string>('');
  const [plantCategory, setPlantCategory] = useState<string>('indoor');
  const [location, setLocation] = useState<string>('Ban công nhiều nắng sáng');
  const [sunlight, setSunlight] = useState<string>('partial_sun');
  const [environmentNotes, setEnvironmentNotes] = useState<string>('Đất thịt nhẹ trộn 30% đá perlite và trấu hun');
  const [temperature, setTemperature] = useState<string>('28°C');
  const [humidity, setHumidity] = useState<string>('75%');

  // AI Recommendation Generated State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<Partial<CarePlan> | null>(null);

  // Notification status
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  const QUICK_PLANTS = [
    { name: 'Cà Chua Bi', category: 'vegetable', sun: 'full_sun', loc: 'Sân thượng đón nắng' },
    { name: 'Cây Trầu Bà Lỗ (Monstera Adansonii)', category: 'indoor', sun: 'indirect', loc: 'Phòng khách cạnh cửa sổ' },
    { name: 'Cây Hoa Hồng Ngoại', category: 'flower', sun: 'full_sun', loc: 'Ban công hướng Đông' },
    { name: 'Cây Bạc Hà (Mint)', category: 'herb', sun: 'partial_sun', loc: 'Bệ cửa sổ bếp' },
    { name: 'Cây Kim Tiền', category: 'indoor', sun: 'indirect', loc: 'Bàn làm việc trong nhà' },
    { name: 'Cây Sầu Riêng Ri6', category: 'fruit', sun: 'full_sun', loc: 'Vườn đất vườn tự nhiên' },
  ];

  // Fetch plans and tasks from Cloud SQL on mount
  useEffect(() => {
    loadCloudSqlData();
  }, []);

  const loadCloudSqlData = async () => {
    setIsLoadingPlans(true);
    try {
      const [plansRes, tasksRes] = await Promise.all([
        fetch('/api/care-plans', { headers: { 'x-user-id': 'current_farmer' } }),
        fetch('/api/care-tasks', { headers: { 'x-user-id': 'current_farmer' } })
      ]);

      if (plansRes.ok && tasksRes.ok) {
        const plansData = await plansRes.json();
        const tasksData = await tasksRes.json();
        setPlans(plansData.plans || []);
        setTasks(tasksData.tasks || []);
        // Also sync to local storage for offline redundancy
        localStorage.setItem('nongtro_care_plans', JSON.stringify(plansData.plans || []));
        localStorage.setItem('nongtro_care_tasks', JSON.stringify(tasksData.tasks || []));
      } else {
        // Fallback to local storage if network or offline
        loadFromLocalStorage();
      }
    } catch (err) {
      console.warn('Cannot reach Cloud SQL API, loading local offline cache:', err);
      loadFromLocalStorage();
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const savedPlans = localStorage.getItem('nongtro_care_plans');
      const savedTasks = localStorage.getItem('nongtro_care_tasks');
      if (savedPlans) setPlans(JSON.parse(savedPlans));
      if (savedTasks) setTasks(JSON.parse(savedTasks));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestNotification = async () => {
    if (!('Notification' in window)) {
      showNotice('error', 'Trình duyệt không hỗ trợ Web Notification.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setHasNotificationPermission(true);
      new Notification('🌾 Nông Trợ Xanh AI - Kế Hoạch Chăm Sóc', {
        body: 'Hệ thống thông báo nhắc nhở tự động đã sẵn sàng!',
        icon: '/icon.svg'
      });
    }
  };

  const handleGeneratePlan = async () => {
    if (!plantName.trim()) {
      showNotice('error', 'Vui lòng nhập tên loại cây trồng.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/care-plans/generate-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plantName,
          plantCategory,
          location,
          sunlight,
          environmentNotes,
          temperature,
          humidity
        })
      });

      const data = await res.json();
      const rec = data.recommendation || {};

      setGeneratedPlan({
        plantName,
        scientificName: rec.scientificName || '',
        plantCategory,
        location,
        sunlight,
        environmentNotes,
        temperatureRange: rec.temperatureRange || '22°C - 32°C',
        humidityLevel: rec.humidityLevel || '60% - 80%',
        wateringFrequencyDays: rec.wateringFrequencyDays || 3,
        recommendedWaterAmount: rec.recommendedWaterAmount || '500ml tưới đẫm gốc',
        fertilizingFrequencyDays: rec.fertilizingFrequencyDays || 14,
        recommendedFertilizer: rec.recommendedFertilizer || 'Phân trùn quế / NPK hữu cơ',
        pruningFrequencyDays: rec.pruningFrequencyDays || 30,
        pruningInstructions: rec.pruningInstructions || 'Cắt tỉa lá già vàng và cành vượt',
        pestCheckFrequencyDays: rec.pestCheckFrequencyDays || 7,
        specialCareNotes: rec.specialCareNotes || 'Kiểm tra độ ẩm đất trước khi tưới',
        notificationEnabled: true,
        notificationTime: '07:30'
      });
    } catch (err) {
      console.error('Error generating plan:', err);
      showNotice('error', 'Không thể tạo kế hoạch lúc này, vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlanToCloudSql = async () => {
    if (!generatedPlan) return;

    try {
      const res = await fetch('/api/care-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'current_farmer'
        },
        body: JSON.stringify(generatedPlan)
      });

      if (!res.ok) {
        throw new Error('Lỗi lưu vào Cloud SQL');
      }

      await res.json();
      showNotice(
        'success',
        `Đã lưu kế hoạch chăm sóc "${generatedPlan.plantName}" và lên lịch trình công việc vào Cloud SQL.`
      );
      setGeneratedPlan(null);
      setPlantName('');
      loadCloudSqlData();
      setActiveSubTab('tasks');
    } catch (err) {
      console.error(err);
      // Offline fallback: save locally
      const offlineId = Date.now();
      const newPlan = { ...generatedPlan, id: offlineId, userId: 'current_farmer', isActive: true } as CarePlan;
      const updated = [newPlan, ...plans];
      setPlans(updated);
      localStorage.setItem('nongtro_care_plans', JSON.stringify(updated));
      showNotice('success', 'Đã lưu kế hoạch vào bộ nhớ thiết bị (Chế độ Ngoại Tuyến).');
      setGeneratedPlan(null);
      setActiveSubTab('tasks');
    }
  };

  const recordCareTelemetryForTask = (task: CareTask) => {
    if (task.taskType !== 'water' && task.taskType !== 'fertilize') return;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dateIso = `${y}-${m}-${d}`;
    const targetKey = `plan-${task.planId}`;
    const updated = saveTelemetryReading({
      targetKey,
      dateIso,
      soilMoisturePct: task.taskType === 'water' ? 78 : undefined,
      nutrientLevelPct: task.taskType === 'fertilize' ? 88 : undefined,
      eventTag: task.taskType === 'water' ? 'water' : 'fertilize'
    });
    setCustomReadings(updated);
  };

  const logDailyWaterTelemetry = (plantId: string, plantNameValue: string) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dateIso = `${y}-${m}-${d}`;
    const matchedPlan = plans.find(
      p => p.plantName.toLowerCase() === plantNameValue.toLowerCase()
    );
    const targetKey = matchedPlan ? `plan-${matchedPlan.id}` : `plant-${plantId}`;
    const updated = saveTelemetryReading({
      targetKey,
      dateIso,
      soilMoisturePct: 80,
      eventTag: 'water',
      note: 'Tưới nước theo lịch nhắc hàng ngày'
    });
    setCustomReadings(updated);
  };

  const handleWaterDuePlant = (plantId: string, plantNameValue: string) => {
    waterPlant(plantId, 'Đã tưới theo nhắc lịch tưới nước hàng ngày');
    logDailyWaterTelemetry(plantId, plantNameValue);
    showNotice('success', `Đã đánh dấu tưới nước cho "${plantNameValue}" và cập nhật biểu đồ độ ẩm.`);
  };

  const handleWaterAllDuePlants = () => {
    if (plantsDueForWatering.length === 0) return;
    const count = plantsDueForWatering.length;
    plantsDueForWatering.forEach(p => {
      waterPlant(p.id, 'Tưới hàng loạt theo lịch nhắc tưới hàng ngày');
      logDailyWaterTelemetry(p.id, p.name);
    });
    showNotice('success', `Đã hoàn tất tưới nước cho tất cả ${count} cây đến hạn hôm nay!`);
  };

  const handleSendDailyWateringReminderNow = async () => {
    await triggerDailyWateringNotification(true);
    if (plantsDueForWatering.length > 0) {
      showNotice('success', `Đã gửi thông báo nhắc tưới nước cho ${plantsDueForWatering.length} cây đang cần nước.`);
    } else {
      showNotice('success', 'Đã gửi thông báo kiểm tra: tất cả cây trong vườn hiện đều đủ độ ẩm.');
    }
  };

  const handleCompleteTask = async (task: CareTask) => {
    recordCareTelemetryForTask(task);
    try {
      const res = await fetch(`/api/care-tasks/${task.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'current_farmer'
        },
        body: JSON.stringify({ notes: 'Đã hoàn thành công việc chăm sóc theo lịch' })
      });

      if (res.ok) {
        loadCloudSqlData();
      } else {
        setTasks(prev =>
          prev.map(t => (t.id === task.id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t))
        );
      }
    } catch (err) {
      console.error(err);
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t))
      );
    }
  };

  const handleDeletePlan = async (id: number) => {
    setConfirmDeletePlanId(null);
    try {
      await fetch(`/api/care-plans/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'current_farmer' }
      });
      loadCloudSqlData();
    } catch (err) {
      console.error(err);
      setPlans(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.planId !== id));
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'today') {
      return t.status === 'pending' && t.scheduledDate <= todayStr;
    }
    if (taskFilter === 'completed') {
      return t.status === 'completed';
    }
    return true; // all
  });

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-tr from-emerald-800 via-teal-800 to-emerald-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hệ Thống Lập Lịch Chăm Sóc Tự Động • Cloud SQL PostgreSQL</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Kế Hoạch & Lịch Trình Chăm Sóc Cây Cá Nhân Hóa
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Nhập loại cây, vị trí trồng và điều kiện môi trường. AI sẽ tự động phân tích nhu cầu sinh lý và đề xuất lịch tưới nước, bón phân, cắt tỉa kèm thông báo nhắc việc theo thời gian thực.
            </p>
          </div>

          {/* Quick Notification Permission Button */}
          <div className="shrink-0 flex sm:flex-col items-center gap-2">
            <button
              onClick={handleRequestNotification}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                hasNotificationPermission
                  ? 'bg-emerald-600/60 text-emerald-100 border border-emerald-400/40'
                  : 'bg-amber-400 text-amber-950 hover:bg-amber-300'
              }`}
            >
              <BellRing className="w-4 h-4 animate-bounce" />
              <span>{hasNotificationPermission ? 'Thông Báo: Đang Bật' : 'Bật Thông Báo Nhắc Việc'}</span>
            </button>
            <span className="text-[10px] text-emerald-200/80">Lưu trữ bảo mật trên Cloud SQL</span>
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${
              activeSubTab === 'create'
                ? 'bg-white text-emerald-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Lập Kế Hoạch Mới</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${
              activeSubTab === 'tasks'
                ? 'bg-white text-emerald-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            <span>Lịch Công Việc Cần Làm</span>
            {tasks.filter(t => t.status === 'pending' && t.scheduledDate <= todayStr).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                {tasks.filter(t => t.status === 'pending' && t.scheduledDate <= todayStr).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
              activeSubTab === 'plans'
                ? 'bg-white text-emerald-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Cây Đang Chăm Sóc ({plans.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('trends')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
              activeSubTab === 'trends'
                ? 'bg-white text-emerald-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{trendCopy.tabLabel}</span>
          </button>
        </div>
      </div>

      {statusNotice && (
        <div
          role="status"
          className={`rounded-2xl px-4 py-3 text-xs font-semibold flex items-center justify-between gap-3 border ${
            statusNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span className="flex items-center gap-2">
            {statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusNotice.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-xs font-bold opacity-75 hover:opacity-100 cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      )}

      {/* DAILY WATERING REMINDER SCHEDULER BAR */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-5 border border-sky-200 dark:border-sky-900/60 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                Nhắc Lịch Tưới Nước Hàng Ngày
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  plantsDueForWatering.length > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {plantsDueForWatering.length > 0
                  ? `Cần tưới hôm nay: ${plantsDueForWatering.length} cây`
                  : 'Tất cả cây đã đủ nước'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Hệ thống tự động kiểm tra chu kỳ tưới của từng cây trong vườn và gửi thông báo nhắc đúng giờ mỗi ngày.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => updateDailyWateringReminder({ enabled: !dailyWateringReminder.enabled })}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border ${
              dailyWateringReminder.enabled
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
            }`}
          >
            {dailyWateringReminder.enabled ? (
              <BellRing className="w-3.5 h-3.5" />
            ) : (
              <BellOff className="w-3.5 h-3.5" />
            )}
            <span>{dailyWateringReminder.enabled ? 'Đang Bật' : 'Đang Tắt'}</span>
          </button>

          <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>Giờ nhắc:</span>
            <input
              type="time"
              value={dailyWateringReminder.time}
              onChange={e => updateDailyWateringReminder({ time: e.target.value })}
              className="bg-transparent font-extrabold text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={handleSendDailyWateringReminderNow}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi Nhắc Tưới Ngay</span>
          </button>

          {plantsDueForWatering.length > 0 && (
            <button
              type="button"
              onClick={handleWaterAllDuePlants}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Tưới Tất Cả Đến Hạn ({plantsDueForWatering.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: LẬP KẾ HOẠCH MỚI */}
      {activeSubTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Input Form (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <h2 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                  Thông Tin Cây & Điều Kiện Môi Trường
                </h2>
              </div>
              <span className="text-xs text-zinc-500">Bước 1/2</span>
            </div>

            {/* Quick Picks from My Garden */}
            {plants.length > 0 && (
              <div>
                <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block mb-1.5">
                  Tải nhanh từ cây trong vườn của bạn:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {plants.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPlantName(p.name);
                        setPlantCategory(p.category || 'indoor');
                        setSunlight(p.sunlight || 'partial_sun');
                        setLocation(p.location || 'Vườn nhà');
                        setEnvironmentNotes(
                          [p.soilType, p.notes].filter(Boolean).join(' • ') ||
                            'Đất tơi xốp thoát nước tốt'
                        );
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 border ${
                        plantName === p.name
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                      }`}
                    >
                      <Sprout className="w-3 h-3" />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Picks */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Gợi ý loại cây thông dụng:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PLANTS.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPlantName(qp.name);
                      setPlantCategory(qp.category);
                      setSunlight(qp.sun);
                      setLocation(qp.loc);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      plantName === qp.name
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                    }`}
                  >
                    {qp.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Plant Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Tên loại cây trồng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={plantName}
                    onChange={e => setPlantName(e.target.value)}
                    placeholder="Ví dụ: Cây Trầu Bà Lỗ, Hoa Hồng, Cà Chua..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Nhóm phân loại
                  </label>
                  <select
                    value={plantCategory}
                    onChange={e => setPlantCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600"
                  >
                    <option value="indoor">🌿 Cây cảnh trong nhà (Indoor)</option>
                    <option value="vegetable">🥦 Rau củ quả ăn lá/trái</option>
                    <option value="fruit">🍈 Cây ăn trái lâu năm</option>
                    <option value="flower">🌹 Hoa & Kiểng lá ngoài trời</option>
                    <option value="herb">🌱 Thảo mộc & Gia vị</option>
                    <option value="bonsai">🪴 Cây Bonsai nghệ thuật</option>
                  </select>
                </div>
              </div>

              {/* Location & Sunlight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Vị trí đặt cây</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Ví dụ: Ban công hướng Đông, Phòng khách, Sân thượng..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Mức độ ánh sáng</span>
                  </label>
                  <select
                    value={sunlight}
                    onChange={e => setSunlight(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600"
                  >
                    <option value="full_sun">☀️ Nắng toàn phần trực tiếp (6-8 tiếng)</option>
                    <option value="partial_sun">🌤️ Nắng bán phần / Nắng sáng sớm (3-5 tiếng)</option>
                    <option value="indirect">⛅ Nắng tán xạ gián tiếp / Cạnh cửa sổ</option>
                    <option value="shade">☁️ Bóng râm râm mát / Dưới tán cây lớn</option>
                  </select>
                </div>
              </div>

              {/* Environment Conditions: Temp & Humidity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                    <span>Nhiệt độ môi trường</span>
                  </label>
                  <input
                    type="text"
                    value={temperature}
                    onChange={e => setTemperature(e.target.value)}
                    placeholder="Ví dụ: 25°C - 32°C"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-500" />
                    <span>Độ ẩm không khí</span>
                  </label>
                  <input
                    type="text"
                    value={humidity}
                    onChange={e => setHumidity(e.target.value)}
                    placeholder="Ví dụ: 70% - 85%"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Environment Notes */}
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Đặc điểm đất trồng & Ghi chú thêm
                </label>
                <textarea
                  rows={2}
                  value={environmentNotes}
                  onChange={e => setEnvironmentNotes(e.target.value)}
                  placeholder="Ví dụ: Đất tơi xốp thoát nước nhanh trong chậu gốm có lỗ đáy..."
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600 text-xs sm:text-sm"
                />
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={isGenerating || !plantName.trim()}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>AI đang phân tích nhu cầu sinh lý của {plantName}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Đề Xuất Lịch Trình Tự Động Bằng AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Recommendation & Customization Panel (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            {generatedPlan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                        {generatedPlan.plantName}
                      </h3>
                      <p className="text-[11px] text-zinc-500 italic">
                        {generatedPlan.scientificName || 'Thực vật nhiệt đới'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                    Đề xuất AI
                  </span>
                </div>

                {/* Customizable frequency sliders */}
                <div className="space-y-3 text-xs">
                  {/* Watering */}
                  <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-100 dark:border-sky-900/60 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-sky-900 dark:text-sky-200">
                      <span className="flex items-center gap-1.5">
                        <Droplets className="w-4 h-4 text-sky-600" />
                        Tưới nước định kỳ
                      </span>
                      <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 rounded-md shadow-2xs font-extrabold text-sky-600">
                        {generatedPlan.wateringFrequencyDays} ngày / lần
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={14}
                        value={generatedPlan.wateringFrequencyDays || 3}
                        onChange={e => setGeneratedPlan({ ...generatedPlan, wateringFrequencyDays: parseInt(e.target.value, 10) })}
                        className="w-full accent-sky-600"
                      />
                    </div>
                    <p className="text-[11px] text-sky-800/80 dark:text-sky-300/80">
                      💧 {generatedPlan.recommendedWaterAmount}
                    </p>
                  </div>

                  {/* Fertilizing */}
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <Sprout className="w-4 h-4 text-emerald-600" />
                        Bón phân bổ sung
                      </span>
                      <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 rounded-md shadow-2xs font-extrabold text-emerald-600">
                        {generatedPlan.fertilizingFrequencyDays} ngày / lần
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={5}
                        max={60}
                        value={generatedPlan.fertilizingFrequencyDays || 14}
                        onChange={e => setGeneratedPlan({ ...generatedPlan, fertilizingFrequencyDays: parseInt(e.target.value, 10) })}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                      🌱 {generatedPlan.recommendedFertilizer}
                    </p>
                  </div>

                  {/* Pest Check */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900/60 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                      <span className="flex items-center gap-1.5">
                        <Bug className="w-4 h-4 text-amber-600" />
                        Kiểm tra sâu rầy & nấm
                      </span>
                      <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 rounded-md shadow-2xs font-extrabold text-amber-600">
                        {generatedPlan.pestCheckFrequencyDays} ngày / lần
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={3}
                        max={30}
                        value={generatedPlan.pestCheckFrequencyDays || 7}
                        onChange={e => setGeneratedPlan({ ...generatedPlan, pestCheckFrequencyDays: parseInt(e.target.value, 10) })}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>

                  {/* Pruning */}
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/60 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-purple-900 dark:text-purple-200">
                      <span className="flex items-center gap-1.5">
                        <Scissors className="w-4 h-4 text-purple-600" />
                        Cắt tỉa & Vệ sinh cành
                      </span>
                      <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 rounded-md shadow-2xs font-extrabold text-purple-600">
                        {generatedPlan.pruningFrequencyDays} ngày / lần
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={7}
                        max={90}
                        value={generatedPlan.pruningFrequencyDays || 30}
                        onChange={e => setGeneratedPlan({ ...generatedPlan, pruningFrequencyDays: parseInt(e.target.value, 10) })}
                        className="w-full accent-purple-600"
                      />
                    </div>
                    <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80">
                      ✂️ {generatedPlan.pruningInstructions}
                    </p>
                  </div>

                  {/* Special Notes */}
                  {generatedPlan.specialCareNotes && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl text-[11px] text-zinc-600 dark:text-zinc-300 flex items-start gap-2">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{generatedPlan.specialCareNotes}</span>
                    </div>
                  )}

                  {/* Notification Toggle & Time */}
                  <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold block text-zinc-900 dark:text-zinc-100">
                          Nhắc nhở thông báo
                        </span>
                        <span className="text-[10px] text-zinc-500">Gửi push alert khi đến lịch</span>
                      </div>
                    </div>
                    <input
                      type="time"
                      value={generatedPlan.notificationTime || '07:30'}
                      onChange={e => setGeneratedPlan({ ...generatedPlan, notificationTime: e.target.value })}
                      className="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-bold bg-white dark:bg-zinc-800"
                    />
                  </div>
                </div>

                {/* Save Plan Button */}
                <div className="pt-3">
                  <button
                    onClick={handleSavePlanToCloudSql}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu Vào Cloud SQL & Kích Hoạt Lịch Trình</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <CalendarClock className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">
                  Chưa có đề xuất lịch trình
                </h4>
                <p className="text-xs max-w-xs leading-relaxed">
                  Hãy nhập thông tin loại cây và điều kiện môi trường bên trái, sau đó bấm <strong>"Đề Xuất Lịch Trình Tự Động"</strong> để AI tính toán chu kỳ chăm sóc tối ưu nhất.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LỊCH CÔNG VIỆC CẦN LÀM (TASKS SCHEDULE) */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-4">
          {/* Today's Garden Watering Checklist */}
          <div className="bg-sky-50/70 dark:bg-sky-950/25 rounded-3xl p-4 sm:p-5 border border-sky-200 dark:border-sky-900/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                    Lịch Tưới Hàng Ngày Cho Cây Trong Vườn ({plantsDueForWatering.length} cây đến hạn)
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Tự động tính theo chu kỳ tưới & độ ẩm đất thực tế của từng cây trong vườn.
                  </p>
                </div>
              </div>
              {plantsDueForWatering.length > 0 && (
                <button
                  type="button"
                  onClick={handleWaterAllDuePlants}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã tưới tất cả hôm nay</span>
                </button>
              )}
            </div>

            {plantsDueForWatering.length === 0 ? (
              <div className="bg-white/80 dark:bg-zinc-900/70 rounded-2xl p-4 border border-sky-100 dark:border-sky-900/40 flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <span>Hôm nay tất cả {plants.length} cây trong vườn đều đã được tưới đủ nước và giữ ẩm ổn định.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plantsDueForWatering.map(p => (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-sky-200 dark:border-sky-800/70 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
                      />
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          Chu kỳ: {p.wateringFrequencyDays} ngày/lần
                          {typeof p.soilMoisturePercent === 'number'
                            ? ` • Độ ẩm: ${p.soilMoisturePercent}%`
                            : ''}
                          {p.recommendedWaterAmount ? ` • ${p.recommendedWaterAmount}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleWaterDuePlant(p.id, p.name)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Droplets className="w-3.5 h-3.5" />
                      <span>Đã tưới hôm nay</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-emerald-600" />
                <span>Danh Sách Công Việc Chăm Sóc Theo Lịch</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Lịch trình được tự động đồng bộ trên cơ sở dữ liệu Cloud SQL PostgreSQL.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {[
                { id: 'today', label: 'Hôm nay & Quá hạn' },
                { id: 'all', label: 'Tất cả công việc' },
                { id: 'completed', label: 'Lịch sử đã xong' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTaskFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    taskFilter === f.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 text-center border border-zinc-200 dark:border-zinc-800 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">
                Tuyệt vời! Không có công việc nào bị tồn đọng
              </h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Tất cả cây trồng của bạn đều đã được chăm sóc đúng lịch trình. Hãy lập thêm kế hoạch cho cây mới hoặc quay lại vào ngày mai nhé!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTasks.map(task => {
                const isOverdue = task.status === 'pending' && task.scheduledDate < todayStr;
                const isToday = task.status === 'pending' && task.scheduledDate === todayStr;

                return (
                  <div
                    key={task.id}
                    className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 border transition-all shadow-xs flex flex-col justify-between ${
                      task.status === 'completed'
                        ? 'border-zinc-200 dark:border-zinc-800 opacity-70'
                        : isOverdue
                        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10'
                        : isToday
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {task.taskType === 'water' && <Droplets className="w-4 h-4 text-sky-600" />}
                            {task.taskType === 'fertilize' && <Sprout className="w-4 h-4 text-emerald-600" />}
                            {task.taskType === 'prune' && <Scissors className="w-4 h-4 text-purple-600" />}
                            {task.taskType === 'pest_check' && <Bug className="w-4 h-4 text-amber-600" />}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                              {task.title}
                            </h4>
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {task.plantName || 'Cây trong vườn'} • {task.location || 'Vị trí đã đặt'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase ${
                            task.status === 'completed'
                              ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                              : isToday
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800'
                          }`}
                        >
                          {task.status === 'completed'
                            ? 'Đã xong'
                            : isOverdue
                            ? 'Quá hạn'
                            : isToday
                            ? 'Hôm nay'
                            : task.scheduledDate}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 pl-1">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-zinc-400">
                        Lặp lại: {task.frequencyDays} ngày/lần
                      </span>

                      {task.status === 'pending' ? (
                        <button
                          onClick={() => handleCompleteTask(task)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Đánh dấu xong</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Hoàn thành lúc {task.completedAt ? new Date(task.completedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: CÂY ĐANG CHĂM SÓC (ACTIVE PLANS LIST) */}
      {activeSubTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
              Danh Sách Kế Hoạch Đang Theo Dõi ({plans.length})
            </h3>
            <button
              onClick={() => setActiveSubTab('create')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Kế Hoạch Cây Mới</span>
            </button>
          </div>

          {plans.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 text-center border border-zinc-200 dark:border-zinc-800 space-y-2">
              <Sprout className="w-12 h-12 text-zinc-300 mx-auto" />
              <h4 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">
                Chưa có kế hoạch chăm sóc nào
              </h4>
              <p className="text-xs text-zinc-500">
                Hãy chuyển sang tab "Lập Kế Hoạch Mới" để tạo lịch trình chăm sóc tự động cho cây đầu tiên của bạn!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(p => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                          {p.plantName}
                        </h4>
                        <p className="text-[11px] text-zinc-500 italic">
                          {p.scientificName || 'Thực vật nhiệt đới'}
                        </p>
                      </div>
                      {confirmDeletePlanId === p.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeletePlan(p.id)}
                            className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer hover:bg-rose-700"
                          >
                            Xác nhận xóa
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePlanId(null)}
                            className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePlanId(p.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Xóa kế hoạch này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="text-xs space-y-1 text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{p.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Ánh sáng: {p.sunlight}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200">
                        <span className="block font-bold">💧 Tưới nước</span>
                        <span>{p.wateringFrequencyDays} ngày/lần</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">
                        <span className="block font-bold">🌱 Bón phân</span>
                        <span>{p.fertilizingFrequencyDays} ngày/lần</span>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
                        <span className="block font-bold">🐛 Sâu bệnh</span>
                        <span>{p.pestCheckFrequencyDays} ngày/lần</span>
                      </div>
                      <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200">
                        <span className="block font-bold">✂️ Cắt tỉa</span>
                        <span>{p.pruningFrequencyDays} ngày/lần</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Nhắc lúc {p.notificationTime || '07:30'}
                    </span>
                    <button
                      onClick={() => {
                        setTaskFilter('all');
                        setActiveSubTab('tasks');
                      }}
                      className="text-emerald-600 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span>Xem lịch</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 30-DAY SOIL MOISTURE & NUTRIENT TREND GRAPH (Recharts) */}
      <SoilNutrientTrendChart
        plans={plans}
        tasks={tasks}
        customReadings={customReadings}
        onReadingsChange={setCustomReadings}
        onCreatePlanClick={() => setActiveSubTab('create')}
      />
    </div>
  );
};
