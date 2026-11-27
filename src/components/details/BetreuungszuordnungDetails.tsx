import type { Betreuungszuordnung, BetreutePerson, Person } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf } from '@/lib/journey/rules';

export interface BetreuungszuordnungDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Betreuungszuordnung;
  /** N:1-Ziel „Betreuungszuordnung": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  betreuungszuordnungList: Betreuungszuordnung[];
  /** Klick auf die Betreuungszuordnung-Relation → overlay.push auf dessen Detail. */
  onOpenBetreuungszuordnung?: (record: Betreuungszuordnung) => void;
  /** N:1-Ziel „BetreutePerson": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  betreutePersonList: BetreutePerson[];
  /** Klick auf die BetreutePerson-Relation → overlay.push auf dessen Detail. */
  onOpenBetreutePerson?: (record: BetreutePerson) => void;
  /** N:1-Ziel „Person": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  personList: Person[];
  /** Klick auf die Person-Relation → overlay.push auf dessen Detail. */
  onOpenPerson?: (record: Person) => void;
}

export function BetreuungszuordnungDetails({
  record,
  betreuungszuordnungList,
  onOpenBetreuungszuordnung,
  betreutePersonList,
  onOpenBetreutePerson,
  personList,
  onOpenPerson,
}: BetreuungszuordnungDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vertretung_fuerTarget = betreuungszuordnungList.find(r => r.record_id === extractRecordId(record.fields.vertretung_fuer));
  const betreute_personTarget = betreutePersonList.find(r => r.record_id === extractRecordId(record.fields.betreute_person));
  const betreuungspersonTarget = personList.find(r => r.record_id === extractRecordId(record.fields.betreuungsperson));
  const beauftragt_durchTarget = personList.find(r => r.record_id === extractRecordId(record.fields.beauftragt_durch));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('betreuungszuordnung', 'rolle')} value={record.fields.rolle} format="pill" />
        <RecordField label={fieldLabel('betreuungszuordnung', 'gueltig_ab')} value={record.fields.gueltig_ab} format="date" />
        <RecordField label={fieldLabel('betreuungszuordnung', 'gueltig_bis')} value={record.fields.gueltig_bis} format="date" />
        <RecordField label={fieldLabel('betreuungszuordnung', 'beauftragt_durch_organisation')} value={record.fields.beauftragt_durch_organisation} format="text" />
        <RecordField label={fieldLabel('betreuungszuordnung', 'ausfall_von')} value={record.fields.ausfall_von} format="date" />
        <RecordField label={fieldLabel('betreuungszuordnung', 'ausfall_bis')} value={record.fields.ausfall_bis} format="date" />
        <RecordField label={fieldLabel('betreuungszuordnung', 'manuell_aktiviert')} value={record.fields.manuell_aktiviert} format="bool" />
        <RecordField label={fieldLabel('betreuungszuordnung', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('betreuungszuordnung', 'aktiv')} value={record.fields.aktiv} format="bool" />
        <RecordField label={fieldLabel('betreuungszuordnung', 'beauftragt_am')} value={record.fields.beauftragt_am} format="date" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('betreuungszuordnung', 'vertretung_fuer')}
          name={vertretung_fuerTarget ? (displayNameOf('betreuungszuordnung', vertretung_fuerTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={undefined}
          onClick={vertretung_fuerTarget && onOpenBetreuungszuordnung ? () => onOpenBetreuungszuordnung!(vertretung_fuerTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('betreuungszuordnung', 'betreute_person')}
          name={betreute_personTarget ? (displayNameOf('betreute_person', betreute_personTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[betreute_personTarget?.fields.nachname, betreute_personTarget?.fields.strasse].filter(Boolean).join(' · ') || undefined}
          onClick={betreute_personTarget && onOpenBetreutePerson ? () => onOpenBetreutePerson!(betreute_personTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('betreuungszuordnung', 'betreuungsperson')}
          name={betreuungspersonTarget ? (displayNameOf('person', betreuungspersonTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[betreuungspersonTarget?.fields.email, betreuungspersonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={betreuungspersonTarget && onOpenPerson ? () => onOpenPerson!(betreuungspersonTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('betreuungszuordnung', 'beauftragt_durch')}
          name={beauftragt_durchTarget ? (displayNameOf('person', beauftragt_durchTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[beauftragt_durchTarget?.fields.email, beauftragt_durchTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={beauftragt_durchTarget && onOpenPerson ? () => onOpenPerson!(beauftragt_durchTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.BETREUUNGSZUORDNUNG} recordId={record.record_id} readOnly={!perms.canWrite('betreuungszuordnung')} />
    </>
  );
}
