import { Activity, FileText, SlidersHorizontal } from 'lucide-react';
import type { EnvironmentalSnapshot } from '../../shared/types';

interface HistoryKpiStripProps {
  planCount: number;
  scenarioCount: number;
  snapshots: EnvironmentalSnapshot[];
}

export function HistoryKpiStrip({ planCount, scenarioCount, snapshots }: HistoryKpiStripProps) {
  const pmPoints = snapshots
    .filter((s) => typeof s.pollutants.pm25 === 'number')
    .slice(0, 10)
    .reverse();
  const maxPm = Math.max(80, ...pmPoints.map((s) => s.pollutants.pm25 ?? 0));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E7E1] rounded-2xl p-5 flex items-center justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div>
            <p className="text-xs text-[#565F58]">Saved Plans</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[#252D28] tabular-nums">
              {planCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#DCE9DD]/55 text-[#263C32] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white border border-[#E2E7E1] rounded-2xl p-5 flex items-center justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div>
            <p className="text-xs text-[#565F58]">What-If Scenarios</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[#252D28] tabular-nums">
              {scenarioCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#DCE9DD]/55 text-[#263C32] flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white border border-[#E2E7E1] rounded-2xl p-5 flex items-center justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div>
            <p className="text-xs text-[#565F58]">Recorded Snapshots</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[#252D28] tabular-nums">
              {snapshots.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#DCE9DD]/55 text-[#263C32] flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {pmPoints.length >= 2 && (
        <div className="bg-white border border-[#E2E7E1] rounded-2xl p-6 shadow-[0_1px_3px_rgba(37,45,40,0.04)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <h2 className="font-display text-sm font-semibold text-[#252D28]">
              Recorded Session Snapshots (PM2.5 µg/m³)
            </h2>
            <span className="font-mono text-[#565F58]">{pmPoints.length} logged points</span>
          </div>
          <div className="flex items-end gap-4 h-32 pt-3 border-t border-[#E2E7E1] overflow-x-auto">
            {pmPoints.map((snap) => {
              const val = snap.pollutants.pm25 ?? 0;
              const hPct = Math.max(14, Math.round((val / maxPm) * 100));
              return (
                <div key={snap.id} className="w-16 shrink-0 flex flex-col items-center gap-1.5">
                  <span className="font-mono text-[11px] font-medium text-[#252D28] tabular-nums">
                    {val}
                  </span>
                  <div className="w-10 h-16 bg-[#F7F7F1] rounded-md flex items-end p-0.5">
                    <div
                      style={{ height: `${hPct}%` }}
                      className="w-full rounded bg-gradient-to-t from-[#263C32] to-[#829C83]"
                      title={`${snap.stationOrGridId}: ${val} µg/m³`}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[#565F58] truncate w-full text-center">
                    {snap.stationOrGridId.split('-').slice(-2, -1)[0] || snap.city}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
