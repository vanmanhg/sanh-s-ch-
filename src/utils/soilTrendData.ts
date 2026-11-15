import { CareLog, Language, Plant } from '../types';

export interface CarePlanSummary {
  id: number;
  plantName: string;
  scientificName?: string;
  plantCategory?: string;
  location: string;
  sunlight: string;
  wateringFrequencyDays: number;
  fertilizingFrequencyDays: number;
}

export interface CareTaskSummary {
  id: number;
  planId: number;
  taskType: string;
  title: string;
  scheduledDate: string;
  status: 'pending' | 'completed' | 'skipped';
  completedAt?: string;
  plantName?: string;
}

export interface CustomTelemetryReading {
  id: string;
  targetKey: string;
  dateIso: string; // YYYY-MM-DD
  soilMoisturePct?: number;
  nutrientLevelPct?: number;
  eventTag?: 'water' | 'fertilize' | 'manual';
  note?: string;
  updatedAt: string;
}

export interface SoilNutrientPoint {
  dayIndex: number; // 0..29
  dateIso: string; // YYYY-MM-DD
  dateLabel: string; // e.g. 14/10
  fullDateLabel: string;
  soilMoisturePct: number;
  nutrientLevelPct: number;
  targetMinMoisture: number;
  targetMaxMoisture: number;
  targetMinNutrient: number;
  events: Array<'water' | 'fertilize' | 'manual'>;
  eventNote?: string;
}

export interface TrendTargetOption {
  key: string;
  source: 'plan' | 'plant';
  name: string;
  subtitle: string;
  wateringFrequencyDays: number;
  fertilizingFrequencyDays: number;
  sunlight: string;
  currentMoisturePct?: number;
  minMoistureThreshold: number;
  maxMoistureThreshold: number;
  lastWatered?: string;
  lastFertilized?: string;
  careLogs: CareLog[];
  planId?: number;
  plantId?: string;
}

export interface TrendSummaryStats {
  avgMoisture: number;
  avgNutrient: number;
  latestMoisture: number;
  latestNutrient: number;
  moistureDeltaFromStart: number;
  nutrientDeltaFromStart: number;
  daysBelowMoistureMin: number;
  daysOptimalBoth: number;
  waterEventsCount: number;
  fertilizeEventsCount: number;
}

const TELEMETRY_STORAGE_KEY = 'nongtro_care_telemetry_logs';

