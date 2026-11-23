export const enSections = {
  // Planner Statuses & Rationales
  status_proceed_as_planned: 'Proceed as Planned',
  status_proceed_with_precautions: 'Proceed with Precautions',
  status_adjust_window: 'Shift Time Window',
  status_move_indoors: 'Move Indoors',
  status_hold_pending_data: 'Verify Data First',

  plan_indoor_unaffected: 'Indoor routine is insulated from direct outdoor ambient peaks.',
  plan_indoor_keep_closed:
    'Proceed indoors; keep street-facing windows shut and minimize indoor smoke sources.',
  plan_hold_unavailable:
    'Current environmental data is unavailable; do not assume outdoor air is clean.',
  plan_stale_verify_first:
    'Reading is over 6 hours old; verify updated conditions before extended outdoor activity.',
  plan_outdoor_favorable: 'Validated AQI ({aqi}) supports normal outdoor activity.',
  plan_fixed_moderate_precaution:
    'Fixed commitment respected at AQI {aqi}: use low-traffic routes and minimize waiting near idling vehicles.',
  plan_fixed_high_precaution:
    'Fixed commitment at elevated AQI ({aqi}): limit outdoor dwell time and use clean respiratory protection if commuting.',
  plan_flexible_move_indoors:
    'Elevated AQI ({aqi}) with no sufficiently clean forecast window; moving this flexible activity indoors reduces exposure.',
  plan_flexible_shift_window:
    'Coarse forecast indicates lower particulate burden during {window} (est. PM2.5 ~{pm25} µg/m³).',
  plan_no_forecast_window:
    'Flexible routine, but no verified forecast data is loaded to recommend a cleaner window.',
  plan_no_cleaner_window_found:
    'Forecast does not show a materially cleaner window today; keep exertion light or move indoors.',

  lim_no_verified_forecast: 'Limitation: No verified forecast available to suggest a better time.',
  lim_coarse_grid_forecast:
    'Limitation: Forecast is coarse-grid (~40 km) and cannot guarantee street-level air safety.',
  lim_evidence_unavailable: 'Limitation: Missing or unverified station data.',
  lim_low_stale: 'Limitation: Measurement is stale (> 6 hours old).',

  // Scenario Diffs
  scenario_banner: 'SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT',
  scenario_diff_band_shifted: 'Air quality band shifted relative to current baseline.',
  scenario_diff_schedule_adjusted: 'One or more daily routine recommendations changed.',
  scenario_diff_confidence_dropped:
    'Evidence confidence dropped due to simulated stale or unavailable data.',
  scenario_diff_no_material_shift:
    'Household guidance remained structurally similar under this scenario.',

  // Section Headers
  onb_title: 'Family Onboarding & Local Profile',
  onb_subtitle:
    'Configure your household without providing medical records or unnecessary sensitive identifiers.',
  env_title: 'Environmental Intelligence & Providers',
  env_subtitle:
    'Inspect station telemetry, license attribution, freshness status, and import Copernicus CAMS forecasts.',
  plan_title: 'Daily Protection Planner',
  plan_subtitle:
    'Add fixed commitments and flexible routines to receive evidence-backed schedule guidance.',
  sim_title: 'What-If Scenario Simulator',
  sim_subtitle:
    'Test hypothetical pollution spikes, schedule shifts, or data outages without altering observed records.',
  comp_title: 'Neighborhood & City Comparison',
  comp_subtitle:
    'Side-by-side comparison of Pune and Ahilyanagar highlighting real coverage differences and missing data.',
  indoor_title: 'Indoor Protection Guidance',
  indoor_subtitle:
    'Practical, evidence-based household precautions aligned with WHO, CPCB, and EPA public health guidance.',
  trust_title: 'Data Transparency & Methodology',
  trust_subtitle:
    'How BreatheWise AI verifies environmental sources, handles outages, and prevents unsupported claims.',
  hist_title: 'History & Printable Reports',
  hist_subtitle:
    'Review saved protection plans, scenario tests, and export a formatted family briefing PDF.',

  // Interactive Redesign Labels
  ui_all_members: 'All Members',
  ui_curve_view: 'Curve',
  ui_bar_view: 'Bars',
  ui_alerts_title: 'Evidence & Quality Notices',
  ui_no_alerts: 'All active sources verified with no divergence warnings.',
  ui_location_label: 'Active City',
  ui_confirm_clear_title: 'Delete All Local Household Data?',
  ui_confirm_clear_desc:
    'This removes your local household profile, family members, routines, plans, and scenarios from SQLite on this device.',
  ui_confirm_delete: 'Yes, Delete Local Data',
  ui_outdoor_ready: 'Proceed Normally',
  ui_precautions_count: 'With Precautions',
  ui_shift_count: 'Shift Suggested',
  ui_hold_pending_data: 'Verify Data First',
  ui_pollutant_index_title: 'Pollutant Benchmark Comparison',
  ui_not_reported: 'Not reported',
  ui_station_variance: 'Intra-City Station Variance',
  ui_filter_all: 'All',
  ui_filter_shifted: 'Shifted',
  ui_filter_precautions: 'Precautions',
  ui_filter_indoor: 'Indoor',
  ui_family_status_ready: 'Active Plan Ready',
  ui_family_status_verify: 'Verify Data First',
  ui_family_status_precaution: 'Precautions Active',
  ui_family_status_shifted: 'Timing Shift Helpful',
  ui_aqi_scale_label: 'India NAQI Scale',

  // 5-Tier Data Classifications
  cls_verified_live: 'Verified Live',
  cls_historical_observation: 'Historical Observation',
  cls_forecast_only: 'Forecast Only (Coarse Grid)',
  cls_demo_fixture: 'Illustrative Sample',
  cls_unavailable: 'Unavailable',

  // Household Sensitivity Tags (Non-Medical)
  ui_sensitivity_tags_title: 'Household Exposure Considerations (Non-Medical)',
  ui_sensitivity_tags_desc:
    'Optional lifestyle sensitivity preferences to tailor precautionary rules. No medical conditions or identifiers are stored.',
  sens_dust_sensitive: 'Dust-Sensitive Environment',
  sens_respiratory_comfort: 'Extra Respiratory Comfort Care',
  sens_high_outdoor_exertion: 'High Outdoor Exertion',
  sens_elder_mobility_care: 'Elder Morning Walk Care',
  sens_early_commute_exposure: 'Early Roadside Commute',

  // Extended Engine Recommendations & Explainability Trail
  rec_no2_title: 'Elevated roadside NO2 traffic burden ({no2} µg/m³)',
  rec_no2_expl:
    'Nitrogen dioxide ({no2} µg/m³) exceeds the 80 µg/m³ 24h CPCB benchmark, indicating concentrated vehicle exhaust near busy corridors.',
  rec_no2_action:
    'Avoid waiting near idling vehicles or major junctions and prefer quieter parallel streets.',
  rec_reason_pollutant_no2: 'Generated because measured NO2 ({no2} µg/m³) exceeded 80 µg/m³.',

  rec_o3_title: 'Elevated afternoon ground-level ozone ({o3} µg/m³)',
  rec_o3_expl:
    'Ground-level ozone ({o3} µg/m³) exceeded 100 µg/m³, which typically peaks during sunny midday and afternoon hours.',
  rec_o3_action:
    'Shift vigorous outdoor exertion to cooler morning or evening hours away from peak sunlight.',
  rec_reason_pollutant_o3: 'Generated because measured O3 ({o3} µg/m³) exceeded 100 µg/m³.',

  rec_dust_title: 'Coarse road & construction dust elevated (PM10: {pm10} µg/m³)',
  rec_dust_expl:
    'PM10 ({pm10} µg/m³) is elevated relative to fine particles, pointing to resuspended road or construction dust.',
  rec_dust_action:
    'Wet-mop floors indoors, rinse eyes/face after outdoor dust exposure, and bypass active digging zones.',
  rec_reason_pollutant_dust: 'Generated because PM10 ({pm10} µg/m³) exceeded 100 µg/m³.',

  rec_sens_dust_title: 'Dust comfort precautions active',
  rec_sens_dust_expl:
    'Particulate levels (PM10: {pm10} µg/m³, PM2.5: {pm25} µg/m³) may feel irritating for dust-sensitive households.',
  rec_sens_dust_action:
    'Keep balconies closed during windy dust gusts and wear a clean well-fitted mask outdoors.',
  rec_sens_resp_title: 'Extra respiratory comfort guidance',
  rec_sens_resp_expl:
    'Current AQI ({aqi}) is above the Good threshold; pacing outdoor exertion helps minimize airway dryness.',
  rec_sens_resp_action:
    'Keep outdoor walks moderate, carry water, and prioritize filtered or calm indoor recovery.',
  rec_sens_commute_title: 'Early morning roadside commute buffering',
  rec_sens_commute_expl:
    'Early window (06:00–09:00) outdoor commutes at AQI {aqi} can coincide with calm-wind traffic accumulation.',
  rec_sens_commute_action:
    'Keep vehicle windows shut in congestion and use a properly fitted particulate mask at bus stops.',
  rec_reason_sensitivity_tag: 'Generated from your household {tag} planning preference.',

  rec_trend_worsening_title: 'Session particulate trend worsening (+{delta} µg/m³)',
  rec_trend_worsening_expl:
    'Across recent verified readings, PM2.5 rose from {prev} µg/m³ to {latest} µg/m³.',
  rec_trend_worsening_action:
    'Avoid extending outdoor activities late into the evening until updated station readings stabilize.',
  rec_reason_historical_trend: 'Generated from multi-snapshot upward PM2.5 shift (+{delta} µg/m³).',

  reconsider_when_fresh_station:
    'Refresh once a verified live station reading (≤ 2h old) is restored.',
  reconsider_when_stations_align:
    'Reassess when nearby monitoring stations converge within 35 AQI points.',
  reconsider_when_aqi_rises: 'Reconsider if hourly traffic peaks push AQI above 100.',
  reconsider_when_aqi_drops:
    'Reconsider once verified readings return below 100 AQI (Satisfactory/Good).',
  reconsider_when_traffic_eases:
    'Reconsider after peak commuter rush hours subside and NO2 drops below 80 µg/m³.',
  reconsider_when_evening_cools:
    'Reconsider after sunset when sunlight-driven ground ozone dissipates.',

  trail_evidence_label: 'Evidence',
  trail_rule_label: 'Rule Triggered',
  trail_context_label: 'Household Context',
  trail_reconsider_label: 'When to Reconsider',

  ui_historical_trend_label: 'Observed Session Trend',
  trend_worsening: 'Worsening',
  trend_improving: 'Improving',
  trend_stable: 'Stable',

  // Comparison & Locations
  comp_warn_missing_coverage:
    'Comparison incomplete: one or both cities lack verified environmental readings.',
  comp_warn_mixed_tiers:
    'Caution: Comparing different data tiers (e.g., live station vs. historical or fixture).',
  comp_warn_timestamp_skew:
    'Timestamp skew: Readings between these two locations are ≥ 3 hours apart.',
  comp_warn_partial_pollutants:
    'Coverage asymmetry: One location lacks gaseous pollutants (NO2/O3).',
  ui_compare_slot_a: 'Location A',
  ui_compare_slot_b: 'Location B',
  ui_compatibility_ok: 'Compatible Comparison Tier & Freshness',
  ui_compatibility_warn: 'Comparison Quality Warnings',
  ui_saved_locations_title: 'Saved Household Locations',
  ui_add_location_title: 'Add Location',
  ui_edit_location: 'Edit Location',
  ui_search_city_placeholder: 'Search Indian cities (e.g. Pune, Ahilyanagar, Mumbai)...',
  ui_location_label_input: 'Location Label (e.g. Home, School)',
  ui_locality_optional: 'Locality / Neighborhood (Optional)',
  action_set_primary: 'Set Primary',
  ui_nav_manage_locations: 'Manage & Compare Locations',

  // General CRUD & View Polish
  action_edit: 'Edit',
  action_save_edit: 'Update',
  action_recalculate: 'Recalculate Plan',
  action_close: 'Close',
  action_inspect: 'Inspect',
  ui_completed_today: 'Done Today',
  ui_mark_completed: 'Mark Done',
  ui_notes_optional: 'Notes (Optional)',
  ui_part_morning: 'Morning (06:00–12:00)',
  ui_part_afternoon: 'Afternoon (12:00–16:00)',
  ui_part_evening: 'Evening (16:00–22:00)',
  ui_weather_coords: 'Station Metadata',
  ui_cached_badge: 'Cached (5m TTL)',
  ui_temp_label: 'Temp',
  ui_humidity_label: 'Humidity',
  ui_wind_label: 'Wind',
  ui_pm10_override: 'Override Hypothetical PM10',
  ui_aqi_override: 'Override Target NAQI',
  ui_modal_plan_detail: 'Protection Plan Snapshot Details',
  ui_no_routines: 'No routines configured yet. Add an activity in Protection Planner.',
  ui_edit_member: 'Edit Family Member',
  ui_edit_routine: 'Edit Routine',
  ui_provider_registry_title: 'Verified Provider Registry & Licensing',
  ui_license_commercial_yes: 'Commercial permitted',
  ui_license_commercial_no: 'Non-commercial / attribution',
  ui_chart_pm25_no_forecast:
    'No coarse-grid forecast series is currently loaded for {city}. BreatheWise AI never plots estimated curves without source data.',
  ui_chart_import_cams_hint: 'Import Copernicus CAMS data in Air Quality → CAMS Forecast',
  ui_pollutant_benchmark_note:
    'Vertical hairline marks India CPCB 24h/8h reference threshold. Missing sensors remain blank.',

  // Indoor Guidance Localized
  indoor_badge_closed: 'Keep Closed',
  indoor_badge_nonpeak: 'Non-Peak Window',
  indoor_card_vent_title: 'Timed Ventilation',
  indoor_card_vent_desc:
    'Open rear windows away from arterial traffic only when outdoor AQI is Good to Moderate.',
  indoor_card_kitchen_title: 'Kitchen & Smoke Control',
  indoor_card_kitchen_badge: 'Every Meal',
  indoor_card_kitchen_desc:
    'Run kitchen exhaust fans while cooking and avoid incense, mosquito coils, or candles indoors.',
  indoor_card_mop_title: 'Wet Mopping',
  indoor_card_mop_badge: 'Daily Dust Control',
  indoor_card_mop_desc:
    'Replace dry sweeping with damp mopping to prevent settled particulates resuspending indoors.',
  indoor_card_sleep_title: 'Sleep Zone Priority',
  indoor_card_sleep_badge: 'Children & Elders',
  indoor_card_sleep_desc:
    'Prioritize closed-door cleaner rooms or non-ozone HEPA filtration for sleeping zones.',
  indoor_hero_high: 'Prioritize Indoor Particle Containment',
  indoor_hero_mod: 'Balance Timed Cross-Ventilation with Dust Control',
  indoor_hero_high_desc:
    'Keep street-facing windows shut during peak traffic and run exhaust ventilation during cooking.',
  indoor_hero_mod_desc:
    'Use quiet off-peak hours for brief cross-ventilation while keeping arterial roadside windows shaded.',
  indoor_disclaimer:
    'Aligned with WHO, CPCB, and US EPA public health guidance. Informational daily planning aid only.',

  // Trust & Methodology Localized
  trust_tier_station: 'Physical Monitoring Station',
  trust_tier_station_scope: 'Station perimeter only',
  trust_tier_station_desc: 'CPCB CAAQMS or OpenAQ v3 ground monitors.',
  trust_tier_bulletin: 'City Bulletin',
  trust_tier_bulletin_scope: 'Municipal aggregate',
  trust_tier_bulletin_desc: 'Regional summaries that may lag traffic peaks.',
  trust_tier_forecast: 'Modeled & Coarse Forecast',
  trust_tier_forecast_scope: '~40 km atmospheric grid',
  trust_tier_forecast_desc: 'Copernicus CAMS regional trends; never street-level.',
  trust_tier_scenario: 'Hypothetical Scenario',
  trust_tier_scenario_scope: 'Non-observed simulation',
  trust_tier_scenario_desc: 'User-configured What-If overrides only.',
  trust_safeguards_title: 'Safeguard Commitments',
  trust_bound_1: 'No medical diagnosis or clinical prescriptions',
  trust_bound_2: 'No unverified street-level safety guarantees',
  trust_bound_3: 'Stale (> 6h) or missing forecasts pause timing shifts openly',
  trust_bound_4: 'Provider outages never fall back to disguised mock values',
  trust_engine_title: 'Deterministic Engine & Licenses',
  trust_engine_desc:
    'Calculated locally via India CPCB NAQI sub-indices, freshness thresholds (≤ 2h Fresh, 2–6h Aging, > 6h Stale), and routine flexibility rules.',
  ui_pdf_disclaimer:
    'Informational environmental planning aid only; not medical advice or emergency clinical guidance.',
  cams_upload_file: 'Upload .csv / .json',
  cams_sample_json: 'Sample JSON',
  cams_mode_manual_title: 'Manual Import (Zero-Cost Offline Ready) vs. Automated CDS API',
  cams_mode_manual_desc:
    'Importing CSV/JSON files works completely offline at zero cost. Automated retrieval from Copernicus ADS requires your own free ADS registration and Python cdsapi token externally; BreatheWise never fabricates forecasts.',
} as const;
