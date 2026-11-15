import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useApp } from '../context/AppContext';
import {
  AgriculturalCommodity,
  CropCategory,
  DailyPricePoint,
  MARKET_COMMODITIES,
  computeMovingAverage
} from '../data/marketPricesData';
import { D3PriceSparkline } from './D3PriceSparkline';
import { Language } from '../types';
import {
  Bell,
  Download,
  Edit3,
  RotateCcw,
  Search,
  Star,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

interface MarketPriceViewProps {
  embedded?: boolean;
}

type TimeRange = '7D' | '14D' | '30D';
type CategoryFilter = 'all' | CropCategory | 'tracked';

const STORAGE_WATCHLIST = 'nongtro_market_watchlist_v1';
const STORAGE_TARGETS = 'nongtro_market_targets_v1';
const STORAGE_OVERRIDES = 'nongtro_market_local_overrides_v1';

interface LocalizedMarketCopy {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  allCrops: string;
  rice: string;
  coffee: string;
  vegetables: string;
  fruits: string;
  tracked: string;
  latestPrice: string;
  dailyChange: string;
  periodChange: string;
  periodRange: string;
  dailyVolume: string;
  tonsUnit: string;
  movingAvg: string;
  compareWith: string;
  noCompare: string;
  targetPrice: string;
  setTarget: string;
  clearTarget: string;
  targetHit: string;
  targetWaiting: string;
  recordLocalPrice: string;
  resetLocalPrice: string;
  savePrice: string;
  exportCsv: string;
  marketBrief: string;
  tableCrop: string;
  tableTrend: string;
  tablePrice: string;
  tableChange: string;
  tableRange30d: string;
  tableVolume: string;
  tableTrack: string;
  trackBtn: string;
  trackingBtn: string;
  emptyTitle: string;
  emptyDesc: string;
  resetFilters: string;
  highLabel: string;
  lowLabel: string;
  volumeLabel: string;
  maLabel: string;
  localOverrideTag: string;
}

const MARKET_COPY: Record<Language, LocalizedMarketCopy> = {
  vi: {
    title: 'Biểu Đồ Giá Nông Sản Hàng Ngày',
    subtitle: 'Theo dõi diễn biến giá lúa gạo, cà phê, rau củ và trái cây theo ngày bằng biểu đồ D3.js',
    searchPlaceholder: 'Tìm lúa OM 5451, cà phê Robusta, cà chua...',
    allCrops: 'Tất cả',
    rice: 'Lúa & Gạo',
    coffee: 'Cà Phê & Tiêu',
    vegetables: 'Rau Củ',
    fruits: 'Trái Cây',
    tracked: 'Đang theo dõi',
    latestPrice: 'Giá hôm nay',
    dailyChange: 'Biến động ngày',
    periodChange: 'Biến động kỳ',
    periodRange: 'Biên độ thấp – cao',
    dailyVolume: 'Sản lượng giao dịch',
    tonsUnit: 'tấn/ngày',
    movingAvg: 'Đường TB 7 ngày',
    compareWith: 'So sánh:',
    noCompare: 'Không so sánh',
    targetPrice: 'Giá bán mục tiêu (đ/kg)',
    setTarget: 'Đặt ngưỡng',
    clearTarget: 'Xóa',
    targetHit: 'Đạt giá mục tiêu',
    targetWaiting: 'Chờ chạm ngưỡng',
    recordLocalPrice: 'Ghi giá thu mua tại vườn hôm nay',
    resetLocalPrice: 'Khôi phục giá chuẩn',
    savePrice: 'Cập nhật',
    exportCsv: 'Xuất CSV',
    marketBrief: 'Nhận định thị trường khu vực',
    tableCrop: 'Nông sản & Vùng thu mua',
    tableTrend: 'Xu hướng ngày',
    tablePrice: 'Giá hiện tại',
    tableChange: 'Ngày / Kỳ',
    tableRange30d: 'Biên độ 30 ngày',
    tableVolume: 'Khối lượng',
    tableTrack: 'Theo dõi',
    trackBtn: 'Theo dõi',
    trackingBtn: 'Đang theo dõi',
    emptyTitle: 'Không tìm thấy nông sản phù hợp',
    emptyDesc: 'Hãy thử từ khóa khác hoặc bỏ bộ lọc khu vực/nhóm cây.',
    resetFilters: 'Đặt lại bộ lọc',
    highLabel: 'Cao nhất',
    lowLabel: 'Thấp nhất',
    volumeLabel: 'Khối lượng',
    maLabel: 'TB 7 ngày',
    localOverrideTag: 'Giá vườn đã ghi'
  },
  en: {
    title: 'Daily Agricultural Market Prices',
    subtitle: 'Track daily price trends for rice, coffee, vegetables, and regional fruits powered by D3.js',
    searchPlaceholder: 'Search rice, coffee, tomatoes, region...',
    allCrops: 'All Crops',
    rice: 'Rice',
    coffee: 'Coffee & Spices',
    vegetables: 'Vegetables',
    fruits: 'Fruits',
    tracked: 'Watchlist',
    latestPrice: 'Latest Price',
    dailyChange: '24h Change',
    periodChange: 'Period Change',
    periodRange: 'Period Low – High',
    dailyVolume: 'Daily Volume',
    tonsUnit: 'tons/day',
    movingAvg: '7-Day Moving Avg',
    compareWith: 'Compare:',
    noCompare: 'None',
    targetPrice: 'Target Sell Price (VND/kg)',
    setTarget: 'Set Target',
    clearTarget: 'Clear',
    targetHit: 'Target Reached',
    targetWaiting: 'Below Target',
    recordLocalPrice: 'Log today’s local farm-gate price',
    resetLocalPrice: 'Reset baseline',
    savePrice: 'Update',
    exportCsv: 'Export CSV',
    marketBrief: 'Regional Market Brief',
    tableCrop: 'Commodity & Region',
    tableTrend: 'Daily Trend',
    tablePrice: 'Current Price',
    tableChange: '24h / Period',
    tableRange30d: '30D Spread',
    tableVolume: 'Volume',
    tableTrack: 'Watch',
    trackBtn: 'Track',
    trackingBtn: 'Tracking',
    emptyTitle: 'No matching commodities',
    emptyDesc: 'Try another search keyword or clear active category filters.',
    resetFilters: 'Reset Filters',
    highLabel: 'High',
    lowLabel: 'Low',
    volumeLabel: 'Volume',
    maLabel: '7D Avg',
    localOverrideTag: 'Local quote'
  },
  zh: {
    title: '每日农产品市场行情',
    subtitle: '基于 D3.js 实时追踪大米、咖啡、蔬菜与水果的每日价格走势',
    searchPlaceholder: '搜索水稻、咖啡、番茄或产区...',
    allCrops: '全部',
    rice: '稻谷大米',
    coffee: '咖啡胡椒',
    vegetables: '新鲜蔬菜',
    fruits: '热带水果',
    tracked: '自选关注',
    latestPrice: '今日报价',
    dailyChange: '日涨跌幅',
    periodChange: '区间涨跌',
    periodRange: '区间最低–最高',
    dailyVolume: '日成交量',
    tonsUnit: '吨/日',
    movingAvg: '7日均线',
    compareWith: '对比:',
    noCompare: '不对比',
    targetPrice: '目标收购价 (VND/kg)',
    setTarget: '设置提醒',
    clearTarget: '清除',
    targetHit: '已达目标价',
    targetWaiting: '等待触发',
    recordLocalPrice: '录入今日田头收购价',
    resetLocalPrice: '恢复基准价',
    savePrice: '更新',
    exportCsv: '导出 CSV',
    marketBrief: '产区市场简报',
    tableCrop: '农产品与产区',
    tableTrend: '每日走势',
    tablePrice: '最新价格',
    tableChange: '日 / 区间',
    tableRange30d: '30日区间',
    tableVolume: '成交量',
    tableTrack: '关注',
    trackBtn: '关注',
    trackingBtn: '已关注',
    emptyTitle: '未找到匹配的农产品',
    emptyDesc: '请尝试更换关键词或清除筛选条件。',
    resetFilters: '重置筛选',
    highLabel: '最高',
    lowLabel: '最低',
    volumeLabel: '成交量',
    maLabel: '7日均价',
    localOverrideTag: '本地报价'
  },
  km: {
    title: 'តម្លៃកសិផលប្រចាំថ្ងៃ',
    subtitle: 'តាមដាននិន្នាការតម្លៃប្រចាំថ្ងៃសម្រាប់ស្រូវ កាហ្វេ បន្លែ និងផ្លែឈើដោយប្រើ D3.js',
    searchPlaceholder: 'ស្វែងរក ស្រូវ កាហ្វេ ប៉េងប៉ោះ...',
    allCrops: 'ទាំងអស់',
    rice: 'ស្រូវ & អង្ករ',
    coffee: 'កាហ្វេ & ម្រេច',
    vegetables: 'បន្លែ',
    fruits: 'ផ្លែឈើ',
    tracked: 'កំពុងតាមដាន',
    latestPrice: 'តម្លៃថ្ងៃនេះ',
    dailyChange: 'បម្រែបម្រួលថ្ងៃនេះ',
    periodChange: 'បម្រែបម្រួលរយៈពេល',
    periodRange: 'ទាប – ខ្ពស់',
    dailyVolume: 'បរិមាណជួញដូរ',
    tonsUnit: 'តោន/ថ្ងៃ',
    movingAvg: 'មធ្យម ៧ ថ្ងៃ',
    compareWith: 'ប្រៀបធៀប:',
    noCompare: 'គ្មាន',
    targetPrice: 'តម្លៃគោលដៅ (VND/kg)',
    setTarget: 'កំណត់គោលដៅ',
    clearTarget: 'លុប',
    targetHit: 'ដល់តម្លៃគោលដៅ',
    targetWaiting: 'រង់ចាំតម្លៃ',
    recordLocalPrice: 'កត់ត្រាតម្លៃកសិដ្ឋានថ្ងៃនេះ',
    resetLocalPrice: 'ស្តារតម្លៃដើម',
    savePrice: 'ធ្វើបច្ចុប្បន្នភាព',
    exportCsv: 'ទាញយក CSV',
    marketBrief: 'ការវិភាគទីផ្សារតំបន់',
    tableCrop: 'កសិផល & តំបន់',
    tableTrend: 'និន្នាការប្រចាំថ្ងៃ',
    tablePrice: 'តម្លៃបច្ចុប្បន្ន',
    tableChange: 'ថ្ងៃ / រយៈពេល',
    tableRange30d: 'ចន្លោះ ៣០ ថ្ងៃ',
    tableVolume: 'បរិមាណ',
    tableTrack: 'តាមដាន',
    trackBtn: 'តាមដាន',
    trackingBtn: 'កំពុងតាមដាន',
    emptyTitle: 'រកមិនឃើញកសិផលទេ',
    emptyDesc: 'សូមសាកល្បងពាក្យស្វែងរកផ្សេងទៀត ឬកំណត់តម្រងឡើងវិញ។',
    resetFilters: 'កំណត់តម្រងឡើងវិញ',
    highLabel: 'ខ្ពស់បំផុត',
    lowLabel: 'ទាបបំផុត',
    volumeLabel: 'បរិមាណ',
    maLabel: 'មធ្យម ៧ ថ្ងៃ',
    localOverrideTag: 'តម្លៃក្នុងស្រុក'
  },
  ja: {
    title: '農産物 日別市場価格トレンド',
    subtitle: 'D3.js を用いて米・コーヒー・野菜・果物の日次価格推移を追跡',
    searchPlaceholder: '米、コーヒー、トマト、産地を検索...',
    allCrops: 'すべて',
    rice: '米・穀物',
    coffee: 'コーヒー・香辛料',
    vegetables: '野菜',
    fruits: '果物',
    tracked: '追跡中',
    latestPrice: '本日の価格',
    dailyChange: '前日比',
    periodChange: '期間比',
    periodRange: '期間安値 – 高値',
    dailyVolume: '日次取引量',
    tonsUnit: 'トン/日',
    movingAvg: '7日移動平均',
    compareWith: '比較:',
    noCompare: '比較なし',
    targetPrice: '目標販売価格 (VND/kg)',
    setTarget: '設定',
    clearTarget: '解除',
    targetHit: '目標価格到達',
    targetWaiting: '目標待ち',
    recordLocalPrice: '本日の産地買取価格を記録',
    resetLocalPrice: '基準価格に戻す',
    savePrice: '更新',
    exportCsv: 'CSV出力',
    marketBrief: '地域市場サマリー',
    tableCrop: '品目・産地',
    tableTrend: '日次推移',
    tablePrice: '現在価格',
    tableChange: '前日 / 期間',
    tableRange30d: '30日レンジ',
    tableVolume: '取引量',
    tableTrack: '追跡',
    trackBtn: '追跡',
    trackingBtn: '追跡中',
    emptyTitle: '該当する農産物が見つかりません',
    emptyDesc: '検索キーワードまたはカテゴリーフィルターを変更してください。',
    resetFilters: 'フィルターをリセット',
    highLabel: '高値',
    lowLabel: '安値',
    volumeLabel: '取引量',
    maLabel: '7日平均',
    localOverrideTag: '現地記録'
  }
};

interface ParsedPoint extends DailyPricePoint {
  dateObj: Date;
  maPrice: number;
  pctFromStart: number;
  comparePrice?: number;
  comparePctFromStart?: number;
}

function formatCompactPrice(val: number): string {
  if (val >= 1000) {
    const k = val / 1000;
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return `${val}`;
}

export const MarketPriceView: React.FC<MarketPriceViewProps> = ({ embedded = false }) => {
  const { language, theme } = useApp();
  const copy = MARKET_COPY[language] || MARKET_COPY.vi;
  const isDark = theme === 'dark';

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const [selectedId, setSelectedId] = useState<string>('rice-om5451');
  const [compareId, setCompareId] = useState<string>('');
  const [showMovingAvg, setShowMovingAvg] = useState<boolean>(true);

  // Local state persisted in localStorage
  const [trackedIds, setTrackedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WATCHLIST);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return ['rice-om5451', 'coffee-robusta', 'veg-tomato'];
  });

  const [targetPrices, setTargetPrices] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TARGETS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'rice-om5451': 8400,
      'coffee-robusta': 120000
    };
  });

  const [localOverrides, setLocalOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_OVERRIDES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [targetInput, setTargetInput] = useState<string>('');
  const [localPriceInput, setLocalPriceInput] = useState<string>('');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Persist user tracking preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WATCHLIST, JSON.stringify(trackedIds));
    } catch {}
  }, [trackedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TARGETS, JSON.stringify(targetPrices));
    } catch {}
  }, [targetPrices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_OVERRIDES, JSON.stringify(localOverrides));
    } catch {}
  }, [localOverrides]);

  // Apply local farmer quote override to latest day if set
  const commodities: AgriculturalCommodity[] = useMemo(() => {
    return MARKET_COMMODITIES.map(item => {
      const override = localOverrides[item.id];
      if (!override || override <= 0) return item;
      const updatedHistory = item.dailyHistory.map((pt, idx, arr) => {
        if (idx !== arr.length - 1) return pt;
        return {
          ...pt,
          price: override,
          high: Math.max(pt.high, override),
          low: Math.min(pt.low, override)
        };
      });
      return {
        ...item,
        dailyHistory: updatedHistory
      };
    });
  }, [localOverrides]);

  const filteredCommodities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return commodities.filter(item => {
      if (categoryFilter === 'tracked' && !trackedIds.includes(item.id)) return false;
      if (categoryFilter !== 'all' && categoryFilter !== 'tracked' && item.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q) ||
        item.variety.toLowerCase().includes(q)
      );
    });
  }, [commodities, categoryFilter, searchQuery, trackedIds]);

  const activeCommodity = useMemo(() => {
    return (
      commodities.find(c => c.id === selectedId) ||
      filteredCommodities[0] ||
      commodities[0]
    );
  }, [commodities, filteredCommodities, selectedId]);

  const compareCommodity = useMemo(() => {
    if (!compareId || compareId === activeCommodity.id) return null;
    return commodities.find(c => c.id === compareId) || null;
  }, [commodities, compareId, activeCommodity.id]);

  // Sync input placeholders when active commodity switches
  useEffect(() => {
    const existingTarget = targetPrices[activeCommodity.id];
    setTargetInput(existingTarget ? String(existingTarget) : '');
    const latestPrice = activeCommodity.dailyHistory[activeCommodity.dailyHistory.length - 1]?.price ?? 0;
    setLocalPriceInput(String(latestPrice));
    setHoverIdx(null);
  }, [activeCommodity.id, targetPrices, activeCommodity.dailyHistory]);

  const sliceCount = timeRange === '7D' ? 7 : timeRange === '14D' ? 14 : 30;

  const chartSeries: ParsedPoint[] = useMemo(() => {
    const fullMa = computeMovingAverage(activeCommodity.dailyHistory, 7);
    const sliced = activeCommodity.dailyHistory.slice(-sliceCount);
    const slicedMa = fullMa.slice(-sliceCount);
    const basePrice = sliced[0]?.price || 1;

    const compSliced = compareCommodity
      ? compareCommodity.dailyHistory.slice(-sliceCount)
      : null;
    const compBase = compSliced?.[0]?.price || 1;

    return sliced.map((pt, idx) => {
      const compPt = compSliced?.[idx];
      return {
        ...pt,
        dateObj: new Date(`${pt.date}T12:00:00Z`),
        maPrice: slicedMa[idx]?.maPrice ?? pt.price,
        pctFromStart: Number((((pt.price - basePrice) / basePrice) * 100).toFixed(2)),
        comparePrice: compPt?.price,
        comparePctFromStart: compPt
          ? Number((((compPt.price - compBase) / compBase) * 100).toFixed(2))
          : undefined
      };
    });
  }, [activeCommodity, compareCommodity, sliceCount]);

  // Responsive D3 Container Width via ResizeObserver
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(760);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const next = Math.max(300, Math.floor(el.getBoundingClientRect().width));
      setChartWidth(next);
    };
    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // D3 Chart Geometry & Scales
  const chartHeight = 320;
  const margin = { top: 20, right: 20, bottom: 34, left: 54 };
  const innerWidth = Math.max(120, chartWidth - margin.left - margin.right);
  const innerHeight = Math.max(120, chartHeight - margin.top - margin.bottom);
  const isCompareMode = Boolean(compareCommodity);

  const d3Geometry = useMemo(() => {
    if (!chartSeries.length) return null;

    const xScale = d3
      .scaleTime()
      .domain([
        chartSeries[0].dateObj,
        chartSeries[chartSeries.length - 1].dateObj
      ])
      .range([0, innerWidth]);

    let yMin: number;
    let yMax: number;

    if (isCompareMode) {
      const pctVals = chartSeries.flatMap(d => [
        d.pctFromStart,
        d.comparePctFromStart ?? d.pctFromStart
      ]);
      const rawMin = d3.min(pctVals) ?? -5;
      const rawMax = d3.max(pctVals) ?? 5;
      const pad = Math.max(1, (rawMax - rawMin) * 0.18);
      yMin = Math.min(rawMin - pad, -0.5);
      yMax = Math.max(rawMax + pad, 0.5);
    } else {
      const activeTarget = targetPrices[activeCommodity.id];
      const vals = chartSeries.flatMap(d =>
        showMovingAvg ? [d.low, d.high, d.maPrice] : [d.low, d.high]
      );
      if (activeTarget) vals.push(activeTarget);
      const rawMin = d3.min(vals) ?? 0;
      const rawMax = d3.max(vals) ?? 100;
      const pad = Math.max(200, (rawMax - rawMin) * 0.18);
      yMin = Math.max(0, rawMin - pad);
      yMax = rawMax + pad * 0.6;
    }

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .nice(5)
      .range([innerHeight, 0]);

    const maxVol = d3.max(chartSeries, d => d.volumeTons) ?? 100;
    const volScale = d3
      .scaleLinear()
      .domain([0, maxVol])
      .range([0, innerHeight * 0.22]);

    const primaryLineGen = d3
      .line<ParsedPoint>()
      .x(d => xScale(d.dateObj))
      .y(d => yScale(isCompareMode ? d.pctFromStart : d.price))
      .curve(d3.curveMonotoneX);

    const primaryAreaGen = d3
      .area<ParsedPoint>()
      .x(d => xScale(d.dateObj))
      .y0(innerHeight)
      .y1(d => yScale(isCompareMode ? d.pctFromStart : d.price))
      .curve(d3.curveMonotoneX);

    const maLineGen = d3
      .line<ParsedPoint>()
      .x(d => xScale(d.dateObj))
      .y(d => yScale(d.maPrice))
      .curve(d3.curveMonotoneX);

    const compareLineGen = d3
      .line<ParsedPoint>()
      .x(d => xScale(d.dateObj))
      .y(d => yScale(d.comparePctFromStart ?? 0))
      .curve(d3.curveMonotoneX);

    const xTicks = xScale.ticks(Math.min(chartSeries.length, innerWidth < 460 ? 5 : 8));
    const yTicks = yScale.ticks(5);
    const barWidth = Math.max(4, Math.min(18, (innerWidth / chartSeries.length) * 0.55));

    return {
      xScale,
      yScale,
      volScale,
      primaryPath: primaryLineGen(chartSeries) || '',
      primaryAreaPath: primaryAreaGen(chartSeries) || '',
      maPath: !isCompareMode && showMovingAvg ? maLineGen(chartSeries) || '' : '',
      comparePath: isCompareMode ? compareLineGen(chartSeries) || '' : '',
      xTicks,
      yTicks,
      barWidth
    };
  }, [
    chartSeries,
    innerWidth,
    innerHeight,
    isCompareMode,
    showMovingAvg,
    targetPrices,
    activeCommodity.id
  ]);

  const dateBisector = useMemo(
    () => d3.bisector<ParsedPoint, Date>(d => d.dateObj).center,
    []
  );

  const handlePointerMove = (clientX: number, svgEl: SVGRectElement) => {
    if (!d3Geometry || !chartSeries.length) return;
    const rect = svgEl.getBoundingClientRect();
    const xPos = Math.max(0, Math.min(innerWidth, clientX - rect.left));
    const hoveredDate = d3Geometry.xScale.invert(xPos);
    const idx = Math.max(
      0,
      Math.min(chartSeries.length - 1, dateBisector(chartSeries, hoveredDate))
    );
    setHoverIdx(idx);
  };

  // Summary metrics for active commodity
  const latestPoint = chartSeries[chartSeries.length - 1];
  const prevDayPoint = chartSeries[chartSeries.length - 2] ?? latestPoint;
  const firstPeriodPoint = chartSeries[0] ?? latestPoint;

  const dailyDeltaPct =
    prevDayPoint.price > 0
      ? ((latestPoint.price - prevDayPoint.price) / prevDayPoint.price) * 100
      : 0;
  const periodDeltaPct =
    firstPeriodPoint.price > 0
      ? ((latestPoint.price - firstPeriodPoint.price) / firstPeriodPoint.price) * 100
      : 0;

  const periodLow = d3.min(chartSeries, d => d.low) ?? latestPoint.price;
  const periodHigh = d3.max(chartSeries, d => d.high) ?? latestPoint.price;
  const avgDailyVol = Math.round(
    chartSeries.reduce((sum, p) => sum + p.volumeTons, 0) / Math.max(1, chartSeries.length)
  );

  const activeTargetPrice = targetPrices[activeCommodity.id];
  const isTargetReached = Boolean(activeTargetPrice && latestPoint.price >= activeTargetPrice);

  const focusedIdx = hoverIdx !== null ? hoverIdx : chartSeries.length - 1;
  const focusedPoint = chartSeries[focusedIdx] ?? latestPoint;

  const toggleTrackCrop = (id: string) => {
    setTrackedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSaveTargetPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(targetInput);
    if (!Number.isFinite(val) || val <= 0) return;
    setTargetPrices(prev => ({ ...prev, [activeCommodity.id]: Math.round(val) }));
  };

  const handleClearTargetPrice = () => {
    setTargetPrices(prev => {
      const next = { ...prev };
      delete next[activeCommodity.id];
      return next;
    });
    setTargetInput('');
  };

  const handleSaveLocalPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(localPriceInput);
    if (!Number.isFinite(val) || val < 500) return;
    setLocalOverrides(prev => ({ ...prev, [activeCommodity.id]: Math.round(val) }));
  };

  const handleResetLocalPrice = () => {
    setLocalOverrides(prev => {
      const next = { ...prev };
      delete next[activeCommodity.id];
      return next;
    });
  };

  const handleExportCsv = () => {
    const header = [
      'Crop',
      'Region',
      'Date',
      'Price_VND_per_kg',
      'Day_Low',
      'Day_High',
      'MA7',
      'Volume_Tons'
    ].join(',');
    const rows = chartSeries.map(pt =>
      [
        `"${activeCommodity.name}"`,
        `"${activeCommodity.region}"`,
        pt.date,
        pt.price,
        pt.low,
        pt.high,
        pt.maPrice,
        pt.volumeTons
      ].join(',')
    );
    const csv = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `Gia_Nong_San_${activeCommodity.id}_${timeRange}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const displayName = (item: AgriculturalCommodity) =>
    language === 'vi' ? item.name : `${item.nameEn}`;

  const primaryStroke = periodDeltaPct >= 0 ? '#16a34a' : '#dc2626';
  const compareStroke = '#0284c7';

  return (
    <div className={embedded ? 'space-y-5' : 'max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6'}>
      {/* Header & Top Action */}
      {!embedded && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 text-balance">
              {copy.title}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
              {copy.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{copy.exportCsv}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          {(
            [
              { id: 'all', label: copy.allCrops },
              { id: 'rice', label: copy.rice },
              { id: 'coffee', label: copy.coffee },
              { id: 'vegetables', label: copy.vegetables },
              { id: 'fruits', label: copy.fruits },
              { id: 'tracked', label: `${copy.tracked} (${trackedIds.length})` }
            ] as Array<{ id: CategoryFilter; label: string }>
          ).map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={copy.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      {/* Main D3.js Interactive Price Chart Panel */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 space-y-5">
        {/* Selected Crop Header + Key KPI Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {displayName(activeCommodity)}
              </h2>
              <button
                type="button"
                onClick={() => toggleTrackCrop(activeCommodity.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap border ${
                  trackedIds.includes(activeCommodity.id)
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    trackedIds.includes(activeCommodity.id)
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-zinc-400'
                  }`}
                />
                <span>
                  {trackedIds.includes(activeCommodity.id) ? copy.trackingBtn : copy.trackBtn}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{activeCommodity.region}</span>
              <span aria-hidden="true">·</span>
              <span>{activeCommodity.variety}</span>
              {localOverrides[activeCommodity.id] && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {copy.localOverrideTag}
                  </span>
                </>
              )}
              {activeTargetPrice && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      isTargetReached
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    <Bell className="w-3 h-3" />
                    {isTargetReached ? copy.targetHit : copy.targetWaiting}:{' '}
                    <span className="tabular-nums">
                      {activeTargetPrice.toLocaleString('vi-VN')} {activeCommodity.unit}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Segmented Timeframe + Compare Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              {(['7D', '14D', '30D'] as TimeRange[]).map(range => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                    timeRange === range
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold whitespace-nowrap">{copy.compareWith}</span>
              <select
                value={compareId}
                onChange={e => setCompareId(e.target.value)}
                className="bg-transparent font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none max-w-[160px] truncate"
              >
                <option value="" className="bg-white dark:bg-zinc-900">
                  {copy.noCompare}
                </option>
                {commodities
                  .filter(c => c.id !== activeCommodity.id)
                  .map(c => (
                    <option
                      key={c.id}
                      value={c.id}
                      className="bg-white dark:bg-zinc-900"
                    >
                      {displayName(c)}
                    </option>
                  ))}
              </select>
            </label>

            {!isCompareMode && (
              <button
                type="button"
                onClick={() => setShowMovingAvg(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                  showMovingAvg
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {copy.movingAvg}
              </button>
            )}
          </div>
        </div>

        {/* 4-column Numeric KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{copy.latestPrice}</div>
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-0.5">
              {latestPoint.price.toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-sans font-semibold text-zinc-500">
                {activeCommodity.unit}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {copy.dailyChange} · {copy.periodChange} ({timeRange})
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 font-mono tabular-nums text-sm font-bold">
              <span
                className={`inline-flex items-center gap-1 ${
                  dailyDeltaPct >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {dailyDeltaPct >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {dailyDeltaPct >= 0 ? '+' : ''}
                {dailyDeltaPct.toFixed(2)}%
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span
                className={
                  periodDeltaPct >= 0
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-300'
                }
              >
                {periodDeltaPct >= 0 ? '+' : ''}
                {periodDeltaPct.toFixed(2)}%
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{copy.periodRange}</div>
            <div className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200 font-mono tabular-nums mt-1">
              {periodLow.toLocaleString('vi-VN')} – {periodHigh.toLocaleString('vi-VN')}
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{copy.dailyVolume}</div>
            <div className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200 font-mono tabular-nums mt-1">
              {avgDailyVol.toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-sans font-medium text-zinc-500">
                {copy.tonsUnit}
              </span>
            </div>
          </div>
        </div>

        {/* D3.js Interactive SVG Viewport + Floating Readout */}
        <div className="relative" ref={chartContainerRef}>
          {/* Live hovered day telemetry bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/60 text-xs">
            <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {focusedPoint.dayLabel} ({focusedPoint.date})
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                {focusedPoint.price.toLocaleString('vi-VN')} {activeCommodity.unit}
                {isCompareMode &&
                  ` (${focusedPoint.pctFromStart >= 0 ? '+' : ''}${focusedPoint.pctFromStart}%)`}
              </span>
              {!isCompareMode && showMovingAvg && (
                <span className="text-amber-600 dark:text-amber-400">
                  {copy.maLabel}: {focusedPoint.maPrice.toLocaleString('vi-VN')}
                </span>
              )}
              {isCompareMode && compareCommodity && focusedPoint.comparePrice !== undefined && (
                <span className="text-sky-600 dark:text-sky-400 font-bold">
                  {displayName(compareCommodity)}: {focusedPoint.comparePrice.toLocaleString('vi-VN')} (
                  {(focusedPoint.comparePctFromStart ?? 0) >= 0 ? '+' : ''}
                  {focusedPoint.comparePctFromStart}%)
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
              <span>
                {copy.lowLabel}: {focusedPoint.low.toLocaleString('vi-VN')}
              </span>
              <span>
                {copy.highLabel}: {focusedPoint.high.toLocaleString('vi-VN')}
              </span>
              <span>
                {copy.volumeLabel}: {focusedPoint.volumeTons}t
              </span>
            </div>
          </div>

          {d3Geometry && (
            <svg
              width={chartWidth}
              height={chartHeight}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full select-none touch-pan-y"
              role="img"
              aria-label={`${displayName(activeCommodity)} D3 price trend`}
            >
              <defs>
                <linearGradient id={`price-area-${activeCommodity.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryStroke} stopOpacity={isDark ? 0.3 : 0.22} />
                  <stop offset="85%" stopColor={primaryStroke} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <g transform={`translate(${margin.left},${margin.top})`}>
                {/* Horizontal Grid Lines + Y Axis Labels */}
                {d3Geometry.yTicks.map((tickVal, idx) => {
                  const y = d3Geometry.yScale(tickVal);
                  return (
                    <g key={idx} transform={`translate(0,${y})`}>
                      <line
                        x1={0}
                        x2={innerWidth}
                        stroke={isDark ? '#27272a' : '#e4e4e7'}
                        strokeDasharray="3 3"
                      />
                      <text
                        x={-8}
                        y={4}
                        textAnchor="end"
                        fontSize={11}
                        className="fill-zinc-500 dark:fill-zinc-400 font-mono tabular-nums"
                      >
                        {isCompareMode
                          ? `${tickVal >= 0 ? '+' : ''}${tickVal.toFixed(1)}%`
                          : formatCompactPrice(tickVal)}
                      </text>
                    </g>
                  );
                })}

                {/* Zero Baseline in Compare Mode */}
                {isCompareMode && (
                  <line
                    x1={0}
                    x2={innerWidth}
                    y1={d3Geometry.yScale(0)}
                    y2={d3Geometry.yScale(0)}
                    stroke={isDark ? '#52525b' : '#a1a1aa'}
                    strokeWidth={1}
                  />
                )}

                {/* Subtle Bottom Daily Volume Histogram Bars (D3 Scale) */}
                {!isCompareMode &&
                  chartSeries.map((pt, idx) => {
                    const cx = d3Geometry.xScale(pt.dateObj);
                    const bh = d3Geometry.volScale(pt.volumeTons);
                    return (
                      <rect
                        key={pt.date}
                        x={cx - d3Geometry.barWidth / 2}
                        y={innerHeight - bh}
                        width={d3Geometry.barWidth}
                        height={bh}
                        rx={2}
                        fill={
                          hoverIdx === idx
                            ? isDark
                              ? 'rgba(16, 185, 129, 0.45)'
                              : 'rgba(16, 185, 129, 0.35)'
                            : isDark
                            ? 'rgba(113, 113, 122, 0.25)'
                            : 'rgba(161, 161, 170, 0.25)'
                        }
                      />
                    );
                  })}

                {/* Area Gradient under Primary Curve (single-crop view) */}
                {!isCompareMode && d3Geometry.primaryAreaPath && (
                  <path
                    d={d3Geometry.primaryAreaPath}
                    fill={`url(#price-area-${activeCommodity.id})`}
                  />
                )}

                {/* 7-Day Moving Average Line */}
                {!isCompareMode && showMovingAvg && d3Geometry.maPath && (
                  <path
                    d={d3Geometry.maPath}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={1.75}
                    strokeDasharray="5 4"
                  />
                )}

                {/* Target Price Alert Threshold Line */}
                {!isCompareMode &&
                  activeTargetPrice &&
                  activeTargetPrice >= d3Geometry.yScale.domain()[0] &&
                  activeTargetPrice <= d3Geometry.yScale.domain()[1] && (
                    <g transform={`translate(0,${d3Geometry.yScale(activeTargetPrice)})`}>
                      <line
                        x1={0}
                        x2={innerWidth}
                        stroke="#d97706"
                        strokeWidth={1.5}
                        strokeDasharray="6 3"
                      />
                      <text
                        x={innerWidth - 4}
                        y={-5}
                        textAnchor="end"
                        fontSize={10}
                        fontWeight={700}
                        fill="#d97706"
                        className="font-mono tabular-nums"
                      >
                        Target: {activeTargetPrice.toLocaleString('vi-VN')}
                      </text>
                    </g>
                  )}

                {/* Primary Commodity Curve */}
                {d3Geometry.primaryPath && (
                  <path
                    d={d3Geometry.primaryPath}
                    fill="none"
                    stroke={primaryStroke}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Comparison Commodity Curve */}
                {isCompareMode && d3Geometry.comparePath && (
                  <path
                    d={d3Geometry.comparePath}
                    fill="none"
                    stroke={compareStroke}
                    strokeWidth={2.25}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Point Nodes along Active Curve */}
                {chartSeries.map((pt, idx) => {
                  const cx = d3Geometry.xScale(pt.dateObj);
                  const cy = d3Geometry.yScale(isCompareMode ? pt.pctFromStart : pt.price);
                  const isFocused = focusedIdx === idx;
                  return (
                    <circle
                      key={pt.date}
                      cx={cx}
                      cy={cy}
                      r={isFocused ? 5 : chartSeries.length <= 14 ? 2.5 : 0}
                      fill={isFocused ? primaryStroke : isDark ? '#18181b' : '#ffffff'}
                      stroke={primaryStroke}
                      strokeWidth={isFocused ? 2.5 : 1.75}
                    />
                  );
                })}

                {/* Crosshair Vertical Guide + Compare Focus Point */}
                {focusedPoint && (
                  <>
                    <line
                      x1={d3Geometry.xScale(focusedPoint.dateObj)}
                      x2={d3Geometry.xScale(focusedPoint.dateObj)}
                      y1={0}
                      y2={innerHeight}
                      stroke={isDark ? '#52525b' : '#a1a1aa'}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                    {isCompareMode && focusedPoint.comparePctFromStart !== undefined && (
                      <circle
                        cx={d3Geometry.xScale(focusedPoint.dateObj)}
                        cy={d3Geometry.yScale(focusedPoint.comparePctFromStart)}
                        r={5}
                        fill={compareStroke}
                        stroke={isDark ? '#18181b' : '#ffffff'}
                        strokeWidth={2}
                      />
                    )}
                  </>
                )}

                {/* X Axis Baseline & Date Ticks */}
                <line
                  x1={0}
                  x2={innerWidth}
                  y1={innerHeight}
                  y2={innerHeight}
                  stroke={isDark ? '#3f3f46' : '#d4d4d8'}
                />
                {d3Geometry.xTicks.map((tickDate, idx) => {
                  const x = d3Geometry.xScale(tickDate);
                  const dd = String(tickDate.getUTCDate()).padStart(2, '0');
                  const mm = String(tickDate.getUTCMonth() + 1).padStart(2, '0');
                  return (
                    <g key={idx} transform={`translate(${x},${innerHeight})`}>
                      <line y1={0} y2={5} stroke={isDark ? '#52525b' : '#a1a1aa'} />
                      <text
                        y={18}
                        textAnchor="middle"
                        fontSize={11}
                        className="fill-zinc-500 dark:fill-zinc-400 font-mono tabular-nums"
                      >
                        {`${dd}/${mm}`}
                      </text>
                    </g>
                  );
                })}

                {/* Transparent Interactive Overlay for D3 Bisector */}
                <rect
                  x={0}
                  y={0}
                  width={innerWidth}
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseMove={e => handlePointerMove(e.clientX, e.currentTarget)}
                  onTouchMove={e => {
                    if (e.touches[0]) {
                      handlePointerMove(e.touches[0].clientX, e.currentTarget);
                    }
                  }}
                  onMouseLeave={() => setHoverIdx(null)}
                />
              </g>
            </svg>
          )}

          {/* Clean Chart Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
              <span
                className="w-3 h-0.5 rounded-full inline-block"
                style={{ backgroundColor: primaryStroke }}
              />
              {displayName(activeCommodity)}
            </span>
            {!isCompareMode && showMovingAvg && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full inline-block bg-amber-500" />
                {copy.movingAvg}
              </span>
            )}
            {isCompareMode && compareCommodity && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-sky-700 dark:text-sky-400">
                <span
                  className="w-3 h-0.5 rounded-full inline-block"
                  style={{ backgroundColor: compareStroke }}
                />
                {displayName(compareCommodity)} (%)
              </span>
            )}
          </div>
        </div>

        {/* Inline Regional Brief, Target Alert Setter & Local Farm-Gate Price Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="lg:col-span-5 space-y-1">
            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {copy.marketBrief}
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {language === 'vi' ? activeCommodity.marketAnalysis : activeCommodity.marketAnalysisEn}
            </p>
          </div>

          <form
            onSubmit={handleSaveTargetPrice}
            className="lg:col-span-3 flex flex-col justify-between gap-2"
          >
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {copy.targetPrice}
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={500}
                step={100}
                value={targetInput}
                onChange={e => setTargetInput(e.target.value)}
                placeholder="VD: 120000"
                className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
              >
                {copy.setTarget}
              </button>
              {activeTargetPrice && (
                <button
                  type="button"
                  onClick={handleClearTargetPrice}
                  className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  {copy.clearTarget}
                </button>
              )}
            </div>
          </form>

          <form
            onSubmit={handleSaveLocalPrice}
            className="lg:col-span-4 flex flex-col justify-between gap-2"
          >
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{copy.recordLocalPrice}</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={500}
                step={100}
                value={localPriceInput}
                onChange={e => setLocalPriceInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
              >
                {copy.savePrice}
              </button>
              {localOverrides[activeCommodity.id] && (
                <button
                  type="button"
                  onClick={handleResetLocalPrice}
                  title={copy.resetLocalPrice}
                  className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Commodity Price Tracking Table (High-Density + D3 Sparklines) */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {filteredCommodities.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
              {copy.emptyTitle}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              {copy.emptyDesc}
            </p>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              {copy.resetFilters}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-50/70 dark:bg-zinc-800/40">
                  <th className="py-3 px-4">{copy.tableCrop}</th>
                  <th className="py-3 px-3 hidden sm:table-cell">{copy.tableTrend}</th>
                  <th className="py-3 px-3 text-right">{copy.tablePrice}</th>
                  <th className="py-3 px-3 text-right">{copy.tableChange}</th>
                  <th className="py-3 px-3 text-right hidden md:table-cell">{copy.tableRange30d}</th>
                  <th className="py-3 px-3 text-right hidden lg:table-cell">{copy.tableVolume}</th>
                  <th className="py-3 px-4 text-right">{copy.tableTrack}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs sm:text-sm">
                {filteredCommodities.map(item => {
                  const hist = item.dailyHistory;
                  const lastPt = hist[hist.length - 1];
                  const prevPt = hist[hist.length - 2] ?? lastPt;
                  const firstPt = hist[0] ?? lastPt;
                  const dayChg =
                    prevPt.price > 0 ? ((lastPt.price - prevPt.price) / prevPt.price) * 100 : 0;
                  const periodChg =
                    firstPt.price > 0 ? ((lastPt.price - firstPt.price) / firstPt.price) * 100 : 0;
                  const min30 = d3.min(hist, d => d.low) ?? lastPt.price;
                  const max30 = d3.max(hist, d => d.high) ?? lastPt.price;
                  const isSelected = activeCommodity.id === item.id;
                  const isTracked = trackedIds.includes(item.id);
                  const rowTarget = targetPrices[item.id];
                  const rowHit = Boolean(rowTarget && lastPt.price >= rowTarget);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <span>{displayName(item)}</span>
                          {rowHit && (
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                              · {copy.targetHit}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {item.region} · {item.variety}
                        </div>
                      </td>

                      <td className="py-2 px-3 hidden sm:table-cell">
                        <D3PriceSparkline
                          values={hist.slice(-14).map(d => d.price)}
                          isPositive={periodChg >= 0}
                        />
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums font-extrabold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {lastPt.price.toLocaleString('vi-VN')}{' '}
                        <span className="text-[11px] font-sans font-normal text-zinc-500">
                          {item.unit}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        <div
                          className={`inline-flex items-center justify-end gap-1 font-bold ${
                            dayChg >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {dayChg >= 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {dayChg >= 0 ? '+' : ''}
                            {dayChg.toFixed(2)}%
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          30D: {periodChg >= 0 ? '+' : ''}
                          {periodChg.toFixed(1)}%
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-zinc-600 dark:text-zinc-400 hidden md:table-cell whitespace-nowrap">
                        {min30.toLocaleString('vi-VN')} – {max30.toLocaleString('vi-VN')}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-zinc-600 dark:text-zinc-400 hidden lg:table-cell whitespace-nowrap">
                        {lastPt.volumeTons.toLocaleString('vi-VN')} t
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            toggleTrackCrop(item.id);
                          }}
                          aria-label={isTracked ? copy.trackingBtn : copy.trackBtn}
                          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                            isTracked
                              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-amber-500'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${isTracked ? 'fill-amber-500' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
