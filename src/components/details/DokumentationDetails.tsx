import type { Dokumentation, Besuch, BetreutePerson, Person, AnhangZurDokumentation, KiExtrakt } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf, displayPart } from '@/lib/journey/rules';

export interface DokumentationDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Dokumentation;
  /** N:1-Ziel „Besuch": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  besuchList: Besuch[];
  /** Klick auf die Besuch-Relation → overlay.push auf dessen Detail. */
  onOpenBesuch?: (record: Besuch) => void;
  /** N:1-Ziel „BetreutePerson": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  betreutePersonList: BetreutePerson[];
  /** Klick auf die BetreutePerson-Relation → overlay.push auf dessen Detail. */
  onOpenBetreutePerson?: (record: BetreutePerson) => void;
  /** N:1-Ziel „Person": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  personList: Person[];
  /** Klick auf die Person-Relation → overlay.push auf dessen Detail. */
  onOpenPerson?: (record: Person) => void;
  /** N:1-Ziel „Dokumentation": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  dokumentationList: Dokumentation[];
  /** Klick auf die Dokumentation-Relation → overlay.push auf dessen Detail. */
  onOpenDokumentation?: (record: Dokumentation) => void;
  /** 1:N „Anhang zur Dokumentation" (dokumentation): VOLLE Liste — der Block filtert auf diesen Record. */
  anhangZurDokumentationList: AnhangZurDokumentation[];
  /** Zeilen-Klick → overlay.push auf das AnhangZurDokumentation-Detail (nie der Edit-Dialog). */
  onOpenAnhangZurDokumentation: (record: AnhangZurDokumentation) => void;
  /** Kontextuelles „+": öffnet den AnhangZurDokumentation-Dialog mit diesem Record vorgesetzt. */
  onAddAnhangZurDokumentation?: () => void;
  /** 1:N „KI-Extrakt" (dokumentation): VOLLE Liste — der Block filtert auf diesen Record. */
  kiExtraktList: KiExtrakt[];
  /** Zeilen-Klick → overlay.push auf das KiExtrakt-Detail (nie der Edit-Dialog). */
  onOpenKiExtrakt: (record: KiExtrakt) => void;
  /** Kontextuelles „+": öffnet den KiExtrakt-Dialog mit diesem Record vorgesetzt. */
  onAddKiExtrakt?: () => void;
}

export function DokumentationDetails({
  record,
  besuchList,
  onOpenBesuch,
  betreutePersonList,
  onOpenBetreutePerson,
  personList,
  onOpenPerson,
  dokumentationList,
  onOpenDokumentation,
  anhangZurDokumentationList,
  onOpenAnhangZurDokumentation,
  onAddAnhangZurDokumentation,
  kiExtraktList,
  onOpenKiExtrakt,
  onAddKiExtrakt,
}: DokumentationDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const besuchTarget = besuchList.find(r => r.record_id === extractRecordId(record.fields.besuch));
  const betreute_personTarget = betreutePersonList.find(r => r.record_id === extractRecordId(record.fields.betreute_person));
  const autorTarget = personList.find(r => r.record_id === extractRecordId(record.fields.autor));
  const ergaenzung_zuTarget = dokumentationList.find(r => r.record_id === extractRecordId(record.fields.ergaenzung_zu));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('dokumentation', 'text')} value={record.fields.text} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('dokumentation', 'eingabeart')} value={record.fields.eingabeart} format="pill" />
        <RecordField label={fieldLabel('dokumentation', 'gespeichert_am')} value={record.fields.gespeichert_am} format="datetime" />
        <RecordField label={fieldLabel('dokumentation', 'erfasst_am')} value={record.fields.erfasst_am} format="datetime" />
        <RecordField label={fieldLabel('dokumentation', 'ki_analysestatus')} value={record.fields.ki_analysestatus} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('dokumentation', 'besuch')}
          name={besuchTarget ? (displayNameOf('besuch', besuchTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={undefined}
          onClick={besuchTarget && onOpenBesuch ? () => onOpenBesuch!(besuchTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('dokumentation', 'betreute_person')}
          name={betreute_personTarget ? (displayNameOf('betreute_person', betreute_personTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[betreute_personTarget?.fields.nachname, betreute_personTarget?.fields.strasse].filter(Boolean).join(' · ') || undefined}
          onClick={betreute_personTarget && onOpenBetreutePerson ? () => onOpenBetreutePerson!(betreute_personTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('dokumentation', 'autor')}
          name={autorTarget ? (displayNameOf('person', autorTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[autorTarget?.fields.email, autorTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={autorTarget && onOpenPerson ? () => onOpenPerson!(autorTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('dokumentation', 'ergaenzung_zu')}
          name={ergaenzung_zuTarget ? (displayNameOf('dokumentation', ergaenzung_zuTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={undefined}
          onClick={ergaenzung_zuTarget && onOpenDokumentation ? () => onOpenDokumentation!(ergaenzung_zuTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('anhang_zur_dokumentation')}
        items={anhangZurDokumentationList.filter(r => extractRecordId(r.fields.dokumentation) === record.record_id)}
        map={r => ({ name: displayNameOf('anhang_zur_dokumentation', r.fields as Record<string, unknown>) || appLabel('anhang_zur_dokumentation'), meta: displayPart(r.fields.aufgenommen_am) })}
        onOpen={onOpenAnhangZurDokumentation}
        onAdd={onAddAnhangZurDokumentation}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('ki_extrakt')}
        items={kiExtraktList.filter(r => extractRecordId(r.fields.dokumentation) === record.record_id)}
        map={r => ({ name: displayNameOf('ki_extrakt', r.fields as Record<string, unknown>) || appLabel('ki_extrakt'), meta: displayPart(r.fields.zeitangabe_datum) })}
        onOpen={onOpenKiExtrakt}
        onAdd={onAddKiExtrakt}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.DOKUMENTATION} recordId={record.record_id} readOnly={!perms.canWrite('dokumentation')} />
    </>
  );
}
