// Auto-generated. Per-entity form-enhancements config for "Betreuungszuordnung".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["betreute_person", "betreuungsperson", "rolle", {"row": ["gueltig_ab", "gueltig_bis"], "cols": "1fr 1fr"}, "aktiv", "vertretung_fuer", "beauftragt_durch", "beauftragt_durch_organisation", "beauftragt_am", {"row": ["ausfall_von", "ausfall_bis"]}, "manuell_aktiviert", "bemerkung"],
  defaults: {
    'gueltig_ab': { kind: 'today' },
    'aktiv': { kind: 'literal', value: true },
    'beauftragt_am': { kind: 'today' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
