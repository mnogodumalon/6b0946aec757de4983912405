import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Qualifikationsart {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    bezeichnung?: string;
    beschreibung?: string;
    nachweis_erforderlich?: boolean;
    aktiv?: boolean;
  };
}

export interface Personentyp {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    bezeichnung?: string;
    beschreibung?: string;
    systemrolle?: LookupValue;
    darf_betreuen?: boolean;
    hat_zugang?: boolean;
    erforderliche_qualifikationsarten?: RecordUrl[];
    aktiv?: boolean;
  };
}

export interface Person {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    personentyp?: RecordUrl; // applookup -> URL zu 'Personentyp' Record
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    land?: string;
    koordinaten?: GeoLocation; // { lat, long, info }
    geocoding_status?: LookupValue;
    email?: string;
    telefon?: string;
    mobil?: string;
    benutzerkonto?: string;
    aktiv_von?: string; // Format: YYYY-MM-DD oder ISO String
    aktiv_bis?: string; // Format: YYYY-MM-DD oder ISO String
    bemerkung?: string;
    aktiv?: boolean;
  };
}

export interface QualifikationEinerPerson {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    person?: RecordUrl; // applookup -> URL zu 'Person' Record
    qualifikationsart?: RecordUrl; // applookup -> URL zu 'Qualifikationsart' Record
    nachweis?: string;
    erworben_am?: string; // Format: YYYY-MM-DD oder ISO String
    gueltig_bis?: string; // Format: YYYY-MM-DD oder ISO String
    geprueft_von?: RecordUrl; // applookup -> URL zu 'Person' Record
    geprueft_am?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface BetreutePerson {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    land?: string;
    koordinaten?: GeoLocation; // { lat, long, info }
    geocoding_status?: LookupValue;
    einrichtung?: string;
    zimmer?: string;
    zugangshinweise?: string;
    betreuungsbeginn?: string; // Format: YYYY-MM-DD oder ISO String
    betreuungsende?: string; // Format: YYYY-MM-DD oder ISO String
    status?: LookupValue;
    allergien?: string;
    wichtige_hinweise?: string;
    hausarzt?: RecordUrl; // applookup -> URL zu 'Person' Record
    ansprechperson?: RecordUrl; // applookup -> URL zu 'Person' Record
    beziehung_ansprechperson?: string;
    ersatz_ansprechperson?: RecordUrl; // applookup -> URL zu 'Person' Record
    aktiv?: boolean;
  };
}

export interface Diagnose {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    betreute_person?: RecordUrl; // applookup -> URL zu 'BetreutePerson' Record
    bezeichnung?: string;
    icd_code?: string;
    festgestellt_von?: RecordUrl; // applookup -> URL zu 'Person' Record
    gueltig_ab?: string; // Format: YYYY-MM-DD oder ISO String
    gueltig_bis?: string; // Format: YYYY-MM-DD oder ISO String
    bemerkung?: string;
    aktiv?: boolean;
  };
}

export interface Medikationsplan {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    betreute_person?: RecordUrl; // applookup -> URL zu 'BetreutePerson' Record
    medikament?: string;
    dosierung?: string;
    rhythmus?: string;
    gueltig_ab?: string; // Format: YYYY-MM-DD oder ISO String
    gueltig_bis?: string; // Format: YYYY-MM-DD oder ISO String
    verordnet_von?: RecordUrl; // applookup -> URL zu 'Person' Record
    quelle?: string;
    begruendung?: string;
    aktiv?: boolean;
  };
}

export interface MassnahmePflegeplan {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    betreute_person?: RecordUrl; // applookup -> URL zu 'BetreutePerson' Record
    bezeichnung?: string;
    massnahmenart?: LookupValue;
    beschreibung?: string;
    wiederholungsregel?: LookupValue;
    intervall_tage?: number;
    wochentage?: LookupValue[];
    tageszeitfenster?: LookupValue;
    gueltig_ab?: string; // Format: YYYY-MM-DD oder ISO String
    gueltig_bis?: string; // Format: YYYY-MM-DD oder ISO String
    mindestqualifikation?: RecordUrl; // applookup -> URL zu 'Qualifikationsart' Record
    verordnet_von?: RecordUrl; // applookup -> URL zu 'Person' Record
    aktiv?: boolean;
  };
}

export interface Besuch {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    betreute_person?: RecordUrl; // applookup -> URL zu 'BetreutePerson' Record
    betreuungsperson?: RecordUrl; // applookup -> URL zu 'Person' Record
    beginn?: string; // Format: YYYY-MM-DD oder ISO String
    ende?: string; // Format: YYYY-MM-DD oder ISO String
    status?: LookupValue;
    einstieg?: LookupValue;
    als_vertretung?: boolean;
    geraet?: string;
  };
}

