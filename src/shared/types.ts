import { z } from 'zod';

export const LanguageCodeSchema = z.enum(['en', 'mr', 'hi']);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

export const AgeGroupSchema = z.enum([
  'infant_toddler',
  'school_child',
  'adult',
  'older_adult',
]);
export type AgeGroup = z.infer<typeof AgeGroupSchema>;

export const ActivityPreferenceSchema = z.enum([
  'outdoor_play',
  'morning_walk',
  'outdoor_exercise',
  'commute',
  'mostly_indoors',
]);
export type ActivityPreference = z.infer<typeof ActivityPreferenceSchema>;

export const SensitivityTagSchema = z.enum([
  'dust_sensitive',
  'respiratory_comfort',
  'high_outdoor_exertion',
  'elder_mobility_care',
  'early_commute_exposure',
]);
export type SensitivityTag = z.infer<typeof SensitivityTagSchema>;

export const DataTypeSchema = z.enum([
  'physical_station',
  'city_bulletin',
  'modeled_estimate',
  'forecast',
  'hypothetical_scenario',
]);
export type DataType = z.infer<typeof DataTypeSchema>;

export const DataClassificationSchema = z.enum([
  'verified_live',
  'historical_observation',
  'forecast_only',
  'demo_fixture',
  'unavailable',
]);
export type DataClassification = z.infer<typeof DataClassificationSchema>;

export const FreshnessStatusSchema = z.enum([
  'fresh',
  'aging',
  'stale',
  'unavailable',
]);
export type FreshnessStatus = z.infer<typeof FreshnessStatusSchema>;

export const TimeWindowSchema = z.enum([
  '06:00-09:00',
  '09:00-12:00',
  '12:00-16:00',
  '16:00-19:00',
  '19:00-22:00',
]);
export type TimeWindow = z.infer<typeof TimeWindowSchema>;

export const PollutantsSchema = z.object({
  pm25: z.number().min(0).max(2000).nullable().optional(),
  pm10: z.number().min(0).max(3000).nullable().optional(),
  no2: z.number().min(0).max(2000).nullable().optional(),
  o3: z.number().min(0).max(1500).nullable().optional(),
  so2: z.number().min(0).max(2000).nullable().optional(),
  co: z.number().min(0).max(100).nullable().optional(),
});
export type Pollutants = z.infer<typeof PollutantsSchema>;

export const WeatherFieldsSchema = z.object({
  temperatureC: z.number().min(-40).max(65).nullable().optional(),
  relativeHumidityPct: z.number().min(0).max(100).nullable().optional(),
  windSpeedMs: z.number().min(0).max(120).nullable().optional(),
  windDirectionDeg: z.number().min(0).max(360).nullable().optional(),
});
export type WeatherFields = z.infer<typeof WeatherFieldsSchema>;

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const QualityMetadataSchema = z.object({
  validatedFields: z.array(z.string()).default([]),
  missingPollutants: z.array(z.string()).default([]),
  fromCache: z.boolean().default(false),
  cacheExpiresAt: z.string().nullable().optional(),
  rejectedFields: z.array(z.string()).optional(),
});
export type QualityMetadata = z.infer<typeof QualityMetadataSchema>;

export const EnvironmentalSnapshotSchema = z.object({
  id: z.string(),
  provider: z.enum(['cpcb', 'openaq', 'cams_manual', 'demo_fixture', 'unavailable']),
  providerLabel: z.string(),
  dataType: DataTypeSchema,
  classification: DataClassificationSchema.optional(),
  city: z.string().min(1).max(80),
  locationLabel: z.string().min(1).max(120),
  stationOrGridId: z.string().min(1).max(120),
  spatialResolutionNote: z.string().max(240),
  pollutants: PollutantsSchema,
  reportedAqiIndia: z.number().min(0).max(1000).nullable().optional(),
  measuredAt: z.string().nullable(),
  retrievedAt: z.string(),
  freshness: FreshnessStatusSchema,
  licenseAttribution: z.string(),
  warnings: z.array(z.string()),
  isDemoFixture: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  coordinates: CoordinatesSchema.nullable().optional(),
  weather: WeatherFieldsSchema.optional(),
  qualityMetadata: QualityMetadataSchema.optional(),
});
export type EnvironmentalSnapshot = z.infer<typeof EnvironmentalSnapshotSchema>;