export function loadTelemetryReadings(): CustomTelemetryReading[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTelemetryReading(
  reading: Omit<CustomTelemetryReading, 'id' | 'updatedAt'>
): CustomTelemetryReading[] {
  const existing = loadTelemetryReadings();
  const filtered = existing.filter(
    r => !(r.targetKey === reading.targetKey && r.dateIso === reading.dateIso)
  );
  const next: CustomTelemetryReading[] = [
    {
      ...reading,
      id: `tel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      updatedAt: new Date().toISOString()
    },
    ...filtered
  ].slice(0, 400);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function toLocalDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getLocaleForLanguage(language: Language): string {
  switch (language) {
    case 'en':
      return 'en-US';
    case 'zh':
      return 'zh-CN';
    case 'km':
      return 'km-KH';
    case 'ja':
      return 'ja-JP';
    case 'vi':
    default:
      return 'vi-VN';
  }
}

export function buildTrendTargetOptions(
  plans: CarePlanSummary[],
  plants: Plant[]
): TrendTargetOption[] {
  const options: TrendTargetOption[] = [];

  for (const plan of plans) {
    const matchedPlant = plants.find(
      p => p.name.toLowerCase() === plan.plantName.toLowerCase()
    );
    options.push({
      key: `plan-${plan.id}`,
      source: 'plan',
      planId: plan.id,
      plantId: matchedPlant?.id,
      name: plan.plantName,
      subtitle: plan.location || matchedPlant?.location || '',
      wateringFrequencyDays: Math.max(1, plan.wateringFrequencyDays || 3),
      fertilizingFrequencyDays: Math.max(3, plan.fertilizingFrequencyDays || 14),
      sunlight: plan.sunlight || 'partial_sun',
      currentMoisturePct: matchedPlant?.soilMoisturePercent,
      minMoistureThreshold: matchedPlant?.minMoistureThreshold ?? 45,
      maxMoistureThreshold: matchedPlant?.maxMoistureThreshold ?? 78,
      lastWatered: matchedPlant?.lastWatered,
      lastFertilized: matchedPlant?.lastFertilized,
      careLogs: matchedPlant?.careLogs ?? []
    });
  }

  for (const plant of plants) {
    const alreadyCovered = options.some(
      o => o.plantId === plant.id || o.name.toLowerCase() === plant.name.toLowerCase()
    );
    if (!alreadyCovered) {
      options.push({
        key: `plant-${plant.id}`,
        source: 'plant',
        plantId: plant.id,
        name: plant.name,
        subtitle: plant.location || plant.soilType || '',
        wateringFrequencyDays: Math.max(1, plant.wateringFrequencyDays || 3),
        fertilizingFrequencyDays: 14,
        sunlight: plant.sunlight || 'partial_sun',
        currentMoisturePct: plant.soilMoisturePercent,
        minMoistureThreshold: plant.minMoistureThreshold ?? 45,
        maxMoistureThreshold: plant.maxMoistureThreshold ?? 78,
        lastWatered: plant.lastWatered,
        lastFertilized: plant.lastFertilized,
        careLogs: plant.careLogs ?? []
      });
    }
  }

  return options;
}

export function build30DaySoilNutrientSeries(params: {
  target: TrendTargetOption;
  tasks: CareTaskSummary[];
  customReadings: CustomTelemetryReading[];
  language: Language;
}): SoilNutrientPoint[] {
  const { target, tasks, customReadings, language } = params;
  const locale = getLocaleForLanguage(language);
  const seed = hashSeed(target.key + target.name);

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const targetMinMoisture = clamp(target.minMoistureThreshold, 20, 75);
  const targetMaxMoisture = clamp(target.maxMoistureThreshold, targetMinMoisture + 10, 95);
  const targetMinNutrient = 55;

  // Sun exposure impacts daily evapotranspiration rate
  const sunMultiplier =
    target.sunlight === 'full_sun'
      ? 1.28
      : target.sunlight === 'partial_sun'
      ? 1.05
      : target.sunlight === 'indirect'
      ? 0.85
      : 0.72;

  const waterFreq = Math.max(1, target.wateringFrequencyDays);
  const fertFreq = Math.max(5, target.fertilizingFrequencyDays);

  // Gather real watering / fertilizing events mapped by YYYY-MM-DD
  const waterDates = new Set<string>();
  const fertilizeDates = new Set<string>();

  for (const log of target.careLogs) {
    const iso = log.date.split('T')[0];
    if (log.type === 'water') waterDates.add(iso);
    if (log.type === 'fertilize') fertilizeDates.add(iso);
  }
  if (target.lastWatered) {
    waterDates.add(target.lastWatered.split('T')[0]);
  }
  if (target.lastFertilized) {
    fertilizeDates.add(target.lastFertilized.split('T')[0]);
  }

  for (const task of tasks) {
    const matchesTarget =
      (target.planId !== undefined && task.planId === target.planId) ||
      (task.plantName && task.plantName.toLowerCase() === target.name.toLowerCase());
    if (!matchesTarget || task.status !== 'completed') continue;
    const iso = (task.completedAt || task.scheduledDate).split('T')[0];
    if (task.taskType === 'water') waterDates.add(iso);
    if (task.taskType === 'fertilize') fertilizeDates.add(iso);
  }

  const customByDate = new Map<string, CustomTelemetryReading>();
  for (const r of customReadings) {
    if (r.targetKey === target.key || r.targetKey === target.name) {
      if (!customByDate.has(r.dateIso)) {
        customByDate.set(r.dateIso, r);
      }
    }
  }

  const days: SoilNutrientPoint[] = [];
  let moisture = clamp(
    targetMinMoisture + (targetMaxMoisture - targetMinMoisture) * 0.65 + (seed % 9) - 4,
    30,
    85
  );
  let nutrient = clamp(64 + (seed % 15), 50, 88);

  const dailyMoistureDecay =
    clamp(((targetMaxMoisture - targetMinMoisture) / Math.max(1.5, waterFreq)) * sunMultiplier, 3.5, 16);
  const dailyNutrientDecay = clamp(24 / Math.max(7, fertFreq), 0.9, 3.2);

  for (let offset = -29; offset <= 0; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dateIso = toLocalDateIso(d);
    const dayIndex = offset + 29;
    const wave = Math.sin((dayIndex + (seed % 7)) * 0.65) * 2.2;

    const events: Array<'water' | 'fertilize' | 'manual'> = [];
    const custom = customByDate.get(dateIso);

    const scheduledWaterDay = (dayIndex + (seed % waterFreq)) % waterFreq === 0 && offset < 0;
    const scheduledFertDay = (dayIndex + (seed % fertFreq)) % fertFreq === 0 && offset < 0;

    const didWater = waterDates.has(dateIso) || custom?.eventTag === 'water' || (!waterDates.size && scheduledWaterDay);
    const didFertilize =
      fertilizeDates.has(dateIso) || custom?.eventTag === 'fertilize' || (!fertilizeDates.size && scheduledFertDay);

    if (didWater) {
      moisture = clamp(targetMaxMoisture + 4 + ((seed + dayIndex) % 5) - 2, 58, 92);
      events.push('water');
    } else {
      moisture = clamp(moisture - dailyMoistureDecay + wave * 0.45, 18, 94);
    }

    if (didFertilize) {
      nutrient = clamp(nutrient + 22 + ((seed + dayIndex) % 6), 68, 95);
      events.push('fertilize');
    } else {
      nutrient = clamp(nutrient - dailyNutrientDecay + Math.cos((dayIndex + seed) * 0.4) * 0.6, 26, 95);
    }

    // Anchor today's point with live plant moisture if no explicit override was logged today
    if (offset === 0 && typeof target.currentMoisturePct === 'number' && custom?.soilMoisturePct === undefined) {
      moisture = clamp(target.currentMoisturePct, 10, 98);
    }

    if (custom) {
      if (typeof custom.soilMoisturePct === 'number') {
        moisture = clamp(custom.soilMoisturePct, 5, 100);
      }
      if (typeof custom.nutrientLevelPct === 'number') {
        nutrient = clamp(custom.nutrientLevelPct, 5, 100);
      }
      if (!events.includes('manual')) {
        events.push('manual');
      }
    }

    const dateLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const fullDateLabel = d.toLocaleDateString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    days.push({
      dayIndex,
      dateIso,
      dateLabel,
      fullDateLabel,
      soilMoisturePct: Math.round(moisture),
      nutrientLevelPct: Math.round(nutrient),
      targetMinMoisture,
      targetMaxMoisture,
      targetMinNutrient,
      events,
      eventNote: custom?.note
    });
  }

  return days;
}

export function summarize30DayTrend(points: SoilNutrientPoint[]): TrendSummaryStats {
  if (points.length === 0) {
    return {
      avgMoisture: 0,
      avgNutrient: 0,
      latestMoisture: 0,
      latestNutrient: 0,
      moistureDeltaFromStart: 0,
      nutrientDeltaFromStart: 0,
      daysBelowMoistureMin: 0,
      daysOptimalBoth: 0,
      waterEventsCount: 0,
      fertilizeEventsCount: 0
    };
  }

  const totalMoisture = points.reduce((acc, p) => acc + p.soilMoisturePct, 0);
  const totalNutrient = points.reduce((acc, p) => acc + p.nutrientLevelPct, 0);
  const first = points[0];
  const last = points[points.length - 1];

  return {
    avgMoisture: Math.round(totalMoisture / points.length),
    avgNutrient: Math.round(totalNutrient / points.length),
    latestMoisture: last.soilMoisturePct,
    latestNutrient: last.nutrientLevelPct,
    moistureDeltaFromStart: last.soilMoisturePct - first.soilMoisturePct,
    nutrientDeltaFromStart: last.nutrientLevelPct - first.nutrientLevelPct,
    daysBelowMoistureMin: points.filter(p => p.soilMoisturePct < p.targetMinMoisture).length,
    daysOptimalBoth: points.filter(
      p =>
        p.soilMoisturePct >= p.targetMinMoisture &&
        p.soilMoisturePct <= p.targetMaxMoisture &&
        p.nutrientLevelPct >= p.targetMinNutrient
    ).length,
    waterEventsCount: points.filter(p => p.events.includes('water')).length,
    fertilizeEventsCount: points.filter(p => p.events.includes('fertilize')).length
  };
}

export interface TrendChartCopy {
  title: string;
  subtitle: string;
  tabLabel: string;
  selectTarget: string;
  seriesMoisture: string;
  seriesNutrient: string;
  seriesOptimalBand: string;
  kpiAvgMoisture: string;
  kpiAvgNutrient: string;
  kpiDryDays: string;
  kpiOptimalDays: string;
  daysSuffix: string;
  targetBandLabel: string;
  eventWatered: string;
  eventFertilized: string;
  eventLogged: string;
  logReadingTitle: string;
  moistureInputLabel: string;
  nutrientInputLabel: string;
  logReadingBtn: string;
  logSavedFeedback: string;
  emptyTitle: string;
  emptyDesc: string;
  emptyAction: string;
  window30d: string;
  window14d: string;
  sourcePlan: string;
  sourceGarden: string;
}

const CHART_COPY: Record<Language, TrendChartCopy> = {
  vi: {
    title: 'Xu Hướng Độ Ẩm Đất & Dinh Dưỡng 30 Ngày',
    subtitle: 'Theo dõi biến động độ ẩm giá thể (%) và chỉ số dinh dưỡng NPK (%) qua chu kỳ tưới — bón phân',
    tabLabel: 'Biểu Đồ 30 Ngày',
    selectTarget: 'Cây trồng theo dõi',
    seriesMoisture: 'Độ ẩm đất (%)',
    seriesNutrient: 'Chỉ số dinh dưỡng (%)',
    seriesOptimalBand: 'Vùng ẩm tối ưu',
    kpiAvgMoisture: 'Độ ẩm TB 30 ngày',
    kpiAvgNutrient: 'Dinh dưỡng TB 30 ngày',
    kpiDryDays: 'Ngày dưới ngưỡng ẩm',
    kpiOptimalDays: 'Ngày đạt chuẩn kép',
    daysSuffix: 'ngày',
    targetBandLabel: 'Ngưỡng tối ưu',
    eventWatered: 'Đã tưới nước',
    eventFertilized: 'Đã bón phân',
    eventLogged: 'Ghi nhận thực tế',
    logReadingTitle: 'Cập nhật chỉ số đo hôm nay',
    moistureInputLabel: 'Độ ẩm đất (%)',
    nutrientInputLabel: 'Dinh dưỡng NPK (%)',
    logReadingBtn: 'Lưu chỉ số hôm nay',
    logSavedFeedback: 'Đã cập nhật điểm đo hôm nay lên biểu đồ.',
    emptyTitle: 'Chưa có cây trồng để hiển thị biểu đồ',
    emptyDesc: 'Hãy tạo kế hoạch chăm sóc hoặc thêm cây vào Vườn Của Tôi để bắt đầu theo dõi xu hướng 30 ngày.',
    emptyAction: 'Lập kế hoạch ngay',
    window30d: '30 ngày',
    window14d: '14 ngày',
    sourcePlan: 'Kế hoạch',
    sourceGarden: 'Vườn'
  },
  en: {
    title: '30-Day Soil Moisture & Nutrient Trends',
    subtitle: 'Track substrate moisture (%) and NPK nutrient availability (%) across watering and feeding cycles',
    tabLabel: '30-Day Trends',
    selectTarget: 'Tracked plant',
    seriesMoisture: 'Soil Moisture (%)',
    seriesNutrient: 'Nutrient Level (%)',
    seriesOptimalBand: 'Optimal Moisture Band',
    kpiAvgMoisture: '30d Avg Moisture',
    kpiAvgNutrient: '30d Avg Nutrients',
    kpiDryDays: 'Days Below Min',
    kpiOptimalDays: 'Dual-Optimal Days',
    daysSuffix: 'days',
    targetBandLabel: 'Target band',
    eventWatered: 'Watered',
    eventFertilized: 'Fertilized',
    eventLogged: 'Logged reading',
    logReadingTitle: 'Log today’s field measurement',
    moistureInputLabel: 'Soil Moisture (%)',
    nutrientInputLabel: 'Nutrient Level (%)',
    logReadingBtn: 'Save Reading',
    logSavedFeedback: 'Today’s measurement recorded on the trend graph.',
    emptyTitle: 'No tracked plants yet',
    emptyDesc: 'Create a care plan or add a plant to My Garden to visualize 30-day soil and nutrient trends.',
    emptyAction: 'Create Care Plan',
    window30d: '30 days',
    window14d: '14 days',
    sourcePlan: 'Plan',
    sourceGarden: 'Garden'
  },
  zh: {
    title: '30天土壤湿度与养分趋势',
    subtitle: '追踪浇水与施肥周期内的基质湿度 (%) 与氮磷钾养分指数 (%) 变化',
    tabLabel: '30天趋势图',
    selectTarget: '监测作物',
    seriesMoisture: '土壤湿度 (%)',
    seriesNutrient: '养分指数 (%)',
    seriesOptimalBand: '最佳湿度区间',
    kpiAvgMoisture: '30天平均湿度',
    kpiAvgNutrient: '30天平均养分',
    kpiDryDays: '低于下限天数',
    kpiOptimalDays: '双项达标天数',
    daysSuffix: '天',
    targetBandLabel: '目标区间',
    eventWatered: '已浇水',
    eventFertilized: '已施肥',
    eventLogged: '实测记录',
    logReadingTitle: '记录今日实测数据',
    moistureInputLabel: '土壤湿度 (%)',
    nutrientInputLabel: '养分指数 (%)',
    logReadingBtn: '保存今日数据',
    logSavedFeedback: '已将今日测量值更新至趋势图。',
    emptyTitle: '暂无可分析的植物',
    emptyDesc: '请先创建养护计划或在我的花园中添加植物，即可查看30天趋势曲线。',
    emptyAction: '立即创建计划',
    window30d: '30天',
    window14d: '14天',
    sourcePlan: '计划',
    sourceGarden: '花园'
  },
  km: {
    title: 'និន្នាការសំណើមដី និងសារធាតុចិញ្ចឹម ៣០ ថ្ងៃ',
    subtitle: 'តាមដានការប្រែប្រួលសំណើមដី (%) និងសន្ទស្សន៍សារធាតុចិញ្ចឹម (%) តាមវដ្តស្រោចទឹក និងដាក់ជី',
    tabLabel: 'ក្រាហ្វ ៣០ ថ្ងៃ',
    selectTarget: 'រុក្ខជាតិដែលតាមដាន',
    seriesMoisture: 'សំណើមដី (%)',
    seriesNutrient: 'សារធាតុចិញ្ចឹម (%)',
    seriesOptimalBand: 'កម្រិតសំណើមល្អបំផុត',
    kpiAvgMoisture: 'សំណើមមធ្យម ៣០ថ្ងៃ',
    kpiAvgNutrient: 'ជីជាតិមធ្យម ៣០ថ្ងៃ',
    kpiDryDays: 'ថ្ងៃក្រោមកម្រិត',
    kpiOptimalDays: 'ថ្ងៃសមស្របទាំងពីរ',
    daysSuffix: 'ថ្ងៃ',
    targetBandLabel: 'កម្រិតគោលដៅ',
    eventWatered: 'បានស្រោចទឹក',
    eventFertilized: 'បានដាក់ជី',
    eventLogged: 'កំណត់ត្រាជាក់ស្តែង',
    logReadingTitle: 'កត់ត្រាទិន្នន័យវាស់ស្ទង់ថ្ងៃនេះ',
    moistureInputLabel: 'សំណើមដី (%)',
    nutrientInputLabel: 'សារធាតុចិញ្ចឹម (%)',
    logReadingBtn: 'រក្សាទុកទិន្នន័យ',
    logSavedFeedback: 'បានធ្វើបច្ចុប្បន្នភាពទិន្នន័យថ្ងៃនេះលើក្រាហ្វ។',
    emptyTitle: 'មិនទាន់មានរុក្ខជាតិសម្រាប់បង្ហាញក្រាហ្វ',
    emptyDesc: 'សូមបង្កើតផែនការថែទាំ ឬបន្ថែមរុក្ខជាតិទៅក្នុងសួនរបស់ខ្ញុំជាមុនសិន។',
    emptyAction: 'បង្កើតផែនការ',
    window30d: '៣០ ថ្ងៃ',
    window14d: '១៤ ថ្ងៃ',
    sourcePlan: 'ផែនការ',
    sourceGarden: 'សួន'
  },
  ja: {
    title: '過去30日間の土壌水分・養分トレンド',
    subtitle: '水やりと施肥サイクルに伴う土壌水分率 (%) とNPK養分指数 (%) の推移を可視化',
    tabLabel: '30日間グラフ',
    selectTarget: '対象植物',
    seriesMoisture: '土壌水分 (%)',
    seriesNutrient: '養分レベル (%)',
    seriesOptimalBand: '適正水分ゾーン',
    kpiAvgMoisture: '30日平均水分',
    kpiAvgNutrient: '30日平均養分',
    kpiDryDays: '下限未満の日数',
    kpiOptimalDays: '両方適正の日数',
    daysSuffix: '日',
    targetBandLabel: '適正範囲',
    eventWatered: '水やり実施',
    eventFertilized: '施肥実施',
    eventLogged: '実測記録',
    logReadingTitle: '本日の計測値を記録',
    moistureInputLabel: '土壌水分 (%)',
    nutrientInputLabel: '養分レベル (%)',
    logReadingBtn: '本日の値を保存',
    logSavedFeedback: '本日の実測値をグラフに反映しました。',
    emptyTitle: '計測対象の植物がありません',
    emptyDesc: 'ケア計画を作成するか、マイガーデンに植物を追加すると30日間の推移が表示されます。',
    emptyAction: '計画を作成',
    window30d: '30日間',
    window14d: '14日間',
    sourcePlan: '計画',
    sourceGarden: 'ガーデン'
  }
};

export function getTrendChartCopy(language: Language): TrendChartCopy {
  return CHART_COPY[language] || CHART_COPY.vi;
}
