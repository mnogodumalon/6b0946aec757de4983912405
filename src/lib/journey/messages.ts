/**
 * Required-field messages — WRITTEN BY THE BUILD AGENT, never by a heuristic.
 *
 * The layer knows two things about an empty required field: that it is
 * required and what its label is. Out of that it can only say „„Anreise" ist
 * ein Pflichtfeld". What the person should do instead („Bitte einen Gast
 * auswählen.") is meaning, and meaning is the agent's: the Phase-2 orchestrator
 * writes one short instruction per required field — what is needed, not why — to
 * `.intents-staging/messages.json`, the integration step validates it against
 * the app metadata and renders it into the block below. Scaffold updates keep
 * the block. Do not edit outside the markers.
 *
 * Every door reads this and nothing else: `useStepForm` (flows and public
 * pages), the generated {Entity}Dialog and the public form's server-error line.
 * A field without a sentence falls back to the label sentence — never to a
 * bare „Dieses Feld ist erforderlich".
 *
 * Required fields per entity (from the base view):
 *   - qualifikationsart: bezeichnung (Bezeichnung)
 *   - personentyp: bezeichnung (Bezeichnung), systemrolle (Systemrolle)
 *   - person: vorname (Vorname), nachname (Nachname), personentyp (Personentyp)
 *   - qualifikation_einer_person: person (Person), qualifikationsart (Qualifikationsart)
 *   - betreute_person: vorname (Vorname), nachname (Nachname), geburtsdatum (Geburtsdatum), status (Status)
 *   - diagnose: betreute_person (Betreute Person), bezeichnung (Bezeichnung)
 *   - medikationsplan: betreute_person (Betreute Person), medikament (Medikament)
 *   - massnahme_(pflegeplan): betreute_person (Betreute Person), bezeichnung (Bezeichnung), wiederholungsregel (Wiederholungsregel)
 *   - besuch: betreute_person (Betreute Person), betreuungsperson (Betreuungsperson), beginn (Beginn), status (Status)
 *   - ereignisprotokoll: zeitstempel (Zeitstempel (Server, UTC)), akteur_typ (Akteurstyp), aktion (Aktion)
 *   - betreuungszuordnung: betreute_person (Betreute Person), betreuungsperson (Betreuungsperson), rolle (Rolle), gueltig_ab (Gültig ab)
 *   - dokumentation: besuch (Besuch), betreute_person (Betreute Person), autor (Autor), text (Text (Original)), eingabeart (Eingabeart)
 *   - anhang_zur_dokumentation: typ (Typ), dokumentation (Dokumentation)
 *   - ki_extrakt: dokumentation (Dokumentation), kategorie (Kategorie), inhalt (Inhalt (Kurztext)), belegstelle (Belegstelle (wörtlich)), status (Status)
 *   - aufgabe: betreute_person (Betreute Person), titel (Titel), aufgabenart (Aufgabenart), herkunft (Herkunft), prioritaet (Priorität), status (Status)
 */
import { t, tx } from '@/i18n';
import { labelOf, type EntityKey } from './rules';

/** The writable fields of each entity — the keys a message may address (generated). */
export interface MessageFields {
  "qualifikationsart": "bezeichnung" | "beschreibung" | "nachweis_erforderlich" | "aktiv";
  "personentyp": "bezeichnung" | "beschreibung" | "systemrolle" | "darf_betreuen" | "hat_zugang" | "erforderliche_qualifikationsarten" | "aktiv";
  "person": "vorname" | "nachname" | "personentyp" | "strasse" | "hausnummer" | "plz" | "ort" | "land" | "koordinaten" | "geocoding_status" | "email" | "telefon" | "mobil" | "benutzerkonto" | "aktiv_von" | "aktiv_bis" | "bemerkung" | "aktiv";
  "qualifikation_einer_person": "person" | "qualifikationsart" | "erworben_am" | "gueltig_bis" | "geprueft_von" | "geprueft_am";
  "betreute_person": "vorname" | "nachname" | "geburtsdatum" | "strasse" | "hausnummer" | "plz" | "ort" | "land" | "koordinaten" | "geocoding_status" | "einrichtung" | "zimmer" | "zugangshinweise" | "betreuungsbeginn" | "betreuungsende" | "status" | "allergien" | "wichtige_hinweise" | "hausarzt" | "ansprechperson" | "beziehung_ansprechperson" | "ersatz_ansprechperson" | "aktiv";
  "diagnose": "betreute_person" | "bezeichnung" | "icd_code" | "festgestellt_von" | "gueltig_ab" | "gueltig_bis" | "bemerkung" | "aktiv";
  "medikationsplan": "betreute_person" | "medikament" | "dosierung" | "rhythmus" | "gueltig_ab" | "gueltig_bis" | "verordnet_von" | "begruendung" | "aktiv";
  "massnahme_(pflegeplan)": "betreute_person" | "bezeichnung" | "massnahmenart" | "beschreibung" | "wiederholungsregel" | "intervall_tage" | "wochentage" | "tageszeitfenster" | "gueltig_ab" | "gueltig_bis" | "mindestqualifikation" | "verordnet_von" | "aktiv";
  "besuch": "betreute_person" | "betreuungsperson" | "beginn" | "ende" | "status" | "einstieg" | "als_vertretung" | "geraet";
  "ereignisprotokoll": "zeitstempel" | "akteur_typ" | "akteur" | "aktion" | "objekttyp" | "objekt_id" | "betreute_person" | "vorher_wert" | "nachher_wert" | "geraet";
  "betreuungszuordnung": "vertretung_fuer" | "betreute_person" | "betreuungsperson" | "rolle" | "gueltig_ab" | "gueltig_bis" | "beauftragt_durch" | "beauftragt_durch_organisation" | "ausfall_von" | "ausfall_bis" | "manuell_aktiviert" | "bemerkung" | "aktiv" | "beauftragt_am";
  "dokumentation": "besuch" | "betreute_person" | "autor" | "text" | "eingabeart" | "gespeichert_am" | "erfasst_am" | "ki_analysestatus" | "ergaenzung_zu";
  "anhang_zur_dokumentation": "typ" | "aufgenommen_am" | "aufgenommen_von" | "beschriftung" | "dokumentation";
  "ki_extrakt": "dokumentation" | "kategorie" | "inhalt" | "belegstelle" | "belegstelle_position" | "zeitangabe_rohtext" | "zeitangabe_datum" | "status" | "modellbezeichnung" | "promptversion";
  "aufgabe": "betreute_person" | "titel" | "beschreibung" | "aufgabenart" | "herkunft" | "quelle_massnahme" | "prioritaet" | "zustaendig" | "faelligkeitsart" | "faelligkeitsdatum" | "tageszeitfenster" | "mindestqualifikation" | "status" | "nicht_durchgefuehrt_grund" | "wartet_auf_person" | "verworfen_grund" | "ergebnis" | "ergebniskommentar" | "vorgeschlagen_am" | "vorgeschlagen_von" | "aktiviert_am" | "aktiviert_von" | "zugeordnet_am" | "zugeordnet_von" | "begonnen_am" | "begonnen_von" | "erledigt_am" | "erledigt_von" | "verworfen_am" | "verworfen_von" | "quelle_ki_extrakt";
}
export type MessageFieldKey<E extends EntityKey> = E extends keyof MessageFields ? MessageFields[E] : never;

