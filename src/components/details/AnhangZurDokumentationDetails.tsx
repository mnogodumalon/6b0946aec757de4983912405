import type { AnhangZurDokumentation, Person, Dokumentation } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf } from '@/lib/journey/rules';

export interface AnhangZurDokumentationDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: AnhangZurDokumentation;
  /** N:1-Ziel „Person": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  personList: Person[];
  /** Klick auf die Person-Relation → overlay.push auf dessen Detail. */
  onOpenPerson?: (record: Person) => void;
  /** N:1-Ziel „Dokumentation": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  dokumentationList: Dokumentation[];
  /** Klick auf die Dokumentation-Relation → overlay.push auf dessen Detail. */
  onOpenDokumentation?: (record: Dokumentation) => void;
}

export function AnhangZurDokumentationDetails({
  record,
  personList,
  onOpenPerson,
  dokumentationList,
  onOpenDokumentation,
}: AnhangZurDokumentationDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const aufgenommen_vonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.aufgenommen_von));
  const dokumentationTarget = dokumentationList.find(r => r.record_id === extractRecordId(record.fields.dokumentation));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('anhang_zur_dokumentation', 'datei')} className="md:col-span-2">
          {record.fields.datei ? (
            <MediaThumbnail src={record.fields.datei as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('anhang_zur_dokumentation', 'typ')} value={record.fields.typ} format="pill" />
        <RecordField label={fieldLabel('anhang_zur_dokumentation', 'aufgenommen_am')} value={record.fields.aufgenommen_am} format="datetime" />
        <RecordField label={fieldLabel('anhang_zur_dokumentation', 'beschriftung')} value={record.fields.beschriftung} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('anhang_zur_dokumentation', 'aufgenommen_von')}
          name={aufgenommen_vonTarget ? (displayNameOf('person', aufgenommen_vonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[aufgenommen_vonTarget?.fields.email, aufgenommen_vonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={aufgenommen_vonTarget && onOpenPerson ? () => onOpenPerson!(aufgenommen_vonTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('anhang_zur_dokumentation', 'dokumentation')}
          name={dokumentationTarget ? (displayNameOf('dokumentation', dokumentationTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={undefined}
          onClick={dokumentationTarget && onOpenDokumentation ? () => onOpenDokumentation!(dokumentationTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.ANHANG_ZUR_DOKUMENTATION} recordId={record.record_id} readOnly={!perms.canWrite('anhang_zur_dokumentation')} />
    </>
  );
}
