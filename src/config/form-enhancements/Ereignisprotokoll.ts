// Auto-generated. Per-entity form-enhancements config for "Ereignisprotokoll".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["aktion", {"row": ["zeitstempel", "akteur_typ"], "cols": "1fr 1fr"}, {"row": ["akteur", "betreute_person"], "cols": "1fr 1fr"}, {"row": ["objekttyp", "objekt_id"], "cols": "1fr 1fr"}, "geraet", "vorher_wert", "nachher_wert"],
  defaults: {
    'zeitstempel': { kind: 'today', withTime: true },
    'akteur_typ': { kind: 'lookup', key: 'person', label: 'Person' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
