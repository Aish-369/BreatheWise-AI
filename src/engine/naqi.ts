import type { AqiBand, Pollutants } from '../shared/types';

export interface DerivedAqiResult {
  aqi: number | null;
  band: AqiBand;
  dominantPollutant: string | null;
  isDerived: boolean;
}

interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

// Official India National Air Quality Index (CPCB NAQI) 24h/8h breakpoints
const PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
  { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
  { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
  { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
  { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
  { cLow: 251, cHigh: 1000, iLow: 401, iHigh: 500 },
];

const PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
  { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
  { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
  { cLow: 431, cHigh: 1500, iLow: 401, iHigh: 500 },
];

const NO2_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
  { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
  { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200 },
  { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },
  { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },
  { cLow: 401, cHigh: 1500, iLow: 401, iHigh: 500 },
];

const O3_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200 },
  { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300 },
  { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400 },
  { cLow: 749, cHigh: 1500, iLow: 401, iHigh: 500 },
];

function computeSubIndex(value: number, breakpoints: Breakpoint[]): number {
  const rounded = Math.round(value);
  for (const bp of breakpoints) {
    if (rounded >= bp.cLow && rounded <= bp.cHigh) {
      const spanC = bp.cHigh - bp.cLow;
      const spanI = bp.iHigh - bp.iLow;
      if (spanC <= 0) return bp.iLow;
      return Math.round(((rounded - bp.cLow) / spanC) * spanI + bp.iLow);
    }
  }
  return 500;
}

export function aqiToBand(aqi: number | null | undefined): AqiBand {
  if (aqi === null || aqi === undefined || Number.isNaN(aqi) || aqi < 0) {
    return 'unavailable';
  }
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'satisfactory';
  if (aqi <= 200) return 'moderate';
  if (aqi <= 300) return 'poor';
  if (aqi <= 400) return 'very_poor';
  return 'severe';
}

export function deriveAqiFromPollutants(
  pollutants: Pollutants,
  reportedAqi?: number | null
): DerivedAqiResult {
  const subIndices: Array<{ pollutant: string; subIndex: number }> = [];

  if (typeof pollutants.pm25 === 'number' && pollutants.pm25 >= 0 && pollutants.pm25 <= 2000) {
    subIndices.push({
      pollutant: 'PM2.5',
      subIndex: computeSubIndex(pollutants.pm25, PM25_BREAKPOINTS),
    });
  }
  if (typeof pollutants.pm10 === 'number' && pollutants.pm10 >= 0 && pollutants.pm10 <= 3000) {
    subIndices.push({
      pollutant: 'PM10',
      subIndex: computeSubIndex(pollutants.pm10, PM10_BREAKPOINTS),
    });
  }
  if (typeof pollutants.no2 === 'number' && pollutants.no2 >= 0 && pollutants.no2 <= 2000) {
    subIndices.push({
      pollutant: 'NO2',
      subIndex: computeSubIndex(pollutants.no2, NO2_BREAKPOINTS),
    });
  }
  if (typeof pollutants.o3 === 'number' && pollutants.o3 >= 0 && pollutants.o3 <= 1500) {
    subIndices.push({ pollutant: 'O3', subIndex: computeSubIndex(pollutants.o3, O3_BREAKPOINTS) });
  }

  subIndices.sort((a, b) => b.subIndex - a.subIndex);
  const dominant = subIndices[0] ?? null;

  if (typeof reportedAqi === 'number' && reportedAqi >= 0 && reportedAqi <= 1000) {
    return {
      aqi: Math.round(reportedAqi),
      band: aqiToBand(reportedAqi),
      dominantPollutant: dominant?.pollutant ?? null,
      isDerived: false,
    };
  }

  if (!dominant) {
    return { aqi: null, band: 'unavailable', dominantPollutant: null, isDerived: false };
  }

  return {
    aqi: dominant.subIndex,
    band: aqiToBand(dominant.subIndex),
    dominantPollutant: dominant.pollutant,
    isDerived: true,
  };
}