export interface Ereignisprotokoll {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    zeitstempel?: string; // Format: YYYY-MM-DD oder ISO String
    akteur_typ?: LookupValue;
    akteur?: RecordUrl; // applookup -> URL zu 'Person' Record
    aktion?: string;
    objekttyp?: string;
    objekt_id?: string;
    betreute_person?: RecordUrl; // applookup -> URL zu 'BetreutePerson' Record
    vorher_wert?: string;
    nachher_wert?: string;
    geraet?: string;
  };
}

export interface Betreuungszuordnung {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vertretung_fuer?: RecordUrl; // applookup -> URL zu 'Betreuungszuordnung' Record
    betreute_person?: RecordUrl; // applookup -> URL zu 'BetreutePerson' Record
    betreuungsperson?: RecordUrl; // applookup -> URL zu 'Person' Record
    rolle?: LookupValue;
    gueltig_ab?: string; // Format: YYYY-MM-DD oder ISO String
    gueltig_bis?: string; // Format: YYYY-MM-DD oder ISO String
    beauftragt_durch?: RecordUrl; // applookup -> URL zu 'Person' Record
    beauftragt_durch_organisation?: string;
    ausfall_von?: string; // Format: YYYY-MM-DD oder ISO String
    ausfall_bis?: string; // Format: YYYY-MM-DD oder ISO String
    manuell_aktiviert?: boolean;
    bemerkung?: string;
    aktiv?: boolean;
    beauftragt_am?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Dokumentation {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    besuch?: RecordUrl; // applookup -> URL zu 'Besuch' Record
    betreute_person?: RecordUrl; // applookup -> URL zu 'BetreutePerson' Record
    autor?: RecordUrl; // applookup -> URL zu 'Person' Record
    text?: string;
    eingabeart?: LookupValue;
    gespeichert_am?: string; // Format: YYYY-MM-DD oder ISO String
    erfasst_am?: string; // Format: YYYY-MM-DD oder ISO String
    ki_analysestatus?: LookupValue;
    ergaenzung_zu?: RecordUrl; // applookup -> URL zu 'Dokumentation' Record
  };
}

export interface AnhangZurDokumentation {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    datei?: string;
    typ?: LookupValue;
    aufgenommen_am?: string; // Format: YYYY-MM-DD oder ISO String
    aufgenommen_von?: RecordUrl; // applookup -> URL zu 'Person' Record
    beschriftung?: string;
    dokumentation?: RecordUrl; // applookup -> URL zu 'Dokumentation' Record
  };
}

export interface KiExtrakt {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    dokumentation?: RecordUrl; // applookup -> URL zu 'Dokumentation' Record
    kategorie?: LookupValue;
    inhalt?: string;
    belegstelle?: string;
    belegstelle_position?: string;
    zeitangabe_rohtext?: string;
    zeitangabe_datum?: string; // Format: YYYY-MM-DD oder ISO String
    status?: LookupValue;
    modellbezeichnung?: string;
    promptversion?: string;
  };
}

export interface Aufgabe {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    betreute_person?: RecordUrl; // applookup -> URL zu 'BetreutePerson' Record
    titel?: string;
    beschreibung?: string;
    aufgabenart?: LookupValue;
    herkunft?: LookupValue;
    quelle_massnahme?: RecordUrl; // applookup -> URL zu 'MassnahmePflegeplan' Record
    prioritaet?: LookupValue;
    zustaendig?: RecordUrl; // applookup -> URL zu 'Person' Record
    faelligkeitsart?: LookupValue;
    faelligkeitsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    tageszeitfenster?: LookupValue;
    mindestqualifikation?: RecordUrl; // applookup -> URL zu 'Qualifikationsart' Record
    status?: LookupValue;
    nicht_durchgefuehrt_grund?: string;
    wartet_auf_person?: RecordUrl; // applookup -> URL zu 'Person' Record
    verworfen_grund?: string;
    ergebnis?: LookupValue;
    ergebniskommentar?: string;
    vorgeschlagen_am?: string; // Format: YYYY-MM-DD oder ISO String
    vorgeschlagen_von?: RecordUrl; // applookup -> URL zu 'Person' Record
    aktiviert_am?: string; // Format: YYYY-MM-DD oder ISO String
    aktiviert_von?: RecordUrl; // applookup -> URL zu 'Person' Record
    zugeordnet_am?: string; // Format: YYYY-MM-DD oder ISO String
    zugeordnet_von?: RecordUrl; // applookup -> URL zu 'Person' Record
    begonnen_am?: string; // Format: YYYY-MM-DD oder ISO String
    begonnen_von?: RecordUrl; // applookup -> URL zu 'Person' Record
    erledigt_am?: string; // Format: YYYY-MM-DD oder ISO String
    erledigt_von?: RecordUrl; // applookup -> URL zu 'Person' Record
    verworfen_am?: string; // Format: YYYY-MM-DD oder ISO String
    verworfen_von?: RecordUrl; // applookup -> URL zu 'Person' Record
    quelle_ki_extrakt?: RecordUrl; // applookup -> URL zu 'KiExtrakt' Record
  };
}

