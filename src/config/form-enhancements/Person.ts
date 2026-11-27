// Auto-generated. Per-entity form-enhancements config for "Person".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["vorname", "nachname"], "cols": "1fr 1fr"}, "personentyp", {"row": ["strasse", "hausnummer"], "cols": "2fr 1fr"}, {"row": ["plz", "ort"], "cols": "1fr 2fr"}, "land", "geocoding_status", "email", {"row": ["telefon", "mobil"], "cols": "1fr 1fr"}, "benutzerkonto", {"row": ["aktiv_von", "aktiv_bis"], "cols": "1fr 1fr"}, "aktiv", "bemerkung"],
  defaults: {
    'aktiv_von': { kind: 'today' },
    'aktiv': { kind: 'literal', value: true },
    'land': { kind: 'literal', value: 'Deutschland' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
