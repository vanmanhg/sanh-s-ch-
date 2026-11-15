import React, { useMemo } from 'react';
import * as d3 from 'd3';

interface D3PriceSparklineProps {
  values: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
}

export const D3PriceSparkline: React.FC<D3PriceSparklineProps> = ({
  values,
  isPositive,
  width = 108,
  height = 34
}) => {
  const { linePath, areaPath, lastPoint } = useMemo(() => {
    if (!values.length) {
      return { linePath: '', areaPath: '', lastPoint: null as { x: number; y: number } | null };
    }

    const padX = 3;
    const padY = 4;
    const minVal = d3.min(values) ?? 0;
    const maxVal = d3.max(values) ?? 1;
    const domainPad = maxVal === minVal ? Math.max(1, maxVal * 0.05) : (maxVal - minVal) * 0.1;

    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(1, values.length - 1)])
      .range([padX, width - padX]);

    const yScale = d3
      .scaleLinear()
      .domain([minVal - domainPad, maxVal + domainPad])
      .range([height - padY, padY]);

    const lineGen = d3
      .line<number>()
      .x((_, idx) => xScale(idx))
      .y(d => yScale(d))
      .curve(d3.curveMonotoneX);

    const areaGen = d3
      .area<number>()
      .x((_, idx) => xScale(idx))
      .y0(height - padY)
      .y1(d => yScale(d))
      .curve(d3.curveMonotoneX);

    const lastIdx = values.length - 1;
    return {
      linePath: lineGen(values) || '',
      areaPath: areaGen(values) || '',
      lastPoint: { x: xScale(lastIdx), y: yScale(values[lastIdx]) }
    };
  }, [values, width, height]);

  const strokeColor = isPositive ? '#16a34a' : '#dc2626';
  const fillColor = isPositive ? 'rgba(22, 163, 74, 0.14)' : 'rgba(220, 38, 38, 0.14)';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible shrink-0"
      aria-hidden="true"
    >
      {areaPath && <path d={areaPath} fill={fillColor} />}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2.5}
          fill={strokeColor}
        />
      )}
    </svg>
  );
};
