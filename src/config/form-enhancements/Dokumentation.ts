// Auto-generated. Per-entity form-enhancements config for "Dokumentation".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["besuch", "betreute_person"], "cols": "1fr 1fr"}, "autor", "eingabeart", {"row": ["erfasst_am", "gespeichert_am"], "cols": "1fr 1fr"}, "ki_analysestatus", "ergaenzung_zu", "text"],
  defaults: {
    'eingabeart': { kind: 'lookup', key: 'getippt', label: 'Getippt' },
    'erfasst_am': { kind: 'today', withTime: true },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
