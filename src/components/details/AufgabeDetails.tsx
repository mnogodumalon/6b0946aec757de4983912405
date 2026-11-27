import type { Aufgabe, BetreutePerson, MassnahmePflegeplan, Person, Qualifikationsart, KiExtrakt } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf } from '@/lib/journey/rules';

export interface AufgabeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Aufgabe;
  /** N:1-Ziel „BetreutePerson": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  betreutePersonList: BetreutePerson[];
  /** Klick auf die BetreutePerson-Relation → overlay.push auf dessen Detail. */
  onOpenBetreutePerson?: (record: BetreutePerson) => void;
  /** N:1-Ziel „MassnahmePflegeplan": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  massnahmePflegeplanList: MassnahmePflegeplan[];
  /** Klick auf die MassnahmePflegeplan-Relation → overlay.push auf dessen Detail. */
  onOpenMassnahmePflegeplan?: (record: MassnahmePflegeplan) => void;
  /** N:1-Ziel „Person": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  personList: Person[];
  /** Klick auf die Person-Relation → overlay.push auf dessen Detail. */
  onOpenPerson?: (record: Person) => void;
  /** N:1-Ziel „Qualifikationsart": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  qualifikationsartList: Qualifikationsart[];
  /** Klick auf die Qualifikationsart-Relation → overlay.push auf dessen Detail. */
  onOpenQualifikationsart?: (record: Qualifikationsart) => void;
  /** N:1-Ziel „KiExtrakt": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kiExtraktList: KiExtrakt[];
  /** Klick auf die KiExtrakt-Relation → overlay.push auf dessen Detail. */
  onOpenKiExtrakt?: (record: KiExtrakt) => void;
}

