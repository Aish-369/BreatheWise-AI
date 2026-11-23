import { motion } from 'motion/react';
import type { AqiBand } from '../shared/types';

interface AqiGaugeProps {
  aqi: number | null;
  band: AqiBand;
  bandLabel: string;
  isAvailable: boolean;
  darkSurface?: boolean;
  size?: 'sm' | 'lg';
}

function bandStrokeColor(band: AqiBand, darkSurface: boolean): string {
  switch (band) {
    case 'good':
      return '#489C6E';
    case 'satisfactory':
      return darkSurface ? '#829C83' : '#4D6B50';
    case 'moderate':
      return '#D99B38';
    case 'poor':
      return '#D96B38';
    case 'very_poor':
      return '#C94438';
    case 'severe':
      return '#9E2323';
    default:
      return '#525C56';
  }
}

function bandTextColor(band: AqiBand, darkSurface: boolean): string {
  if (darkSurface) {
    switch (band) {
      case 'good':
        return '#A7E3C1';
      case 'satisfactory':
        return '#DCE9DD';
      case 'moderate':
        return '#FCD37D';
      case 'poor':
        return '#FDBA8C';
      case 'very_poor':
        return '#FCA5A5';
      case 'severe':
        return '#FECACA';
      default:
        return '#DCE9DD';
    }
  }
  switch (band) {
    case 'good':
      return '#215E3C';
    case 'satisfactory':
      return '#263C32';
    case 'moderate':
      return '#8A5308';
    case 'poor':
      return '#9A3B12';
    case 'very_poor':
      return '#9E2323';
    case 'severe':
      return '#7F1D1D';
    default:
      return '#525C56';
  }
}

export function AqiGauge({
  aqi,
  band,
  bandLabel,
  isAvailable,
  darkSurface = false,
  size = 'lg',
}: AqiGaugeProps) {
  const isLarge = size === 'lg';
  const svgSize = isLarge ? 196 : 124;
  const strokeWidth = isLarge ? 13 : 9;
  const radius = (svgSize - strokeWidth * 2) / 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  // 240-degree sweep arc starting at 150 degrees
  const startAngle = 150;
  const totalAngle = 240;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalAngle / 360) * circumference;

  const clampedRatio =
    isAvailable && typeof aqi === 'number' ? Math.max(0.03, Math.min(1, aqi / 450)) : 0;
  const targetOffset = arcLength * (1 - clampedRatio);

  const trackColor = darkSurface ? 'rgba(220, 233, 221, 0.16)' : '#DCE9DD';
  const valueColor = darkSurface ? '#FFFFFF' : '#252D28';
  const subColor = darkSurface ? '#DCE9DD' : '#525C56';
  const accentColor = bandStrokeColor(band, darkSurface);
  const labelColor = isAvailable ? bandTextColor(band, darkSurface) : subColor;

  return (
    <div className="relative inline-flex items-center justify-center select-none">
      <svg
        width={svgSize}
        height={svgSize * 0.86}
        viewBox={`0 0 ${svgSize} ${svgSize * 0.92}`}
        className="overflow-visible"
        role="img"
        aria-label={isAvailable && aqi !== null ? `AQI ${aqi} ${bandLabel}` : 'AQI Unavailable'}
      >
        <g transform={`rotate(${startAngle} ${cx} ${cy})`}>
          {/* Background Arc Track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Active Animated Progress Arc */}
          {isAvailable && aqi !== null && (
            <motion.circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={accentColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              initial={{ strokeDashoffset: arcLength }}
              animate={{ strokeDashoffset: targetOffset }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              strokeLinecap="round"
            />
          )}
        </g>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 text-center">
        <span
          className={`font-display font-bold tracking-tight tabular-nums leading-none ${
            isLarge ? 'text-[44px]' : 'text-2xl'
          }`}
          style={{ color: valueColor }}
        >
          {isAvailable && aqi !== null ? aqi : '—'}
        </span>
        <span
          className={`mt-1.5 font-medium ${isLarge ? 'text-xs' : 'text-[11px]'}`}
          style={{ color: labelColor }}
        >
          {bandLabel}
        </span>
      </div>
    </div>
  );
}
