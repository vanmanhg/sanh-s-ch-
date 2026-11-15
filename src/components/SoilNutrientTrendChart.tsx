import React, { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import { Droplets, Sprout, TrendingUp, Plus, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  CarePlanSummary,
  CareTaskSummary,
  CustomTelemetryReading,
  SoilNutrientPoint,
  build30DaySoilNutrientSeries,
  buildTrendTargetOptions,
  getTrendChartCopy,
  saveTelemetryReading,
  summarize30DayTrend
} from '../utils/soilTrendData';

interface SoilNutrientTrendChartProps {
  plans: CarePlanSummary[];
  tasks: CareTaskSummary[];
  customReadings: CustomTelemetryReading[];
  onReadingsChange: (next: CustomTelemetryReading[]) => void;
  onCreatePlanClick?: () => void;
}

interface ChartTooltipPayloadItem {
  dataKey?: string;
  name?: string;
  value?: number;
  color?: string;
  payload?: SoilNutrientPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<ChartTooltipPayloadItem>;
  isDark: boolean;
  copy: ReturnType<typeof getTrendChartCopy>;
}

const CustomTrendTooltip: React.FC<CustomTooltipProps> = ({ active, payload, isDark, copy }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div
      className={`rounded-xl border px-3.5 py-2.5 text-xs shadow-lg ${
        isDark
          ? 'bg-zinc-950/95 border-zinc-700 text-zinc-100'
          : 'bg-white/95 border-zinc-200 text-zinc-900'
      }`}
    >
      <div className="font-bold mb-1.5 flex items-center justify-between gap-4 border-b border-zinc-200/70 dark:border-zinc-800 pb-1">
        <span>{point.fullDateLabel}</span>
        <span className="font-mono tabular-nums text-[11px] text-zinc-500 dark:text-zinc-400">
          {point.dateIso}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold">
            <span className="w-2.5 h-0.5 rounded-full bg-sky-500 inline-block" />
            {copy.seriesMoisture}
          </span>
          <span className="font-mono tabular-nums font-bold">
            {point.soilMoisturePct}%
          </span>
        </div>

        <div className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-2.5 h-0.5 rounded-full bg-emerald-500 inline-block" />
            {copy.seriesNutrient}
          </span>
          <span className="font-mono tabular-nums font-bold">
            {point.nutrientLevelPct}%
          </span>
        </div>

        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 flex items-center justify-between gap-4">
          <span>{copy.targetBandLabel}</span>
          <span className="font-mono tabular-nums">
            {point.targetMinMoisture}%–{point.targetMaxMoisture}%
          </span>
        </div>
      </div>

      {point.events.length > 0 && (
        <div className="mt-2 pt-1.5 border-t border-zinc-200/70 dark:border-zinc-800 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300">
          {point.events.includes('water') && <span>{copy.eventWatered}</span>}
          {point.events.includes('water') && point.events.includes('fertilize') && (
            <span aria-hidden="true">·</span>
          )}
          {point.events.includes('fertilize') && <span>{copy.eventFertilized}</span>}
          {point.events.includes('manual') && (
            <>
              {(point.events.includes('water') || point.events.includes('fertilize')) && (
                <span aria-hidden="true">·</span>
              )}
              <span>{copy.eventLogged}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const SoilNutrientTrendChart: React.FC<SoilNutrientTrendChartProps> = ({
  plans,
  tasks,
  customReadings,
  onReadingsChange,
  onCreatePlanClick
}) => {
  const { plants, language, theme, updateSoilMoisture } = useApp();
  const isDark = theme === 'dark';
  const copy = getTrendChartCopy(language);

  const targets = useMemo(() => buildTrendTargetOptions(plans, plants), [plans, plants]);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [windowDays, setWindowDays] = useState<30 | 14>(30);
  const [showMoisture, setShowMoisture] = useState<boolean>(true);
  const [showNutrient, setShowNutrient] = useState<boolean>(true);
  const [showOptimalBand, setShowOptimalBand] = useState<boolean>(true);

  // Quick manual telemetry entry state
  const [inputMoisture, setInputMoisture] = useState<number>(62);
  const [inputNutrient, setInputNutrient] = useState<number>(70);
  const [savedToast, setSavedToast] = useState<string>('');

  useEffect(() => {
    if (targets.length > 0 && !targets.some(t => t.key === selectedKey)) {
      setSelectedKey(targets[0].key);
    }
  }, [targets, selectedKey]);

  const activeTarget = useMemo(
    () => targets.find(t => t.key === selectedKey) || targets[0],
    [targets, selectedKey]
  );

  const full30DaySeries = useMemo(() => {
    if (!activeTarget) return [];
    return build30DaySoilNutrientSeries({
      target: activeTarget,
      tasks,
      customReadings,
      language
    });
  }, [activeTarget, tasks, customReadings, language]);

  const visibleSeries = useMemo(() => {
    if (windowDays === 14) {
      return full30DaySeries.slice(-14);
    }
    return full30DaySeries;
  }, [full30DaySeries, windowDays]);

  const stats = useMemo(() => summarize30DayTrend(full30DaySeries), [full30DaySeries]);

  useEffect(() => {
    if (full30DaySeries.length > 0) {
      const latest = full30DaySeries[full30DaySeries.length - 1];
      setInputMoisture(latest.soilMoisturePct);
      setInputNutrient(latest.nutrientLevelPct);
    }
  }, [activeTarget?.key]);

  const handleSaveTodayReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTarget) return;

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayIso = `${y}-${m}-${d}`;

    const clampedMoisture = Math.max(5, Math.min(100, Math.round(inputMoisture)));
    const clampedNutrient = Math.max(5, Math.min(100, Math.round(inputNutrient)));

    const updated = saveTelemetryReading({
      targetKey: activeTarget.key,
      dateIso: todayIso,
      soilMoisturePct: clampedMoisture,
      nutrientLevelPct: clampedNutrient,
      eventTag: 'manual'
    });
    onReadingsChange(updated);

    if (activeTarget.plantId) {
      updateSoilMoisture(activeTarget.plantId, clampedMoisture);
    }

    setSavedToast(copy.logSavedFeedback);
    setTimeout(() => setSavedToast(''), 3200);
  };

  if (!activeTarget || targets.length === 0) {
    return (
      <section className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{copy.emptyTitle}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">{copy.emptyDesc}</p>
        {onCreatePlanClick && (
          <button
            type="button"
            onClick={onCreatePlanClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{copy.emptyAction}</span>
          </button>
        )}
      </section>
    );
  }

  const gridStroke = isDark ? '#27272a' : '#e4e4e7';
  const axisTickColor = isDark ? '#a1a1aa' : '#52525b';
  const moistureStroke = isDark ? '#38bdf8' : '#0284c7';
  const nutrientStroke = isDark ? '#34d399' : '#059669';

  return (
    <section
      aria-label={copy.title}
      className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {activeTarget.source === 'plan' ? copy.sourcePlan : copy.sourceGarden}
            </span>
            {activeTarget.subtitle && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-xs">{activeTarget.subtitle}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {activeTarget.wateringFrequencyDays}d / {activeTarget.fertilizingFrequencyDays}d
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {copy.title}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl">
            {copy.subtitle}
          </p>
        </div>

        {/* Plant/Plan selector & Time Range Switch */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <label className="sr-only" htmlFor="soil-trend-target-select">
            {copy.selectTarget}
          </label>
          <select
            id="soil-trend-target-select"
            value={activeTarget.key}
            onChange={e => setSelectedKey(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold focus:outline-emerald-600 max-w-[230px]"
          >
            {targets.map(opt => (
              <option key={opt.key} value={opt.key}>
                {opt.name} ({opt.source === 'plan' ? copy.sourcePlan : copy.sourceGarden})
              </option>
            ))}
          </select>

          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setWindowDays(30)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                windowDays === 30
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {copy.window30d}
            </button>
            <button
              type="button"
              onClick={() => setWindowDays(14)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                windowDays === 14
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {copy.window14d}
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip (unboxed, clean hairline grid, tabular figures) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="space-y-0.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
            {copy.kpiAvgMoisture}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
              {stats.avgMoisture}%
            </span>
            <span className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
              {stats.moistureDeltaFromStart >= 0 ? `+${stats.moistureDeltaFromStart}` : stats.moistureDeltaFromStart}%
            </span>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
            {copy.kpiAvgNutrient}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {stats.avgNutrient}%
            </span>
            <span className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
              {stats.nutrientDeltaFromStart >= 0 ? `+${stats.nutrientDeltaFromStart}` : stats.nutrientDeltaFromStart}%
            </span>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
            {copy.kpiDryDays}
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                stats.daysBelowMoistureMin > 5
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {stats.daysBelowMoistureMin}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              / 30 {copy.daysSuffix}
            </span>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
            {copy.kpiOptimalDays}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
              {stats.daysOptimalBoth}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              / 30 {copy.daysSuffix}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Series Toggle Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMoisture(v => !v || !showNutrient)}
            aria-pressed={showMoisture}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              showMoisture
                ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200'
                : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{copy.seriesMoisture}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNutrient(v => !v || !showMoisture)}
            aria-pressed={showNutrient}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              showNutrient
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{copy.seriesNutrient}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOptimalBand(v => !v)}
            aria-pressed={showOptimalBand}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              showOptimalBand
                ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900'
                : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {copy.seriesOptimalBand} ({activeTarget.minMoistureThreshold}%–{activeTarget.maxMoistureThreshold}%)
          </button>
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums flex items-center gap-2">
          <span>{copy.eventWatered}: {stats.waterEventsCount}</span>
          <span aria-hidden="true">·</span>
          <span>{copy.eventFertilized}: {stats.fertilizeEventsCount}</span>
        </div>
      </div>

      {/* Recharts 30-Day Trend Line Chart */}
      <div className="w-full h-[300px] min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={260}>
          <LineChart data={visibleSeries} margin={{ top: 12, right: 16, left: -12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: axisTickColor, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: gridStroke }}
              minTickGap={windowDays === 30 ? 22 : 10}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={v => `${v}%`}
              tick={{ fill: axisTickColor, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<CustomTrendTooltip isDark={isDark} copy={copy} />}
              cursor={{ stroke: isDark ? '#52525b' : '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
            />

            {showOptimalBand && (
              <ReferenceArea
                y1={activeTarget.minMoistureThreshold}
                y2={activeTarget.maxMoistureThreshold}
                fill={isDark ? '#0284c7' : '#38bdf8'}
                fillOpacity={isDark ? 0.1 : 0.08}
              />
            )}

            {showOptimalBand && (
              <ReferenceLine
                y={55}
                stroke={isDark ? '#34d399' : '#10b981'}
                strokeDasharray="4 4"
                strokeOpacity={0.55}
              />
            )}

            {showMoisture && (
              <Line
                type="monotone"
                dataKey="soilMoisturePct"
                name={copy.seriesMoisture}
                stroke={moistureStroke}
                strokeWidth={2.5}
                dot={props => {
                  const pt = props.payload as SoilNutrientPoint | undefined;
                  if (!pt || (!pt.events.includes('water') && !pt.events.includes('manual'))) {
                    return <g key={`m-empty-${props.index}`} />;
                  }
                  return (
                    <circle
                      key={`m-dot-${props.index}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={moistureStroke}
                      stroke={isDark ? '#18181b' : '#ffffff'}
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 5.5, fill: moistureStroke, stroke: isDark ? '#18181b' : '#ffffff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}

            {showNutrient && (
              <Line
                type="monotone"
                dataKey="nutrientLevelPct"
                name={copy.seriesNutrient}
                stroke={nutrientStroke}
                strokeWidth={2.5}
                dot={props => {
                  const pt = props.payload as SoilNutrientPoint | undefined;
                  if (!pt || (!pt.events.includes('fertilize') && !pt.events.includes('manual'))) {
                    return <g key={`n-empty-${props.index}`} />;
                  }
                  return (
                    <circle
                      key={`n-dot-${props.index}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={nutrientStroke}
                      stroke={isDark ? '#18181b' : '#ffffff'}
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 5.5, fill: nutrientStroke, stroke: isDark ? '#18181b' : '#ffffff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Inline Today's Measurement Logger */}
      <form
        onSubmit={handleSaveTodayReading}
        className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div className="space-y-1">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
            {copy.logReadingTitle}
          </span>
          {savedToast && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {savedToast}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="today-moisture-input"
              className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1"
            >
              {copy.moistureInputLabel}
            </label>
            <input
              id="today-moisture-input"
              type="number"
              min={5}
              max={100}
              value={inputMoisture}
              onChange={e => setInputMoisture(Number(e.target.value))}
              className="w-28 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono tabular-nums font-bold focus:outline-emerald-600"
            />
          </div>

          <div>
            <label
              htmlFor="today-nutrient-input"
              className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1"
            >
              {copy.nutrientInputLabel}
            </label>
            <input
              id="today-nutrient-input"
              type="number"
              min={5}
              max={100}
              value={inputNutrient}
              onChange={e => setInputNutrient(Number(e.target.value))}
              className="w-28 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono tabular-nums font-bold focus:outline-emerald-600"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {copy.logReadingBtn}
          </button>
        </div>
      </form>
    </section>
  );
};
