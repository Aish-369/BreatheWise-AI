import type { ForecastSlot } from '../../shared/types';

interface DataAvailabilityBannerProps {
  city: string;
  hasStationObservation: boolean;
  nextForecast: ForecastSlot | null;
  onViewForecast: () => void;
}

function formatMetric(value: number | null | undefined, unit = '') {
  return typeof value === 'number' && Number.isFinite(value) ? `${value}${unit}` : 'Unavailable';
}

export function DataAvailabilityBanner({
  city,
  hasStationObservation,
  nextForecast,
  onViewForecast,
}: DataAvailabilityBannerProps) {
  return (
    <section
      aria-label="Air quality data availability"
      className="rounded-2xl border border-[#E2E7E1] bg-white p-5 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#565F58]">
            Data availability · {city}
          </p>
          <h2 className="mt-1 font-display text-sm font-semibold text-[#252D28]">
            {hasStationObservation
              ? 'Physical station observations'
              : 'No verified station observation is currently available'}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#565F58]">
            {hasStationObservation
              ? 'Station observations are shown separately from regional model forecasts below.'
              : 'CPCB / OpenAQ station readings are not being replaced with estimates. Check the source status cards below for provider availability.'}
          </p>
        </div>
        {nextForecast && (
          <div className="shrink-0 rounded-xl border border-[#DCE9DD] bg-[#F7F7F1] p-4 sm:min-w-64">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#565F58]">
              Regional CAMS model forecast · not a station reading
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-[#565F58]">PM2.5</p>
                <p className="mt-1 font-mono text-lg font-bold tabular-nums text-[#263C32]">
                  {formatMetric(nextForecast.expectedPm25)}
                </p>
                <p className="text-[10px] text-[#565F58]">µg/m³</p>
              </div>
              <div>
                <p className="text-[10px] text-[#565F58]">PM10</p>
                <p className="mt-1 font-mono text-lg font-bold tabular-nums text-[#263C32]">
                  {formatMetric(nextForecast.expectedPm10)}
                </p>
                <p className="text-[10px] text-[#565F58]">µg/m³</p>
              </div>
              <div>
                <p className="text-[10px] text-[#565F58]">India AQI</p>
                <p className="mt-1 font-mono text-lg font-bold tabular-nums text-[#263C32]">
                  {formatMetric(nextForecast.expectedAqiIndia)}
                </p>
                <p className="text-[10px] text-[#565F58]">model-derived</p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-[#565F58]">
              {nextForecast.forecastDate} · {nextForecast.timeWindow}
            </p>
            <button
              type="button"
              onClick={onViewForecast}
              className="mt-2 text-xs font-semibold text-[#263C32] underline underline-offset-2 cursor-pointer"
            >
              View forecast details
            </button>
          </div>
        )}
      </div>
      {!nextForecast && (
        <p className="mt-3 rounded-lg border border-dashed border-[#E2E7E1] bg-[#F7F7F1]/70 p-3 text-xs text-[#565F58]">
          No valid regional forecast is available for this city right now. The forecast panel will
          show the provider error state; no synthetic readings are displayed.
        </p>
      )}
    </section>
  );
}
