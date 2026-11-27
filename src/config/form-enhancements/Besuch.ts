// Auto-generated. Per-entity form-enhancements config for "Besuch".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["betreute_person", "betreuungsperson"], "cols": "1fr 1fr"}, "status", {"row": ["beginn", "ende"]}, "einstieg", "als_vertretung", "geraet"],
  defaults: {
    'beginn': { kind: 'today', withTime: true },
    'status': { kind: 'lookup', key: 'laufend', label: 'Laufend' },
  },
  computed: {
    '_besuch_dauer_stunden': { kind: 'dateDiff', from: 'beginn', to: 'ende', unit: 'hours' },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
