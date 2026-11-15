export type HeatmapMetric = 'humidity' | 'temperature' | 'planting_index';
export type HeatmapHorizon = 'now' | '24h' | '3d' | '7d';

export interface HorizonClimateMetrics {
  tempC: number;
  humidityPct: number;
  rainMm: number;
  plantingScore: number;
}

export interface DailyClimatePoint {
  dateLabel: string;
  tempAvg: number;
  tempMax: number;
  tempMin: number;
  humidityAvg: number;
  rainMm: number;
}

export interface RegionalClimatePoint {
  id: string;
  regionName: string;
  lat: number;
  lng: number;
  isLive: boolean;
  tempTrendDelta: number;
  humidityTrendDelta: number;
  minTemp7d: number;
  maxTemp7d: number;
  totalRain7d: number;
  fungalRisk: 'low' | 'medium' | 'high';
  plantingWindow: string;
  recommendedCrops: string[];
  dailySeries: DailyClimatePoint[];
  metricsByHorizon: Record<HeatmapHorizon, HorizonClimateMetrics>;
}

const REGIONAL_HEATMAP_CACHE_KEY = 'nongtro_regional_heatmap_cache';

export function buildFallbackRegionalHeatmap(centerLat: number = 10.8872, centerLng: number = 106.5921): RegionalClimatePoint[] {
  const seeds = [
    { id: 'reg-farm', regionName: 'Khu Vực Vườn Của Bạn', lat: centerLat, lng: centerLng, baseTemp: 29.8, baseHumid: 76, baseRain: 4.2, crops: ['Cà Chua Bi F1', 'Dưa Leo Baby', 'Rau Gia Vị'], window: 'Nhiệt-ẩm ổn định — Phù hợp gieo trồng & sang chậu trong 3-5 ngày tới.' },
    { id: 'reg-hocmon', regionName: 'Vùng Rau Sạch Hóc Môn', lat: 10.892, lng: 106.605, baseTemp: 30.6, baseHumid: 73, baseRain: 3.1, crops: ['Cải Thìa', 'Rau Dền', 'Húng Quế'], window: 'Nắng ấm dịu — Rất tốt cho rau ăn lá ngắn ngày.' },
    { id: 'reg-cuchi', regionName: 'Vùng Hữu Cơ Củ Chi', lat: 11.0254, lng: 106.5123, baseTemp: 29.2, baseHumid: 80, baseRain: 6.4, crops: ['Rau Muống', 'Mướp Hương', 'Ớt Chỉ Thiên'], window: 'Độ ẩm 80% — Bổ sung Trichoderma khi làm đất gieo.' },
    { id: 'reg-binhchanh', regionName: 'Vùng Nông Nghiệp Bình Chánh', lat: 10.718, lng: 106.535, baseTemp: 31.1, baseHumid: 74, baseRain: 3.8, crops: ['Đậu Bắp', 'Dưa Leo', 'Mồng Tơi'], window: 'Thoát nắng nhẹ — Tưới sáng sớm & chiều mát.' },
    { id: 'reg-thuduc', regionName: 'Đông TP.HCM - Dĩ An', lat: 10.898, lng: 106.795, baseTemp: 32.4, baseHumid: 68, baseRain: 1.9, crops: ['Rau Dền Đỏ', 'Sả Chanh', 'Sen Đá'], window: 'Nắng ấm cao — Che lưới 30% cho cây non mới gieo.' },
    { id: 'reg-longkhanh', regionName: 'Vùng Cây Ăn Trái Long Khánh', lat: 10.9421, lng: 107.2415, baseTemp: 28.1, baseHumid: 83, baseRain: 8.5, crops: ['Sầu Riêng Ri6', 'Chôm Chôm', 'Bưởi Da Xanh'], window: 'Ẩm độ cao mát dịu — Chú ý thoát nước gốc khi có mưa chiều.' },
    { id: 'reg-caibe', regionName: 'Vùng Vườn Trái Cây Cái Bè', lat: 10.3392, lng: 105.9921, baseTemp: 28.9, baseHumid: 86, baseRain: 9.2, crops: ['Xoài Cát', 'Bưởi Da Xanh', 'Rau Nhút'], window: 'Ẩm độ cao >84% — Lên liếp cao & tỉa tán thông thoáng.' },
    { id: 'reg-mytho', regionName: 'Mỹ Tho - Châu Thành (Tiền Giang)', lat: 10.365, lng: 106.365, baseTemp: 29.4, baseHumid: 82, baseRain: 7.4, crops: ['Thanh Long', 'Dừa Xiêm', 'Cải Ngọt'], window: 'Thuận lợi ươm giống & tưới phân vi sinh gốc.' },
    { id: 'reg-longan', regionName: 'Đức Hòa - Bến Lức (Long An)', lat: 10.795, lng: 106.382, baseTemp: 31.4, baseHumid: 71, baseRain: 2.8, crops: ['Chanh Không Hạt', 'Đậu Đũa', 'Cà Pháo'], window: 'Nắng nhiều — Phủ rơm rạ giữ ẩm mặt luống.' },
    { id: 'reg-dalat', regionName: 'Cao Nguyên Bảo Lộc - Lâm Đồng', lat: 11.548, lng: 107.807, baseTemp: 21.8, baseHumid: 87, baseRain: 11.2, crops: ['Xà Lách Carol', 'Cải Kale', 'Dâu Tây'], window: 'Mát lạnh ôn đới — Rất hợp xuống giống rau ôn đới.' },
  ];

  return seeds.map((s, idx) => {
    const dailySeries: DailyClimatePoint[] = Array.from({ length: 7 }, (_, dIdx) => {
      const wave = Math.sin((dIdx + idx) * 0.85);
      const t = Number((s.baseTemp + wave * 1.1).toFixed(1));
      const h = Math.max(48, Math.min(95, Math.round(s.baseHumid - wave * 4)));
      const r = Number(Math.max(0, s.baseRain + wave * 2.1).toFixed(1));
      return {
        dateLabel: `N+${dIdx}`,
        tempAvg: t,
        tempMax: Number((t + 3.2).toFixed(1)),
        tempMin: Number((t - 3.5).toFixed(1)),
        humidityAvg: h,
        rainMm: r,
      };
    });

    const d7Temp = Number((dailySeries.reduce((sum, d) => sum + d.tempAvg, 0) / 7).toFixed(1));
    const d7Hum = Math.round(dailySeries.reduce((sum, d) => sum + d.humidityAvg, 0) / 7);
    const d7Rain = Number(dailySeries.reduce((sum, d) => sum + d.rainMm, 0).toFixed(1));
    const score = (temp: number, hum: number, rain: number) =>
      Math.max(20, Math.min(96, Math.round(100 - Math.abs(temp - 26.5) * 3.8 - Math.abs(hum - 70) * 0.9 - Math.max(0, rain - 30) * 0.5)));

    return {
      id: s.id,
      regionName: s.regionName,
      lat: s.lat,
      lng: s.lng,
      isLive: false,
      tempTrendDelta: Number((d7Temp - s.baseTemp).toFixed(1)),
      humidityTrendDelta: Math.round(d7Hum - s.baseHumid),
      minTemp7d: Number(Math.min(...dailySeries.map(d => d.tempMin)).toFixed(1)),
      maxTemp7d: Number(Math.max(...dailySeries.map(d => d.tempMax)).toFixed(1)),
      totalRain7d: d7Rain,
      fungalRisk: d7Hum >= 84 ? 'high' : d7Hum >= 75 ? 'medium' : 'low',
      plantingWindow: s.window,
      recommendedCrops: s.crops,
      dailySeries,
      metricsByHorizon: {
        now: { tempC: s.baseTemp, humidityPct: s.baseHumid, rainMm: s.baseRain, plantingScore: score(s.baseTemp, s.baseHumid, s.baseRain) },
        '24h': { tempC: dailySeries[1].tempAvg, humidityPct: dailySeries[1].humidityAvg, rainMm: dailySeries[1].rainMm, plantingScore: score(dailySeries[1].tempAvg, dailySeries[1].humidityAvg, dailySeries[1].rainMm) },
        '3d': {
          tempC: Number(((dailySeries[0].tempAvg + dailySeries[1].tempAvg + dailySeries[2].tempAvg) / 3).toFixed(1)),
          humidityPct: Math.round((dailySeries[0].humidityAvg + dailySeries[1].humidityAvg + dailySeries[2].humidityAvg) / 3),
          rainMm: Number((dailySeries[0].rainMm + dailySeries[1].rainMm + dailySeries[2].rainMm).toFixed(1)),
          plantingScore: score(d7Temp, d7Hum, s.baseRain),
        },
        '7d': { tempC: d7Temp, humidityPct: d7Hum, rainMm: d7Rain, plantingScore: score(d7Temp, d7Hum, d7Rain / 7) },
      },
    };
  });
}

