import { enCore } from './locales/enCore';
import { enSections } from './locales/enSections';

export const en = {
  ...enCore,
  ...enSections,
} as const;

export type EnDictionary = typeof en;
