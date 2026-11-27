import type { Ereignisprotokoll, Person, BetreutePerson } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf } from '@/lib/journey/rules';

export interface EreignisprotokollDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Ereignisprotokoll;
  /** N:1-Ziel „Person": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  personList: Person[];
  /** Klick auf die Person-Relation → overlay.push auf dessen Detail. */
  onOpenPerson?: (record: Person) => void;
  /** N:1-Ziel „BetreutePerson": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  betreutePersonList: BetreutePerson[];
  /** Klick auf die BetreutePerson-Relation → overlay.push auf dessen Detail. */
  onOpenBetreutePerson?: (record: BetreutePerson) => void;
}

export function EreignisprotokollDetails({
  record,
  personList,
  onOpenPerson,
  betreutePersonList,
  onOpenBetreutePerson,
}: EreignisprotokollDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const akteurTarget = personList.find(r => r.record_id === extractRecordId(record.fields.akteur));
  const betreute_personTarget = betreutePersonList.find(r => r.record_id === extractRecordId(record.fields.betreute_person));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('ereignisprotokoll', 'zeitstempel')} value={record.fields.zeitstempel} format="datetime" />
        <RecordField label={fieldLabel('ereignisprotokoll', 'akteur_typ')} value={record.fields.akteur_typ} format="pill" />
        <RecordField label={fieldLabel('ereignisprotokoll', 'aktion')} value={record.fields.aktion} format="text" />
        <RecordField label={fieldLabel('ereignisprotokoll', 'objekttyp')} value={record.fields.objekttyp} format="text" />
        <RecordField label={fieldLabel('ereignisprotokoll', 'objekt_id')} value={record.fields.objekt_id} format="text" />
        <RecordField label={fieldLabel('ereignisprotokoll', 'vorher_wert')} value={record.fields.vorher_wert} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('ereignisprotokoll', 'nachher_wert')} value={record.fields.nachher_wert} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('ereignisprotokoll', 'geraet')} value={record.fields.geraet} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('ereignisprotokoll', 'akteur')}
          name={akteurTarget ? (displayNameOf('person', akteurTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[akteurTarget?.fields.email, akteurTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={akteurTarget && onOpenPerson ? () => onOpenPerson!(akteurTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('ereignisprotokoll', 'betreute_person')}
          name={betreute_personTarget ? (displayNameOf('betreute_person', betreute_personTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[betreute_personTarget?.fields.nachname, betreute_personTarget?.fields.strasse].filter(Boolean).join(' · ') || undefined}
          onClick={betreute_personTarget && onOpenBetreutePerson ? () => onOpenBetreutePerson!(betreute_personTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.EREIGNISPROTOKOLL} recordId={record.record_id} readOnly={!perms.canWrite('ereignisprotokoll')} />
    </>
  );
}
