import type { Besuch, BetreutePerson, Person, Dokumentation } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf, displayPart } from '@/lib/journey/rules';

export interface BesuchDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Besuch;
  /** N:1-Ziel „BetreutePerson": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  betreutePersonList: BetreutePerson[];
  /** Klick auf die BetreutePerson-Relation → overlay.push auf dessen Detail. */
  onOpenBetreutePerson?: (record: BetreutePerson) => void;
  /** N:1-Ziel „Person": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  personList: Person[];
  /** Klick auf die Person-Relation → overlay.push auf dessen Detail. */
  onOpenPerson?: (record: Person) => void;
  /** 1:N „Dokumentation" (besuch): VOLLE Liste — der Block filtert auf diesen Record. */
  dokumentationList: Dokumentation[];
  /** Zeilen-Klick → overlay.push auf das Dokumentation-Detail (nie der Edit-Dialog). */
  onOpenDokumentation: (record: Dokumentation) => void;
  /** Kontextuelles „+": öffnet den Dokumentation-Dialog mit diesem Record vorgesetzt. */
  onAddDokumentation?: () => void;
}

export function BesuchDetails({
  record,
  betreutePersonList,
  onOpenBetreutePerson,
  personList,
  onOpenPerson,
  dokumentationList,
  onOpenDokumentation,
  onAddDokumentation,
}: BesuchDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const betreute_personTarget = betreutePersonList.find(r => r.record_id === extractRecordId(record.fields.betreute_person));
  const betreuungspersonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.betreuungsperson));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('besuch', 'beginn')} value={record.fields.beginn} format="datetime" />
        <RecordField label={fieldLabel('besuch', 'ende')} value={record.fields.ende} format="datetime" />
        <RecordField label={fieldLabel('besuch', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('besuch', 'einstieg')} value={record.fields.einstieg} format="pill" />
        <RecordField label={fieldLabel('besuch', 'als_vertretung')} value={record.fields.als_vertretung} format="bool" />
        <RecordField label={fieldLabel('besuch', 'geraet')} value={record.fields.geraet} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('besuch', 'betreute_person')}
          name={betreute_personTarget ? (displayNameOf('betreute_person', betreute_personTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[betreute_personTarget?.fields.nachname, betreute_personTarget?.fields.strasse].filter(Boolean).join(' · ') || undefined}
          onClick={betreute_personTarget && onOpenBetreutePerson ? () => onOpenBetreutePerson!(betreute_personTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('besuch', 'betreuungsperson')}
          name={betreuungspersonTarget ? (displayNameOf('person', betreuungspersonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[betreuungspersonTarget?.fields.email, betreuungspersonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={betreuungspersonTarget && onOpenPerson ? () => onOpenPerson!(betreuungspersonTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('dokumentation')}
        items={dokumentationList.filter(r => extractRecordId(r.fields.besuch) === record.record_id)}
        map={r => ({ name: displayNameOf('dokumentation', r.fields as Record<string, unknown>) || appLabel('dokumentation'), meta: displayPart(r.fields.gespeichert_am) })}
        onOpen={onOpenDokumentation}
        onAdd={onAddDokumentation}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.BESUCH} recordId={record.record_id} readOnly={!perms.canWrite('besuch')} />
    </>
  );
}