export function loadCachedRegionalHeatmap(): RegionalClimatePoint[] | null {
  try {
    const raw = localStorage.getItem(REGIONAL_HEATMAP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.points) && parsed.points.length > 0 ? parsed.points : null;
  } catch {
    return null;
  }
}

export function saveCachedRegionalHeatmap(points: RegionalClimatePoint[]): void {
  try {
    localStorage.setItem(
      REGIONAL_HEATMAP_CACHE_KEY,
      JSON.stringify({ points, cachedAt: new Date().toISOString() })
    );
  } catch {}
}

export function getMetricValue(
  point: RegionalClimatePoint,
  metric: HeatmapMetric,
  horizon: HeatmapHorizon
): number {
  const m = point.metricsByHorizon[horizon] || point.metricsByHorizon.now;
  if (metric === 'humidity') return m.humidityPct;
  if (metric === 'temperature') return m.tempC;
  return m.plantingScore;
}

export function formatMetricValue(value: number, metric: HeatmapMetric): string {
  if (metric === 'humidity') return `${Math.round(value)}%`;
  if (metric === 'temperature') return `${value.toFixed(1)}°C`;
  return `${Math.round(value)}/100`;
}

/**
 * Maps meteorological values to crisp RGB thermal colors.
 */
export function getThermalRgb(metric: HeatmapMetric, value: number): [number, number, number] {
  if (metric === 'humidity') {
    if (value >= 85) return [37, 99, 235]; // Deep high-humidity blue (fungal watch)
    if (value >= 77) return [6, 182, 212]; // Moist cyan
    if (value >= 66) return [16, 185, 129]; // Ideal balanced emerald
    return [245, 158, 11]; // Drier amber
  }
  if (metric === 'temperature') {
    if (value >= 33) return [239, 68, 68]; // Heat stress red
    if (value >= 30.5) return [249, 115, 22]; // Warm orange
    if (value >= 26) return [234, 179, 8]; // Warm sunny yellow-amber
    if (value >= 22) return [16, 185, 129]; // Mild ideal green
    return [56, 189, 248]; // Cool highland sky blue
  }
  // planting_index (0-100)
  if (value >= 76) return [16, 185, 129]; // Optimal emerald
  if (metric === 'planting_index' && value >= 60) return [132, 204, 22]; // Good lime
  if (value >= 45) return [245, 158, 11]; // Caution amber
  return [239, 68, 68]; // Challenging red
}

