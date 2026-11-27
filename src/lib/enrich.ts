import type { EnrichedAnhangZurDokumentation, EnrichedAufgabe, EnrichedBesuch, EnrichedBetreutePerson, EnrichedBetreuungszuordnung, EnrichedDiagnose, EnrichedDokumentation, EnrichedEreignisprotokoll, EnrichedKiExtrakt, EnrichedMassnahmePflegeplan, EnrichedMedikationsplan, EnrichedPerson, EnrichedPersonentyp, EnrichedQualifikationEinerPerson } from '@/types/enriched';
import type { AnhangZurDokumentation, Aufgabe, Besuch, BetreutePerson, Betreuungszuordnung, Diagnose, Dokumentation, Ereignisprotokoll, KiExtrakt, MassnahmePflegeplan, Medikationsplan, Person, Personentyp, QualifikationEinerPerson, Qualifikationsart } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import { displayPart } from '@/lib/journey/rules';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => displayPart(r.fields[f])).filter(Boolean).join(' ').trim();
}

interface PersonentypMaps {
  qualifikationsartMap: Map<string, Qualifikationsart>;
}

export function enrichPersonentyp(
  personentyp: Personentyp[],
  maps: PersonentypMaps
): EnrichedPersonentyp[] {
  return personentyp.map(r => ({
    ...r,
    erforderliche_qualifikationsartenName: resolveDisplay(r.fields.erforderliche_qualifikationsarten, maps.qualifikationsartMap, 'bezeichnung'),
  }));
}

interface PersonMaps {
  personentypMap: Map<string, Personentyp>;
}

export function enrichPerson(
  person: Person[],
  maps: PersonMaps
): EnrichedPerson[] {
  return person.map(r => ({
    ...r,
    personentypName: resolveDisplay(r.fields.personentyp, maps.personentypMap, 'bezeichnung'),
  }));
}

interface QualifikationEinerPersonMaps {
  personMap: Map<string, Person>;
  qualifikationsartMap: Map<string, Qualifikationsart>;
}

export function enrichQualifikationEinerPerson(
  qualifikationEinerPerson: QualifikationEinerPerson[],
  maps: QualifikationEinerPersonMaps
): EnrichedQualifikationEinerPerson[] {
  return qualifikationEinerPerson.map(r => ({
    ...r,
    personName: resolveDisplay(r.fields.person, maps.personMap, 'vorname', 'nachname'),
    qualifikationsartName: resolveDisplay(r.fields.qualifikationsart, maps.qualifikationsartMap, 'bezeichnung'),
    geprueft_vonName: resolveDisplay(r.fields.geprueft_von, maps.personMap, 'vorname', 'nachname'),
  }));
}

interface BetreutePersonMaps {
  personMap: Map<string, Person>;
}

export function enrichBetreutePerson(
  betreutePerson: BetreutePerson[],
  maps: BetreutePersonMaps
): EnrichedBetreutePerson[] {
  return betreutePerson.map(r => ({
    ...r,
    hausarztName: resolveDisplay(r.fields.hausarzt, maps.personMap, 'vorname', 'nachname'),
    ansprechpersonName: resolveDisplay(r.fields.ansprechperson, maps.personMap, 'vorname', 'nachname'),
    ersatz_ansprechpersonName: resolveDisplay(r.fields.ersatz_ansprechperson, maps.personMap, 'vorname', 'nachname'),
  }));
}

interface DiagnoseMaps {
  betreutePersonMap: Map<string, BetreutePerson>;
  personMap: Map<string, Person>;
}

export function enrichDiagnose(
  diagnose: Diagnose[],
  maps: DiagnoseMaps
): EnrichedDiagnose[] {
  return diagnose.map(r => ({
    ...r,
    betreute_personName: resolveDisplay(r.fields.betreute_person, maps.betreutePersonMap, 'vorname', 'nachname'),
    festgestellt_vonName: resolveDisplay(r.fields.festgestellt_von, maps.personMap, 'vorname', 'nachname'),
  }));
}

