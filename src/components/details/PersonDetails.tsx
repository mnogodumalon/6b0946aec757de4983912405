import type { Person, Personentyp, QualifikationEinerPerson, BetreutePerson, Diagnose, Medikationsplan, MassnahmePflegeplan, Besuch, Ereignisprotokoll, Betreuungszuordnung, Dokumentation, AnhangZurDokumentation, Aufgabe } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MapRouteLinks } from '@/components/widgets/MapWidget';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf, displayPart } from '@/lib/journey/rules';

export interface PersonDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Person;
  /** N:1-Ziel „Personentyp": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  personentypList: Personentyp[];
  /** Klick auf die Personentyp-Relation → overlay.push auf dessen Detail. */
  onOpenPersonentyp?: (record: Personentyp) => void;
  /** 1:N „Qualifikation einer Person" (person): VOLLE Liste — der Block filtert auf diesen Record. */
  qualifikationEinerPersonPersonList: QualifikationEinerPerson[];
  /** Zeilen-Klick → overlay.push auf das QualifikationEinerPerson-Detail (nie der Edit-Dialog). */
  onOpenQualifikationEinerPersonPerson: (record: QualifikationEinerPerson) => void;
  /** Kontextuelles „+": öffnet den QualifikationEinerPerson-Dialog mit diesem Record vorgesetzt. */
  onAddQualifikationEinerPersonPerson?: () => void;
  /** 1:N „Qualifikation einer Person" (geprueft_von): VOLLE Liste — der Block filtert auf diesen Record. */
  qualifikationEinerPersonGeprueftVonList: QualifikationEinerPerson[];
  /** Zeilen-Klick → overlay.push auf das QualifikationEinerPerson-Detail (nie der Edit-Dialog). */
  onOpenQualifikationEinerPersonGeprueftVon: (record: QualifikationEinerPerson) => void;
  /** Kontextuelles „+": öffnet den QualifikationEinerPerson-Dialog mit diesem Record vorgesetzt. */
  onAddQualifikationEinerPersonGeprueftVon?: () => void;
  /** 1:N „Betreute Person" (hausarzt): VOLLE Liste — der Block filtert auf diesen Record. */
  betreutePersonHausarztList: BetreutePerson[];
  /** Zeilen-Klick → overlay.push auf das BetreutePerson-Detail (nie der Edit-Dialog). */
  onOpenBetreutePersonHausarzt: (record: BetreutePerson) => void;
  /** Kontextuelles „+": öffnet den BetreutePerson-Dialog mit diesem Record vorgesetzt. */
  onAddBetreutePersonHausarzt?: () => void;
  /** 1:N „Betreute Person" (ansprechperson): VOLLE Liste — der Block filtert auf diesen Record. */
  betreutePersonAnsprechpersonList: BetreutePerson[];
  /** Zeilen-Klick → overlay.push auf das BetreutePerson-Detail (nie der Edit-Dialog). */
  onOpenBetreutePersonAnsprechperson: (record: BetreutePerson) => void;
  /** Kontextuelles „+": öffnet den BetreutePerson-Dialog mit diesem Record vorgesetzt. */
  onAddBetreutePersonAnsprechperson?: () => void;
  /** 1:N „Betreute Person" (ersatz_ansprechperson): VOLLE Liste — der Block filtert auf diesen Record. */
  betreutePersonErsatzAnsprechpersonList: BetreutePerson[];
  /** Zeilen-Klick → overlay.push auf das BetreutePerson-Detail (nie der Edit-Dialog). */
  onOpenBetreutePersonErsatzAnsprechperson: (record: BetreutePerson) => void;
  /** Kontextuelles „+": öffnet den BetreutePerson-Dialog mit diesem Record vorgesetzt. */
  onAddBetreutePersonErsatzAnsprechperson?: () => void;
  /** 1:N „Diagnose" (festgestellt_von): VOLLE Liste — der Block filtert auf diesen Record. */
  diagnoseList: Diagnose[];
  /** Zeilen-Klick → overlay.push auf das Diagnose-Detail (nie der Edit-Dialog). */
  onOpenDiagnose: (record: Diagnose) => void;
  /** Kontextuelles „+": öffnet den Diagnose-Dialog mit diesem Record vorgesetzt. */
  onAddDiagnose?: () => void;
  /** 1:N „Medikationsplan" (verordnet_von): VOLLE Liste — der Block filtert auf diesen Record. */
  medikationsplanList: Medikationsplan[];
  /** Zeilen-Klick → overlay.push auf das Medikationsplan-Detail (nie der Edit-Dialog). */
  onOpenMedikationsplan: (record: Medikationsplan) => void;
  /** Kontextuelles „+": öffnet den Medikationsplan-Dialog mit diesem Record vorgesetzt. */
  onAddMedikationsplan?: () => void;
  /** 1:N „Maßnahme (Pflegeplan)" (verordnet_von): VOLLE Liste — der Block filtert auf diesen Record. */
  massnahmePflegeplanList: MassnahmePflegeplan[];
  /** Zeilen-Klick → overlay.push auf das MassnahmePflegeplan-Detail (nie der Edit-Dialog). */
  onOpenMassnahmePflegeplan: (record: MassnahmePflegeplan) => void;
  /** Kontextuelles „+": öffnet den MassnahmePflegeplan-Dialog mit diesem Record vorgesetzt. */
  onAddMassnahmePflegeplan?: () => void;
  /** 1:N „Besuch" (betreuungsperson): VOLLE Liste — der Block filtert auf diesen Record. */
  besuchList: Besuch[];
  /** Zeilen-Klick → overlay.push auf das Besuch-Detail (nie der Edit-Dialog). */
  onOpenBesuch: (record: Besuch) => void;
  /** Kontextuelles „+": öffnet den Besuch-Dialog mit diesem Record vorgesetzt. */
  onAddBesuch?: () => void;
  /** 1:N „Ereignisprotokoll" (akteur): VOLLE Liste — der Block filtert auf diesen Record. */
  ereignisprotokollList: Ereignisprotokoll[];
  /** Zeilen-Klick → overlay.push auf das Ereignisprotokoll-Detail (nie der Edit-Dialog). */
  onOpenEreignisprotokoll: (record: Ereignisprotokoll) => void;
  /** Kontextuelles „+": öffnet den Ereignisprotokoll-Dialog mit diesem Record vorgesetzt. */
  onAddEreignisprotokoll?: () => void;
  /** 1:N „Betreuungszuordnung" (betreuungsperson): VOLLE Liste — der Block filtert auf diesen Record. */
  betreuungszuordnungBetreuungspersonList: Betreuungszuordnung[];
  /** Zeilen-Klick → overlay.push auf das Betreuungszuordnung-Detail (nie der Edit-Dialog). */
  onOpenBetreuungszuordnungBetreuungsperson: (record: Betreuungszuordnung) => void;
  /** Kontextuelles „+": öffnet den Betreuungszuordnung-Dialog mit diesem Record vorgesetzt. */
  onAddBetreuungszuordnungBetreuungsperson?: () => void;
  /** 1:N „Betreuungszuordnung" (beauftragt_durch): VOLLE Liste — der Block filtert auf diesen Record. */
  betreuungszuordnungBeauftragtDurchList: Betreuungszuordnung[];
  /** Zeilen-Klick → overlay.push auf das Betreuungszuordnung-Detail (nie der Edit-Dialog). */
  onOpenBetreuungszuordnungBeauftragtDurch: (record: Betreuungszuordnung) => void;
  /** Kontextuelles „+": öffnet den Betreuungszuordnung-Dialog mit diesem Record vorgesetzt. */
  onAddBetreuungszuordnungBeauftragtDurch?: () => void;
  /** 1:N „Dokumentation" (autor): VOLLE Liste — der Block filtert auf diesen Record. */
  dokumentationList: Dokumentation[];
  /** Zeilen-Klick → overlay.push auf das Dokumentation-Detail (nie der Edit-Dialog). */
  onOpenDokumentation: (record: Dokumentation) => void;
  /** Kontextuelles „+": öffnet den Dokumentation-Dialog mit diesem Record vorgesetzt. */
  onAddDokumentation?: () => void;
  /** 1:N „Anhang zur Dokumentation" (aufgenommen_von): VOLLE Liste — der Block filtert auf diesen Record. */
  anhangZurDokumentationList: AnhangZurDokumentation[];
  /** Zeilen-Klick → overlay.push auf das AnhangZurDokumentation-Detail (nie der Edit-Dialog). */
  onOpenAnhangZurDokumentation: (record: AnhangZurDokumentation) => void;
  /** Kontextuelles „+": öffnet den AnhangZurDokumentation-Dialog mit diesem Record vorgesetzt. */
  onAddAnhangZurDokumentation?: () => void;
  /** 1:N „Aufgabe" (zustaendig): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabeZustaendigList: Aufgabe[];
  /** Zeilen-Klick → overlay.push auf das Aufgabe-Detail (nie der Edit-Dialog). */
  onOpenAufgabeZustaendig: (record: Aufgabe) => void;
  /** Kontextuelles „+": öffnet den Aufgabe-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabeZustaendig?: () => void;
  /** 1:N „Aufgabe" (wartet_auf_person): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabeWartetAufPersonList: Aufgabe[];
  /** Zeilen-Klick → overlay.push auf das Aufgabe-Detail (nie der Edit-Dialog). */
  onOpenAufgabeWartetAufPerson: (record: Aufgabe) => void;
  /** Kontextuelles „+": öffnet den Aufgabe-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabeWartetAufPerson?: () => void;
  /** 1:N „Aufgabe" (vorgeschlagen_von): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabeVorgeschlagenVonList: Aufgabe[];
  /** Zeilen-Klick → overlay.push auf das Aufgabe-Detail (nie der Edit-Dialog). */
  onOpenAufgabeVorgeschlagenVon: (record: Aufgabe) => void;
  /** Kontextuelles „+": öffnet den Aufgabe-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabeVorgeschlagenVon?: () => void;
  /** 1:N „Aufgabe" (aktiviert_von): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabeAktiviertVonList: Aufgabe[];
  /** Zeilen-Klick → overlay.push auf das Aufgabe-Detail (nie der Edit-Dialog). */
  onOpenAufgabeAktiviertVon: (record: Aufgabe) => void;
  /** Kontextuelles „+": öffnet den Aufgabe-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabeAktiviertVon?: () => void;
  /** 1:N „Aufgabe" (zugeordnet_von): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabeZugeordnetVonList: Aufgabe[];
  /** Zeilen-Klick → overlay.push auf das Aufgabe-Detail (nie der Edit-Dialog). */
  onOpenAufgabeZugeordnetVon: (record: Aufgabe) => void;
  /** Kontextuelles „+": öffnet den Aufgabe-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabeZugeordnetVon?: () => void;
  /** 1:N „Aufgabe" (begonnen_von): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabeBegonnenVonList: Aufgabe[];
  /** Zeilen-Klick → overlay.push auf das Aufgabe-Detail (nie der Edit-Dialog). */
  onOpenAufgabeBegonnenVon: (record: Aufgabe) => void;
  /** Kontextuelles „+": öffnet den Aufgabe-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabeBegonnenVon?: () => void;
  /** 1:N „Aufgabe" (erledigt_von): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabeErledigtVonList: Aufgabe[];
  /** Zeilen-Klick → overlay.push auf das Aufgabe-Detail (nie der Edit-Dialog). */
  onOpenAufgabeErledigtVon: (record: Aufgabe) => void;
  /** Kontextuelles „+": öffnet den Aufgabe-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabeErledigtVon?: () => void;
  /** 1:N „Aufgabe" (verworfen_von): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabeVerworfenVonList: Aufgabe[];
  /** Zeilen-Klick → overlay.push auf das Aufgabe-Detail (nie der Edit-Dialog). */
  onOpenAufgabeVerworfenVon: (record: Aufgabe) => void;
  /** Kontextuelles „+": öffnet den Aufgabe-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabeVerworfenVon?: () => void;
}

export function PersonDetails({
  record,
  personentypList,
  onOpenPersonentyp,
  qualifikationEinerPersonPersonList,
  onOpenQualifikationEinerPersonPerson,
  onAddQualifikationEinerPersonPerson,
  qualifikationEinerPersonGeprueftVonList,
  onOpenQualifikationEinerPersonGeprueftVon,
  onAddQualifikationEinerPersonGeprueftVon,
  betreutePersonHausarztList,
  onOpenBetreutePersonHausarzt,
  onAddBetreutePersonHausarzt,
  betreutePersonAnsprechpersonList,
  onOpenBetreutePersonAnsprechperson,
  onAddBetreutePersonAnsprechperson,
  betreutePersonErsatzAnsprechpersonList,
  onOpenBetreutePersonErsatzAnsprechperson,
  onAddBetreutePersonErsatzAnsprechperson,
  diagnoseList,
  onOpenDiagnose,
  onAddDiagnose,
  medikationsplanList,
  onOpenMedikationsplan,
  onAddMedikationsplan,
  massnahmePflegeplanList,
  onOpenMassnahmePflegeplan,
  onAddMassnahmePflegeplan,
  besuchList,
  onOpenBesuch,
  onAddBesuch,
  ereignisprotokollList,
  onOpenEreignisprotokoll,
  onAddEreignisprotokoll,
  betreuungszuordnungBetreuungspersonList,
  onOpenBetreuungszuordnungBetreuungsperson,
  onAddBetreuungszuordnungBetreuungsperson,
  betreuungszuordnungBeauftragtDurchList,
  onOpenBetreuungszuordnungBeauftragtDurch,
  onAddBetreuungszuordnungBeauftragtDurch,
  dokumentationList,
  onOpenDokumentation,
  onAddDokumentation,
  anhangZurDokumentationList,
  onOpenAnhangZurDokumentation,
  onAddAnhangZurDokumentation,
  aufgabeZustaendigList,
  onOpenAufgabeZustaendig,
  onAddAufgabeZustaendig,
  aufgabeWartetAufPersonList,
  onOpenAufgabeWartetAufPerson,
  onAddAufgabeWartetAufPerson,
  aufgabeVorgeschlagenVonList,
  onOpenAufgabeVorgeschlagenVon,
  onAddAufgabeVorgeschlagenVon,
  aufgabeAktiviertVonList,
  onOpenAufgabeAktiviertVon,
  onAddAufgabeAktiviertVon,
  aufgabeZugeordnetVonList,
  onOpenAufgabeZugeordnetVon,
  onAddAufgabeZugeordnetVon,
  aufgabeBegonnenVonList,
  onOpenAufgabeBegonnenVon,
  onAddAufgabeBegonnenVon,
  aufgabeErledigtVonList,
  onOpenAufgabeErledigtVon,
  onAddAufgabeErledigtVon,
  aufgabeVerworfenVonList,
  onOpenAufgabeVerworfenVon,
  onAddAufgabeVerworfenVon,
}: PersonDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const personentypTarget = personentypList.find(r => r.record_id === extractRecordId(record.fields.personentyp));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('person', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('person', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('person', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('person', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('person', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('person', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('person', 'land')} value={record.fields.land} format="text" />
        <RecordField label={fieldLabel('person', 'koordinaten')}>
          {record.fields.koordinaten ? (
            <div className="space-y-1">
              <div>{record.fields.koordinaten.info ?? `${record.fields.koordinaten.lat}, ${record.fields.koordinaten.long}`}</div>
              {/* Directions links — the map popup is hover-fleeting; the overlay
                  is the only mobile-reachable place for navigation. */}
              <MapRouteLinks lat={record.fields.koordinaten.lat} long={record.fields.koordinaten.long} />
            </div>
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('person', 'geocoding_status')} value={record.fields.geocoding_status} format="pill" />
        <RecordField label={fieldLabel('person', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('person', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('person', 'mobil')} value={record.fields.mobil} format="text" />
        <RecordField label={fieldLabel('person', 'benutzerkonto')} value={record.fields.benutzerkonto} format="text" />
        <RecordField label={fieldLabel('person', 'aktiv_von')} value={record.fields.aktiv_von} format="date" />
        <RecordField label={fieldLabel('person', 'aktiv_bis')} value={record.fields.aktiv_bis} format="date" />
        <RecordField label={fieldLabel('person', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('person', 'aktiv')} value={record.fields.aktiv} format="bool" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('person', 'personentyp')}
          name={personentypTarget ? (displayNameOf('personentyp', personentypTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={undefined}
          onClick={personentypTarget && onOpenPersonentyp ? () => onOpenPersonentyp!(personentypTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={`${appLabel('qualifikation_einer_person')} · ${fieldLabel('qualifikation_einer_person', 'person')}`}
        items={qualifikationEinerPersonPersonList.filter(r => extractRecordId(r.fields.person) === record.record_id)}
        map={r => ({ name: displayNameOf('qualifikation_einer_person', r.fields as Record<string, unknown>) || appLabel('qualifikation_einer_person'), meta: displayPart(r.fields.gueltig_bis) })}
        onOpen={onOpenQualifikationEinerPersonPerson}
        onAdd={onAddQualifikationEinerPersonPerson}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('qualifikation_einer_person')} · ${fieldLabel('qualifikation_einer_person', 'geprueft_von')}`}
        items={qualifikationEinerPersonGeprueftVonList.filter(r => extractRecordId(r.fields.geprueft_von) === record.record_id)}
        map={r => ({ name: displayNameOf('qualifikation_einer_person', r.fields as Record<string, unknown>) || appLabel('qualifikation_einer_person'), meta: displayPart(r.fields.gueltig_bis) })}
        onOpen={onOpenQualifikationEinerPersonGeprueftVon}
        onAdd={onAddQualifikationEinerPersonGeprueftVon}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('betreute_person')} · ${fieldLabel('betreute_person', 'hausarzt')}`}
        items={betreutePersonHausarztList.filter(r => extractRecordId(r.fields.hausarzt) === record.record_id)}
        map={r => ({ name: displayNameOf('betreute_person', r.fields as Record<string, unknown>) || appLabel('betreute_person'), meta: displayPart(r.fields.geburtsdatum) })}
        onOpen={onOpenBetreutePersonHausarzt}
        onAdd={onAddBetreutePersonHausarzt}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('betreute_person')} · ${fieldLabel('betreute_person', 'ansprechperson')}`}
        items={betreutePersonAnsprechpersonList.filter(r => extractRecordId(r.fields.ansprechperson) === record.record_id)}
        map={r => ({ name: displayNameOf('betreute_person', r.fields as Record<string, unknown>) || appLabel('betreute_person'), meta: displayPart(r.fields.geburtsdatum) })}
        onOpen={onOpenBetreutePersonAnsprechperson}
        onAdd={onAddBetreutePersonAnsprechperson}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('betreute_person')} · ${fieldLabel('betreute_person', 'ersatz_ansprechperson')}`}
        items={betreutePersonErsatzAnsprechpersonList.filter(r => extractRecordId(r.fields.ersatz_ansprechperson) === record.record_id)}
        map={r => ({ name: displayNameOf('betreute_person', r.fields as Record<string, unknown>) || appLabel('betreute_person'), meta: displayPart(r.fields.geburtsdatum) })}
        onOpen={onOpenBetreutePersonErsatzAnsprechperson}
        onAdd={onAddBetreutePersonErsatzAnsprechperson}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('diagnose')}
        items={diagnoseList.filter(r => extractRecordId(r.fields.festgestellt_von) === record.record_id)}
        map={r => ({ name: displayNameOf('diagnose', r.fields as Record<string, unknown>) || appLabel('diagnose'), meta: displayPart(r.fields.gueltig_ab) })}
        onOpen={onOpenDiagnose}
        onAdd={onAddDiagnose}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('medikationsplan')}
        items={medikationsplanList.filter(r => extractRecordId(r.fields.verordnet_von) === record.record_id)}
        map={r => ({ name: displayNameOf('medikationsplan', r.fields as Record<string, unknown>) || appLabel('medikationsplan'), meta: displayPart(r.fields.gueltig_ab) })}
        onOpen={onOpenMedikationsplan}
        onAdd={onAddMedikationsplan}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('massnahme_(pflegeplan)')}
        items={massnahmePflegeplanList.filter(r => extractRecordId(r.fields.verordnet_von) === record.record_id)}
        map={r => ({ name: displayNameOf('massnahme_(pflegeplan)', r.fields as Record<string, unknown>) || appLabel('massnahme_(pflegeplan)'), meta: displayPart(r.fields.gueltig_ab) })}
        onOpen={onOpenMassnahmePflegeplan}
        onAdd={onAddMassnahmePflegeplan}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('besuch')}
        items={besuchList.filter(r => extractRecordId(r.fields.betreuungsperson) === record.record_id)}
        map={r => ({ name: displayNameOf('besuch', r.fields as Record<string, unknown>) || appLabel('besuch'), meta: displayPart(r.fields.beginn) })}
        onOpen={onOpenBesuch}
        onAdd={onAddBesuch}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('ereignisprotokoll')}
        items={ereignisprotokollList.filter(r => extractRecordId(r.fields.akteur) === record.record_id)}
        map={r => ({ name: displayNameOf('ereignisprotokoll', r.fields as Record<string, unknown>) || appLabel('ereignisprotokoll'), meta: displayPart(r.fields.zeitstempel) })}
        onOpen={onOpenEreignisprotokoll}
        onAdd={onAddEreignisprotokoll}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('betreuungszuordnung')} · ${fieldLabel('betreuungszuordnung', 'betreuungsperson')}`}
        items={betreuungszuordnungBetreuungspersonList.filter(r => extractRecordId(r.fields.betreuungsperson) === record.record_id)}
        map={r => ({ name: displayNameOf('betreuungszuordnung', r.fields as Record<string, unknown>) || appLabel('betreuungszuordnung'), meta: displayPart(r.fields.gueltig_ab) })}
        onOpen={onOpenBetreuungszuordnungBetreuungsperson}
        onAdd={onAddBetreuungszuordnungBetreuungsperson}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('betreuungszuordnung')} · ${fieldLabel('betreuungszuordnung', 'beauftragt_durch')}`}
        items={betreuungszuordnungBeauftragtDurchList.filter(r => extractRecordId(r.fields.beauftragt_durch) === record.record_id)}
        map={r => ({ name: displayNameOf('betreuungszuordnung', r.fields as Record<string, unknown>) || appLabel('betreuungszuordnung'), meta: displayPart(r.fields.gueltig_ab) })}
        onOpen={onOpenBetreuungszuordnungBeauftragtDurch}
        onAdd={onAddBetreuungszuordnungBeauftragtDurch}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('dokumentation')}
        items={dokumentationList.filter(r => extractRecordId(r.fields.autor) === record.record_id)}
        map={r => ({ name: displayNameOf('dokumentation', r.fields as Record<string, unknown>) || appLabel('dokumentation'), meta: displayPart(r.fields.gespeichert_am) })}
        onOpen={onOpenDokumentation}
        onAdd={onAddDokumentation}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('anhang_zur_dokumentation')}
        items={anhangZurDokumentationList.filter(r => extractRecordId(r.fields.aufgenommen_von) === record.record_id)}
        map={r => ({ name: displayNameOf('anhang_zur_dokumentation', r.fields as Record<string, unknown>) || appLabel('anhang_zur_dokumentation'), meta: displayPart(r.fields.aufgenommen_am) })}
        onOpen={onOpenAnhangZurDokumentation}
        onAdd={onAddAnhangZurDokumentation}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('aufgabe')} · ${fieldLabel('aufgabe', 'zustaendig')}`}
        items={aufgabeZustaendigList.filter(r => extractRecordId(r.fields.zustaendig) === record.record_id)}
        map={r => ({ name: displayNameOf('aufgabe', r.fields as Record<string, unknown>) || appLabel('aufgabe'), meta: displayPart(r.fields.faelligkeitsdatum) })}
        onOpen={onOpenAufgabeZustaendig}
        onAdd={onAddAufgabeZustaendig}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('aufgabe')} · ${fieldLabel('aufgabe', 'wartet_auf_person')}`}
        items={aufgabeWartetAufPersonList.filter(r => extractRecordId(r.fields.wartet_auf_person) === record.record_id)}
        map={r => ({ name: displayNameOf('aufgabe', r.fields as Record<string, unknown>) || appLabel('aufgabe'), meta: displayPart(r.fields.faelligkeitsdatum) })}
        onOpen={onOpenAufgabeWartetAufPerson}
        onAdd={onAddAufgabeWartetAufPerson}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('aufgabe')} · ${fieldLabel('aufgabe', 'vorgeschlagen_von')}`}
        items={aufgabeVorgeschlagenVonList.filter(r => extractRecordId(r.fields.vorgeschlagen_von) === record.record_id)}
        map={r => ({ name: displayNameOf('aufgabe', r.fields as Record<string, unknown>) || appLabel('aufgabe'), meta: displayPart(r.fields.faelligkeitsdatum) })}
        onOpen={onOpenAufgabeVorgeschlagenVon}
        onAdd={onAddAufgabeVorgeschlagenVon}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('aufgabe')} · ${fieldLabel('aufgabe', 'aktiviert_von')}`}
        items={aufgabeAktiviertVonList.filter(r => extractRecordId(r.fields.aktiviert_von) === record.record_id)}
        map={r => ({ name: displayNameOf('aufgabe', r.fields as Record<string, unknown>) || appLabel('aufgabe'), meta: displayPart(r.fields.faelligkeitsdatum) })}
        onOpen={onOpenAufgabeAktiviertVon}
        onAdd={onAddAufgabeAktiviertVon}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('aufgabe')} · ${fieldLabel('aufgabe', 'zugeordnet_von')}`}
        items={aufgabeZugeordnetVonList.filter(r => extractRecordId(r.fields.zugeordnet_von) === record.record_id)}
        map={r => ({ name: displayNameOf('aufgabe', r.fields as Record<string, unknown>) || appLabel('aufgabe'), meta: displayPart(r.fields.faelligkeitsdatum) })}
        onOpen={onOpenAufgabeZugeordnetVon}
        onAdd={onAddAufgabeZugeordnetVon}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('aufgabe')} · ${fieldLabel('aufgabe', 'begonnen_von')}`}
        items={aufgabeBegonnenVonList.filter(r => extractRecordId(r.fields.begonnen_von) === record.record_id)}
        map={r => ({ name: displayNameOf('aufgabe', r.fields as Record<string, unknown>) || appLabel('aufgabe'), meta: displayPart(r.fields.faelligkeitsdatum) })}
        onOpen={onOpenAufgabeBegonnenVon}
        onAdd={onAddAufgabeBegonnenVon}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('aufgabe')} · ${fieldLabel('aufgabe', 'erledigt_von')}`}
        items={aufgabeErledigtVonList.filter(r => extractRecordId(r.fields.erledigt_von) === record.record_id)}
        map={r => ({ name: displayNameOf('aufgabe', r.fields as Record<string, unknown>) || appLabel('aufgabe'), meta: displayPart(r.fields.faelligkeitsdatum) })}
        onOpen={onOpenAufgabeErledigtVon}
        onAdd={onAddAufgabeErledigtVon}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('aufgabe')} · ${fieldLabel('aufgabe', 'verworfen_von')}`}
        items={aufgabeVerworfenVonList.filter(r => extractRecordId(r.fields.verworfen_von) === record.record_id)}
        map={r => ({ name: displayNameOf('aufgabe', r.fields as Record<string, unknown>) || appLabel('aufgabe'), meta: displayPart(r.fields.faelligkeitsdatum) })}
        onOpen={onOpenAufgabeVerworfenVon}
        onAdd={onAddAufgabeVerworfenVon}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.PERSON} recordId={record.record_id} readOnly={!perms.canWrite('person')} />
    </>
  );
}
