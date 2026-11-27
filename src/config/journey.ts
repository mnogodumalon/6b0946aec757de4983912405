/**
 * Occupancy semantics — DECIDED BY THE PLAN when it has a no_overlap check
 * (rendered below, generator-owned), else by the build agent, never by a
 * heuristic. Without a plan the Phase-2 orchestrator writes its decision to
 * `.intents-staging/occupancy.json` (stay pair, booked resource, statuses
 * that do not occupy); the integration step validates it against the app
 * metadata and renders it into the block below. Do not edit outside the markers.
 *
 * Both doors read this and nothing else: `occupancyFor` (internal flows AND
 * public pages) and the owner service (the public grant's occupancy read).
 * No rule for an entity = no availability calendar, no occupancy claim —
 * a plain date field pair is shown instead.
 *
 * Facts from the metadata — candidates, NOT decisions:
 *   - qualifikationsart: no date pair, no references
 *   - personentyp: applookups erforderliche_qualifikationsarten→qualifikationsart · lookups systemrolle[betreuungsperson|pflegedienstleitung|verwaltung|administrator|extern]
 *   - person: date pairs aktiv_von+aktiv_bis · applookups personentyp→personentyp · lookups geocoding_status[ok|fehlgeschlagen|ausstehend]
 *   - qualifikation_einer_person: applookups person→person, qualifikationsart→qualifikationsart, geprueft_von→person
 *   - betreute_person: applookups hausarzt→person, ansprechperson→person, ersatz_ansprechperson→person · lookups geocoding_status[ok|fehlgeschlagen|ausstehend], status[aktiv|pausiert|beendet]
 *   - diagnose: applookups betreute_person→betreute_person, festgestellt_von→person
 *   - medikationsplan: applookups betreute_person→betreute_person, verordnet_von→person
 *   - massnahme_(pflegeplan): applookups betreute_person→betreute_person, mindestqualifikation→qualifikationsart, verordnet_von→person · lookups massnahmenart[koerperpflege|mobilisation|medikamentengabe|ernaehrung|vitalzeichen|haushalt|sonstiges], wiederholungsregel[einmalig|taeglich|jeden_nten_tag|wochentage], tageszeitfenster[morgens|mittags|abends|egal]
 *   - besuch: date pairs beginn+ende · applookups betreute_person→betreute_person, betreuungsperson→person · lookups status[laufend|abgeschlossen|nicht_ordnungsgemaess_beendet], einstieg[standort|liste]
 *   - ereignisprotokoll: applookups akteur→person, betreute_person→betreute_person · lookups akteur_typ[person|system|ki]
 *   - betreuungszuordnung: date pairs ausfall_von+ausfall_bis · applookups vertretung_fuer→betreuungszuordnung, betreute_person→betreute_person, betreuungsperson→person, beauftragt_durch→person · lookups rolle[hauptbetreuung|vertretung]
 *   - dokumentation: applookups besuch→besuch, betreute_person→betreute_person, autor→person, ergaenzung_zu→dokumentation · lookups eingabeart[diktiert|getippt], ki_analysestatus[ausstehend|fertig|fehlgeschlagen]
 *   - anhang_zur_dokumentation: applookups aufgenommen_von→person, dokumentation→dokumentation · lookups typ[foto|dokument]
 *   - ki_extrakt: applookups dokumentation→dokumentation · lookups kategorie[allgemeinzustand|schwierigkeit|entscheidung|durchgefuehrtes|medikationshinweis|besorgung|behoerde_recht|arzt_verstaendigen|vermerk_naechster_besuch|dringlichkeit], status[neu|bestaetigt|verworfen]
 *   - aufgabe: applookups betreute_person→betreute_person, quelle_massnahme→massnahme_(pflegeplan), zustaendig→person, mindestqualifikation→qualifikationsart, wartet_auf_person→person, vorgeschlagen_von→person, aktiviert_von→person, zugeordnet_von→person, begonnen_von→person, erledigt_von→person, verworfen_von→person, quelle_ki_extrakt→ki_extrakt · lookups aufgabenart[pflegemassnahme|allgemeinzustand|medikation_klaeren|besorgung|behoerde_recht|arzt_verstaendigen|vermerk_naechster_besuch|sonstiges], herkunft[pflegeplan|manuell|ki_vorschlag], prioritaet[normal|dringend], faelligkeitsart[naechster_besuch|datum|tageszeitfenster], tageszeitfenster[morgens|mittags|abends|egal], status[vorschlag|offen|erledigt|nicht_durchgefuehrt|wartet_auf_dritte|verworfen], ergebnis[erfolgreich|mit_schwierigkeiten|nicht_erfolgreich]
 */
import type { EntityKey } from '@/lib/journey/rules';

export interface OccupancyRule {
  /** Arrival / departure fields (the departure day is exclusive). */
  from: string;
  to: string;
  /** applookup field naming the booked RESOURCE (room, vehicle, court).
   *  Omit when the entity itself is the one resource (a single holiday flat). */
  resource?: string;
  /** lookup field + the keys that mean "does NOT occupy" (cancelled, no-show). */
  statusField?: string;
  freeKeys?: string[];
}

export const OCCUPANCY: Partial<Record<EntityKey, OccupancyRule>> = {
  // <custom:occupancy>
  // decided by the plan (its no_overlap checks) — generator-owned, the build agent's decision is ignored
  betreuungszuordnung: { from: 'gueltig_ab', to: 'gueltig_bis', resource: 'betreute_person', statusField: 'rolle', freeKeys: ['vertretung'] },
  // </custom:occupancy>
};

/**
 * A record of the KEY entity is TAKEN while a record of `entity` points at it
 * through `field` — a slot with a booking, a seat with a ticket. Generated
 * from the plan's blocking `unique` check on that reference (05.10.2026:
 * the salon's public page offered booked slots again). Pickers on both
 * doors leave taken records out (useRecordSearch); a public page reads only
 * `field` of `entity` — never who booked. Generator-owned: no markers.
 */
export interface TakenRule {
  entity: EntityKey;
  field: string;
}

export const TAKEN_BY: Partial<Record<EntityKey, TakenRule>> = {
};
