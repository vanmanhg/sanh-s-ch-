import React, { useEffect, useRef, useState } from 'react';
import { useMap, useMapsLibrary, AdvancedMarker } from '@vis.gl/react-google-maps';
import {
  RegionalClimatePoint,
  HeatmapMetric,
  HeatmapHorizon,
  drawHeatmapOnCanvas,
  getMetricValue,
  formatMetricValue,
  getThermalRgb,
  CanvasProjectedPoint,
} from '../utils/regionalHeatmap';

interface GoogleMapsHeatmapLayerProps {
  points: RegionalClimatePoint[];
  metric: HeatmapMetric;
  horizon: HeatmapHorizon;
  opacity: number;
  selectedRegionId: string | null;
  onSelectRegion: (point: RegionalClimatePoint) => void;
}

/**
 * Renders a Canvas 2D regional thermal heat-map directly on Google Maps using google.maps.OverlayView
 * plus interactive regional climate hotspot pins via AdvancedMarker (avoiding deprecated HeatmapLayer & WebGL issues).
 */
export const GoogleMapsHeatmapLayer: React.FC<GoogleMapsHeatmapLayerProps> = ({
  points,
  metric,
  horizon,
  opacity,
  selectedRegionId,
  onSelectRegion,
}) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const pointsRef = useRef(points);
  const metricRef = useRef(metric);
  const horizonRef = useRef(horizon);
  const opacityRef = useRef(opacity);
  const overlayRef = useRef<any>(null);

  pointsRef.current = points;
  metricRef.current = metric;
  horizonRef.current = horizon;
  opacityRef.current = opacity;

  useEffect(() => {
    if (!map || !mapsLib || typeof window === 'undefined' || !(window as any).google?.maps) return;
    const gmaps = (window as any).google.maps;

    class RegionalCanvasHeatmapOverlay extends gmaps.OverlayView {
      private canvas: HTMLCanvasElement | null = null;

      onAdd() {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.pointerEvents = 'none';
        this.canvas = canvas;
        const panes = this.getPanes();
        panes?.overlayLayer?.appendChild(canvas);
      }

      draw() {
        const canvas = this.canvas;
        const projection = this.getProjection();
        const mapDiv = map?.getDiv();
        if (!canvas || !projection || !mapDiv) return;

        const width = Math.max(mapDiv.clientWidth, 320);
        const height = Math.max(mapDiv.clientHeight, 260);
        const ne = projection.fromContainerPixelToLatLng(new gmaps.Point(width, 0));
        const sw = projection.fromContainerPixelToLatLng(new gmaps.Point(0, height));
        if (!ne || !sw) return;

        const topLeftDiv = projection.fromLatLngToDivPixel(new gmaps.LatLng(ne.lat(), sw.lng()));
        if (!topLeftDiv) return;

        canvas.style.left = `${topLeftDiv.x}px`;
        canvas.style.top = `${topLeftDiv.y}px`;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const projected: CanvasProjectedPoint[] = [];
        for (const pt of pointsRef.current) {
          const px = projection.fromLatLngToDivPixel(new gmaps.LatLng(pt.lat, pt.lng));
          if (!px) continue;
          projected.push({
            point: pt,
            x: px.x - topLeftDiv.x,
            y: px.y - topLeftDiv.y,
          });
        }

        const zoom = map?.getZoom() ?? 10;
        const radiusPx = Math.max(55, Math.min(165, Math.round(zoom * 11.5)));
        drawHeatmapOnCanvas(
          canvas,
          width,
          height,
          projected,
          metricRef.current,
          horizonRef.current,
          radiusPx,
          opacityRef.current
        );
      }

      onRemove() {
        if (this.canvas && this.canvas.parentNode) {
          this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
      }
    }

    const overlay = new RegionalCanvasHeatmapOverlay();
    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
    };
  }, [map, mapsLib]);

  useEffect(() => {
    overlayRef.current?.draw?.();
  }, [points, metric, horizon, opacity]);

  return (
    <>
      {points.map(pt => {
        const val = getMetricValue(pt, metric, horizon);
        const [r, g, b] = getThermalRgb(metric, val);
        const isSelected = selectedRegionId === pt.id;
        return (
          <AdvancedMarker
            key={`hm-node-${pt.id}`}
            position={{ lat: pt.lat, lng: pt.lng }}
            title={`${pt.regionName}: ${formatMetricValue(val, metric)}`}
            onClick={() => onSelectRegion(pt)}
            zIndex={isSelected ? 40 : 15}
          >
            <div
              className={`px-2 py-1 rounded-xl text-[10px] font-black text-white shadow-lg border transition-transform cursor-pointer whitespace-nowrap ${
                isSelected ? 'scale-110 ring-2 ring-white border-zinc-900' : 'border-white/60 hover:scale-105'
              }`}
              style={{
                backgroundColor: `rgba(${r}, ${g}, ${b}, 0.92)`,
              }}
            >
              <span>{formatMetricValue(val, metric)}</span>
              <span className="ml-1 opacity-90 font-semibold hidden sm:inline">
                · {pt.regionName.replace('Khu Vực ', '').replace('Vùng ', '').split('(')[0].trim()}
              </span>
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
};

interface StaticCachedHeatmapLayerProps {
  points: RegionalClimatePoint[];
  projectPoint: (lat: number, lng: number) => { xPct: number; yPct: number };
  metric: HeatmapMetric;
  horizon: HeatmapHorizon;
  opacity: number;
  selectedRegionId: string | null;
  onSelectRegion: (point: RegionalClimatePoint) => void;
}

/**
 * Renders the interactive Canvas 2D regional thermal heat-map and clickable microclimate nodes
 * on top of the static cached fallback map.
 */
export const StaticCachedHeatmapLayer: React.FC<StaticCachedHeatmapLayerProps> = ({
  points,
  projectPoint,
  metric,
  horizon,
  opacity,
  selectedRegionId,
  onSelectRegion,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 760, height: 420 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateSize);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const projected: CanvasProjectedPoint[] = points.map(pt => {
      const { xPct, yPct } = projectPoint(pt.lat, pt.lng);
      return {
        point: pt,
        x: (xPct / 100) * size.width,
        y: (yPct / 100) * size.height,
      };
    });
    const radiusPx = Math.max(65, Math.min(130, Math.round(Math.min(size.width, size.height) * 0.24)));
    drawHeatmapOnCanvas(canvas, size.width, size.height, projected, metric, horizon, radiusPx, opacity);
  }, [points, projectPoint, size, metric, horizon, opacity]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-15 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Interactive Regional Climate Hotspot Chips */}
      {points.map(pt => {
        const { xPct, yPct } = projectPoint(pt.lat, pt.lng);
        const val = getMetricValue(pt, metric, horizon);
        const [r, g, b] = getThermalRgb(metric, val);
        const isSelected = selectedRegionId === pt.id;
        return (
          <button
            key={`static-hm-${pt.id}`}
            type="button"
            onClick={() => onSelectRegion(pt)}
            style={{
              top: `${yPct}%`,
              left: `${xPct}%`,
              backgroundColor: `rgba(${r}, ${g}, ${b}, 0.92)`,
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-white shadow-md border transition-transform cursor-pointer whitespace-nowrap ${
              isSelected
                ? 'z-30 scale-110 ring-2 ring-white border-zinc-900'
                : 'z-15 border-white/70 hover:scale-105'
            }`}
            title={`${pt.regionName}: ${formatMetricValue(val, metric)} — Nhấn để xem lịch gieo trồng`}
          >
            {formatMetricValue(val, metric)}
          </button>
        );
      })}
    </div>
  );
};
