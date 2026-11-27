import type { Diagnose, BetreutePerson, Person } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf } from '@/lib/journey/rules';

export interface DiagnoseDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Diagnose;
  /** N:1-Ziel „BetreutePerson": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  betreutePersonList: BetreutePerson[];
  /** Klick auf die BetreutePerson-Relation → overlay.push auf dessen Detail. */
  onOpenBetreutePerson?: (record: BetreutePerson) => void;
  /** N:1-Ziel „Person": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  personList: Person[];
  /** Klick auf die Person-Relation → overlay.push auf dessen Detail. */
  onOpenPerson?: (record: Person) => void;
}

export function DiagnoseDetails({
  record,
  betreutePersonList,
  onOpenBetreutePerson,
  personList,
  onOpenPerson,
}: DiagnoseDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const betreute_personTarget = betreutePersonList.find(r => r.record_id === extractRecordId(record.fields.betreute_person));
  const festgestellt_vonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.festgestellt_von));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('diagnose', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('diagnose', 'icd_code')} value={record.fields.icd_code} format="text" />
        <RecordField label={fieldLabel('diagnose', 'gueltig_ab')} value={record.fields.gueltig_ab} format="date" />
        <RecordField label={fieldLabel('diagnose', 'gueltig_bis')} value={record.fields.gueltig_bis} format="date" />
        <RecordField label={fieldLabel('diagnose', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('diagnose', 'aktiv')} value={record.fields.aktiv} format="bool" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('diagnose', 'betreute_person')}
          name={betreute_personTarget ? (displayNameOf('betreute_person', betreute_personTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[betreute_personTarget?.fields.nachname, betreute_personTarget?.fields.strasse].filter(Boolean).join(' · ') || undefined}
          onClick={betreute_personTarget && onOpenBetreutePerson ? () => onOpenBetreutePerson!(betreute_personTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('diagnose', 'festgestellt_von')}
          name={festgestellt_vonTarget ? (displayNameOf('person', festgestellt_vonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[festgestellt_vonTarget?.fields.email, festgestellt_vonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={festgestellt_vonTarget && onOpenPerson ? () => onOpenPerson!(festgestellt_vonTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.DIAGNOSE} recordId={record.record_id} readOnly={!perms.canWrite('diagnose')} />
    </>
  );
}
