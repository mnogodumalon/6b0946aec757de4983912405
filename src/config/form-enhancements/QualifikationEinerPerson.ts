// Auto-generated. Per-entity form-enhancements config for "Qualifikation einer Person".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["person", "qualifikationsart"], "cols": "1fr 1fr"}, {"row": ["erworben_am", "gueltig_bis"], "cols": "1fr 1fr"}, {"row": ["geprueft_von", "geprueft_am"], "cols": "2fr 1fr"}],
  defaults: {
    'erworben_am': { kind: 'today' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
