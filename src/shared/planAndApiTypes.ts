import { z } from 'zod';
import {
  type DataClassification,
  type DataType,
  type FreshnessStatus,
  LanguageCodeSchema,
  type TimeWindow,
  TimeWindowSchema,
} from './domainTypes';

export type AqiBand =
  'good' | 'satisfactory' | 'moderate' | 'poor' | 'very_poor' | 'severe' | 'unavailable';

export type ConfidenceOrLimitationKey =
  | 'high_station_fresh'
  | 'moderate_aging'
  | 'low_stale'
  | 'partial_pollutants'
  | 'coarse_grid_forecast'
  | 'provider_conflict'
  | 'evidence_unavailable'
  | 'hypothetical_simulation';

export type RecommendationSeverity =
  'nominal' | 'advisory' | 'caution' | 'elevated' | 'unavailable';

export interface SupportingEvidence {
  providerLabel: string;
  stationOrGridId: string;
  dataType: DataType;
  classification?: DataClassification;
  measuredAt: string | null;
  retrievedAt: string;
  freshness: FreshnessStatus;
  pm25: number | null;
  pm10: number | null;
  aqiValue: number | null;
  aqiIsDerived: boolean;
  isDemoFixture: boolean;
}

export interface ExplainabilityTrail {
  evidenceMetric: string;
  ruleTriggered: string;
  householdContext: string;
  reconsiderWhenKey: string;
}

export interface Recommendation {
  id: string;
  titleKey: string;
  titleParams?: Record<string, string | number>;
  explanationKey: string;
  explanationParams?: Record<string, string | number>;
  applicableMembers: string[];
  supportingEvidence: SupportingEvidence;
  sourceTimestamp: string | null;
  confidenceOrLimitationKey: ConfidenceOrLimitationKey;
  suggestedActionKey: string;
  suggestedActionParams?: Record<string, string | number>;
  reasonGeneratedKey: string;
  reasonGeneratedParams?: Record<string, string | number>;
  reconsiderWhenKey?: string;
  evidenceTrail?: ExplainabilityTrail;
  severity: RecommendationSeverity;
}

export type PlanItemStatus =
  | 'proceed_as_planned'
  | 'proceed_with_precautions'
  | 'adjust_window'
  | 'move_indoors'
  | 'hold_pending_data';

export interface DailyPlanItem {
  routineId: string;
  routineTitle: string;
  environment: 'outdoor' | 'indoor';
  flexibility: 'fixed' | 'flexible';
  originalWindow: TimeWindow;
  suggestedWindow: TimeWindow | null;
  status: PlanItemStatus;
  applicableMembers: string[];
  rationaleKey: string;
  rationaleParams?: Record<string, string | number>;
  limitationKey: string | null;
  evidenceTimestamp: string | null;
  notes?: string;
  completedToday?: boolean;
}

export interface HistoricalTrendSummary {
  direction: 'improving' | 'worsening' | 'stable';
  previousPm25: number | null;
  latestPm25: number | null;
  deltaPm25: number | null;
  sampleCount: number;
}

export interface ProtectionPlanResult {
  id: string;
  generatedAt: string;
  city: string;
  aqiValue: number | null;
  aqiIsDerived: boolean;
  aqiBand: AqiBand;
  dominantPollutant: string | null;
  freshness: FreshnessStatus;
  dataType: DataType;
  classification?: DataClassification;
  ruleSetVersion?: string;
  historicalTrend?: HistoricalTrendSummary | null;
  isAvailable: boolean;
  isDemoFixture: boolean;
  isScenario: boolean;
  scenarioLabel?: string;
  conflictWarningKey: string | null;
  conflictDetails: string | null;
  summaryKey: string;
  summaryParams: Record<string, string | number>;
  limitations: string[];
  recommendations: Recommendation[];
  dailyPlan: DailyPlanItem[];
  supportingEvidence: SupportingEvidence;
}

