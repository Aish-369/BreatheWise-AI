import type {
  ActivityRoutine,
  AqiBand,
  ConfidenceOrLimitationKey,
  DataClassification,
  EnvironmentalSnapshot,
  FamilyMember,
  ForecastSlot,
  FreshnessStatus,
  HistoricalTrendSummary,
  HouseholdProfile,
  SupportingEvidence,
} from '../../shared/types';
import type { ProviderConflictReport, SnapshotValidationResult } from '../quality';

export interface EngineInput {
  household: HouseholdProfile;
  members: FamilyMember[];
  routines: ActivityRoutine[];
  primarySnapshot: EnvironmentalSnapshot | null;
  secondarySnapshots?: EnvironmentalSnapshot[];
  historicalSnapshots?: EnvironmentalSnapshot[];
  forecastSlots?: ForecastSlot[];
  nowIso?: string;
  isScenario?: boolean;
}

export interface EvidenceBundle {
  nowIso: string;
  todayDate: string;
  forecasts: ForecastSlot[];
  validation: SnapshotValidationResult;
  conflict: ProviderConflictReport;
  historicalTrend: HistoricalTrendSummary | null;
  aqiValue: number | null;
  aqiBand: AqiBand;
  dominantPollutant: string | null;
  freshness: FreshnessStatus;
  classification: DataClassification;
  isAvailable: boolean;
  evidence: SupportingEvidence;
  limitations: string[];
  confidence: ConfidenceOrLimitationKey;
}

export interface MemberGroups {
  infantToddler: string[];
  schoolChild: string[];
  adult: string[];
  olderAdult: string[];
  activeOutdoorAdults: string[];
  allMemberNames: string[];
}