export function AufgabeDetails({
  record,
  betreutePersonList,
  onOpenBetreutePerson,
  massnahmePflegeplanList,
  onOpenMassnahmePflegeplan,
  personList,
  onOpenPerson,
  qualifikationsartList,
  onOpenQualifikationsart,
  kiExtraktList,
  onOpenKiExtrakt,
}: AufgabeDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const betreute_personTarget = betreutePersonList.find(r => r.record_id === extractRecordId(record.fields.betreute_person));
  const quelle_massnahmeTarget = massnahmePflegeplanList.find(r => r.record_id === extractRecordId(record.fields.quelle_massnahme));
  const zustaendigTarget = personList.find(r => r.record_id === extractRecordId(record.fields.zustaendig));
  const mindestqualifikationTarget = qualifikationsartList.find(r => r.record_id === extractRecordId(record.fields.mindestqualifikation));
  const wartet_auf_personTarget = personList.find(r => r.record_id === extractRecordId(record.fields.wartet_auf_person));
  const vorgeschlagen_vonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.vorgeschlagen_von));
  const aktiviert_vonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.aktiviert_von));
  const zugeordnet_vonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.zugeordnet_von));
  const begonnen_vonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.begonnen_von));
  const erledigt_vonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.erledigt_von));
  const verworfen_vonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.verworfen_von));
  const quelle_ki_extraktTarget = kiExtraktList.find(r => r.record_id === extractRecordId(record.fields.quelle_ki_extrakt));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('aufgabe', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('aufgabe', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('aufgabe', 'aufgabenart')} value={record.fields.aufgabenart} format="pill" />
        <RecordField label={fieldLabel('aufgabe', 'herkunft')} value={record.fields.herkunft} format="pill" />
        <RecordField label={fieldLabel('aufgabe', 'prioritaet')} value={record.fields.prioritaet} format="pill" />
        <RecordField label={fieldLabel('aufgabe', 'faelligkeitsart')} value={record.fields.faelligkeitsart} format="pill" />
        <RecordField label={fieldLabel('aufgabe', 'faelligkeitsdatum')} value={record.fields.faelligkeitsdatum} format="date" />
        <RecordField label={fieldLabel('aufgabe', 'tageszeitfenster')} value={record.fields.tageszeitfenster} format="pill" />
        <RecordField label={fieldLabel('aufgabe', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('aufgabe', 'nicht_durchgefuehrt_grund')} value={record.fields.nicht_durchgefuehrt_grund} format="text" />
        <RecordField label={fieldLabel('aufgabe', 'verworfen_grund')} value={record.fields.verworfen_grund} format="text" />
        <RecordField label={fieldLabel('aufgabe', 'ergebnis')} value={record.fields.ergebnis} format="pill" />
        <RecordField label={fieldLabel('aufgabe', 'ergebniskommentar')} value={record.fields.ergebniskommentar} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('aufgabe', 'vorgeschlagen_am')} value={record.fields.vorgeschlagen_am} format="datetime" />
        <RecordField label={fieldLabel('aufgabe', 'aktiviert_am')} value={record.fields.aktiviert_am} format="datetime" />
        <RecordField label={fieldLabel('aufgabe', 'zugeordnet_am')} value={record.fields.zugeordnet_am} format="datetime" />
        <RecordField label={fieldLabel('aufgabe', 'begonnen_am')} value={record.fields.begonnen_am} format="datetime" />
        <RecordField label={fieldLabel('aufgabe', 'erledigt_am')} value={record.fields.erledigt_am} format="datetime" />
        <RecordField label={fieldLabel('aufgabe', 'verworfen_am')} value={record.fields.verworfen_am} format="datetime" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('aufgabe', 'betreute_person')}
          name={betreute_personTarget ? (displayNameOf('betreute_person', betreute_personTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[betreute_personTarget?.fields.nachname, betreute_personTarget?.fields.strasse].filter(Boolean).join(' · ') || undefined}
          onClick={betreute_personTarget && onOpenBetreutePerson ? () => onOpenBetreutePerson!(betreute_personTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgabe', 'quelle_massnahme')}
          name={quelle_massnahmeTarget ? (displayNameOf('massnahme_(pflegeplan)', quelle_massnahmeTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={undefined}
          onClick={quelle_massnahmeTarget && onOpenMassnahmePflegeplan ? () => onOpenMassnahmePflegeplan!(quelle_massnahmeTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgabe', 'zustaendig')}
          name={zustaendigTarget ? (displayNameOf('person', zustaendigTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[zustaendigTarget?.fields.email, zustaendigTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={zustaendigTarget && onOpenPerson ? () => onOpenPerson!(zustaendigTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgabe', 'mindestqualifikation')}
          name={mindestqualifikationTarget ? (displayNameOf('qualifikationsart', mindestqualifikationTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={undefined}
          onClick={mindestqualifikationTarget && onOpenQualifikationsart ? () => onOpenQualifikationsart!(mindestqualifikationTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgabe', 'wartet_auf_person')}
          name={wartet_auf_personTarget ? (displayNameOf('person', wartet_auf_personTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[wartet_auf_personTarget?.fields.email, wartet_auf_personTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={wartet_auf_personTarget && onOpenPerson ? () => onOpenPerson!(wartet_auf_personTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgabe', 'vorgeschlagen_von')}
          name={vorgeschlagen_vonTarget ? (displayNameOf('person', vorgeschlagen_vonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[vorgeschlagen_vonTarget?.fields.email, vorgeschlagen_vonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={vorgeschlagen_vonTarget && onOpenPerson ? () => onOpenPerson!(vorgeschlagen_vonTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgabe', 'aktiviert_von')}
          name={aktiviert_vonTarget ? (displayNameOf('person', aktiviert_vonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[aktiviert_vonTarget?.fields.email, aktiviert_vonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={aktiviert_vonTarget && onOpenPerson ? () => onOpenPerson!(aktiviert_vonTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgabe', 'zugeordnet_von')}
          name={zugeordnet_vonTarget ? (displayNameOf('person', zugeordnet_vonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[zugeordnet_vonTarget?.fields.email, zugeordnet_vonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={zugeordnet_vonTarget && onOpenPerson ? () => onOpenPerson!(zugeordnet_vonTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgabe', 'begonnen_von')}
          name={begonnen_vonTarget ? (displayNameOf('person', begonnen_vonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[begonnen_vonTarget?.fields.email, begonnen_vonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={begonnen_vonTarget && onOpenPerson ? () => onOpenPerson!(begonnen_vonTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgabe', 'erledigt_von')}
          name={erledigt_vonTarget ? (displayNameOf('person', erledigt_vonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[erledigt_vonTarget?.fields.email, erledigt_vonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={erledigt_vonTarget && onOpenPerson ? () => onOpenPerson!(erledigt_vonTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgabe', 'verworfen_von')}
          name={verworfen_vonTarget ? (displayNameOf('person', verworfen_vonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[verworfen_vonTarget?.fields.email, verworfen_vonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={verworfen_vonTarget && onOpenPerson ? () => onOpenPerson!(verworfen_vonTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgabe', 'quelle_ki_extrakt')}
          name={quelle_ki_extraktTarget ? (displayNameOf('ki_extrakt', quelle_ki_extraktTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[quelle_ki_extraktTarget?.fields.belegstelle_position, quelle_ki_extraktTarget?.fields.zeitangabe_rohtext].filter(Boolean).join(' · ') || undefined}
          onClick={quelle_ki_extraktTarget && onOpenKiExtrakt ? () => onOpenKiExtrakt!(quelle_ki_extraktTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.AUFGABE} recordId={record.record_id} readOnly={!perms.canWrite('aufgabe')} />
    </>
  );
}
