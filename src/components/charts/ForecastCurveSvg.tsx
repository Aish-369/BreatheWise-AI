import { motion } from 'motion/react';
import type { ForecastSlot } from '../../shared/types';

interface ForecastCurveSvgProps {
  valid: ForecastSlot[];
  maxPm: number;
  minPm: number;
  activeIndex: number;
  onSelectIndex: (idx: number) => void;
}

export function ForecastCurveSvg({
  valid,
  maxPm,
  minPm,
  activeIndex,
  onSelectIndex,
}: ForecastCurveSvgProps) {
  const width = 420;
  const height = 140;
  const padX = 28;
  const padY = 20;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;

  const points = valid.map((slot, idx) => {
    const x = valid.length === 1 ? width / 2 : padX + (idx / (valid.length - 1)) * usableW;
    const val = slot.expectedPm25 ?? 0;
    const y = padY + usableH - (val / maxPm) * usableH;
    return { x, y, slot, val };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(height - padY).toFixed(1)} L ${points[0].x.toFixed(1)} ${(height - padY).toFixed(1)} Z`
      : '';

  return (
    <div className="pt-1">
      <svg
        viewBox={`0 0 ${width} ${height + 18}`}
        className="w-full h-40 overflow-visible"
        role="img"
        aria-label="Coarse-grid expected PM2.5 trend curve"
      >
        <defs>
          <linearGradient id="bwForecastArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#829C83" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#DCE9DD" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((r) => {
          const gy = padY + usableH * (1 - r);
          return (
            <line
              key={r}
              x1={padX}
              x2={width - padX}
              y1={gy}
              y2={gy}
              stroke="#E2E7E1"
              strokeDasharray="3 3"
            />
          );
        })}

        {areaPath && <path d={areaPath} fill="url(#bwForecastArea)" />}

        {linePath && (
          <motion.path
            d={linePath}
            fill="none"
            stroke="#263C32"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0.2, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        )}

        {points.map((pt, idx) => {
          const isBest = pt.val === minPm;
          const isActive = idx === activeIndex;
          return (
            <g
              key={pt.slot.id}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={`${pt.slot.timeWindow}: PM2.5 ~${pt.val} µg/m³`}
              className="cursor-pointer focus:outline-none"
              onFocus={() => onSelectIndex(idx)}
              onMouseEnter={() => onSelectIndex(idx)}
              onClick={() => onSelectIndex(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectIndex(idx);
                }
              }}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isActive ? 6.5 : 4.5}
                fill={isBest ? '#3B6E52' : '#263C32'}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <text
                x={pt.x}
                y={pt.y - 11}
                textAnchor="middle"
                className="fill-[#252D28] font-mono text-[10px] font-medium tabular-nums"
              >
                {pt.val}
              </text>
              <text
                x={pt.x}
                y={height + 8}
                textAnchor="middle"
                className="fill-[#525C56] font-mono text-[10px] tabular-nums"
              >
                {pt.slot.timeWindow.slice(0, 5)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
