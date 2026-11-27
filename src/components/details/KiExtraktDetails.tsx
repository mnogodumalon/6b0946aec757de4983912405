import type { KiExtrakt, Dokumentation, Aufgabe } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf, displayPart } from '@/lib/journey/rules';

export interface KiExtraktDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: KiExtrakt;
  /** N:1-Ziel „Dokumentation": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  dokumentationList: Dokumentation[];
  /** Klick auf die Dokumentation-Relation → overlay.push auf dessen Detail. */
  onOpenDokumentation?: (record: Dokumentation) => void;
  /** 1:N „Aufgabe" (quelle_ki_extrakt): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabeList: Aufgabe[];
  /** Zeilen-Klick → overlay.push auf das Aufgabe-Detail (nie der Edit-Dialog). */
  onOpenAufgabe: (record: Aufgabe) => void;
  /** Kontextuelles „+": öffnet den Aufgabe-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabe?: () => void;
}

export function KiExtraktDetails({
  record,
  dokumentationList,
  onOpenDokumentation,
  aufgabeList,
  onOpenAufgabe,
  onAddAufgabe,
}: KiExtraktDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const dokumentationTarget = dokumentationList.find(r => r.record_id === extractRecordId(record.fields.dokumentation));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('ki_extrakt', 'kategorie')} value={record.fields.kategorie} format="pill" />
        <RecordField label={fieldLabel('ki_extrakt', 'inhalt')} value={record.fields.inhalt} format="text" />
        <RecordField label={fieldLabel('ki_extrakt', 'belegstelle')} value={record.fields.belegstelle} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('ki_extrakt', 'belegstelle_position')} value={record.fields.belegstelle_position} format="text" />
        <RecordField label={fieldLabel('ki_extrakt', 'zeitangabe_rohtext')} value={record.fields.zeitangabe_rohtext} format="text" />
        <RecordField label={fieldLabel('ki_extrakt', 'zeitangabe_datum')} value={record.fields.zeitangabe_datum} format="date" />
        <RecordField label={fieldLabel('ki_extrakt', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('ki_extrakt', 'modellbezeichnung')} value={record.fields.modellbezeichnung} format="text" />
        <RecordField label={fieldLabel('ki_extrakt', 'promptversion')} value={record.fields.promptversion} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('ki_extrakt', 'dokumentation')}
          name={dokumentationTarget ? (displayNameOf('dokumentation', dokumentationTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={undefined}
          onClick={dokumentationTarget && onOpenDokumentation ? () => onOpenDokumentation!(dokumentationTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('aufgabe')}
        items={aufgabeList.filter(r => extractRecordId(r.fields.quelle_ki_extrakt) === record.record_id)}
        map={r => ({ name: displayNameOf('aufgabe', r.fields as Record<string, unknown>) || appLabel('aufgabe'), meta: displayPart(r.fields.faelligkeitsdatum) })}
        onOpen={onOpenAufgabe}
        onAdd={onAddAufgabe}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.KI_EXTRAKT} recordId={record.record_id} readOnly={!perms.canWrite('ki_extrakt')} />
    </>
  );
}
