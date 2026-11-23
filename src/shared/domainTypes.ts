import { z } from 'zod';

export const LanguageCodeSchema = z.enum(['en', 'mr', 'hi']);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

export const AgeGroupSchema = z.enum(['infant_toddler', 'school_child', 'adult', 'older_adult']);
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

export const FreshnessStatusSchema = z.enum(['fresh', 'aging', 'stale', 'unavailable']);
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
  provider: z.enum(['cpcb', 'openaq', 'cams_manual', 'cams_auto', 'demo_fixture', 'unavailable']),
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