export const REQUIRED_MESSAGES: { [E in EntityKey]?: Partial<Record<MessageFieldKey<E>, string>> } = {
  // <custom:messages>
  qualifikationsart: { bezeichnung: "Bitte eine Bezeichnung eingeben." },
  personentyp: { bezeichnung: "Bitte eine Bezeichnung eingeben.", systemrolle: "Bitte eine Systemrolle wählen." },
  person: { vorname: "Bitte den Vornamen eingeben.", nachname: "Bitte den Nachnamen eingeben.", personentyp: "Bitte einen Personentyp wählen." },
  qualifikation_einer_person: { person: "Bitte eine Person wählen.", qualifikationsart: "Bitte eine Qualifikationsart wählen." },
  betreute_person: { vorname: "Bitte den Vornamen eingeben.", nachname: "Bitte den Nachnamen eingeben.", geburtsdatum: "Bitte das Geburtsdatum wählen.", status: "Bitte einen Status wählen." },
  diagnose: { betreute_person: "Bitte eine betreute Person wählen.", bezeichnung: "Bitte die Diagnose eingeben." },
  medikationsplan: { betreute_person: "Bitte eine betreute Person wählen.", medikament: "Bitte das Medikament eingeben." },
  "massnahme_(pflegeplan)": { betreute_person: "Bitte eine betreute Person wählen.", bezeichnung: "Bitte die Maßnahme eingeben.", wiederholungsregel: "Bitte eine Wiederholung wählen." },
  besuch: { betreute_person: "Bitte eine betreute Person wählen.", betreuungsperson: "Bitte eine Betreuungsperson wählen.", beginn: "Bitte den Beginn wählen.", status: "Bitte einen Status wählen." },
  ereignisprotokoll: { zeitstempel: "Bitte den Zeitpunkt wählen.", akteur_typ: "Bitte den Akteurstyp wählen.", aktion: "Bitte die Aktion eingeben." },
  betreuungszuordnung: { betreute_person: "Bitte eine betreute Person wählen.", betreuungsperson: "Bitte eine Betreuungsperson wählen.", rolle: "Bitte die Rolle wählen.", gueltig_ab: "Bitte das Startdatum wählen." },
  dokumentation: { besuch: "Bitte einen Besuch wählen.", betreute_person: "Bitte eine betreute Person wählen.", autor: "Bitte den Autor wählen.", text: "Bitte den Text diktieren oder tippen.", eingabeart: "Bitte die Eingabeart wählen." },
  anhang_zur_dokumentation: { typ: "Bitte den Typ wählen.", dokumentation: "Bitte eine Dokumentation wählen." },
  ki_extrakt: { dokumentation: "Bitte eine Dokumentation wählen.", kategorie: "Bitte eine Kategorie wählen.", inhalt: "Bitte den Inhalt eingeben.", belegstelle: "Bitte die Belegstelle eingeben.", status: "Bitte einen Status wählen." },
  aufgabe: { betreute_person: "Bitte eine betreute Person wählen.", titel: "Bitte einen Titel eingeben.", aufgabenart: "Bitte die Aufgabenart wählen.", herkunft: "Bitte die Herkunft wählen.", prioritaet: "Bitte die Priorität wählen.", status: "Bitte einen Status wählen." },
  // </custom:messages>
};

/** The sentence shown when `key` of `entity` is required and empty — the
 *  agent's own text (translated at runtime like every page string), else the
 *  label sentence. Call it while rendering, not at module scope. */
export function requiredMessage(entity: EntityKey, key: string): string {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  if (own && own.trim()) return tx(own);
  return t('v_required', { label: labelOf(entity, key) });
}

/** True when the agent wrote a sentence for the field. */
export function hasOwnMessage(entity: EntityKey, key: string): boolean {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  return Boolean(own && own.trim());
}
