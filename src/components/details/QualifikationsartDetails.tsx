import type { Qualifikationsart, Personentyp, QualifikationEinerPerson, MassnahmePflegeplan, Aufgabe } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf, displayPart } from '@/lib/journey/rules';

export interface QualifikationsartDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Qualifikationsart;
  /** 1:N „Personentyp" (erforderliche_qualifikationsarten): VOLLE Liste — der Block filtert auf diesen Record. */
  personentypList: Personentyp[];
  /** Zeilen-Klick → overlay.push auf das Personentyp-Detail (nie der Edit-Dialog). */
  onOpenPersonentyp: (record: Personentyp) => void;
  /** Kontextuelles „+": öffnet den Personentyp-Dialog mit diesem Record vorgesetzt. */
  onAddPersonentyp?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Personentyp-Datensatz. */
  onPickPersonentyp?: () => void;
  /** 1:N „Qualifikation einer Person" (qualifikationsart): VOLLE Liste — der Block filtert auf diesen Record. */
  qualifikationEinerPersonList: QualifikationEinerPerson[];
  /** Zeilen-Klick → overlay.push auf das QualifikationEinerPerson-Detail (nie der Edit-Dialog). */
  onOpenQualifikationEinerPerson: (record: QualifikationEinerPerson) => void;
  /** Kontextuelles „+": öffnet den QualifikationEinerPerson-Dialog mit diesem Record vorgesetzt. */
  onAddQualifikationEinerPerson?: () => void;
  /** 1:N „Maßnahme (Pflegeplan)" (mindestqualifikation): VOLLE Liste — der Block filtert auf diesen Record. */
  massnahmePflegeplanList: MassnahmePflegeplan[];
  /** Zeilen-Klick → overlay.push auf das MassnahmePflegeplan-Detail (nie der Edit-Dialog). */
  onOpenMassnahmePflegeplan: (record: MassnahmePflegeplan) => void;
  /** Kontextuelles „+": öffnet den MassnahmePflegeplan-Dialog mit diesem Record vorgesetzt. */
  onAddMassnahmePflegeplan?: () => void;
  /** 1:N „Aufgabe" (mindestqualifikation): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabeList: Aufgabe[];
  /** Zeilen-Klick → overlay.push auf das Aufgabe-Detail (nie der Edit-Dialog). */
  onOpenAufgabe: (record: Aufgabe) => void;
  /** Kontextuelles „+": öffnet den Aufgabe-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabe?: () => void;
}

export function QualifikationsartDetails({
  record,
  personentypList,
  onOpenPersonentyp,
  onAddPersonentyp,
  onPickPersonentyp,
  qualifikationEinerPersonList,
  onOpenQualifikationEinerPerson,
  onAddQualifikationEinerPerson,
  massnahmePflegeplanList,
  onOpenMassnahmePflegeplan,
  onAddMassnahmePflegeplan,
  aufgabeList,
  onOpenAufgabe,
  onAddAufgabe,
}: QualifikationsartDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('qualifikationsart', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('qualifikationsart', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('qualifikationsart', 'nachweis_erforderlich')} value={record.fields.nachweis_erforderlich} format="bool" />
        <RecordField label={fieldLabel('qualifikationsart', 'aktiv')} value={record.fields.aktiv} format="bool" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('personentyp')}
        items={personentypList.filter(r => Array.isArray(r.fields.erforderliche_qualifikationsarten) && r.fields.erforderliche_qualifikationsarten.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: displayNameOf('personentyp', r.fields as Record<string, unknown>) || appLabel('personentyp'), meta: undefined })}
        onOpen={onOpenPersonentyp}
        onAdd={onAddPersonentyp}
        onPick={onPickPersonentyp}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('qualifikation_einer_person')}
        items={qualifikationEinerPersonList.filter(r => extractRecordId(r.fields.qualifikationsart) === record.record_id)}
        map={r => ({ name: displayNameOf('qualifikation_einer_person', r.fields as Record<string, unknown>) || appLabel('qualifikation_einer_person'), meta: displayPart(r.fields.gueltig_bis) })}
        onOpen={onOpenQualifikationEinerPerson}
        onAdd={onAddQualifikationEinerPerson}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('massnahme_(pflegeplan)')}
        items={massnahmePflegeplanList.filter(r => extractRecordId(r.fields.mindestqualifikation) === record.record_id)}
        map={r => ({ name: displayNameOf('massnahme_(pflegeplan)', r.fields as Record<string, unknown>) || appLabel('massnahme_(pflegeplan)'), meta: displayPart(r.fields.gueltig_ab) })}
        onOpen={onOpenMassnahmePflegeplan}
        onAdd={onAddMassnahmePflegeplan}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('aufgabe')}
        items={aufgabeList.filter(r => extractRecordId(r.fields.mindestqualifikation) === record.record_id)}
        map={r => ({ name: displayNameOf('aufgabe', r.fields as Record<string, unknown>) || appLabel('aufgabe'), meta: displayPart(r.fields.faelligkeitsdatum) })}
        onOpen={onOpenAufgabe}
        onAdd={onAddAufgabe}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.QUALIFIKATIONSART} recordId={record.record_id} readOnly={!perms.canWrite('qualifikationsart')} />
    </>
  );
}
