// Auto-generated. Per-entity form-enhancements config for "KI-Extrakt".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["dokumentation", {"row": ["kategorie", "status"], "cols": "1fr 1fr"}, "inhalt", {"row": ["zeitangabe_rohtext", "zeitangabe_datum"], "cols": "1fr 1fr"}, {"row": ["modellbezeichnung", "promptversion"], "cols": "1fr 1fr"}, "belegstelle_position", "belegstelle"],
  defaults: {
    'status': { kind: 'lookup', key: 'neu', label: 'Neu' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