export const ScenarioModificationSchema = z.object({
  label: z.string().trim().min(1).max(120),
  pm25Override: z.number().min(0).max(1000).nullable().optional(),
  pm10Override: z.number().min(0).max(1500).nullable().optional(),
  aqiOverride: z.number().min(0).max(500).nullable().optional(),
  simulateStale: z.boolean().optional(),
  simulateUnavailable: z.boolean().optional(),
  overrideRoutineId: z.string().optional(),
  overrideWindow: TimeWindowSchema.optional(),
  overrideEnvironment: z.enum(['outdoor', 'indoor']).optional(),
  forecastTrendOverride: z.enum(['improving', 'stable', 'worsening', 'none']).optional(),
});
export type ScenarioModification = z.infer<typeof ScenarioModificationSchema>;

export interface ScenarioComparisonResult {
  id: string;
  createdAt: string;
  isScenario: true;
  disclaimerBanner: 'SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT';
  modification: ScenarioModification;
  baselinePlan: ProtectionPlanResult;
  scenarioPlan: ProtectionPlanResult;
  changedRecommendationsCount: number;
  changedScheduleCount: number;
  changeSummaryKeys: string[];
}

export interface ProviderAdapterStatus {
  provider: 'cpcb' | 'openaq' | 'cams_manual' | 'cams_auto';
  name: string;
  configured: boolean;
  liveReachable: boolean;
  status: 'live' | 'forecast' | 'unconfigured' | 'unavailable' | 'manual_import';
  licenseName: string;
  attributionText: string;
  notes: string;
  lastCheckedAt: string;
}

export const CamsImportPayloadSchema = z.object({
  city: z.string().trim().min(1).max(60),
  gridId: z.string().trim().min(1).max(100),
  issuedAt: z.string().min(1),
  slots: z
    .array(
      z.object({
        timeWindow: TimeWindowSchema,
        forecastDate: z.string().min(1),
        expectedPm25: z.number().min(0).max(2000),
        expectedPm10: z.number().min(0).max(3000).optional(),
        expectedAqiIndia: z.number().min(0).max(1000).optional(),
        trend: z.enum(['improving', 'stable', 'worsening', 'unknown']).default('unknown'),
      })
    )
    .min(1),
});
export type CamsImportPayload = z.infer<typeof CamsImportPayloadSchema>;

export const IdParamSchema = z
  .string()
  .trim()
  .min(1, 'Identifier is required')
  .max(120, 'Identifier is too long')
  .regex(/^[a-zA-Z0-9._:-]+$/, 'Identifier contains invalid characters');

export const LocationInputSchema = z.object({
  city: z.string().trim().min(1, 'City is required').max(60),
  locality: z.string().trim().max(100).optional().default(''),
  label: z.string().trim().min(1, 'Location label is required').max(120),
  isPrimary: z.boolean().optional().default(false),
  latitude: z.number().min(-90).max(90).nullable().optional().default(null),
  longitude: z.number().min(-180).max(180).nullable().optional().default(null),
});
export type LocationInput = z.infer<typeof LocationInputSchema>;

export interface SavedLocation {
  id: string;
  householdId: string;
  city: string;
  locality: string;
  label: string;
  isPrimary: boolean;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export const UserSettingsInputSchema = z.object({
  language: LanguageCodeSchema,
  useDemoFixtures: z.boolean(),
  simulateOutage: z.boolean(),
  defaultCity: z.string().trim().min(1, 'Default city is required').max(60),
});
export type UserSettingsInput = z.infer<typeof UserSettingsInputSchema>;

export interface UserSettings extends UserSettingsInput {
  householdId: string;
  updatedAt: string;
}

export interface DataProviderRecord {
  id: string;
  name: string;
  baseUrl: string;
  requiresApiKey: boolean;
  status: string;
  notes: string;
  updatedAt: string;
  licenses: Array<{
    id: string;
    providerId: string;
    licenseName: string;
    attributionText: string;
    commercialAllowed: boolean;
    attributionRequired: boolean;
    licenseUrl: string;
  }>;
}
