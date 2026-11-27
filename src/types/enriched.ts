import type { AnhangZurDokumentation, Aufgabe, Besuch, BetreutePerson, Betreuungszuordnung, Diagnose, Dokumentation, Ereignisprotokoll, KiExtrakt, MassnahmePflegeplan, Medikationsplan, Person, Personentyp, QualifikationEinerPerson } from './app';

export type EnrichedPersonentyp = Personentyp & {
  erforderliche_qualifikationsartenName: string;
};

export type EnrichedPerson = Person & {
  personentypName: string;
};

export type EnrichedQualifikationEinerPerson = QualifikationEinerPerson & {
  personName: string;
  qualifikationsartName: string;
  geprueft_vonName: string;
};

export type EnrichedBetreutePerson = BetreutePerson & {
  hausarztName: string;
  ansprechpersonName: string;
  ersatz_ansprechpersonName: string;
};

export type EnrichedDiagnose = Diagnose & {
  betreute_personName: string;
  festgestellt_vonName: string;
};

export type EnrichedMedikationsplan = Medikationsplan & {
  betreute_personName: string;
  verordnet_vonName: string;
};

export type EnrichedMassnahmePflegeplan = MassnahmePflegeplan & {
  betreute_personName: string;
  mindestqualifikationName: string;
  verordnet_vonName: string;
};

export type EnrichedBesuch = Besuch & {
  betreute_personName: string;
  betreuungspersonName: string;
};

export type EnrichedEreignisprotokoll = Ereignisprotokoll & {
  akteurName: string;
  betreute_personName: string;
};

export type EnrichedBetreuungszuordnung = Betreuungszuordnung & {
  vertretung_fuerName: string;
  betreute_personName: string;
  betreuungspersonName: string;
  beauftragt_durchName: string;
};

export type EnrichedDokumentation = Dokumentation & {
  besuchName: string;
  betreute_personName: string;
  autorName: string;
  ergaenzung_zuName: string;
};

export type EnrichedAnhangZurDokumentation = AnhangZurDokumentation & {
  aufgenommen_vonName: string;
  dokumentationName: string;
};

export type EnrichedKiExtrakt = KiExtrakt & {
  dokumentationName: string;
};

export type EnrichedAufgabe = Aufgabe & {
  betreute_personName: string;
  quelle_massnahmeName: string;
  zustaendigName: string;
  mindestqualifikationName: string;
  wartet_auf_personName: string;
  vorgeschlagen_vonName: string;
  aktiviert_vonName: string;
  zugeordnet_vonName: string;
  begonnen_vonName: string;
  erledigt_vonName: string;
  verworfen_vonName: string;
  quelle_ki_extraktName: string;
};
