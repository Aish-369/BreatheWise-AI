import { mrCore } from './locales/mrCore';
import { mrSections } from './locales/mrSections';

export const mr = {
  ...mrCore,
  ...mrSections,
} as const;
