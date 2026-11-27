// Auto-generated. Per-entity form-enhancements config for "Betreute Person".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["vorname", "nachname"], "cols": "1fr 1fr"}, "geburtsdatum", "status", "aktiv", "einrichtung", "zimmer", {"row": ["betreuungsbeginn", "betreuungsende"], "cols": "1fr 1fr"}, {"row": ["strasse", "hausnummer"], "cols": "2fr 1fr"}, {"row": ["plz", "ort"], "cols": "1fr 2fr"}, "land", "geocoding_status", "hausarzt", "ansprechperson", "beziehung_ansprechperson", "ersatz_ansprechperson", "wichtige_hinweise", "allergien", "zugangshinweise"],
  defaults: {
    'betreuungsbeginn': { kind: 'today' },
    'status': { kind: 'lookup', key: 'aktiv', label: 'Aktiv' },
    'aktiv': { kind: 'literal', value: true },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
