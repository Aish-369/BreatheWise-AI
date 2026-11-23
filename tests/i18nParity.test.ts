import { describe, expect, it } from 'vitest';
import { DICTS, en, hi, mr, t } from '../src/i18n/index';

describe('i18n/index dictionary parity and translation helpers', () => {
  it('maintains identical sorted translation keys across en, hi, and mr with non-empty values', () => {
    const enKeys = Object.keys(en).sort();
    const hiKeys = Object.keys(hi).sort();
    const mrKeys = Object.keys(mr).sort();

    expect(hiKeys).toEqual(enKeys);
    expect(mrKeys).toEqual(enKeys);
    expect(enKeys.length).toBeGreaterThan(150);

    for (const lang of ['en', 'hi', 'mr'] as const) {
      const dict = DICTS[lang];
      for (const key of enKeys) {
        expect(typeof dict[key]).toBe('string');
        expect(dict[key].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('contains localized Devanagari script strings in Hindi and Marathi dictionaries', () => {
    const devanagariPattern = /[\u0900-\u097F]/;
    const hiDevanagariCount = Object.values(hi).filter((val) => devanagariPattern.test(val)).length;
    const mrDevanagariCount = Object.values(mr).filter((val) => devanagariPattern.test(val)).length;

    expect(hiDevanagariCount).toBeGreaterThan(100);
    expect(mrDevanagariCount).toBeGreaterThan(100);
  });

  it('interpolates {band}, {group}, and {tag} parameters in the active language and falls back safely', () => {
    const enSummary = t('en', 'summary_moderate', { city: 'Pune', aqi: 127, memberCount: 4 });
    expect(enSummary).toContain('Pune');
    expect(enSummary).toContain('127');

    const hiReason = t('hi', 'rec_reason_age_sensitivity', { group: 'infant_toddler', aqi: 130 });
    expect(hiReason).toContain(hi.age_infant_toddler);
    expect(hiReason).toContain('130');

    const mrBand = t('mr', 'rec_reason_aqi_threshold', {
      aqi: 220,
      band: 'poor',
      pollutant: 'PM2.5',
    });
    expect(mrBand).toContain(mr.band_poor);
    expect(mrBand).toContain('220');

    const mrSensitivity = t('mr', 'rec_reason_sensitivity_tag', { tag: 'dust_sensitive' });
    expect(mrSensitivity).toContain(mr.sens_dust_sensitive);

    expect(t('en', 'nonexistent_translation_key')).toBe('nonexistent_translation_key');
  });
});
