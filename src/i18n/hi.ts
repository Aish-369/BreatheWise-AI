import { hiCore } from './locales/hiCore';
import { hiSections } from './locales/hiSections';

export const hi = {
  ...hiCore,
  ...hiSections,
} as const;
