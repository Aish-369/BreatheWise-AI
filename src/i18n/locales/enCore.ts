export const enCore = {
  // Brand & Top Navigation
  brandName: 'BreatheWise AI',
  tagline: 'Understand Your Air. Protect Your Family. Breathe Better.',
  nav_howItWorks: 'How It Works',
  nav_intelligence: 'Intelligence',
  nav_transparency: 'Data Trust',
  nav_openApp: 'Open Workspace',
  nav_backToSite: 'Product Overview',

  // Workspace Sidebar Navigation (8 Minimal Items)
  side_overview: 'Overview',
  side_family: 'Family',
  side_air_quality: 'Air Quality',
  side_planner: 'Protection Planner',
  side_simulator: 'What-If Simulator',
  side_locations: 'Locations',
  side_reports: 'Reports',
  side_settings: 'Settings',

  // Greetings & Sub-navigation
  greet_morning: 'Good morning',
  greet_afternoon: 'Good afternoon',
  greet_evening: 'Good evening',
  tab_members: 'Members',
  tab_onboarding: 'Guided Setup',
  tab_telemetry: 'Station Details',
  tab_indoor: 'Indoor Guidance',
  tab_forecast: 'CAMS Forecast',
  tab_preferences: 'Preferences',
  tab_methodology: 'Data Transparency',
  settings_title: 'Settings & Data Trust',
  settings_subtitle: 'Language, local privacy controls, provider verification, and methodology.',

  // Common Labels & Actions
  action_save: 'Save Changes',
  action_cancel: 'Cancel',
  action_add: 'Add',
  action_delete: 'Remove',
  action_refresh: 'Refresh Evidence',
  action_clearLocal: 'Delete Local Data',
  action_downloadPdf: 'Download PDF Report',
  action_runScenario: 'Run What-If Scenario',
  action_importCams: 'Import CAMS Forecast',
  action_startOnboarding: 'Configure Family',
  action_persistPlan: 'Save Snapshot to History',
  loading: 'Loading verified environmental intelligence...',
  error_generic: 'Unable to complete request. Please verify inputs and try again.',
  demo_fixture_notice:
    'Illustrative sample data active — Synthetic reference values are shown because live provider keys are not configured. These are not live measurements.',
  outage_mode_label: 'Simulate Provider Outage',
  on: 'On',
  off: 'Off',

  // Data Types & Freshness
  dtype_physical_station: 'Physical Monitoring Station',
  dtype_city_bulletin: 'City Air Bulletin',
  dtype_modeled_estimate: 'Modeled Regional Estimate',
  dtype_forecast: 'Forecast (Coarse Grid)',
  dtype_hypothetical_scenario: 'Hypothetical Scenario',

  fresh_fresh: 'Fresh (≤ 2h)',
  fresh_aging: 'Aging (2–6h)',
  fresh_stale: 'Stale (> 6h)',
  fresh_unavailable: 'Unavailable',

  band_good: 'Good',
  band_satisfactory: 'Satisfactory',
  band_moderate: 'Moderate',
  band_poor: 'Poor',
  band_very_poor: 'Very Poor',
  band_severe: 'Severe',
  band_unavailable: 'Unavailable',

  // Age Groups & Preferences
  age_infant_toddler: 'Infant / Toddler (0–4 yrs)',
  age_school_child: 'School Child (5–17 yrs)',
  age_adult: 'Adult (18–59 yrs)',
  age_older_adult: 'Older Adult (60+ yrs)',

  pref_outdoor_play: 'Outdoor Play',
  pref_morning_walk: 'Morning Walk',
  pref_outdoor_exercise: 'Outdoor Exercise',
  pref_commute: 'Daily Commute',
  pref_mostly_indoors: 'Mostly Indoors',

  flex_fixed: 'Fixed Commitment',
  flex_flexible: 'Flexible Schedule',
  env_outdoor: 'Outdoor',
  env_indoor: 'Indoor',

  // Landing Page
  hero_kicker: 'Family Air Protection Intelligence Platform',
  hero_title: 'Turn raw air quality numbers into clear daily decisions for your family.',
  hero_subtitle:
    'Generic AQI apps stop at a single number. BreatheWise AI validates environmental provenance, accounts for children, adults, and older family members, and builds an explainable daily protection plan without medical guesswork.',
  hero_cta_primary: 'Launch Family Workspace',
  hero_cta_secondary: 'Explore Data Methodology',
  landing_problem_title: 'Why raw AQI scores leave families guessing',
  landing_problem_1_title: 'One number ignores who is breathing',
  landing_problem_1_desc:
    'A Moderate AQI reading affects a school-age child at playground practice differently than an adult commuting indoors or an older parent on an early walk.',
  landing_problem_2_title: 'Fixed schedules need practical options',
  landing_problem_2_desc:
    'Families cannot skip school or work commutes. They need clear exposure precautions for fixed routines and evidence-backed timing shifts for flexible ones.',
  landing_problem_3_title: 'Unverified data destroys trust',
  landing_problem_3_desc:
    'Many apps blend stale sensors, modeled grids, and missing stations silently. BreatheWise AI separates real readings, forecasts, and unavailable states explicitly.',
  landing_flow_title: '01. How BreatheWise AI Works',
  landing_flow_subtitle:
    'A deterministic, transparent pipeline from verified station telemetry to household action.',
  landing_step_1: '01. Environmental Validation',
  landing_step_1_desc:
    'Checks provider source, timestamps, pollutant completeness, and flags stale or conflicting readings.',
  landing_step_2: '02. Household Context',
  landing_step_2_desc:
    'Maps age groups, activity intensity, and fixed vs. flexible commitments using local privacy-first profiles.',
  landing_step_3: '03. Deterministic Rules',
  landing_step_3_desc:
    'Generates transparent, evidence-linked guidance without paid AI hallucinations or medical diagnoses.',
  landing_step_4: '04. Daily Action & What-If',
  landing_step_4_desc:
    'Adjusts flexible schedules only when forecast evidence supports it, and lets you test hypothetical shifts.',
  landing_demo_title: '02. See the Protection Workflow',
  landing_demo_subtitle:
    'Explore how environmental evidence becomes clear, family-aware daily actions.',
  landing_trust_title: '03. Radical Data Transparency',
  landing_trust_desc:
    'Zero hidden assumptions. Every recommendation cites its exact station or grid source, measurement timestamp, data type, and limitations.',

  // Dashboard
  dash_title: 'Household Protection Overview',
  dash_subtitle: 'Real-time evidence assessment, member guidance, and daily routine status.',
  dash_aqi_label: 'Reference India NAQI',
  dash_derived_note: 'Derived from pollutant sub-indices',
  dash_reported_note: 'Reported reference index',
  dash_dominant: 'Dominant Pollutant',
  dash_measured_at: 'Measured',
  dash_retrieved_at: 'Retrieved',
  dash_source: 'Source',
  dash_summary_heading: 'Family Protection Summary',
  dash_actions_heading: "Today's Key Recommendations",
  dash_planner_heading: 'Daily Planner Snapshot',
  dash_evidence_heading: 'Supporting Evidence & Limitations',
  dash_why_generated: 'Why generated & source evidence',
  dash_applicable_members: 'Applies to',
  dash_confidence: 'Evidence Confidence',
  dash_unavailable_title: 'Current Environmental Data Unavailable',
  dash_unavailable_desc:
    'No verified live feed or enabled fixture is available for this city right now. BreatheWise AI will not invent air quality numbers.',
  dash_pollutantDetails: 'Pollutant Details',
  dash_expectedPm25Trend: 'Expected PM2.5 Trend',
  dash_coarseGrid: 'Coarse grid',
  dash_evidenceBtn: 'Evidence',
  dash_reasonLabel: 'Reason',
  dash_sourceLabel: 'Source',
  dash_savedNotice: 'Saved to Reports',

  // Confidence / Limitation Labels
  conf_high_station_fresh: 'High — Fresh station reading (≤ 2h)',
  conf_moderate_aging: 'Moderate — Reading is 2–6 hours old',
  conf_low_stale: 'Low — Reading is stale (> 6h)',
  conf_partial_pollutants: 'Partial — Key pollutant readings missing',
  conf_coarse_grid_forecast: 'Coarse Grid Forecast — Regional trend only',
  conf_provider_conflict: 'Conflicting Providers — Significant variance across stations',
  conf_evidence_unavailable: 'Unavailable — Cannot verify current outdoor air quality',
  conf_hypothetical_simulation: 'Hypothetical Scenario — Not observed data',

  // Engine Summaries
  summary_good:
    'Air quality in {city} is currently in the Good band (AQI {aqi}). Routine outdoor plans for all {memberCount} family members can proceed normally.',
  summary_satisfactory:
    'Air quality in {city} is Satisfactory (AQI {aqi}). Most routines can continue, with mild watchfulness for infants and toddlers.',
  summary_moderate:
    'Air quality in {city} is Moderate (AQI {aqi}). Sensitive household members—children, older adults, and heavy outdoor exercisers—benefit from timing adjustments or moderated exertion.',
  summary_poor:
    'Air quality in {city} is Poor (AQI {aqi}). Flexible outdoor activities should shift indoors or to cleaner verified windows; fixed commutes warrant practical precautions.',
  summary_very_poor:
    'Air quality in {city} is Very Poor (AQI {aqi}). Avoid discretionary outdoor exertion across all {memberCount} members and keep indoor air sealed from heavy traffic plumes.',
  summary_severe:
    'Air quality in {city} is Severe (AQI {aqi}). Keep all flexible activities indoors and minimize outdoor exposure strictly to essential fixed commitments.',
  summary_unavailable:
    'Verified environmental readings for {city} are currently unavailable. BreatheWise AI withholds outdoor safety assurances until fresh evidence is restored.',

  // Recommendations
  rec_unavailable_title: 'Pause discretionary outdoor planning until data is verified',
  rec_unavailable_expl:
    'No current, validated environmental reading could be retrieved for this location.',
  rec_unavailable_action:
    'Check local visual haze/traffic conditions before extended outdoor play and refresh providers later.',
  rec_unavailable_reason:
    'Triggered because environmental evidence is unavailable or missing valid timestamps.',

  rec_stale_title: 'Displayed measurement is stale (over 6 hours old)',
  rec_stale_expl:
    'Air quality in {city} can change rapidly due to morning inversions, wind shifts, or rush-hour traffic.',
  rec_stale_action:
    'Treat older readings as historical context only; refresh data before committing to prolonged outdoor exercise.',
  rec_stale_reason:
    'Triggered because measurement timestamp is more than 6 hours older than current time.',

  rec_conflict_title: 'Stations report diverging air quality levels',
  rec_conflict_expl: 'Available sources disagree significantly: {details}',
  rec_conflict_action:
    'Follow the more cautious precautionary guidance for sensitive members until local readings align.',
  rec_conflict_reason:
    'Triggered because two active sources in the same city differ by ≥ 35 AQI points or ≥ 35% PM2.5.',

  rec_band_good_title: 'Favorable air conditions across {city} (AQI {aqi})',
  rec_band_good_expl:
    'Primary pollutant ({pollutant}, PM2.5: {pm25} µg/m³) remains within the Good band.',
  rec_band_good_action: 'Normal outdoor play, walks, and home cross-ventilation are appropriate.',
  rec_band_satisfactory_title: 'Satisfactory ambient air in {city} (AQI {aqi})',
  rec_band_satisfactory_expl:
    'Dominant pollutant is {pollutant} (PM2.5: {pm25} µg/m³). Acceptable for general daily routines.',
  rec_band_satisfactory_action:
    'Proceed with routine plans while keeping high-traffic roadside exposure brief.',
  rec_band_moderate_title: 'Moderate particulate burden in {city} (AQI {aqi})',
  rec_band_moderate_expl:
    '{pollutant} (PM2.5: {pm25} µg/m³) is elevated enough to affect prolonged outdoor exertion and sensitive age groups.',
  rec_band_moderate_action:
    'Shorten intense outdoor workouts near busy roads and prioritize cleaner midday/afternoon windows when supported by forecasts.',
  rec_band_poor_title: 'Poor air quality alert for household planning (AQI {aqi})',
  rec_band_poor_expl:
    '{pollutant} (PM2.5: {pm25} µg/m³) indicates elevated respiratory irritant load outdoors.',
  rec_band_poor_action:
    'Move flexible outdoor play and exercise indoors; use clean well-fitted masks during essential outdoor commutes.',
  rec_band_very_poor_title: 'Very Poor air quality — minimize outdoor exposure (AQI {aqi})',
  rec_band_very_poor_expl:
    '{pollutant} (PM2.5: {pm25} µg/m³) is high enough that sustained outdoor activity increases exposure for all age groups.',
  rec_band_very_poor_action:
    'Cancel optional outdoor activities, close street-facing windows during peak traffic, and keep routines indoors.',
  rec_band_severe_title: 'Severe air quality — stay indoors where possible (AQI {aqi})',
  rec_band_severe_expl: '{pollutant} (PM2.5: {pm25} µg/m³) is in the Severe range.',
  rec_band_severe_action:
    'Keep children and older adults strictly indoors; limit fixed travel to essential transit with sealed indoor recovery.',

  rec_reason_aqi_threshold:
    'Generated from validated {band} band (AQI {aqi}, dominant {pollutant}).',
  rec_reason_age_sensitivity:
    'Generated because household includes {group} members while AQI is {aqi}.',
  rec_reason_activity_intensity:
    'Generated because adult members have outdoor exercise, walk, or commute preferences at AQI {aqi}.',
  rec_reason_ventilation:
    'Generated by comparing indoor ventilation benefit against current outdoor particulate band.',

  rec_infant_title: 'Extra caution for infants and toddlers',
  rec_infant_low_expl:
    'Young airways breathe faster per kilogram of body weight; even Satisfactory air (AQI {aqi}) warrants avoiding roadside exhaust.',
  rec_infant_high_expl:
    'At AQI {aqi}, prolonged outdoor stroller walks or open balcony play increase particulate intake for infants and toddlers.',
  rec_infant_low_action:
    'Choose leafy, low-traffic courtyards or brief morning outdoor time away from intersections.',
  rec_infant_high_action:
    'Keep infants and toddlers indoors in a dust-controlled room with closed street-side windows.',

  rec_child_title: 'School child outdoor play & commute adjustments',
  rec_child_mod_expl:
    'At Moderate AQI ({aqi}), active running games increase breathing rate and particulate inhalation.',
  rec_child_high_expl:
    'At AQI {aqi}, sustained outdoor sports or playground play can cause airway irritation.',
  rec_child_mod_action:
    'Prefer shaded, non-roadside play areas or shift flexible play to cleaner forecast hours.',
  rec_child_high_action:
    'Swap outdoor park play for indoor games and remind children to wash hands and face after fixed school transit.',

  rec_elder_title: 'Older adult routine precautions',
  rec_elder_mod_expl:
    'Early morning walks often overlap with trapped overnight particulates when AQI is {aqi}.',
  rec_elder_high_expl:
    'At AQI {aqi}, outdoor brisk walking places unnecessary burden on older adults.',
  rec_elder_mod_action:
    'Delay morning walks past rush-hour dispersion (or use indoor walking routes) if forecast supports improvement.',
  rec_elder_high_action:
    'Move walks completely indoors today and keep indoor dust low without harsh smoke or incense.',

  rec_adult_active_title: 'Modify outdoor workouts & daily commutes',
  rec_adult_active_expl:
    'High-exertion outdoor exercise or unshielded commuting at AQI {aqi} multiplies air intake volume.',
  rec_adult_mod_action:
    'Reduce vigorous outdoor cardio duration or avoid arterial roads during peak traffic.',
  rec_adult_high_action:
    'Move exercise indoors and wear a well-fitted N95/FFP2 respirator during fixed outdoor commutes.',

  rec_vent_open_title: 'Natural cross-ventilation window recommended',
  rec_vent_open_expl:
    'Outdoor particulate levels are low enough to flush stale indoor cooking or CO2 buildup.',
  rec_vent_open_action: 'Open opposite windows for 20–30 minutes away from peak street traffic.',
  rec_vent_limit_title: 'Limit street-facing window ventilation',
  rec_vent_limit_expl:
    'Elevated outdoor particulates can infiltrate indoor rooms if windows remain wide open during traffic peaks.',
  rec_vent_limit_action:
    'Use kitchen exhaust while cooking, keep street-facing windows closed during rush hours, and wet-mop dust.',
} as const;
