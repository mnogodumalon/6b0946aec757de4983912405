import type { Medikationsplan, BetreutePerson, Person } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf } from '@/lib/journey/rules';

export interface MedikationsplanDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Medikationsplan;
  /** N:1-Ziel „BetreutePerson": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  betreutePersonList: BetreutePerson[];
  /** Klick auf die BetreutePerson-Relation → overlay.push auf dessen Detail. */
  onOpenBetreutePerson?: (record: BetreutePerson) => void;
  /** N:1-Ziel „Person": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  personList: Person[];
  /** Klick auf die Person-Relation → overlay.push auf dessen Detail. */
  onOpenPerson?: (record: Person) => void;
}

export function MedikationsplanDetails({
  record,
  betreutePersonList,
  onOpenBetreutePerson,
  personList,
  onOpenPerson,
}: MedikationsplanDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const betreute_personTarget = betreutePersonList.find(r => r.record_id === extractRecordId(record.fields.betreute_person));
  const verordnet_vonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.verordnet_von));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('medikationsplan', 'medikament')} value={record.fields.medikament} format="text" />
        <RecordField label={fieldLabel('medikationsplan', 'dosierung')} value={record.fields.dosierung} format="text" />
        <RecordField label={fieldLabel('medikationsplan', 'rhythmus')} value={record.fields.rhythmus} format="text" />
        <RecordField label={fieldLabel('medikationsplan', 'gueltig_ab')} value={record.fields.gueltig_ab} format="date" />
        <RecordField label={fieldLabel('medikationsplan', 'gueltig_bis')} value={record.fields.gueltig_bis} format="date" />
        <RecordField label={fieldLabel('medikationsplan', 'quelle')} className="md:col-span-2">
          {record.fields.quelle ? (
            <MediaThumbnail src={record.fields.quelle as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('medikationsplan', 'begruendung')} value={record.fields.begruendung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('medikationsplan', 'aktiv')} value={record.fields.aktiv} format="bool" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('medikationsplan', 'betreute_person')}
          name={betreute_personTarget ? (displayNameOf('betreute_person', betreute_personTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[betreute_personTarget?.fields.nachname, betreute_personTarget?.fields.strasse].filter(Boolean).join(' · ') || undefined}
          onClick={betreute_personTarget && onOpenBetreutePerson ? () => onOpenBetreutePerson!(betreute_personTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('medikationsplan', 'verordnet_von')}
          name={verordnet_vonTarget ? (displayNameOf('person', verordnet_vonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[verordnet_vonTarget?.fields.email, verordnet_vonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={verordnet_vonTarget && onOpenPerson ? () => onOpenPerson!(verordnet_vonTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.MEDIKATIONSPLAN} recordId={record.record_id} readOnly={!perms.canWrite('medikationsplan')} />
    </>
  );
}