interface MedikationsplanMaps {
  betreutePersonMap: Map<string, BetreutePerson>;
  personMap: Map<string, Person>;
}

export function enrichMedikationsplan(
  medikationsplan: Medikationsplan[],
  maps: MedikationsplanMaps
): EnrichedMedikationsplan[] {
  return medikationsplan.map(r => ({
    ...r,
    betreute_personName: resolveDisplay(r.fields.betreute_person, maps.betreutePersonMap, 'vorname', 'nachname'),
    verordnet_vonName: resolveDisplay(r.fields.verordnet_von, maps.personMap, 'vorname', 'nachname'),
  }));
}

interface MassnahmePflegeplanMaps {
  betreutePersonMap: Map<string, BetreutePerson>;
  qualifikationsartMap: Map<string, Qualifikationsart>;
  personMap: Map<string, Person>;
}

export function enrichMassnahmePflegeplan(
  massnahmePflegeplan: MassnahmePflegeplan[],
  maps: MassnahmePflegeplanMaps
): EnrichedMassnahmePflegeplan[] {
  return massnahmePflegeplan.map(r => ({
    ...r,
    betreute_personName: resolveDisplay(r.fields.betreute_person, maps.betreutePersonMap, 'vorname', 'nachname'),
    mindestqualifikationName: resolveDisplay(r.fields.mindestqualifikation, maps.qualifikationsartMap, 'bezeichnung'),
    verordnet_vonName: resolveDisplay(r.fields.verordnet_von, maps.personMap, 'vorname', 'nachname'),
  }));
}

interface BesuchMaps {
  betreutePersonMap: Map<string, BetreutePerson>;
  personMap: Map<string, Person>;
}

export function enrichBesuch(
  besuch: Besuch[],
  maps: BesuchMaps
): EnrichedBesuch[] {
  return besuch.map(r => ({
    ...r,
    betreute_personName: resolveDisplay(r.fields.betreute_person, maps.betreutePersonMap, 'vorname', 'nachname'),
    betreuungspersonName: resolveDisplay(r.fields.betreuungsperson, maps.personMap, 'vorname', 'nachname'),
  }));
}

interface EreignisprotokollMaps {
  personMap: Map<string, Person>;
  betreutePersonMap: Map<string, BetreutePerson>;
}

export function enrichEreignisprotokoll(
  ereignisprotokoll: Ereignisprotokoll[],
  maps: EreignisprotokollMaps
): EnrichedEreignisprotokoll[] {
  return ereignisprotokoll.map(r => ({
    ...r,
    akteurName: resolveDisplay(r.fields.akteur, maps.personMap, 'vorname', 'nachname'),
    betreute_personName: resolveDisplay(r.fields.betreute_person, maps.betreutePersonMap, 'vorname', 'nachname'),
  }));
}

interface BetreuungszuordnungMaps {
  betreuungszuordnungMap: Map<string, Betreuungszuordnung>;
  betreutePersonMap: Map<string, BetreutePerson>;
  personMap: Map<string, Person>;
}

export function enrichBetreuungszuordnung(
  betreuungszuordnung: Betreuungszuordnung[],
  maps: BetreuungszuordnungMaps
): EnrichedBetreuungszuordnung[] {
  return betreuungszuordnung.map(r => ({
    ...r,
    vertretung_fuerName: resolveDisplay(r.fields.vertretung_fuer, maps.betreuungszuordnungMap, 'beauftragt_durch_organisation'),
    betreute_personName: resolveDisplay(r.fields.betreute_person, maps.betreutePersonMap, 'vorname', 'nachname'),
    betreuungspersonName: resolveDisplay(r.fields.betreuungsperson, maps.personMap, 'vorname', 'nachname'),
    beauftragt_durchName: resolveDisplay(r.fields.beauftragt_durch, maps.personMap, 'vorname', 'nachname'),
  }));
}

interface DokumentationMaps {
  besuchMap: Map<string, Besuch>;
  betreutePersonMap: Map<string, BetreutePerson>;
  personMap: Map<string, Person>;
  dokumentationMap: Map<string, Dokumentation>;
}

