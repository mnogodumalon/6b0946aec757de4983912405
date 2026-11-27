// Auto-generated. Per-entity form-enhancements config for "Medikationsplan".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["betreute_person", "medikament", {"row": ["dosierung", "rhythmus"], "cols": "1fr 1fr"}, {"row": ["gueltig_ab", "gueltig_bis"], "cols": "1fr 1fr"}, "verordnet_von", "aktiv", "begruendung"],
  defaults: {
    'gueltig_ab': { kind: 'today' },
    'aktiv': { kind: 'literal', value: true },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
