import type { AqiBand } from '../../shared/types';
import { AqiGauge } from '../AqiGauge';

export interface HeroPreviewData {
  city: string;
  aqi: number;
  band: AqiBand;
  bandLabel: string;
  pm25: number;
  pm10: number;
  freshness: string;
  source: string;
  walkTime: string;
  walkStatus: string;
}

export function HeroPreviewBody({ data }: { data: HeroPreviewData }) {
  return (
    <>
      <div className="py-2 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        <div className="sm:col-span-5 flex justify-center">
          <AqiGauge
            aqi={data.aqi}
            band={data.band}
            bandLabel={data.bandLabel}
            isAvailable
            darkSurface
            size="sm"
          />
        </div>
        <div className="sm:col-span-7 space-y-2.5">
          <p className="text-xs text-[#DCE9DD]">{data.source}</p>
          <p className="text-base font-display font-semibold text-white">{data.city}</p>
          <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono tabular-nums">
            <div className="rounded-lg bg-white/8 p-2">
              <span className="block text-[10px] text-[#DCE9DD]">PM2.5</span>
              <span className="font-semibold text-white">{data.pm25} µg</span>
            </div>
            <div className="rounded-lg bg-white/8 p-2">
              <span className="block text-[10px] text-[#DCE9DD]/80">PM10</span>
              <span className="font-semibold text-white">{data.pm10} µg</span>
            </div>
            <div className="rounded-lg bg-white/8 p-2">
              <span className="block text-[10px] text-[#DCE9DD]/80">Status</span>
              <span className="font-sans font-medium text-[#DCE9DD]">
                {data.freshness.split(' ')[0]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-white/10 text-xs">
        <div className="rounded-lg bg-white/8 px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-white">Morning walk · Older adult</p>
            <p className="text-[11px] text-[#DCE9DD]">{data.walkStatus}</p>
          </div>
          <span className="font-mono text-[#DCE9DD] tabular-nums shrink-0">{data.walkTime}</span>
        </div>
        <div className="rounded-lg bg-white/8 px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-white">School commute · School-age member</p>
            <p className="text-[11px] text-[#DCE9DD]">Low-traffic route · Wash face after return</p>
          </div>
          <span className="font-mono text-[#DCE9DD] tabular-nums shrink-0">06:00–09:00</span>
        </div>
      </div>
    </>
  );
}