export function enrichDokumentation(
  dokumentation: Dokumentation[],
  maps: DokumentationMaps
): EnrichedDokumentation[] {
  return dokumentation.map(r => ({
    ...r,
    besuchName: resolveDisplay(r.fields.besuch, maps.besuchMap, 'geraet'),
    betreute_personName: resolveDisplay(r.fields.betreute_person, maps.betreutePersonMap, 'vorname', 'nachname'),
    autorName: resolveDisplay(r.fields.autor, maps.personMap, 'vorname', 'nachname'),
    ergaenzung_zuName: resolveDisplay(r.fields.ergaenzung_zu, maps.dokumentationMap, 'text'),
  }));
}

interface AnhangZurDokumentationMaps {
  personMap: Map<string, Person>;
  dokumentationMap: Map<string, Dokumentation>;
}

export function enrichAnhangZurDokumentation(
  anhangZurDokumentation: AnhangZurDokumentation[],
  maps: AnhangZurDokumentationMaps
): EnrichedAnhangZurDokumentation[] {
  return anhangZurDokumentation.map(r => ({
    ...r,
    aufgenommen_vonName: resolveDisplay(r.fields.aufgenommen_von, maps.personMap, 'vorname', 'nachname'),
    dokumentationName: resolveDisplay(r.fields.dokumentation, maps.dokumentationMap, 'text'),
  }));
}

interface KiExtraktMaps {
  dokumentationMap: Map<string, Dokumentation>;
}

export function enrichKiExtrakt(
  kiExtrakt: KiExtrakt[],
  maps: KiExtraktMaps
): EnrichedKiExtrakt[] {
  return kiExtrakt.map(r => ({
    ...r,
    dokumentationName: resolveDisplay(r.fields.dokumentation, maps.dokumentationMap, 'text'),
  }));
}

interface AufgabeMaps {
  betreutePersonMap: Map<string, BetreutePerson>;
  massnahmePflegeplanMap: Map<string, MassnahmePflegeplan>;
  personMap: Map<string, Person>;
  qualifikationsartMap: Map<string, Qualifikationsart>;
  kiExtraktMap: Map<string, KiExtrakt>;
}

export function enrichAufgabe(
  aufgabe: Aufgabe[],
  maps: AufgabeMaps
): EnrichedAufgabe[] {
  return aufgabe.map(r => ({
    ...r,
    betreute_personName: resolveDisplay(r.fields.betreute_person, maps.betreutePersonMap, 'vorname', 'nachname'),
    quelle_massnahmeName: resolveDisplay(r.fields.quelle_massnahme, maps.massnahmePflegeplanMap, 'bezeichnung'),
    zustaendigName: resolveDisplay(r.fields.zustaendig, maps.personMap, 'vorname', 'nachname'),
    mindestqualifikationName: resolveDisplay(r.fields.mindestqualifikation, maps.qualifikationsartMap, 'bezeichnung'),
    wartet_auf_personName: resolveDisplay(r.fields.wartet_auf_person, maps.personMap, 'vorname', 'nachname'),
    vorgeschlagen_vonName: resolveDisplay(r.fields.vorgeschlagen_von, maps.personMap, 'vorname', 'nachname'),
    aktiviert_vonName: resolveDisplay(r.fields.aktiviert_von, maps.personMap, 'vorname', 'nachname'),
    zugeordnet_vonName: resolveDisplay(r.fields.zugeordnet_von, maps.personMap, 'vorname', 'nachname'),
    begonnen_vonName: resolveDisplay(r.fields.begonnen_von, maps.personMap, 'vorname', 'nachname'),
    erledigt_vonName: resolveDisplay(r.fields.erledigt_von, maps.personMap, 'vorname', 'nachname'),
    verworfen_vonName: resolveDisplay(r.fields.verworfen_von, maps.personMap, 'vorname', 'nachname'),
    quelle_ki_extraktName: resolveDisplay(r.fields.quelle_ki_extrakt, maps.kiExtraktMap, 'inhalt'),
  }));
}