export const ForecastSlotSchema = z.object({
  id: z.string(),
  city: z.string(),
  timeWindow: TimeWindowSchema,
  forecastDate: z.string(),
  expectedPm25: z.number().min(0).max(2000).nullable(),
  expectedPm10: z.number().min(0).max(3000).nullable().optional(),
  expectedAqiIndia: z.number().min(0).max(1000).nullable(),
  trend: z.enum(['improving', 'stable', 'worsening', 'unknown']),
  dataType: z.literal('forecast'),
  providerLabel: z.string(),
  gridResolutionNote: z.string(),
  issuedAt: z.string(),
  licenseAttribution: z.string(),
  isDemoFixture: z.boolean().default(false),
});
export type ForecastSlot = z.infer<typeof ForecastSlotSchema>;

export const FamilyMemberInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Name is required').max(60),
  ageGroup: AgeGroupSchema,
  activityPreference: ActivityPreferenceSchema,
  routineFlexibility: z.enum(['fixed', 'flexible']),
});
export type FamilyMemberInput = z.infer<typeof FamilyMemberInputSchema>;

export interface FamilyMember extends FamilyMemberInput {
  id: string;
  householdId: string;
  createdAt: string;
}

export const ActivityRoutineInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Activity title is required').max(100),
  environment: z.enum(['outdoor', 'indoor']),
  flexibility: z.enum(['fixed', 'flexible']),
  preferredWindow: TimeWindowSchema,
  memberIds: z.array(z.string()).min(1, 'Select at least one family member'),
  notes: z.string().max(240).optional(),
  completedDate: z.string().nullable().optional(),
});
export type ActivityRoutineInput = z.infer<typeof ActivityRoutineInputSchema>;

export interface ActivityRoutine extends ActivityRoutineInput {
  id: string;
  householdId: string;
  createdAt: string;
  completedDate?: string | null;
}

export const RoutineCompletionSchema = z.object({
  completed: z.boolean(),
});

export const HouseholdInputSchema = z.object({
  name: z.string().trim().min(1, 'Household name is required').max(80),
  city: z.string().trim().min(1, 'City is required').max(60),
  locality: z.string().trim().max(100).optional(),
  language: LanguageCodeSchema,
  sensitivityTags: z.array(SensitivityTagSchema).optional(),
});
export type HouseholdInput = z.infer<typeof HouseholdInputSchema>;

export interface HouseholdProfile extends HouseholdInput {
  id: string;
  isDemoProfile: boolean;
  sensitivityTags?: SensitivityTag[];
  createdAt: string;
  updatedAt: string;
}

export type AqiBand =
  | 'good'
  | 'satisfactory'
  | 'moderate'
  | 'poor'
  | 'very_poor'
  | 'severe'
  | 'unavailable';

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
  | 'nominal'
  | 'advisory'
  | 'caution'
  | 'elevated'
  | 'unavailable';

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
  provider: 'cpcb' | 'openaq' | 'cams_manual';
  name: string;
  configured: boolean;
  liveReachable: boolean;
  status: 'live' | 'unconfigured' | 'unavailable' | 'manual_import';
  licenseName: string;
  attributionText: string;
  notes: string;
  lastCheckedAt: string;
}

export const CamsImportPayloadSchema = z.object({
  city: z.string().trim().min(1).max(60),
  gridId: z.string().trim().min(1).max(100),
  issuedAt: z.string().min(1),
  slots: z.array(
    z.object({
      timeWindow: TimeWindowSchema,
      forecastDate: z.string().min(1),
      expectedPm25: z.number().min(0).max(2000),
      expectedPm10: z.number().min(0).max(3000).optional(),
      expectedAqiIndia: z.number().min(0).max(1000).optional(),
      trend: z.enum(['improving', 'stable', 'worsening', 'unknown']).default('unknown'),
    })
  ).min(1),
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
