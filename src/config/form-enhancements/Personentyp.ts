// Auto-generated. Per-entity form-enhancements config for "Personentyp".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["bezeichnung", "systemrolle", {"row": ["darf_betreuen", "hat_zugang"], "cols": "1fr 1fr"}, "aktiv", "erforderliche_qualifikationsarten", "beschreibung"],
  defaults: {
    'aktiv': { kind: 'literal', value: true },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
