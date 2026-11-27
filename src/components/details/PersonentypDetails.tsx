import type { Personentyp, Qualifikationsart, Person } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf, displayPart } from '@/lib/journey/rules';

export interface PersonentypDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Personentyp;
  /** N:1-Ziel „Qualifikationsart": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  qualifikationsartList: Qualifikationsart[];
  /** Reserviert — Qualifikationsart ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenQualifikationsart?: (record: Qualifikationsart) => void;
  /** 1:N „Person" (personentyp): VOLLE Liste — der Block filtert auf diesen Record. */
  personList: Person[];
  /** Zeilen-Klick → overlay.push auf das Person-Detail (nie der Edit-Dialog). */
  onOpenPerson: (record: Person) => void;
  /** Kontextuelles „+": öffnet den Person-Dialog mit diesem Record vorgesetzt. */
  onAddPerson?: () => void;
}

export function PersonentypDetails({
  record,
  qualifikationsartList,
  personList,
  onOpenPerson,
  onAddPerson,
}: PersonentypDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('personentyp', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('personentyp', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('personentyp', 'systemrolle')} value={record.fields.systemrolle} format="pill" />
        <RecordField label={fieldLabel('personentyp', 'darf_betreuen')} value={record.fields.darf_betreuen} format="bool" />
        <RecordField label={fieldLabel('personentyp', 'hat_zugang')} value={record.fields.hat_zugang} format="bool" />
        <RecordField label={fieldLabel('personentyp', 'erforderliche_qualifikationsarten')} value={Array.isArray(record.fields.erforderliche_qualifikationsarten) ? record.fields.erforderliche_qualifikationsarten.map((u: unknown) => qualifikationsartList.find(t => t.record_id === extractRecordId(u))?.fields.bezeichnung ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('personentyp', 'aktiv')} value={record.fields.aktiv} format="bool" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('person')}
        items={personList.filter(r => extractRecordId(r.fields.personentyp) === record.record_id)}
        map={r => ({ name: displayNameOf('person', r.fields as Record<string, unknown>) || appLabel('person'), meta: displayPart(r.fields.aktiv_von) })}
        onOpen={onOpenPerson}
        onAdd={onAddPerson}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.PERSONENTYP} recordId={record.record_id} readOnly={!perms.canWrite('personentyp')} />
    </>
  );
}
