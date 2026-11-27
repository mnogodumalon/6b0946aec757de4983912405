import type { QualifikationEinerPerson, Person, Qualifikationsart } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf } from '@/lib/journey/rules';

export interface QualifikationEinerPersonDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: QualifikationEinerPerson;
  /** N:1-Ziel „Person": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  personList: Person[];
  /** Klick auf die Person-Relation → overlay.push auf dessen Detail. */
  onOpenPerson?: (record: Person) => void;
  /** N:1-Ziel „Qualifikationsart": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  qualifikationsartList: Qualifikationsart[];
  /** Klick auf die Qualifikationsart-Relation → overlay.push auf dessen Detail. */
  onOpenQualifikationsart?: (record: Qualifikationsart) => void;
}

export function QualifikationEinerPersonDetails({
  record,
  personList,
  onOpenPerson,
  qualifikationsartList,
  onOpenQualifikationsart,
}: QualifikationEinerPersonDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const personTarget = personList.find(r => r.record_id === extractRecordId(record.fields.person));
  const qualifikationsartTarget = qualifikationsartList.find(r => r.record_id === extractRecordId(record.fields.qualifikationsart));
  const geprueft_vonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.geprueft_von));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('qualifikation_einer_person', 'nachweis')} className="md:col-span-2">
          {record.fields.nachweis ? (
            <MediaThumbnail src={record.fields.nachweis as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('qualifikation_einer_person', 'erworben_am')} value={record.fields.erworben_am} format="date" />
        <RecordField label={fieldLabel('qualifikation_einer_person', 'gueltig_bis')} value={record.fields.gueltig_bis} format="date" />
        <RecordField label={fieldLabel('qualifikation_einer_person', 'geprueft_am')} value={record.fields.geprueft_am} format="date" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('qualifikation_einer_person', 'person')}
          name={personTarget ? (displayNameOf('person', personTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[personTarget?.fields.email, personTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={personTarget && onOpenPerson ? () => onOpenPerson!(personTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('qualifikation_einer_person', 'qualifikationsart')}
          name={qualifikationsartTarget ? (displayNameOf('qualifikationsart', qualifikationsartTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={undefined}
          onClick={qualifikationsartTarget && onOpenQualifikationsart ? () => onOpenQualifikationsart!(qualifikationsartTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('qualifikation_einer_person', 'geprueft_von')}
          name={geprueft_vonTarget ? (displayNameOf('person', geprueft_vonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[geprueft_vonTarget?.fields.email, geprueft_vonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={geprueft_vonTarget && onOpenPerson ? () => onOpenPerson!(geprueft_vonTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.QUALIFIKATION_EINER_PERSON} recordId={record.record_id} readOnly={!perms.canWrite('qualifikation_einer_person')} />
    </>
  );
}
