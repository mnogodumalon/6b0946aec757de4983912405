import type { BetreutePerson, Person, Diagnose, Medikationsplan, MassnahmePflegeplan, Besuch, Ereignisprotokoll, Betreuungszuordnung, Dokumentation, Aufgabe } from '@/types/app';
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

export interface BetreutePersonDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: BetreutePerson;
  /** N:1-Ziel „Person": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  personList: Person[];
  /** Klick auf die Person-Relation → overlay.push auf dessen Detail. */
  onOpenPerson?: (record: Person) => void;
  /** 1:N „Diagnose" (betreute_person): VOLLE Liste — der Block filtert auf diesen Record. */
  diagnoseList: Diagnose[];
  /** Zeilen-Klick → overlay.push auf das Diagnose-Detail (nie der Edit-Dialog). */
  onOpenDiagnose: (record: Diagnose) => void;
  /** Kontextuelles „+": öffnet den Diagnose-Dialog mit diesem Record vorgesetzt. */
  onAddDiagnose?: () => void;
  /** 1:N „Medikationsplan" (betreute_person): VOLLE Liste — der Block filtert auf diesen Record. */
  medikationsplanList: Medikationsplan[];
  /** Zeilen-Klick → overlay.push auf das Medikationsplan-Detail (nie der Edit-Dialog). */
  onOpenMedikationsplan: (record: Medikationsplan) => void;
  /** Kontextuelles „+": öffnet den Medikationsplan-Dialog mit diesem Record vorgesetzt. */
  onAddMedikationsplan?: () => void;
  /** 1:N „Maßnahme (Pflegeplan)" (betreute_person): VOLLE Liste — der Block filtert auf diesen Record. */
  massnahmePflegeplanList: MassnahmePflegeplan[];
  /** Zeilen-Klick → overlay.push auf das MassnahmePflegeplan-Detail (nie der Edit-Dialog). */
  onOpenMassnahmePflegeplan: (record: MassnahmePflegeplan) => void;
  /** Kontextuelles „+": öffnet den MassnahmePflegeplan-Dialog mit diesem Record vorgesetzt. */
  onAddMassnahmePflegeplan?: () => void;
  /** 1:N „Besuch" (betreute_person): VOLLE Liste — der Block filtert auf diesen Record. */
  besuchList: Besuch[];
  /** Zeilen-Klick → overlay.push auf das Besuch-Detail (nie der Edit-Dialog). */
  onOpenBesuch: (record: Besuch) => void;
  /** Kontextuelles „+": öffnet den Besuch-Dialog mit diesem Record vorgesetzt. */
  onAddBesuch?: () => void;
  /** 1:N „Ereignisprotokoll" (betreute_person): VOLLE Liste — der Block filtert auf diesen Record. */
  ereignisprotokollList: Ereignisprotokoll[];
  /** Zeilen-Klick → overlay.push auf das Ereignisprotokoll-Detail (nie der Edit-Dialog). */
  onOpenEreignisprotokoll: (record: Ereignisprotokoll) => void;
  /** Kontextuelles „+": öffnet den Ereignisprotokoll-Dialog mit diesem Record vorgesetzt. */
  onAddEreignisprotokoll?: () => void;
  /** 1:N „Betreuungszuordnung" (betreute_person): VOLLE Liste — der Block filtert auf diesen Record. */
  betreuungszuordnungList: Betreuungszuordnung[];
  /** Zeilen-Klick → overlay.push auf das Betreuungszuordnung-Detail (nie der Edit-Dialog). */
  onOpenBetreuungszuordnung: (record: Betreuungszuordnung) => void;
  /** Kontextuelles „+": öffnet den Betreuungszuordnung-Dialog mit diesem Record vorgesetzt. */
  onAddBetreuungszuordnung?: () => void;
  /** 1:N „Dokumentation" (betreute_person): VOLLE Liste — der Block filtert auf diesen Record. */
  dokumentationList: Dokumentation[];
  /** Zeilen-Klick → overlay.push auf das Dokumentation-Detail (nie der Edit-Dialog). */
  onOpenDokumentation: (record: Dokumentation) => void;
  /** Kontextuelles „+": öffnet den Dokumentation-Dialog mit diesem Record vorgesetzt. */
  onAddDokumentation?: () => void;
  /** 1:N „Aufgabe" (betreute_person): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabeList: Aufgabe[];
  /** Zeilen-Klick → overlay.push auf das Aufgabe-Detail (nie der Edit-Dialog). */
  onOpenAufgabe: (record: Aufgabe) => void;
  /** Kontextuelles „+": öffnet den Aufgabe-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabe?: () => void;
}

export function BetreutePersonDetails({
  record,
  personList,
  onOpenPerson,
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
  betreuungszuordnungList,
  onOpenBetreuungszuordnung,
  onAddBetreuungszuordnung,
  dokumentationList,
  onOpenDokumentation,
  onAddDokumentation,
  aufgabeList,
  onOpenAufgabe,
  onAddAufgabe,
}: BetreutePersonDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const hausarztTarget = personList.find(r => r.record_id === extractRecordId(record.fields.hausarzt));
  const ansprechpersonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.ansprechperson));
  const ersatz_ansprechpersonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.ersatz_ansprechperson));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('betreute_person', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('betreute_person', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('betreute_person', 'geburtsdatum')} value={record.fields.geburtsdatum} format="date" />
        <RecordField label={fieldLabel('betreute_person', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('betreute_person', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('betreute_person', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('betreute_person', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('betreute_person', 'land')} value={record.fields.land} format="text" />
        <RecordField label={fieldLabel('betreute_person', 'koordinaten')}>
          {record.fields.koordinaten ? (
            <div className="space-y-1">
              <div>{record.fields.koordinaten.info ?? `${record.fields.koordinaten.lat}, ${record.fields.koordinaten.long}`}</div>
              {/* Directions links — the map popup is hover-fleeting; the overlay
                  is the only mobile-reachable place for navigation. */}
              <MapRouteLinks lat={record.fields.koordinaten.lat} long={record.fields.koordinaten.long} />
            </div>
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('betreute_person', 'geocoding_status')} value={record.fields.geocoding_status} format="pill" />
        <RecordField label={fieldLabel('betreute_person', 'einrichtung')} value={record.fields.einrichtung} format="text" />
        <RecordField label={fieldLabel('betreute_person', 'zimmer')} value={record.fields.zimmer} format="text" />
        <RecordField label={fieldLabel('betreute_person', 'zugangshinweise')} value={record.fields.zugangshinweise} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('betreute_person', 'betreuungsbeginn')} value={record.fields.betreuungsbeginn} format="date" />
        <RecordField label={fieldLabel('betreute_person', 'betreuungsende')} value={record.fields.betreuungsende} format="date" />
        <RecordField label={fieldLabel('betreute_person', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('betreute_person', 'allergien')} value={record.fields.allergien} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('betreute_person', 'wichtige_hinweise')} value={record.fields.wichtige_hinweise} format="text" />
        <RecordField label={fieldLabel('betreute_person', 'beziehung_ansprechperson')} value={record.fields.beziehung_ansprechperson} format="text" />
        <RecordField label={fieldLabel('betreute_person', 'aktiv')} value={record.fields.aktiv} format="bool" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('betreute_person', 'hausarzt')}
          name={hausarztTarget ? (displayNameOf('person', hausarztTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[hausarztTarget?.fields.email, hausarztTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={hausarztTarget && onOpenPerson ? () => onOpenPerson!(hausarztTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('betreute_person', 'ansprechperson')}
          name={ansprechpersonTarget ? (displayNameOf('person', ansprechpersonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[ansprechpersonTarget?.fields.email, ansprechpersonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={ansprechpersonTarget && onOpenPerson ? () => onOpenPerson!(ansprechpersonTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('betreute_person', 'ersatz_ansprechperson')}
          name={ersatz_ansprechpersonTarget ? (displayNameOf('person', ersatz_ansprechpersonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[ersatz_ansprechpersonTarget?.fields.email, ersatz_ansprechpersonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={ersatz_ansprechpersonTarget && onOpenPerson ? () => onOpenPerson!(ersatz_ansprechpersonTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('diagnose')}
        items={diagnoseList.filter(r => extractRecordId(r.fields.betreute_person) === record.record_id)}
        map={r => ({ name: displayNameOf('diagnose', r.fields as Record<string, unknown>) || appLabel('diagnose'), meta: displayPart(r.fields.gueltig_ab) })}
        onOpen={onOpenDiagnose}
        onAdd={onAddDiagnose}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('medikationsplan')}
        items={medikationsplanList.filter(r => extractRecordId(r.fields.betreute_person) === record.record_id)}
        map={r => ({ name: displayNameOf('medikationsplan', r.fields as Record<string, unknown>) || appLabel('medikationsplan'), meta: displayPart(r.fields.gueltig_ab) })}
        onOpen={onOpenMedikationsplan}
        onAdd={onAddMedikationsplan}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('massnahme_(pflegeplan)')}
        items={massnahmePflegeplanList.filter(r => extractRecordId(r.fields.betreute_person) === record.record_id)}
        map={r => ({ name: displayNameOf('massnahme_(pflegeplan)', r.fields as Record<string, unknown>) || appLabel('massnahme_(pflegeplan)'), meta: displayPart(r.fields.gueltig_ab) })}
        onOpen={onOpenMassnahmePflegeplan}
        onAdd={onAddMassnahmePflegeplan}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('besuch')}
        items={besuchList.filter(r => extractRecordId(r.fields.betreute_person) === record.record_id)}
        map={r => ({ name: displayNameOf('besuch', r.fields as Record<string, unknown>) || appLabel('besuch'), meta: displayPart(r.fields.beginn) })}
        onOpen={onOpenBesuch}
        onAdd={onAddBesuch}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('ereignisprotokoll')}
        items={ereignisprotokollList.filter(r => extractRecordId(r.fields.betreute_person) === record.record_id)}
        map={r => ({ name: displayNameOf('ereignisprotokoll', r.fields as Record<string, unknown>) || appLabel('ereignisprotokoll'), meta: displayPart(r.fields.zeitstempel) })}
        onOpen={onOpenEreignisprotokoll}
        onAdd={onAddEreignisprotokoll}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('betreuungszuordnung')}
        items={betreuungszuordnungList.filter(r => extractRecordId(r.fields.betreute_person) === record.record_id)}
        map={r => ({ name: displayNameOf('betreuungszuordnung', r.fields as Record<string, unknown>) || appLabel('betreuungszuordnung'), meta: displayPart(r.fields.gueltig_ab) })}
        onOpen={onOpenBetreuungszuordnung}
        onAdd={onAddBetreuungszuordnung}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('dokumentation')}
        items={dokumentationList.filter(r => extractRecordId(r.fields.betreute_person) === record.record_id)}
        map={r => ({ name: displayNameOf('dokumentation', r.fields as Record<string, unknown>) || appLabel('dokumentation'), meta: displayPart(r.fields.gespeichert_am) })}
        onOpen={onOpenDokumentation}
        onAdd={onAddDokumentation}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('aufgabe')}
        items={aufgabeList.filter(r => extractRecordId(r.fields.betreute_person) === record.record_id)}
        map={r => ({ name: displayNameOf('aufgabe', r.fields as Record<string, unknown>) || appLabel('aufgabe'), meta: displayPart(r.fields.faelligkeitsdatum) })}
        onOpen={onOpenAufgabe}
        onAdd={onAddAufgabe}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.BETREUTE_PERSON} recordId={record.record_id} readOnly={!perms.canWrite('betreute_person')} />
    </>
  );
}
