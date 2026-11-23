import type { LanguageCode } from '../shared/types';
import { en } from './en';
import { hi } from './hi';
import { mr } from './mr';

export type TranslationKey = keyof typeof en;
export type LocaleDictionary = Record<TranslationKey, string>;
export type TranslationMap = Record<string, string>;

// Compile-time guarantee that hi and mr contain the exact same keys as en (no missing, no extra).
type AssertExactKeys<T extends LocaleDictionary> =
  Exclude<keyof T, TranslationKey> extends never ? T : never;

const checkedEn: LocaleDictionary = en;
const checkedMr: AssertExactKeys<typeof mr> = mr;
const checkedHi: AssertExactKeys<typeof hi> = hi;

export { en, mr, hi };

export const DICTS: Record<LanguageCode, TranslationMap> = {
  en: checkedEn,
  mr: checkedMr,
  hi: checkedHi,
};

export function t(
  lang: LanguageCode,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict: TranslationMap = DICTS[lang] ?? checkedEn;
  let text = dict[key] ?? checkedEn[key as TranslationKey] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      let resolved = String(v);
      if (k === 'band') {
        resolved =
          dict[`band_${resolved}`] ?? checkedEn[`band_${resolved}` as TranslationKey] ?? resolved;
      } else if (k === 'group') {
        resolved =
          dict[`age_${resolved}`] ?? checkedEn[`age_${resolved}` as TranslationKey] ?? resolved;
      } else if (k === 'tag') {
        resolved =
          dict[`sens_${resolved}`] ?? checkedEn[`sens_${resolved}` as TranslationKey] ?? resolved;
      }
      text = text.replaceAll(`{${k}}`, resolved);
    }
  }
  return text;
}
