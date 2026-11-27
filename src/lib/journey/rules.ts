/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { policyLabel } from './policy';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'qualifikationsart' | 'personentyp' | 'person' | 'qualifikation_einer_person' | 'betreute_person' | 'diagnose' | 'medikationsplan' | 'massnahme_(pflegeplan)' | 'besuch' | 'ereignisprotokoll' | 'betreuungszuordnung' | 'dokumentation' | 'anhang_zur_dokumentation' | 'ki_extrakt' | 'aufgabe';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "qualifikationsart": "bezeichnung" | "beschreibung";
  "personentyp": "bezeichnung" | "beschreibung";
  "person": "vorname" | "nachname" | "strasse" | "hausnummer" | "plz" | "ort" | "land" | "email" | "telefon" | "mobil" | "benutzerkonto" | "bemerkung";
  "qualifikation_einer_person": never;
  "betreute_person": "vorname" | "nachname" | "strasse" | "hausnummer" | "plz" | "ort" | "land" | "einrichtung" | "zimmer" | "zugangshinweise" | "allergien" | "wichtige_hinweise" | "beziehung_ansprechperson";
  "diagnose": "bezeichnung" | "icd_code" | "bemerkung";
  "medikationsplan": "medikament" | "dosierung" | "rhythmus" | "begruendung";
  "massnahme_(pflegeplan)": "bezeichnung" | "beschreibung";
  "besuch": "geraet";
  "ereignisprotokoll": "aktion" | "objekttyp" | "objekt_id" | "vorher_wert" | "nachher_wert" | "geraet";
  "betreuungszuordnung": "beauftragt_durch_organisation" | "bemerkung";
  "dokumentation": "text";
  "anhang_zur_dokumentation": "beschriftung";
  "ki_extrakt": "inhalt" | "belegstelle" | "belegstelle_position" | "zeitangabe_rohtext" | "modellbezeichnung" | "promptversion";
  "aufgabe": "titel" | "beschreibung" | "nicht_durchgefuehrt_grund" | "verworfen_grund" | "ergebniskommentar";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "qualifikationsart": never;
  "personentyp": "erforderliche_qualifikationsarten";
  "person": "personentyp";
  "qualifikation_einer_person": "person" | "qualifikationsart" | "geprueft_von";
  "betreute_person": "hausarzt" | "ansprechperson" | "ersatz_ansprechperson";
  "diagnose": "betreute_person" | "festgestellt_von";
  "medikationsplan": "betreute_person" | "verordnet_von";
  "massnahme_(pflegeplan)": "betreute_person" | "mindestqualifikation" | "verordnet_von";
  "besuch": "betreute_person" | "betreuungsperson";
  "ereignisprotokoll": "akteur" | "betreute_person";
  "betreuungszuordnung": "vertretung_fuer" | "betreute_person" | "betreuungsperson" | "beauftragt_durch";
  "dokumentation": "besuch" | "betreute_person" | "autor" | "ergaenzung_zu";
  "anhang_zur_dokumentation": "aufgenommen_von" | "dokumentation";
  "ki_extrakt": "dokumentation";
  "aufgabe": "betreute_person" | "quelle_massnahme" | "zustaendig" | "mindestqualifikation" | "wartet_auf_person" | "vorgeschlagen_von" | "aktiviert_von" | "zugeordnet_von" | "begonnen_von" | "erledigt_von" | "verworfen_von" | "quelle_ki_extrakt";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it as a value. `file` is false: a file is UPLOADED
   *  (`form.file(key)` → FileField; the chosen file travels in the create as a data URL). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "qualifikationsart": {
    "key": "qualifikationsart",
    "appId": "6b094668dcf73c7868fd6fc4",
    "label": "Qualifikationsart",
    "pascal": "Qualifikationsart",
    "single": "QualifikationsartEntry"
  },
  "personentyp": {
    "key": "personentyp",
    "appId": "6b0946722077c0cfe7d1c828",
    "label": "Personentyp",
    "pascal": "Personentyp",
    "single": "PersonentypEntry"
  },
  "person": {
    "key": "person",
    "appId": "6b094673f3d73f1a0f1ddca2",
    "label": "Person",
    "pascal": "Person",
    "single": "PersonEntry"
  },
  "qualifikation_einer_person": {
    "key": "qualifikation_einer_person",
    "appId": "6b0946737c041ff4f839d8ec",
    "label": "Qualifikation einer Person",
    "pascal": "QualifikationEinerPerson",
    "single": "QualifikationEinerPersonEntry"
  },
  "betreute_person": {
    "key": "betreute_person",
    "appId": "6b09467406fae14537e8cd0d",
    "label": "Betreute Person",
    "pascal": "BetreutePerson",
    "single": "BetreutePersonEntry"
  },
  "diagnose": {
    "key": "diagnose",
    "appId": "6b094675b2a98cf2b1bc8d3f",
    "label": "Diagnose",
    "pascal": "Diagnose",
    "single": "DiagnoseEntry"
  },
  "medikationsplan": {
    "key": "medikationsplan",
    "appId": "6b094675eecfa49f3b11429b",
    "label": "Medikationsplan",
    "pascal": "Medikationsplan",
    "single": "MedikationsplanEntry"
  },
  "massnahme_(pflegeplan)": {
    "key": "massnahme_(pflegeplan)",
    "appId": "6b094676880715a2a563e130",
    "label": "Maßnahme (Pflegeplan)",
    "pascal": "MassnahmePflegeplan",
    "single": "MassnahmePflegeplanEntry"
  },
  "besuch": {
    "key": "besuch",
    "appId": "6b09467738f8038e43ee7b98",
    "label": "Besuch",
    "pascal": "Besuch",
    "single": "BesuchEntry"
  },
  "ereignisprotokoll": {
    "key": "ereignisprotokoll",
    "appId": "6b09467775742cfdeb90d88e",
    "label": "Ereignisprotokoll",
    "pascal": "Ereignisprotokoll",
    "single": "EreignisprotokollEntry"
  },
  "betreuungszuordnung": {
    "key": "betreuungszuordnung",
    "appId": "6b0946783edf81b190f38f85",
    "label": "Betreuungszuordnung",
    "pascal": "Betreuungszuordnung",
    "single": "BetreuungszuordnungEntry"
  },
  "dokumentation": {
    "key": "dokumentation",
    "appId": "6b094679bd368440b6437fe2",
    "label": "Dokumentation",
    "pascal": "Dokumentation",
    "single": "DokumentationEntry"
  },
  "anhang_zur_dokumentation": {
    "key": "anhang_zur_dokumentation",
    "appId": "6b0946795004aea62a7368bd",
    "label": "Anhang zur Dokumentation",
    "pascal": "AnhangZurDokumentation",
    "single": "AnhangZurDokumentationEntry"
  },
  "ki_extrakt": {
    "key": "ki_extrakt",
    "appId": "6b09467a2962daa7769a483e",
    "label": "KI-Extrakt",
    "pascal": "KiExtrakt",
    "single": "KiExtraktEntry"
  },
  "aufgabe": {
    "key": "aufgabe",
    "appId": "6b09467aabf4d7d13ac1c86c",
    "label": "Aufgabe",
    "pascal": "Aufgabe",
    "single": "AufgabeEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "qualifikationsart": {
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "nachweis_erforderlich": {
      "key": "nachweis_erforderlich",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Nachweis erforderlich",
      "writable": true
    },
    "aktiv": {
      "key": "aktiv",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Aktiv",
      "writable": true
    }
  },
  "personentyp": {
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "systemrolle": {
      "key": "systemrolle",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Systemrolle",
      "writable": true,
      "options": [
        "betreuungsperson",
        "pflegedienstleitung",
        "verwaltung",
        "administrator",
        "extern"
      ]
    },
    "darf_betreuen": {
      "key": "darf_betreuen",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Darf betreuen",
      "writable": true
    },
    "hat_zugang": {
      "key": "hat_zugang",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Hat Zugang zur Anwendung",
      "writable": true
    },
    "erforderliche_qualifikationsarten": {
      "key": "erforderliche_qualifikationsarten",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Erforderliche Qualifikationsarten",
      "writable": true,
      "targetAppId": "6b094668dcf73c7868fd6fc4",
      "targetEntity": "qualifikationsart"
    },
    "aktiv": {
      "key": "aktiv",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Aktiv",
      "writable": true
    }
  },
  "person": {
    "vorname": {
      "key": "vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nachname": {
      "key": "nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "personentyp": {
      "key": "personentyp",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Personentyp",
      "writable": true,
      "targetAppId": "6b0946722077c0cfe7d1c828",
      "targetEntity": "personentyp"
    },
    "strasse": {
      "key": "strasse",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Straße",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-line1"
    },
    "hausnummer": {
      "key": "hausnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Hausnummer",
      "writable": true,
      "maxLength": 4000
    },
    "plz": {
      "key": "plz",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "PLZ",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "postal-code"
    },
    "ort": {
      "key": "ort",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Ort",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "land": {
      "key": "land",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Land",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "country-name"
    },
    "koordinaten": {
      "key": "koordinaten",
      "fulltype": "geo",
      "kind": "geo",
      "required": false,
      "label": "Koordinaten",
      "writable": true
    },
    "geocoding_status": {
      "key": "geocoding_status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Geocoding-Status",
      "writable": true,
      "options": [
        "ok",
        "fehlgeschlagen",
        "ausstehend"
      ]
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "telefon": {
      "key": "telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "mobil": {
      "key": "mobil",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Mobil",
      "writable": true,
      "autoComplete": "tel"
    },
    "benutzerkonto": {
      "key": "benutzerkonto",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Benutzerkonto",
      "writable": true,
      "maxLength": 4000
    },
    "aktiv_von": {
      "key": "aktiv_von",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Aktiv von",
      "writable": true
    },
    "aktiv_bis": {
      "key": "aktiv_bis",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Aktiv bis",
      "writable": true
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    },
    "aktiv": {
      "key": "aktiv",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Aktiv",
      "writable": true
    }
  },
  "qualifikation_einer_person": {
    "person": {
      "key": "person",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Person",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "qualifikationsart": {
      "key": "qualifikationsart",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Qualifikationsart",
      "writable": true,
      "targetAppId": "6b094668dcf73c7868fd6fc4",
      "targetEntity": "qualifikationsart"
    },
    "nachweis": {
      "key": "nachweis",
      "fulltype": "file",
      "kind": "file",
      "required": false,
      "label": "Nachweis",
      "writable": false
    },
    "erworben_am": {
      "key": "erworben_am",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Erworben am",
      "writable": true
    },
    "gueltig_bis": {
      "key": "gueltig_bis",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gültig bis",
      "writable": true
    },
    "geprueft_von": {
      "key": "geprueft_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Geprüft von",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "geprueft_am": {
      "key": "geprueft_am",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Geprüft am",
      "writable": true
    }
  },
  "betreute_person": {
    "vorname": {
      "key": "vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nachname": {
      "key": "nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "geburtsdatum": {
      "key": "geburtsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Geburtsdatum",
      "writable": true,
      "autoComplete": "bday"
    },
    "strasse": {
      "key": "strasse",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Straße",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-line1"
    },
    "hausnummer": {
      "key": "hausnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Hausnummer",
      "writable": true,
      "maxLength": 4000
    },
    "plz": {
      "key": "plz",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "PLZ",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "postal-code"
    },
    "ort": {
      "key": "ort",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Ort",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "land": {
      "key": "land",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Land",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "country-name"
    },
    "koordinaten": {
      "key": "koordinaten",
      "fulltype": "geo",
      "kind": "geo",
      "required": false,
      "label": "Koordinaten",
      "writable": true
    },
    "geocoding_status": {
      "key": "geocoding_status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Geocoding-Status",
      "writable": true,
      "options": [
        "ok",
        "fehlgeschlagen",
        "ausstehend"
      ]
    },
    "einrichtung": {
      "key": "einrichtung",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Einrichtung",
      "writable": true,
      "maxLength": 4000
    },
    "zimmer": {
      "key": "zimmer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Zimmer / Wohnbereich",
      "writable": true,
      "maxLength": 4000
    },
    "zugangshinweise": {
      "key": "zugangshinweise",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Zugangshinweise",
      "writable": true
    },
    "betreuungsbeginn": {
      "key": "betreuungsbeginn",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Betreuungsbeginn",
      "writable": true
    },
    "betreuungsende": {
      "key": "betreuungsende",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Betreuungsende (leer = laufend)",
      "writable": true
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "aktiv",
        "pausiert",
        "beendet"
      ]
    },
    "allergien": {
      "key": "allergien",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Allergien und Unverträglichkeiten",
      "writable": true
    },
    "wichtige_hinweise": {
      "key": "wichtige_hinweise",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Wichtige Hinweise",
      "writable": true,
      "maxLength": 4000
    },
    "hausarzt": {
      "key": "hausarzt",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Hausarzt",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "ansprechperson": {
      "key": "ansprechperson",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Ansprechperson",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "beziehung_ansprechperson": {
      "key": "beziehung_ansprechperson",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Beziehung der Ansprechperson",
      "writable": true,
      "maxLength": 4000
    },
    "ersatz_ansprechperson": {
      "key": "ersatz_ansprechperson",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Ersatz-Ansprechperson",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "aktiv": {
      "key": "aktiv",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Aktiv",
      "writable": true
    }
  },
  "diagnose": {
    "betreute_person": {
      "key": "betreute_person",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Betreute Person",
      "writable": true,
      "targetAppId": "6b09467406fae14537e8cd0d",
      "targetEntity": "betreute_person"
    },
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "icd_code": {
      "key": "icd_code",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "ICD-Code",
      "writable": true,
      "maxLength": 4000
    },
    "festgestellt_von": {
      "key": "festgestellt_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Festgestellt von",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "gueltig_ab": {
      "key": "gueltig_ab",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gültig ab",
      "writable": true
    },
    "gueltig_bis": {
      "key": "gueltig_bis",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gültig bis",
      "writable": true
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    },
    "aktiv": {
      "key": "aktiv",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Aktiv",
      "writable": true
    }
  },
  "medikationsplan": {
    "betreute_person": {
      "key": "betreute_person",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Betreute Person",
      "writable": true,
      "targetAppId": "6b09467406fae14537e8cd0d",
      "targetEntity": "betreute_person"
    },
    "medikament": {
      "key": "medikament",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Medikament",
      "writable": true,
      "maxLength": 4000
    },
    "dosierung": {
      "key": "dosierung",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Dosierung",
      "writable": true,
      "maxLength": 4000
    },
    "rhythmus": {
      "key": "rhythmus",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Rhythmus / Zeiten",
      "writable": true,
      "maxLength": 4000
    },
    "gueltig_ab": {
      "key": "gueltig_ab",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gültig ab",
      "writable": true
    },
    "gueltig_bis": {
      "key": "gueltig_bis",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gültig bis",
      "writable": true
    },
    "verordnet_von": {
      "key": "verordnet_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Verordnet von",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "quelle": {
      "key": "quelle",
      "fulltype": "file",
      "kind": "file",
      "required": false,
      "label": "Quelle (Datei)",
      "writable": false
    },
    "begruendung": {
      "key": "begruendung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Begründung der Änderung",
      "writable": true
    },
    "aktiv": {
      "key": "aktiv",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Aktiv",
      "writable": true
    }
  },
  "massnahme_(pflegeplan)": {
    "betreute_person": {
      "key": "betreute_person",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Betreute Person",
      "writable": true,
      "targetAppId": "6b09467406fae14537e8cd0d",
      "targetEntity": "betreute_person"
    },
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "massnahmenart": {
      "key": "massnahmenart",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Maßnahmenart",
      "writable": true,
      "options": [
        "koerperpflege",
        "mobilisation",
        "medikamentengabe",
        "ernaehrung",
        "vitalzeichen",
        "haushalt",
        "sonstiges"
      ]
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "wiederholungsregel": {
      "key": "wiederholungsregel",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Wiederholungsregel",
      "writable": true,
      "options": [
        "einmalig",
        "taeglich",
        "jeden_nten_tag",
        "wochentage"
      ]
    },
    "intervall_tage": {
      "key": "intervall_tage",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Intervall in Tagen (bei jeden n-ten Tag)",
      "writable": true
    },
    "wochentage": {
      "key": "wochentage",
      "fulltype": "multiplelookup/checkbox",
      "kind": "multilookup",
      "required": false,
      "label": "Wochentage",
      "writable": true,
      "options": [
        "montag",
        "dienstag",
        "mittwoch",
        "donnerstag",
        "freitag",
        "samstag",
        "sonntag"
      ]
    },
    "tageszeitfenster": {
      "key": "tageszeitfenster",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Tageszeitfenster",
      "writable": true,
      "options": [
        "morgens",
        "mittags",
        "abends",
        "egal"
      ]
    },
    "gueltig_ab": {
      "key": "gueltig_ab",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gültig ab",
      "writable": true
    },
    "gueltig_bis": {
      "key": "gueltig_bis",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gültig bis",
      "writable": true
    },
    "mindestqualifikation": {
      "key": "mindestqualifikation",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Mindestqualifikation",
      "writable": true,
      "targetAppId": "6b094668dcf73c7868fd6fc4",
      "targetEntity": "qualifikationsart"
    },
    "verordnet_von": {
      "key": "verordnet_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Verordnet von",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "aktiv": {
      "key": "aktiv",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Aktiv",
      "writable": true
    }
  },
  "besuch": {
    "betreute_person": {
      "key": "betreute_person",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Betreute Person",
      "writable": true,
      "targetAppId": "6b09467406fae14537e8cd0d",
      "targetEntity": "betreute_person"
    },
    "betreuungsperson": {
      "key": "betreuungsperson",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Betreuungsperson",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "beginn": {
      "key": "beginn",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Beginn",
      "writable": true
    },
    "ende": {
      "key": "ende",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Ende",
      "writable": true
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "laufend",
        "abgeschlossen",
        "nicht_ordnungsgemaess_beendet"
      ]
    },
    "einstieg": {
      "key": "einstieg",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Einstieg",
      "writable": true,
      "options": [
        "standort",
        "liste"
      ]
    },
    "als_vertretung": {
      "key": "als_vertretung",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Als Vertretung",
      "writable": true
    },
    "geraet": {
      "key": "geraet",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Gerät",
      "writable": true,
      "maxLength": 4000
    }
  },
  "ereignisprotokoll": {
    "zeitstempel": {
      "key": "zeitstempel",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Zeitstempel (Server, UTC)",
      "writable": true
    },
    "akteur_typ": {
      "key": "akteur_typ",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Akteurstyp",
      "writable": true,
      "options": [
        "person",
        "system",
        "ki"
      ]
    },
    "akteur": {
      "key": "akteur",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Akteur (Person)",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "aktion": {
      "key": "aktion",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Aktion",
      "writable": true,
      "maxLength": 4000
    },
    "objekttyp": {
      "key": "objekttyp",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Objekttyp",
      "writable": true,
      "maxLength": 4000
    },
    "objekt_id": {
      "key": "objekt_id",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Objekt-ID",
      "writable": true,
      "maxLength": 4000
    },
    "betreute_person": {
      "key": "betreute_person",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Betreute Person",
      "writable": true,
      "targetAppId": "6b09467406fae14537e8cd0d",
      "targetEntity": "betreute_person"
    },
    "vorher_wert": {
      "key": "vorher_wert",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Vorher-Wert",
      "writable": true
    },
    "nachher_wert": {
      "key": "nachher_wert",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Nachher-Wert",
      "writable": true
    },
    "geraet": {
      "key": "geraet",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Gerät",
      "writable": true,
      "maxLength": 4000
    }
  },
  "betreuungszuordnung": {
    "vertretung_fuer": {
      "key": "vertretung_fuer",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Vertretung für",
      "writable": true,
      "targetAppId": "6b0946783edf81b190f38f85",
      "targetEntity": "betreuungszuordnung"
    },
    "betreute_person": {
      "key": "betreute_person",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Betreute Person",
      "writable": true,
      "targetAppId": "6b09467406fae14537e8cd0d",
      "targetEntity": "betreute_person"
    },
    "betreuungsperson": {
      "key": "betreuungsperson",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Betreuungsperson",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "rolle": {
      "key": "rolle",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Rolle",
      "writable": true,
      "options": [
        "hauptbetreuung",
        "vertretung"
      ]
    },
    "gueltig_ab": {
      "key": "gueltig_ab",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Gültig ab",
      "writable": true
    },
    "gueltig_bis": {
      "key": "gueltig_bis",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gültig bis",
      "writable": true
    },
    "beauftragt_durch": {
      "key": "beauftragt_durch",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Beauftragt durch",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "beauftragt_durch_organisation": {
      "key": "beauftragt_durch_organisation",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Beauftragt durch (Organisation)",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "organization"
    },
    "ausfall_von": {
      "key": "ausfall_von",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Ausfall von (nur Hauptbetreuung)",
      "writable": true
    },
    "ausfall_bis": {
      "key": "ausfall_bis",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Ausfall bis (nur Hauptbetreuung)",
      "writable": true
    },
    "manuell_aktiviert": {
      "key": "manuell_aktiviert",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Von der Pflegedienstleitung manuell aktiviert",
      "writable": true
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    },
    "aktiv": {
      "key": "aktiv",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Aktiv",
      "writable": true
    },
    "beauftragt_am": {
      "key": "beauftragt_am",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Beauftragt am",
      "writable": true
    }
  },
  "dokumentation": {
    "besuch": {
      "key": "besuch",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Besuch",
      "writable": true,
      "targetAppId": "6b09467738f8038e43ee7b98",
      "targetEntity": "besuch"
    },
    "betreute_person": {
      "key": "betreute_person",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Betreute Person",
      "writable": true,
      "targetAppId": "6b09467406fae14537e8cd0d",
      "targetEntity": "betreute_person"
    },
    "autor": {
      "key": "autor",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Autor",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "text": {
      "key": "text",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Text (Original)",
      "writable": true
    },
    "eingabeart": {
      "key": "eingabeart",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Eingabeart",
      "writable": true,
      "options": [
        "diktiert",
        "getippt"
      ]
    },
    "gespeichert_am": {
      "key": "gespeichert_am",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Gespeichert am (Server)",
      "writable": true
    },
    "erfasst_am": {
      "key": "erfasst_am",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Erfasst am (Gerät)",
      "writable": true
    },
    "ki_analysestatus": {
      "key": "ki_analysestatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "KI-Analysestatus",
      "writable": true,
      "options": [
        "ausstehend",
        "fertig",
        "fehlgeschlagen"
      ]
    },
    "ergaenzung_zu": {
      "key": "ergaenzung_zu",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Ergänzung zu",
      "writable": true,
      "targetAppId": "6b094679bd368440b6437fe2",
      "targetEntity": "dokumentation"
    }
  },
  "anhang_zur_dokumentation": {
    "datei": {
      "key": "datei",
      "fulltype": "file",
      "kind": "file",
      "required": true,
      "label": "Datei",
      "writable": false
    },
    "typ": {
      "key": "typ",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Typ",
      "writable": true,
      "options": [
        "foto",
        "dokument"
      ]
    },
    "aufgenommen_am": {
      "key": "aufgenommen_am",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Aufgenommen am",
      "writable": true
    },
    "aufgenommen_von": {
      "key": "aufgenommen_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Aufgenommen von",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "beschriftung": {
      "key": "beschriftung",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Beschriftung",
      "writable": true,
      "maxLength": 4000
    },
    "dokumentation": {
      "key": "dokumentation",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Dokumentation",
      "writable": true,
      "targetAppId": "6b094679bd368440b6437fe2",
      "targetEntity": "dokumentation"
    }
  },
  "ki_extrakt": {
    "dokumentation": {
      "key": "dokumentation",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Dokumentation",
      "writable": true,
      "targetAppId": "6b094679bd368440b6437fe2",
      "targetEntity": "dokumentation"
    },
    "kategorie": {
      "key": "kategorie",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Kategorie",
      "writable": true,
      "options": [
        "allgemeinzustand",
        "schwierigkeit",
        "entscheidung",
        "durchgefuehrtes",
        "medikationshinweis",
        "besorgung",
        "behoerde_recht",
        "arzt_verstaendigen",
        "vermerk_naechster_besuch",
        "dringlichkeit"
      ]
    },
    "inhalt": {
      "key": "inhalt",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Inhalt (Kurztext)",
      "writable": true,
      "maxLength": 4000
    },
    "belegstelle": {
      "key": "belegstelle",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Belegstelle (wörtlich)",
      "writable": true
    },
    "belegstelle_position": {
      "key": "belegstelle_position",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Position der Belegstelle im Text",
      "writable": true,
      "maxLength": 4000
    },
    "zeitangabe_rohtext": {
      "key": "zeitangabe_rohtext",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Genannte Zeitangabe (Rohtext)",
      "writable": true,
      "maxLength": 4000
    },
    "zeitangabe_datum": {
      "key": "zeitangabe_datum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Aufgelöstes Datum",
      "writable": true
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "neu",
        "bestaetigt",
        "verworfen"
      ]
    },
    "modellbezeichnung": {
      "key": "modellbezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Modellbezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "promptversion": {
      "key": "promptversion",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Promptversion",
      "writable": true,
      "maxLength": 4000
    }
  },
  "aufgabe": {
    "betreute_person": {
      "key": "betreute_person",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Betreute Person",
      "writable": true,
      "targetAppId": "6b09467406fae14537e8cd0d",
      "targetEntity": "betreute_person"
    },
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "aufgabenart": {
      "key": "aufgabenart",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Aufgabenart",
      "writable": true,
      "options": [
        "pflegemassnahme",
        "allgemeinzustand",
        "medikation_klaeren",
        "besorgung",
        "behoerde_recht",
        "arzt_verstaendigen",
        "vermerk_naechster_besuch",
        "sonstiges"
      ]
    },
    "herkunft": {
      "key": "herkunft",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Herkunft",
      "writable": true,
      "options": [
        "pflegeplan",
        "manuell",
        "ki_vorschlag"
      ]
    },
    "quelle_massnahme": {
      "key": "quelle_massnahme",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Quelle: Maßnahme",
      "writable": true,
      "targetAppId": "6b094676880715a2a563e130",
      "targetEntity": "massnahme_(pflegeplan)"
    },
    "prioritaet": {
      "key": "prioritaet",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Priorität",
      "writable": true,
      "options": [
        "normal",
        "dringend"
      ]
    },
    "zustaendig": {
      "key": "zustaendig",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Zuständig",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "faelligkeitsart": {
      "key": "faelligkeitsart",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Fälligkeitsart",
      "writable": true,
      "options": [
        "naechster_besuch",
        "datum",
        "tageszeitfenster"
      ]
    },
    "faelligkeitsdatum": {
      "key": "faelligkeitsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Fälligkeitsdatum",
      "writable": true
    },
    "tageszeitfenster": {
      "key": "tageszeitfenster",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Tageszeitfenster",
      "writable": true,
      "options": [
        "morgens",
        "mittags",
        "abends",
        "egal"
      ]
    },
    "mindestqualifikation": {
      "key": "mindestqualifikation",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Mindestqualifikation",
      "writable": true,
      "targetAppId": "6b094668dcf73c7868fd6fc4",
      "targetEntity": "qualifikationsart"
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "vorschlag",
        "offen",
        "erledigt",
        "nicht_durchgefuehrt",
        "wartet_auf_dritte",
        "verworfen"
      ]
    },
    "nicht_durchgefuehrt_grund": {
      "key": "nicht_durchgefuehrt_grund",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Grund für Nicht durchgeführt",
      "writable": true,
      "maxLength": 4000
    },
    "wartet_auf_person": {
      "key": "wartet_auf_person",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Wartet auf (Person)",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "verworfen_grund": {
      "key": "verworfen_grund",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Grund für Verwerfen",
      "writable": true,
      "maxLength": 4000
    },
    "ergebnis": {
      "key": "ergebnis",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Ergebnis (nur bei Erledigt)",
      "writable": true,
      "options": [
        "erfolgreich",
        "mit_schwierigkeiten",
        "nicht_erfolgreich"
      ]
    },
    "ergebniskommentar": {
      "key": "ergebniskommentar",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Ergebniskommentar",
      "writable": true
    },
    "vorgeschlagen_am": {
      "key": "vorgeschlagen_am",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Vorgeschlagen am",
      "writable": true
    },
    "vorgeschlagen_von": {
      "key": "vorgeschlagen_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Vorgeschlagen von",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "aktiviert_am": {
      "key": "aktiviert_am",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Aktiviert am",
      "writable": true
    },
    "aktiviert_von": {
      "key": "aktiviert_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Aktiviert von",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "zugeordnet_am": {
      "key": "zugeordnet_am",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Zugeordnet am",
      "writable": true
    },
    "zugeordnet_von": {
      "key": "zugeordnet_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Zugeordnet von",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "begonnen_am": {
      "key": "begonnen_am",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Begonnen am",
      "writable": true
    },
    "begonnen_von": {
      "key": "begonnen_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Begonnen von",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "erledigt_am": {
      "key": "erledigt_am",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Erledigt am",
      "writable": true
    },
    "erledigt_von": {
      "key": "erledigt_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Erledigt von",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "verworfen_am": {
      "key": "verworfen_am",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Verworfen am",
      "writable": true
    },
    "verworfen_von": {
      "key": "verworfen_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Verworfen von",
      "writable": true,
      "targetAppId": "6b094673f3d73f1a0f1ddca2",
      "targetEntity": "person"
    },
    "quelle_ki_extrakt": {
      "key": "quelle_ki_extrakt",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Quelle: KI-Extrakt",
      "writable": true,
      "targetAppId": "6b09467a2962daa7769a483e",
      "targetEntity": "ki_extrakt"
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "qualifikationsart": [],
  "personentyp": [
    {
      "kind": "choice",
      "field": "systemrolle",
      "count": 5
    },
    {
      "kind": "record",
      "field": "erforderliche_qualifikationsarten",
      "targetEntity": "qualifikationsart"
    }
  ],
  "person": [
    {
      "kind": "range",
      "from": "aktiv_von",
      "to": "aktiv_bis"
    },
    {
      "kind": "choice",
      "field": "geocoding_status",
      "count": 3
    },
    {
      "kind": "record",
      "field": "personentyp",
      "targetEntity": "personentyp"
    }
  ],
  "qualifikation_einer_person": [
    {
      "kind": "record",
      "field": "person",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "qualifikationsart",
      "targetEntity": "qualifikationsart"
    },
    {
      "kind": "record",
      "field": "geprueft_von",
      "targetEntity": "person"
    }
  ],
  "betreute_person": [
    {
      "kind": "choice",
      "field": "geocoding_status",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 3
    },
    {
      "kind": "record",
      "field": "hausarzt",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "ansprechperson",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "ersatz_ansprechperson",
      "targetEntity": "person"
    }
  ],
  "diagnose": [
    {
      "kind": "record",
      "field": "betreute_person",
      "targetEntity": "betreute_person"
    },
    {
      "kind": "record",
      "field": "festgestellt_von",
      "targetEntity": "person"
    }
  ],
  "medikationsplan": [
    {
      "kind": "record",
      "field": "betreute_person",
      "targetEntity": "betreute_person"
    },
    {
      "kind": "record",
      "field": "verordnet_von",
      "targetEntity": "person"
    }
  ],
  "massnahme_(pflegeplan)": [
    {
      "kind": "choice",
      "field": "wiederholungsregel",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "tageszeitfenster",
      "count": 4
    },
    {
      "kind": "record",
      "field": "betreute_person",
      "targetEntity": "betreute_person"
    },
    {
      "kind": "record",
      "field": "mindestqualifikation",
      "targetEntity": "qualifikationsart"
    },
    {
      "kind": "record",
      "field": "verordnet_von",
      "targetEntity": "person"
    }
  ],
  "besuch": [
    {
      "kind": "range",
      "from": "beginn",
      "to": "ende"
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "einstieg",
      "count": 2
    },
    {
      "kind": "record",
      "field": "betreute_person",
      "targetEntity": "betreute_person"
    },
    {
      "kind": "record",
      "field": "betreuungsperson",
      "targetEntity": "person"
    }
  ],
  "ereignisprotokoll": [
    {
      "kind": "choice",
      "field": "akteur_typ",
      "count": 3
    },
    {
      "kind": "record",
      "field": "akteur",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "betreute_person",
      "targetEntity": "betreute_person"
    }
  ],
  "betreuungszuordnung": [
    {
      "kind": "range",
      "from": "ausfall_von",
      "to": "ausfall_bis"
    },
    {
      "kind": "choice",
      "field": "rolle",
      "count": 2
    },
    {
      "kind": "record",
      "field": "vertretung_fuer",
      "targetEntity": "betreuungszuordnung"
    },
    {
      "kind": "record",
      "field": "betreute_person",
      "targetEntity": "betreute_person"
    },
    {
      "kind": "record",
      "field": "betreuungsperson",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "beauftragt_durch",
      "targetEntity": "person"
    }
  ],
  "dokumentation": [
    {
      "kind": "choice",
      "field": "eingabeart",
      "count": 2
    },
    {
      "kind": "choice",
      "field": "ki_analysestatus",
      "count": 3
    },
    {
      "kind": "record",
      "field": "besuch",
      "targetEntity": "besuch"
    },
    {
      "kind": "record",
      "field": "betreute_person",
      "targetEntity": "betreute_person"
    },
    {
      "kind": "record",
      "field": "autor",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "ergaenzung_zu",
      "targetEntity": "dokumentation"
    }
  ],
  "anhang_zur_dokumentation": [
    {
      "kind": "choice",
      "field": "typ",
      "count": 2
    },
    {
      "kind": "record",
      "field": "aufgenommen_von",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "dokumentation",
      "targetEntity": "dokumentation"
    }
  ],
  "ki_extrakt": [
    {
      "kind": "choice",
      "field": "status",
      "count": 3
    },
    {
      "kind": "record",
      "field": "dokumentation",
      "targetEntity": "dokumentation"
    }
  ],
  "aufgabe": [
    {
      "kind": "choice",
      "field": "herkunft",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "prioritaet",
      "count": 2
    },
    {
      "kind": "choice",
      "field": "faelligkeitsart",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "tageszeitfenster",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 6
    },
    {
      "kind": "choice",
      "field": "ergebnis",
      "count": 3
    },
    {
      "kind": "record",
      "field": "betreute_person",
      "targetEntity": "betreute_person"
    },
    {
      "kind": "record",
      "field": "quelle_massnahme",
      "targetEntity": "massnahme_(pflegeplan)"
    },
    {
      "kind": "record",
      "field": "zustaendig",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "mindestqualifikation",
      "targetEntity": "qualifikationsart"
    },
    {
      "kind": "record",
      "field": "wartet_auf_person",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "vorgeschlagen_von",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "aktiviert_von",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "zugeordnet_von",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "begonnen_von",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "erledigt_von",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "verworfen_von",
      "targetEntity": "person"
    },
    {
      "kind": "record",
      "field": "quelle_ki_extrakt",
      "targetEntity": "ki_extrakt"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "qualifikationsart": [
    "bezeichnung"
  ],
  "personentyp": [
    "bezeichnung"
  ],
  "person": [
    "vorname",
    "nachname"
  ],
  "qualifikation_einer_person": [
    "erworben_am"
  ],
  "betreute_person": [
    "vorname",
    "nachname"
  ],
  "diagnose": [
    "bezeichnung"
  ],
  "medikationsplan": [
    "medikament"
  ],
  "massnahme_(pflegeplan)": [
    "bezeichnung"
  ],
  "besuch": [
    "geraet"
  ],
  "ereignisprotokoll": [
    "aktion"
  ],
  "betreuungszuordnung": [
    "beauftragt_durch_organisation"
  ],
  "dokumentation": [
    "text"
  ],
  "anhang_zur_dokumentation": [
    "beschriftung"
  ],
  "ki_extrakt": [
    "inhalt"
  ],
  "aufgabe": [
    "titel"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
/** A display-field value as text: strings as they are, a lookup `{ key, label }`
 *  (either door hydrates lookups to objects) by its label — an entity whose
 *  only title-like field is a lookup/select otherwise had no name at all. */
/** A date reads as a date (a target whose only readable fields are `beginn`/`ende` — Doodle KB 6),
 *  a number as a number; a record URL or a bare id is never a name (0.0.389). */
export function displayPart(v: unknown): string {
  if (typeof v === 'string') {
    const s = v.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return formatDate(s);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return formatDateTime(s);
    if (/^https?:\/\//.test(s) || /^[0-9a-f]{24}$/i.test(s)) return '';
    return s;
  }
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  if (v && typeof v === 'object' && 'label' in v) {
    const l = (v as { label?: unknown }).label;
    return l === null || l === undefined ? '' : String(l).trim();
  }
  return '';
}

export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => displayPart(fields[k]))
    .filter(v => v !== '');
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — the owner's policy label first (a
 *  public page's "Felder anpassen"), runtime bundle second, generated label last. */
export function labelOf(entity: EntityKey, key: string): string {
  const own = policyLabel(entity, key);
  if (own) return own;
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

/** „Nicht ausgefüllt“ for a required field, by its kind: a checkbox that is
 *  `false` is NOT filled — the person did not consent (live 03.11.2026: a
 *  consent page validated with the box unticked and the grant took it). Every
 *  other kind is isEmptyValue. */
export function isUnfilled(entity: EntityKey, key: string, v: unknown): boolean {
  if (ruleOf(entity, key)?.kind === 'bool') return v !== true;
  return isEmptyValue(v);
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
