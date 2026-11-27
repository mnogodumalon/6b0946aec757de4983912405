// Auto-generated. Per-entity form-enhancements config for "Aufgabe".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "betreute_person", {"row": ["aufgabenart", "prioritaet"], "cols": "1fr 1fr"}, "herkunft", "status", "zustaendig", "faelligkeitsart", {"row": ["faelligkeitsdatum", "tageszeitfenster"], "cols": "1fr 1fr"}, "mindestqualifikation", "quelle_massnahme", "quelle_ki_extrakt", "wartet_auf_person", {"row": ["vorgeschlagen_am", "vorgeschlagen_von"], "cols": "1fr 1fr"}, {"row": ["aktiviert_am", "aktiviert_von"], "cols": "1fr 1fr"}, {"row": ["zugeordnet_am", "zugeordnet_von"], "cols": "1fr 1fr"}, {"row": ["begonnen_am", "begonnen_von"], "cols": "1fr 1fr"}, {"row": ["erledigt_am", "erledigt_von"], "cols": "1fr 1fr"}, {"row": ["verworfen_am", "verworfen_von"], "cols": "1fr 1fr"}, "ergebnis", "nicht_durchgefuehrt_grund", "verworfen_grund", "beschreibung", "ergebniskommentar"],
  defaults: {
    'status': { kind: 'lookup', key: 'offen', label: 'Offen' },
    'prioritaet': { kind: 'lookup', key: 'normal', label: 'Normal' },
    'herkunft': { kind: 'lookup', key: 'manuell', label: 'Manuell' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