export const APP_IDS = {
  QUALIFIKATIONSART: '6b094668dcf73c7868fd6fc4',
  PERSONENTYP: '6b0946722077c0cfe7d1c828',
  PERSON: '6b094673f3d73f1a0f1ddca2',
  QUALIFIKATION_EINER_PERSON: '6b0946737c041ff4f839d8ec',
  BETREUTE_PERSON: '6b09467406fae14537e8cd0d',
  DIAGNOSE: '6b094675b2a98cf2b1bc8d3f',
  MEDIKATIONSPLAN: '6b094675eecfa49f3b11429b',
  MASSNAHME_PFLEGEPLAN: '6b094676880715a2a563e130',
  BESUCH: '6b09467738f8038e43ee7b98',
  EREIGNISPROTOKOLL: '6b09467775742cfdeb90d88e',
  BETREUUNGSZUORDNUNG: '6b0946783edf81b190f38f85',
  DOKUMENTATION: '6b094679bd368440b6437fe2',
  ANHANG_ZUR_DOKUMENTATION: '6b0946795004aea62a7368bd',
  KI_EXTRAKT: '6b09467a2962daa7769a483e',
  AUFGABE: '6b09467aabf4d7d13ac1c86c',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'personentyp': {
    systemrolle: [{ key: "betreuungsperson", get label() { return lookupLabel('personentyp', 'systemrolle', "betreuungsperson") ?? "Betreuungsperson"; } }, { key: "pflegedienstleitung", get label() { return lookupLabel('personentyp', 'systemrolle', "pflegedienstleitung") ?? "Pflegedienstleitung"; } }, { key: "verwaltung", get label() { return lookupLabel('personentyp', 'systemrolle', "verwaltung") ?? "Verwaltung"; } }, { key: "administrator", get label() { return lookupLabel('personentyp', 'systemrolle', "administrator") ?? "Administrator"; } }, { key: "extern", get label() { return lookupLabel('personentyp', 'systemrolle', "extern") ?? "Extern"; } }],
  },
  'person': {
    geocoding_status: [{ key: "ok", get label() { return lookupLabel('person', 'geocoding_status', "ok") ?? "OK"; } }, { key: "fehlgeschlagen", get label() { return lookupLabel('person', 'geocoding_status', "fehlgeschlagen") ?? "Fehlgeschlagen"; } }, { key: "ausstehend", get label() { return lookupLabel('person', 'geocoding_status', "ausstehend") ?? "Ausstehend"; } }],
  },
  'betreute_person': {
    geocoding_status: [{ key: "ok", get label() { return lookupLabel('betreute_person', 'geocoding_status', "ok") ?? "OK"; } }, { key: "fehlgeschlagen", get label() { return lookupLabel('betreute_person', 'geocoding_status', "fehlgeschlagen") ?? "Fehlgeschlagen"; } }, { key: "ausstehend", get label() { return lookupLabel('betreute_person', 'geocoding_status', "ausstehend") ?? "Ausstehend"; } }],
    status: [{ key: "aktiv", get label() { return lookupLabel('betreute_person', 'status', "aktiv") ?? "Aktiv"; } }, { key: "pausiert", get label() { return lookupLabel('betreute_person', 'status', "pausiert") ?? "Pausiert"; } }, { key: "beendet", get label() { return lookupLabel('betreute_person', 'status', "beendet") ?? "Beendet"; } }],
  },
  'massnahme_(pflegeplan)': {
    massnahmenart: [{ key: "koerperpflege", get label() { return lookupLabel('massnahme_(pflegeplan)', 'massnahmenart', "koerperpflege") ?? "Körperpflege"; } }, { key: "mobilisation", get label() { return lookupLabel('massnahme_(pflegeplan)', 'massnahmenart', "mobilisation") ?? "Mobilisation"; } }, { key: "medikamentengabe", get label() { return lookupLabel('massnahme_(pflegeplan)', 'massnahmenart', "medikamentengabe") ?? "Medikamentengabe"; } }, { key: "ernaehrung", get label() { return lookupLabel('massnahme_(pflegeplan)', 'massnahmenart', "ernaehrung") ?? "Ernährung"; } }, { key: "vitalzeichen", get label() { return lookupLabel('massnahme_(pflegeplan)', 'massnahmenart', "vitalzeichen") ?? "Vitalzeichen"; } }, { key: "haushalt", get label() { return lookupLabel('massnahme_(pflegeplan)', 'massnahmenart', "haushalt") ?? "Haushalt"; } }, { key: "sonstiges", get label() { return lookupLabel('massnahme_(pflegeplan)', 'massnahmenart', "sonstiges") ?? "Sonstiges"; } }],
    wiederholungsregel: [{ key: "einmalig", get label() { return lookupLabel('massnahme_(pflegeplan)', 'wiederholungsregel', "einmalig") ?? "Einmalig"; } }, { key: "taeglich", get label() { return lookupLabel('massnahme_(pflegeplan)', 'wiederholungsregel', "taeglich") ?? "Täglich"; } }, { key: "jeden_nten_tag", get label() { return lookupLabel('massnahme_(pflegeplan)', 'wiederholungsregel', "jeden_nten_tag") ?? "Jeden n-ten Tag"; } }, { key: "wochentage", get label() { return lookupLabel('massnahme_(pflegeplan)', 'wiederholungsregel', "wochentage") ?? "Bestimmte Wochentage"; } }],
    wochentage: [{ key: "montag", get label() { return lookupLabel('massnahme_(pflegeplan)', 'wochentage', "montag") ?? "Montag"; } }, { key: "dienstag", get label() { return lookupLabel('massnahme_(pflegeplan)', 'wochentage', "dienstag") ?? "Dienstag"; } }, { key: "mittwoch", get label() { return lookupLabel('massnahme_(pflegeplan)', 'wochentage', "mittwoch") ?? "Mittwoch"; } }, { key: "donnerstag", get label() { return lookupLabel('massnahme_(pflegeplan)', 'wochentage', "donnerstag") ?? "Donnerstag"; } }, { key: "freitag", get label() { return lookupLabel('massnahme_(pflegeplan)', 'wochentage', "freitag") ?? "Freitag"; } }, { key: "samstag", get label() { return lookupLabel('massnahme_(pflegeplan)', 'wochentage', "samstag") ?? "Samstag"; } }, { key: "sonntag", get label() { return lookupLabel('massnahme_(pflegeplan)', 'wochentage', "sonntag") ?? "Sonntag"; } }],
    tageszeitfenster: [{ key: "morgens", get label() { return lookupLabel('massnahme_(pflegeplan)', 'tageszeitfenster', "morgens") ?? "Morgens"; } }, { key: "mittags", get label() { return lookupLabel('massnahme_(pflegeplan)', 'tageszeitfenster', "mittags") ?? "Mittags"; } }, { key: "abends", get label() { return lookupLabel('massnahme_(pflegeplan)', 'tageszeitfenster', "abends") ?? "Abends"; } }, { key: "egal", get label() { return lookupLabel('massnahme_(pflegeplan)', 'tageszeitfenster', "egal") ?? "Egal"; } }],
  },
  'besuch': {
    status: [{ key: "laufend", get label() { return lookupLabel('besuch', 'status', "laufend") ?? "Laufend"; } }, { key: "abgeschlossen", get label() { return lookupLabel('besuch', 'status', "abgeschlossen") ?? "Abgeschlossen"; } }, { key: "nicht_ordnungsgemaess_beendet", get label() { return lookupLabel('besuch', 'status', "nicht_ordnungsgemaess_beendet") ?? "Nicht ordnungsgemäß beendet"; } }],
    einstieg: [{ key: "standort", get label() { return lookupLabel('besuch', 'einstieg', "standort") ?? "Standort"; } }, { key: "liste", get label() { return lookupLabel('besuch', 'einstieg', "liste") ?? "Liste"; } }],
  },
  'ereignisprotokoll': {
    akteur_typ: [{ key: "person", get label() { return lookupLabel('ereignisprotokoll', 'akteur_typ', "person") ?? "Person"; } }, { key: "system", get label() { return lookupLabel('ereignisprotokoll', 'akteur_typ', "system") ?? "System"; } }, { key: "ki", get label() { return lookupLabel('ereignisprotokoll', 'akteur_typ', "ki") ?? "KI"; } }],
  },
  'betreuungszuordnung': {
    rolle: [{ key: "hauptbetreuung", get label() { return lookupLabel('betreuungszuordnung', 'rolle', "hauptbetreuung") ?? "Hauptbetreuung"; } }, { key: "vertretung", get label() { return lookupLabel('betreuungszuordnung', 'rolle', "vertretung") ?? "Vertretung"; } }],
  },
  'dokumentation': {
    eingabeart: [{ key: "diktiert", get label() { return lookupLabel('dokumentation', 'eingabeart', "diktiert") ?? "Diktiert"; } }, { key: "getippt", get label() { return lookupLabel('dokumentation', 'eingabeart', "getippt") ?? "Getippt"; } }],
    ki_analysestatus: [{ key: "ausstehend", get label() { return lookupLabel('dokumentation', 'ki_analysestatus', "ausstehend") ?? "Ausstehend"; } }, { key: "fertig", get label() { return lookupLabel('dokumentation', 'ki_analysestatus', "fertig") ?? "Fertig"; } }, { key: "fehlgeschlagen", get label() { return lookupLabel('dokumentation', 'ki_analysestatus', "fehlgeschlagen") ?? "Fehlgeschlagen"; } }],
  },
  'anhang_zur_dokumentation': {
    typ: [{ key: "foto", get label() { return lookupLabel('anhang_zur_dokumentation', 'typ', "foto") ?? "Foto"; } }, { key: "dokument", get label() { return lookupLabel('anhang_zur_dokumentation', 'typ', "dokument") ?? "Dokument"; } }],
  },
  'ki_extrakt': {
    kategorie: [{ key: "allgemeinzustand", get label() { return lookupLabel('ki_extrakt', 'kategorie', "allgemeinzustand") ?? "Allgemeinzustand"; } }, { key: "schwierigkeit", get label() { return lookupLabel('ki_extrakt', 'kategorie', "schwierigkeit") ?? "Schwierigkeit"; } }, { key: "entscheidung", get label() { return lookupLabel('ki_extrakt', 'kategorie', "entscheidung") ?? "Entscheidung"; } }, { key: "durchgefuehrtes", get label() { return lookupLabel('ki_extrakt', 'kategorie', "durchgefuehrtes") ?? "Durchgeführtes"; } }, { key: "medikationshinweis", get label() { return lookupLabel('ki_extrakt', 'kategorie', "medikationshinweis") ?? "Medikationshinweis"; } }, { key: "besorgung", get label() { return lookupLabel('ki_extrakt', 'kategorie', "besorgung") ?? "Besorgung"; } }, { key: "behoerde_recht", get label() { return lookupLabel('ki_extrakt', 'kategorie', "behoerde_recht") ?? "Behörde / Recht"; } }, { key: "arzt_verstaendigen", get label() { return lookupLabel('ki_extrakt', 'kategorie', "arzt_verstaendigen") ?? "Arzt verständigen"; } }, { key: "vermerk_naechster_besuch", get label() { return lookupLabel('ki_extrakt', 'kategorie', "vermerk_naechster_besuch") ?? "Vermerk nächster Besuch"; } }, { key: "dringlichkeit", get label() { return lookupLabel('ki_extrakt', 'kategorie', "dringlichkeit") ?? "Dringlichkeit"; } }],
    status: [{ key: "neu", get label() { return lookupLabel('ki_extrakt', 'status', "neu") ?? "Neu"; } }, { key: "bestaetigt", get label() { return lookupLabel('ki_extrakt', 'status', "bestaetigt") ?? "Bestätigt"; } }, { key: "verworfen", get label() { return lookupLabel('ki_extrakt', 'status', "verworfen") ?? "Verworfen"; } }],
  },
  'aufgabe': {
    aufgabenart: [{ key: "pflegemassnahme", get label() { return lookupLabel('aufgabe', 'aufgabenart', "pflegemassnahme") ?? "Pflegemaßnahme"; } }, { key: "allgemeinzustand", get label() { return lookupLabel('aufgabe', 'aufgabenart', "allgemeinzustand") ?? "Allgemeinzustand"; } }, { key: "medikation_klaeren", get label() { return lookupLabel('aufgabe', 'aufgabenart', "medikation_klaeren") ?? "Medikation klären"; } }, { key: "besorgung", get label() { return lookupLabel('aufgabe', 'aufgabenart', "besorgung") ?? "Besorgung"; } }, { key: "behoerde_recht", get label() { return lookupLabel('aufgabe', 'aufgabenart', "behoerde_recht") ?? "Behörde / Recht"; } }, { key: "arzt_verstaendigen", get label() { return lookupLabel('aufgabe', 'aufgabenart', "arzt_verstaendigen") ?? "Arzt verständigen"; } }, { key: "vermerk_naechster_besuch", get label() { return lookupLabel('aufgabe', 'aufgabenart', "vermerk_naechster_besuch") ?? "Vermerk nächster Besuch"; } }, { key: "sonstiges", get label() { return lookupLabel('aufgabe', 'aufgabenart', "sonstiges") ?? "Sonstiges"; } }],
    herkunft: [{ key: "pflegeplan", get label() { return lookupLabel('aufgabe', 'herkunft', "pflegeplan") ?? "Pflegeplan"; } }, { key: "manuell", get label() { return lookupLabel('aufgabe', 'herkunft', "manuell") ?? "Manuell"; } }, { key: "ki_vorschlag", get label() { return lookupLabel('aufgabe', 'herkunft', "ki_vorschlag") ?? "KI-Vorschlag"; } }],
    prioritaet: [{ key: "normal", get label() { return lookupLabel('aufgabe', 'prioritaet', "normal") ?? "Normal"; } }, { key: "dringend", get label() { return lookupLabel('aufgabe', 'prioritaet', "dringend") ?? "Dringend"; } }],
    faelligkeitsart: [{ key: "naechster_besuch", get label() { return lookupLabel('aufgabe', 'faelligkeitsart', "naechster_besuch") ?? "Beim nächsten Besuch"; } }, { key: "datum", get label() { return lookupLabel('aufgabe', 'faelligkeitsart', "datum") ?? "Datum"; } }, { key: "tageszeitfenster", get label() { return lookupLabel('aufgabe', 'faelligkeitsart', "tageszeitfenster") ?? "Tageszeitfenster"; } }],
    tageszeitfenster: [{ key: "morgens", get label() { return lookupLabel('aufgabe', 'tageszeitfenster', "morgens") ?? "Morgens"; } }, { key: "mittags", get label() { return lookupLabel('aufgabe', 'tageszeitfenster', "mittags") ?? "Mittags"; } }, { key: "abends", get label() { return lookupLabel('aufgabe', 'tageszeitfenster', "abends") ?? "Abends"; } }, { key: "egal", get label() { return lookupLabel('aufgabe', 'tageszeitfenster', "egal") ?? "Egal"; } }],
    status: [{ key: "vorschlag", get label() { return lookupLabel('aufgabe', 'status', "vorschlag") ?? "Vorschlag"; } }, { key: "offen", get label() { return lookupLabel('aufgabe', 'status', "offen") ?? "Offen"; } }, { key: "erledigt", get label() { return lookupLabel('aufgabe', 'status', "erledigt") ?? "Erledigt"; } }, { key: "nicht_durchgefuehrt", get label() { return lookupLabel('aufgabe', 'status', "nicht_durchgefuehrt") ?? "Nicht durchgeführt"; } }, { key: "wartet_auf_dritte", get label() { return lookupLabel('aufgabe', 'status', "wartet_auf_dritte") ?? "Wartet auf Dritte"; } }, { key: "verworfen", get label() { return lookupLabel('aufgabe', 'status', "verworfen") ?? "Verworfen"; } }],
    ergebnis: [{ key: "erfolgreich", get label() { return lookupLabel('aufgabe', 'ergebnis', "erfolgreich") ?? "Erfolgreich"; } }, { key: "mit_schwierigkeiten", get label() { return lookupLabel('aufgabe', 'ergebnis', "mit_schwierigkeiten") ?? "Mit Schwierigkeiten"; } }, { key: "nicht_erfolgreich", get label() { return lookupLabel('aufgabe', 'ergebnis', "nicht_erfolgreich") ?? "Nicht erfolgreich"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'qualifikationsart': {
    'bezeichnung': 'string/text',
    'beschreibung': 'string/textarea',
    'nachweis_erforderlich': 'bool',
    'aktiv': 'bool',
  },
  'personentyp': {
    'bezeichnung': 'string/text',
    'beschreibung': 'string/textarea',
    'systemrolle': 'lookup/select',
    'darf_betreuen': 'bool',
    'hat_zugang': 'bool',
    'erforderliche_qualifikationsarten': 'multipleapplookup/select',
    'aktiv': 'bool',
  },
  'person': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'personentyp': 'applookup/select',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'land': 'string/text',
    'koordinaten': 'geo',
    'geocoding_status': 'lookup/select',
    'email': 'string/email',
    'telefon': 'string/tel',
    'mobil': 'string/tel',
    'benutzerkonto': 'string/text',
    'aktiv_von': 'date/date',
    'aktiv_bis': 'date/date',
    'bemerkung': 'string/textarea',
    'aktiv': 'bool',
  },
  'qualifikation_einer_person': {
    'person': 'applookup/select',
    'qualifikationsart': 'applookup/select',
    'nachweis': 'file',
    'erworben_am': 'date/date',
    'gueltig_bis': 'date/date',
    'geprueft_von': 'applookup/select',
    'geprueft_am': 'date/date',
  },
  'betreute_person': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'geburtsdatum': 'date/date',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'land': 'string/text',
    'koordinaten': 'geo',
    'geocoding_status': 'lookup/select',
    'einrichtung': 'string/text',
    'zimmer': 'string/text',
    'zugangshinweise': 'string/textarea',
    'betreuungsbeginn': 'date/date',
    'betreuungsende': 'date/date',
    'status': 'lookup/radio',
    'allergien': 'string/textarea',
    'wichtige_hinweise': 'string/text',
    'hausarzt': 'applookup/select',
    'ansprechperson': 'applookup/select',
    'beziehung_ansprechperson': 'string/text',
    'ersatz_ansprechperson': 'applookup/select',
    'aktiv': 'bool',
  },
  'diagnose': {
    'betreute_person': 'applookup/select',
    'bezeichnung': 'string/text',
    'icd_code': 'string/text',
    'festgestellt_von': 'applookup/select',
    'gueltig_ab': 'date/date',
    'gueltig_bis': 'date/date',
    'bemerkung': 'string/textarea',
    'aktiv': 'bool',
  },
  'medikationsplan': {
    'betreute_person': 'applookup/select',
    'medikament': 'string/text',
    'dosierung': 'string/text',
    'rhythmus': 'string/text',
    'gueltig_ab': 'date/date',
    'gueltig_bis': 'date/date',
    'verordnet_von': 'applookup/select',
    'quelle': 'file',
    'begruendung': 'string/textarea',
    'aktiv': 'bool',
  },
  'massnahme_(pflegeplan)': {
    'betreute_person': 'applookup/select',
    'bezeichnung': 'string/text',
    'massnahmenart': 'lookup/select',
    'beschreibung': 'string/textarea',
    'wiederholungsregel': 'lookup/select',
    'intervall_tage': 'number',
    'wochentage': 'multiplelookup/checkbox',
    'tageszeitfenster': 'lookup/select',
    'gueltig_ab': 'date/date',
    'gueltig_bis': 'date/date',
    'mindestqualifikation': 'applookup/select',
    'verordnet_von': 'applookup/select',
    'aktiv': 'bool',
  },
  'besuch': {
    'betreute_person': 'applookup/select',
    'betreuungsperson': 'applookup/select',
    'beginn': 'date/datetimeminute',
    'ende': 'date/datetimeminute',
    'status': 'lookup/select',
    'einstieg': 'lookup/radio',
    'als_vertretung': 'bool',
    'geraet': 'string/text',
  },
  'ereignisprotokoll': {
    'zeitstempel': 'date/datetimeminute',
    'akteur_typ': 'lookup/radio',
    'akteur': 'applookup/select',
    'aktion': 'string/text',
    'objekttyp': 'string/text',
    'objekt_id': 'string/text',
    'betreute_person': 'applookup/select',
    'vorher_wert': 'string/textarea',
    'nachher_wert': 'string/textarea',
    'geraet': 'string/text',
  },
  'betreuungszuordnung': {
    'vertretung_fuer': 'applookup/select',
    'betreute_person': 'applookup/select',
    'betreuungsperson': 'applookup/select',
    'rolle': 'lookup/radio',
    'gueltig_ab': 'date/date',
    'gueltig_bis': 'date/date',
    'beauftragt_durch': 'applookup/select',
    'beauftragt_durch_organisation': 'string/text',
    'ausfall_von': 'date/date',
    'ausfall_bis': 'date/date',
    'manuell_aktiviert': 'bool',
    'bemerkung': 'string/textarea',
    'aktiv': 'bool',
    'beauftragt_am': 'date/date',
  },
  'dokumentation': {
    'besuch': 'applookup/select',
    'betreute_person': 'applookup/select',
    'autor': 'applookup/select',
    'text': 'string/textarea',
    'eingabeart': 'lookup/radio',
    'gespeichert_am': 'date/datetimeminute',
    'erfasst_am': 'date/datetimeminute',
    'ki_analysestatus': 'lookup/select',
    'ergaenzung_zu': 'applookup/select',
  },
  'anhang_zur_dokumentation': {
    'datei': 'file',
    'typ': 'lookup/radio',
    'aufgenommen_am': 'date/datetimeminute',
    'aufgenommen_von': 'applookup/select',
    'beschriftung': 'string/text',
    'dokumentation': 'applookup/select',
  },
  'ki_extrakt': {
    'dokumentation': 'applookup/select',
    'kategorie': 'lookup/select',
    'inhalt': 'string/text',
    'belegstelle': 'string/textarea',
    'belegstelle_position': 'string/text',
    'zeitangabe_rohtext': 'string/text',
    'zeitangabe_datum': 'date/date',
    'status': 'lookup/radio',
    'modellbezeichnung': 'string/text',
    'promptversion': 'string/text',
  },
  'aufgabe': {
    'betreute_person': 'applookup/select',
    'titel': 'string/text',
    'beschreibung': 'string/textarea',
    'aufgabenart': 'lookup/select',
    'herkunft': 'lookup/radio',
    'quelle_massnahme': 'applookup/select',
    'prioritaet': 'lookup/radio',
    'zustaendig': 'applookup/select',
    'faelligkeitsart': 'lookup/select',
    'faelligkeitsdatum': 'date/date',
    'tageszeitfenster': 'lookup/select',
    'mindestqualifikation': 'applookup/select',
    'status': 'lookup/select',
    'nicht_durchgefuehrt_grund': 'string/text',
    'wartet_auf_person': 'applookup/select',
    'verworfen_grund': 'string/text',
    'ergebnis': 'lookup/radio',
    'ergebniskommentar': 'string/textarea',
    'vorgeschlagen_am': 'date/datetimeminute',
    'vorgeschlagen_von': 'applookup/select',
    'aktiviert_am': 'date/datetimeminute',
    'aktiviert_von': 'applookup/select',
    'zugeordnet_am': 'date/datetimeminute',
    'zugeordnet_von': 'applookup/select',
    'begonnen_am': 'date/datetimeminute',
    'begonnen_von': 'applookup/select',
    'erledigt_am': 'date/datetimeminute',
    'erledigt_von': 'applookup/select',
    'verworfen_am': 'date/datetimeminute',
    'verworfen_von': 'applookup/select',
    'quelle_ki_extrakt': 'applookup/select',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
  'qualifikationsart': [
    { field: 'erforderliche_qualifikationsarten', entity: 'personentyp' },
    { field: 'qualifikationsart', entity: 'qualifikation_einer_person' },
    { field: 'mindestqualifikation', entity: 'massnahme_(pflegeplan)' },
    { field: 'mindestqualifikation', entity: 'aufgabe' },
  ],
  'person': [
    { field: 'person', entity: 'qualifikation_einer_person' },
    { field: 'geprueft_von', entity: 'qualifikation_einer_person' },
    { field: 'hausarzt', entity: 'betreute_person' },
    { field: 'ansprechperson', entity: 'betreute_person' },
    { field: 'ersatz_ansprechperson', entity: 'betreute_person' },
    { field: 'festgestellt_von', entity: 'diagnose' },
    { field: 'verordnet_von', entity: 'medikationsplan' },
    { field: 'verordnet_von', entity: 'massnahme_(pflegeplan)' },
    { field: 'betreuungsperson', entity: 'besuch' },
    { field: 'akteur', entity: 'ereignisprotokoll' },
    { field: 'betreuungsperson', entity: 'betreuungszuordnung' },
    { field: 'beauftragt_durch', entity: 'betreuungszuordnung' },
    { field: 'autor', entity: 'dokumentation' },
    { field: 'aufgenommen_von', entity: 'anhang_zur_dokumentation' },
    { field: 'zustaendig', entity: 'aufgabe' },
    { field: 'wartet_auf_person', entity: 'aufgabe' },
    { field: 'vorgeschlagen_von', entity: 'aufgabe' },
    { field: 'aktiviert_von', entity: 'aufgabe' },
    { field: 'zugeordnet_von', entity: 'aufgabe' },
    { field: 'begonnen_von', entity: 'aufgabe' },
    { field: 'erledigt_von', entity: 'aufgabe' },
    { field: 'verworfen_von', entity: 'aufgabe' },
  ],
  'betreute_person': [
    { field: 'betreute_person', entity: 'diagnose' },
    { field: 'betreute_person', entity: 'medikationsplan' },
    { field: 'betreute_person', entity: 'massnahme_(pflegeplan)' },
    { field: 'betreute_person', entity: 'besuch' },
    { field: 'betreute_person', entity: 'ereignisprotokoll' },
    { field: 'betreute_person', entity: 'betreuungszuordnung' },
    { field: 'betreute_person', entity: 'dokumentation' },
    { field: 'betreute_person', entity: 'aufgabe' },
  ],
};

// Aliases for the pre-0.0.279 app keys (see 4c).
LOOKUP_OPTIONS['maßnahme_(pflegeplan)'] = LOOKUP_OPTIONS['massnahme_(pflegeplan)'];
FIELD_TYPES['maßnahme_(pflegeplan)'] = FIELD_TYPES['massnahme_(pflegeplan)'];

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateQualifikationsart = StripLookup<Qualifikationsart['fields']>;
export type CreatePersonentyp = StripLookup<Personentyp['fields']>;
export type CreatePerson = StripLookup<Person['fields']>;
export type CreateQualifikationEinerPerson = StripLookup<QualifikationEinerPerson['fields']>;
export type CreateBetreutePerson = StripLookup<BetreutePerson['fields']>;
export type CreateDiagnose = StripLookup<Diagnose['fields']>;
export type CreateMedikationsplan = StripLookup<Medikationsplan['fields']>;
export type CreateMassnahmePflegeplan = StripLookup<MassnahmePflegeplan['fields']>;
export type CreateBesuch = StripLookup<Besuch['fields']>;
export type CreateEreignisprotokoll = StripLookup<Ereignisprotokoll['fields']>;
export type CreateBetreuungszuordnung = StripLookup<Betreuungszuordnung['fields']>;
export type CreateDokumentation = StripLookup<Dokumentation['fields']>;
export type CreateAnhangZurDokumentation = StripLookup<AnhangZurDokumentation['fields']>;
export type CreateKiExtrakt = StripLookup<KiExtrakt['fields']>;
export type CreateAufgabe = StripLookup<Aufgabe['fields']>;