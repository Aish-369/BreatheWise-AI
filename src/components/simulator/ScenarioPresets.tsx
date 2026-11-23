import type { ScenarioModification } from '../../shared/types';

interface ScenarioPresetsProps {
  onSelectPreset: (mod: ScenarioModification) => void;
}

const PRESETS: Array<{ title: string; metric: string; sub: string; mod: ScenarioModification }> = [
  {
    title: 'PM2.5 Spike',
    metric: '145 µg/m³',
    sub: 'Simulate worsening peak',
    mod: {
      label: 'What if PM2.5 spikes to 145 µg/m³?',
      pm25Override: 145,
      forecastTrendOverride: 'worsening',
    },
  },
  {
    title: 'Dust Event (PM10)',
    metric: '260 µg/m³',
    sub: 'Road / construction dust storm',
    mod: {
      label: 'What if PM10 rises to 260 µg/m³?',
      pm25Override: 48,
      pm10Override: 260,
    },
  },
  {
    title: 'Afternoon Clear',
    metric: '32 µg/m³',
    sub: 'Dispersion improves air',
    mod: {
      label: 'What if afternoon air clears to 32 µg/m³?',
      pm25Override: 32,
      forecastTrendOverride: 'improving',
    },
  },
  {
    title: 'Stale Sensor',
    metric: '> 6h old',
    sub: 'Test confidence drop',
    mod: {
      label: 'What if monitoring data becomes stale (> 6h)?',
      simulateStale: true,
    },
  },
];

export function ScenarioPresets({ onSelectPreset }: ScenarioPresetsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {PRESETS.map((preset) => (
        <button
          key={preset.title}
          type="button"
          onClick={() => onSelectPreset(preset.mod)}
          className="text-left bg-white border border-[#E2E7E1] rounded-xl p-4 hover:border-[#263C32] hover:bg-[#DCE9DD]/25 transition-colors cursor-pointer shadow-[0_1px_3px_rgba(37,45,40,0.03)]"
        >
          <p className="font-mono text-xs font-semibold text-[#263C32]">{preset.metric}</p>
          <p className="mt-1 font-display text-sm font-semibold text-[#252D28]">{preset.title}</p>
          <p className="mt-0.5 text-[11px] text-[#565F58]">{preset.sub}</p>
        </button>
      ))}
    </div>
  );
}
