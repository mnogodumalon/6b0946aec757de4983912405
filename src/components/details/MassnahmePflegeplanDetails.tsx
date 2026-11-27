import type { MassnahmePflegeplan, BetreutePerson, Qualifikationsart, Person, Aufgabe } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf, displayPart } from '@/lib/journey/rules';

export interface MassnahmePflegeplanDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: MassnahmePflegeplan;
  /** N:1-Ziel „BetreutePerson": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  betreutePersonList: BetreutePerson[];
  /** Klick auf die BetreutePerson-Relation → overlay.push auf dessen Detail. */
  onOpenBetreutePerson?: (record: BetreutePerson) => void;
  /** N:1-Ziel „Qualifikationsart": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  qualifikationsartList: Qualifikationsart[];
  /** Klick auf die Qualifikationsart-Relation → overlay.push auf dessen Detail. */
  onOpenQualifikationsart?: (record: Qualifikationsart) => void;
  /** N:1-Ziel „Person": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  personList: Person[];
  /** Klick auf die Person-Relation → overlay.push auf dessen Detail. */
  onOpenPerson?: (record: Person) => void;
  /** 1:N „Aufgabe" (quelle_massnahme): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabeList: Aufgabe[];
  /** Zeilen-Klick → overlay.push auf das Aufgabe-Detail (nie der Edit-Dialog). */
  onOpenAufgabe: (record: Aufgabe) => void;
  /** Kontextuelles „+": öffnet den Aufgabe-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabe?: () => void;
}

export function MassnahmePflegeplanDetails({
  record,
  betreutePersonList,
  onOpenBetreutePerson,
  qualifikationsartList,
  onOpenQualifikationsart,
  personList,
  onOpenPerson,
  aufgabeList,
  onOpenAufgabe,
  onAddAufgabe,
}: MassnahmePflegeplanDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const betreute_personTarget = betreutePersonList.find(r => r.record_id === extractRecordId(record.fields.betreute_person));
  const mindestqualifikationTarget = qualifikationsartList.find(r => r.record_id === extractRecordId(record.fields.mindestqualifikation));
  const verordnet_vonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.verordnet_von));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('massnahme_(pflegeplan)', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('massnahme_(pflegeplan)', 'massnahmenart')} value={record.fields.massnahmenart} format="pill" />
        <RecordField label={fieldLabel('massnahme_(pflegeplan)', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('massnahme_(pflegeplan)', 'wiederholungsregel')} value={record.fields.wiederholungsregel} format="pill" />
        <RecordField label={fieldLabel('massnahme_(pflegeplan)', 'intervall_tage')} value={record.fields.intervall_tage} format="text" />
        <RecordField label={fieldLabel('massnahme_(pflegeplan)', 'wochentage')} value={Array.isArray(record.fields.wochentage) ? record.fields.wochentage.map((v: unknown) => (v && typeof v === 'object' && 'label' in v) ? (v as {label: unknown}).label : v).join(', ') : null} format="text" />
        <RecordField label={fieldLabel('massnahme_(pflegeplan)', 'tageszeitfenster')} value={record.fields.tageszeitfenster} format="pill" />
        <RecordField label={fieldLabel('massnahme_(pflegeplan)', 'gueltig_ab')} value={record.fields.gueltig_ab} format="date" />
        <RecordField label={fieldLabel('massnahme_(pflegeplan)', 'gueltig_bis')} value={record.fields.gueltig_bis} format="date" />
        <RecordField label={fieldLabel('massnahme_(pflegeplan)', 'aktiv')} value={record.fields.aktiv} format="bool" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('massnahme_(pflegeplan)', 'betreute_person')}
          name={betreute_personTarget ? (displayNameOf('betreute_person', betreute_personTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[betreute_personTarget?.fields.nachname, betreute_personTarget?.fields.strasse].filter(Boolean).join(' · ') || undefined}
          onClick={betreute_personTarget && onOpenBetreutePerson ? () => onOpenBetreutePerson!(betreute_personTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('massnahme_(pflegeplan)', 'mindestqualifikation')}
          name={mindestqualifikationTarget ? (displayNameOf('qualifikationsart', mindestqualifikationTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={undefined}
          onClick={mindestqualifikationTarget && onOpenQualifikationsart ? () => onOpenQualifikationsart!(mindestqualifikationTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('massnahme_(pflegeplan)', 'verordnet_von')}
          name={verordnet_vonTarget ? (displayNameOf('person', verordnet_vonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[verordnet_vonTarget?.fields.email, verordnet_vonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={verordnet_vonTarget && onOpenPerson ? () => onOpenPerson!(verordnet_vonTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('aufgabe')}
        items={aufgabeList.filter(r => extractRecordId(r.fields.quelle_massnahme) === record.record_id)}
        map={r => ({ name: displayNameOf('aufgabe', r.fields as Record<string, unknown>) || appLabel('aufgabe'), meta: displayPart(r.fields.faelligkeitsdatum) })}
        onOpen={onOpenAufgabe}
        onAdd={onAddAufgabe}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.MASSNAHME_PFLEGEPLAN} recordId={record.record_id} readOnly={!perms.canWrite('massnahme_(pflegeplan)')} />
    </>
  );
}