export function getHeatmapLegendMeta(metric: HeatmapMetric): {
  title: string;
  minLabel: string;
  midLabel: string;
  maxLabel: string;
  gradientCss: string;
} {
  if (metric === 'humidity') {
    return {
      title: 'Độ ẩm không khí vùng (%)',
      minLabel: 'Khô (<65%)',
      midLabel: 'Lý tưởng (70-78%)',
      maxLabel: 'Ẩm cao (>85%)',
      gradientCss: 'linear-gradient(90deg, #f59e0b 0%, #10b981 40%, #06b6d4 70%, #2563eb 100%)',
    };
  }
  if (metric === 'temperature') {
    return {
      title: 'Nhiệt độ vùng (°C)',
      minLabel: 'Mát (<23°C)',
      midLabel: 'Ấm (27-30°C)',
      maxLabel: 'Nóng (>33°C)',
      gradientCss: 'linear-gradient(90deg, #38bdf8 0%, #10b981 30%, #eab308 60%, #f97316 80%, #ef4444 100%)',
    };
  }
  return {
    title: 'Chỉ số thuận lợi gieo trồng',
    minLabel: 'Khó khăn (<45)',
    midLabel: 'Khá (60-75)',
    maxLabel: 'Vàng (>78)',
    gradientCss: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 35%, #84cc16 70%, #10b981 100%)',
  };
}

export interface CanvasProjectedPoint {
  point: RegionalClimatePoint;
  x: number;
  y: number;
}

/**
 * Renders soft overlapping radial thermal blobs onto any 2D Canvas (no WebGL required).
 */
export function drawHeatmapOnCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  projectedPoints: CanvasProjectedPoint[],
  metric: HeatmapMetric,
  horizon: HeatmapHorizon,
  radiusPx: number,
  opacity: number
): void {
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const targetW = Math.max(1, Math.round(width * dpr));
  const targetH = Math.max(1, Math.round(height * dpr));

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  if (projectedPoints.length === 0) {
    ctx.restore();
    return;
  }

  ctx.globalCompositeOperation = 'screen';

  for (const item of projectedPoints) {
    const val = getMetricValue(item.point, metric, horizon);
    const [r, g, b] = getThermalRgb(metric, val);
    const alphaPeak = Math.max(0.28, Math.min(0.85, opacity));

    const grad = ctx.createRadialGradient(item.x, item.y, 4, item.x, item.y, radiusPx);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alphaPeak})`);
    grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${alphaPeak * 0.58})`);
    grad.addColorStop(0.78, `rgba(${r}, ${g}, ${b}, ${alphaPeak * 0.22})`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(item.x, item.y, radiusPx, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fallback soft blending for light surfaces using normal pass ring highlights
  ctx.globalCompositeOperation = 'source-over';
  for (const item of projectedPoints) {
    const val = getMetricValue(item.point, metric, horizon);
    const [r, g, b] = getThermalRgb(metric, val);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(0.55, opacity * 0.65)})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(item.x, item.y, radiusPx * 0.52, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}
