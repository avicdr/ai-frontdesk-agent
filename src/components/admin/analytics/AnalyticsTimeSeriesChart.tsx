'use client';

// src/components/admin/analytics/AnalyticsTimeSeriesChart.tsx
// Zero-dependency SVG time-series chart with smooth curves, gradient glows, and hover crosshair

import React, { useState, useMemo, useRef } from 'react';
import { TimeSeriesDataPoint } from '@/lib/analytics/types';

interface ChartProps {
  data: TimeSeriesDataPoint[];
  metricKey: 'pageViews' | 'uniqueVisitors' | 'sessions' | 'visitors';
  metricLabel: string;
  color?: string; // e.g. '#E84B2C' or '#E87A38'
}

export function AnalyticsTimeSeriesChart({
  data,
  metricKey,
  metricLabel,
  color = '#E84B2C',
}: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const values = useMemo(() => data.map((d) => d[metricKey] || 0), [data, metricKey]);
  const maxValue = useMemo(() => {
    const max = Math.max(...values, 0);
    if (max === 0) return 10;
    // Round up to nice number
    const factor = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / factor) * factor;
  }, [values]);

  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Compute coordinate points
  const points = useMemo(() => {
    if (data.length === 0) return [];
    const count = data.length;
    const stepX = count > 1 ? chartWidth / (count - 1) : chartWidth / 2;

    return data.map((d, i) => {
      const val = d[metricKey] || 0;
      const x = padding.left + (count > 1 ? i * stepX : chartWidth / 2);
      const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
      return { x, y, value: val, label: d.label, date: d.date };
    });
  }, [data, metricKey, maxValue, chartWidth, chartHeight, padding.left, padding.top]);

  // Construct smooth SVG path using Catmull-Rom or Cubic Bézier
  const { pathD, areaD } = useMemo(() => {
    if (points.length === 0) return { pathD: '', areaD: '' };
    if (points.length === 1) {
      const p = points[0];
      return {
        pathD: `M ${padding.left} ${p.y} L ${padding.left + chartWidth} ${p.y}`,
        areaD: `M ${padding.left} ${p.y} L ${padding.left + chartWidth} ${p.y} L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`,
      };
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const baselineY = padding.top + chartHeight;
    const aD = `${d} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;

    return { pathD: d, areaD: aD };
  }, [points, chartHeight, padding.left, chartWidth, padding.top]);

  // Y-axis grid ticks
  const yTicks = useMemo(() => {
    return [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue];
  }, [maxValue]);

  // X-axis label filtering (limit to max 7 labels)
  const xLabels = useMemo(() => {
    if (points.length <= 8) return points;
    const step = Math.ceil(points.length / 6);
    return points.filter((_, i) => i === 0 || i === points.length - 1 || i % step === 0);
  }, [points]);

  // Mouse move handler for crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (points.length === 0 || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const svgX = clientX * scaleX;

    // Find closest point
    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div ref={containerRef} className="relative w-full select-none">
      {/* Active tooltip overlay */}
      {activePoint && (
        <div
          className="absolute z-20 pointer-events-none transition-all duration-75 px-3 py-2 rounded-lg border text-xs shadow-xl"
          style={{
            left: `${(activePoint.x / width) * 100}%`,
            top: `${(activePoint.y / height) * 100 - 15}%`,
            transform: 'translate(-50%, -100%)',
            background: 'var(--color-surface-elevated, #171614)',
            borderColor: 'var(--color-border-standard, rgba(243, 240, 232, 0.15))',
            color: 'var(--color-text-primary, #F3F0E8)',
          }}
        >
          <div className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">
            {activePoint.label}
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-bold text-sm text-[var(--color-text-primary)]">
              {activePoint.value.toLocaleString()}
            </span>
            <span className="text-[var(--color-text-muted)] text-[11px]">{metricLabel}</span>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={`gradient-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="70%" stopColor={color} stopOpacity="0.06" />
            <stop offset="100%" stopColor={color} stopOpacity="0.00" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Horizontal Gridlines & Y-Axis Labels */}
        {yTicks.map((val, idx) => {
          const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="var(--color-border-subtle, rgba(243, 240, 232, 0.08))"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 3}
                fill="var(--color-text-muted, #9E9B93)"
                fontSize="10"
                fontFamily="var(--font-mono, monospace)"
                textAnchor="end"
              >
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* X-Axis Labels */}
        {xLabels.map((p, idx) => (
          <text
            key={idx}
            x={p.x}
            y={height - 8}
            fill="var(--color-text-muted, #9E9B93)"
            fontSize="10"
            fontFamily="var(--font-mono, monospace)"
            textAnchor="middle"
          >
            {p.label}
          </text>
        ))}

        {/* Gradient Area Fill */}
        {areaD && <path d={areaD} fill={`url(#gradient-${metricKey})`} />}

        {/* Trend Line with Glow */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />
        )}

        {/* Interactive Hover Crosshair */}
        {activePoint && (
          <g>
            <line
              x1={activePoint.x}
              y1={padding.top}
              x2={activePoint.x}
              y2={padding.top + chartHeight}
              stroke={color}
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.8"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="5"
              fill="var(--color-obsidian, #111110)"
              stroke={color}
              strokeWidth="2.5"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

