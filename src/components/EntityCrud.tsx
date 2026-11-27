/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'qualifikationsart'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.qualifikationsart.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.qualifikationsart.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.qualifikationsart.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.qualifikationsart              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   qualifikationsart: bezeichnung, beschreibung, nachweis_erforderlich, aktiv  ·  ← personentyp (list + contextual + + choose existing) · ← qualifikation_einer_person (list + contextual +) · ← massnahme_(pflegeplan) (list + contextual +) · ← aufgabe (list + contextual +)
 *   personentyp: bezeichnung, beschreibung, systemrolle, darf_betreuen, hat_zugang, erforderliche_qualifikationsarten, aktiv  ·  → qualifikationsart · ← person (list + contextual +)
 *   person: vorname, nachname, personentyp, strasse, hausnummer, plz, ort, land, …  ·  → personentyp · ← qualifikation_einer_person (list + contextual +) · ← qualifikation_einer_person (list + contextual +) · ← betreute_person (list + contextual +) · ← betreute_person (list + contextual +) · ← betreute_person (list + contextual +) · ← diagnose (list + contextual +) · ← medikationsplan (list + contextual +) · ← massnahme_(pflegeplan) (list + contextual +) · ← besuch (list + contextual +) · ← ereignisprotokoll (list + contextual +) · ← betreuungszuordnung (list + contextual +) · ← betreuungszuordnung (list + contextual +) · ← dokumentation (list + contextual +) · ← anhang_zur_dokumentation (list + contextual +) · ← aufgabe (list + contextual +) · ← aufgabe (list + contextual +) · ← aufgabe (list + contextual +) · ← aufgabe (list + contextual +) · ← aufgabe (list + contextual +) · ← aufgabe (list + contextual +) · ← aufgabe (list + contextual +) · ← aufgabe (list + contextual +)
 *   qualifikation_einer_person: person, qualifikationsart, nachweis, erworben_am, gueltig_bis, geprueft_von, geprueft_am  ·  → person · → qualifikationsart
 *   betreute_person: vorname, nachname, geburtsdatum, strasse, hausnummer, plz, ort, land, …  ·  → person · ← diagnose (list + contextual +) · ← medikationsplan (list + contextual +) · ← massnahme_(pflegeplan) (list + contextual +) · ← besuch (list + contextual +) · ← ereignisprotokoll (list + contextual +) · ← betreuungszuordnung (list + contextual +) · ← dokumentation (list + contextual +) · ← aufgabe (list + contextual +)
 *   diagnose: betreute_person, bezeichnung, icd_code, festgestellt_von, gueltig_ab, gueltig_bis, bemerkung, aktiv  ·  → betreute_person · → person
 *   medikationsplan: betreute_person, medikament, dosierung, rhythmus, gueltig_ab, gueltig_bis, verordnet_von, quelle, …  ·  → betreute_person · → person
 *   massnahme_(pflegeplan): betreute_person, bezeichnung, massnahmenart, beschreibung, wiederholungsregel, intervall_tage, wochentage, tageszeitfenster, …  ·  → betreute_person · → qualifikationsart · → person · ← aufgabe (list + contextual +)
 *   besuch: betreute_person, betreuungsperson, beginn, ende, status, einstieg, als_vertretung, geraet  ·  → betreute_person · → person · ← dokumentation (list + contextual +)
 *   ereignisprotokoll: zeitstempel, akteur_typ, akteur, aktion, objekttyp, objekt_id, betreute_person, vorher_wert, …  ·  → person · → betreute_person
 *   betreuungszuordnung: vertretung_fuer, betreute_person, betreuungsperson, rolle, gueltig_ab, gueltig_bis, beauftragt_durch, beauftragt_durch_organisation, …  ·  → betreuungszuordnung · → betreute_person · → person
 *   dokumentation: besuch, betreute_person, autor, text, eingabeart, gespeichert_am, erfasst_am, ki_analysestatus, …  ·  → besuch · → betreute_person · → person · → dokumentation · ← anhang_zur_dokumentation (list + contextual +) · ← ki_extrakt (list + contextual +)
 *   anhang_zur_dokumentation: datei, typ, aufgenommen_am, aufgenommen_von, beschriftung, dokumentation  ·  → person · → dokumentation
 *   ki_extrakt: dokumentation, kategorie, inhalt, belegstelle, belegstelle_position, zeitangabe_rohtext, zeitangabe_datum, status, …  ·  → dokumentation · ← aufgabe (list + contextual +)
 *   aufgabe: betreute_person, titel, beschreibung, aufgabenart, herkunft, quelle_massnahme, prioritaet, zustaendig, …  ·  → betreute_person · → massnahme_(pflegeplan) · → person · → qualifikationsart · → ki_extrakt
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Qualifikationsart, Personentyp, Person, QualifikationEinerPerson, BetreutePerson, Diagnose, Medikationsplan, MassnahmePflegeplan, Besuch, Ereignisprotokoll, Betreuungszuordnung, Dokumentation, AnhangZurDokumentation, KiExtrakt, Aufgabe } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordIds } from '@/services/livingAppsService';
import { enrichPersonentyp, enrichPerson, enrichQualifikationEinerPerson, enrichBetreutePerson, enrichDiagnose, enrichMedikationsplan, enrichMassnahmePflegeplan, enrichBesuch, enrichEreignisprotokoll, enrichBetreuungszuordnung, enrichDokumentation, enrichAnhangZurDokumentation, enrichKiExtrakt, enrichAufgabe } from '@/lib/enrich';
import type { EnrichedPersonentyp, EnrichedPerson, EnrichedQualifikationEinerPerson, EnrichedBetreutePerson, EnrichedDiagnose, EnrichedMedikationsplan, EnrichedMassnahmePflegeplan, EnrichedBesuch, EnrichedEreignisprotokoll, EnrichedBetreuungszuordnung, EnrichedDokumentation, EnrichedAnhangZurDokumentation, EnrichedKiExtrakt, EnrichedAufgabe } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { QualifikationsartDialog, type QualifikationsartDialogDefaults } from '@/components/dialogs/QualifikationsartDialog';
import { QualifikationsartDetails } from '@/components/details/QualifikationsartDetails';
import { PersonentypDialog, type PersonentypDialogDefaults } from '@/components/dialogs/PersonentypDialog';
import { PersonentypDetails } from '@/components/details/PersonentypDetails';
import { PersonDialog, type PersonDialogDefaults } from '@/components/dialogs/PersonDialog';
import { PersonDetails } from '@/components/details/PersonDetails';
import { QualifikationEinerPersonDialog, type QualifikationEinerPersonDialogDefaults } from '@/components/dialogs/QualifikationEinerPersonDialog';
import { QualifikationEinerPersonDetails } from '@/components/details/QualifikationEinerPersonDetails';
import { BetreutePersonDialog, type BetreutePersonDialogDefaults } from '@/components/dialogs/BetreutePersonDialog';
import { BetreutePersonDetails } from '@/components/details/BetreutePersonDetails';
import { DiagnoseDialog, type DiagnoseDialogDefaults } from '@/components/dialogs/DiagnoseDialog';
import { DiagnoseDetails } from '@/components/details/DiagnoseDetails';
import { MedikationsplanDialog, type MedikationsplanDialogDefaults } from '@/components/dialogs/MedikationsplanDialog';
import { MedikationsplanDetails } from '@/components/details/MedikationsplanDetails';
import { MassnahmePflegeplanDialog, type MassnahmePflegeplanDialogDefaults } from '@/components/dialogs/MassnahmePflegeplanDialog';
import { MassnahmePflegeplanDetails } from '@/components/details/MassnahmePflegeplanDetails';
import { BesuchDialog, type BesuchDialogDefaults } from '@/components/dialogs/BesuchDialog';
import { BesuchDetails } from '@/components/details/BesuchDetails';
import { EreignisprotokollDialog, type EreignisprotokollDialogDefaults } from '@/components/dialogs/EreignisprotokollDialog';
import { EreignisprotokollDetails } from '@/components/details/EreignisprotokollDetails';
import { BetreuungszuordnungDialog, type BetreuungszuordnungDialogDefaults } from '@/components/dialogs/BetreuungszuordnungDialog';
import { BetreuungszuordnungDetails } from '@/components/details/BetreuungszuordnungDetails';
import { DokumentationDialog, type DokumentationDialogDefaults } from '@/components/dialogs/DokumentationDialog';
import { DokumentationDetails } from '@/components/details/DokumentationDetails';
import { AnhangZurDokumentationDialog, type AnhangZurDokumentationDialogDefaults } from '@/components/dialogs/AnhangZurDokumentationDialog';
import { AnhangZurDokumentationDetails } from '@/components/details/AnhangZurDokumentationDetails';
import { KiExtraktDialog, type KiExtraktDialogDefaults } from '@/components/dialogs/KiExtraktDialog';
import { KiExtraktDetails } from '@/components/details/KiExtraktDetails';
import { AufgabeDialog, type AufgabeDialogDefaults } from '@/components/dialogs/AufgabeDialog';
import { AufgabeDetails } from '@/components/details/AufgabeDetails';
import { PickExistingDialog } from '@/components/PickExistingDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { syncDoorsAfterWrite } from '@/lib/publicDoors';
import { displayNameOf, displayPart } from '@/lib/journey/rules';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'qualifikationsart'; record: Qualifikationsart }
  | { type: 'personentyp'; record: EnrichedPersonentyp }
  | { type: 'person'; record: EnrichedPerson }
  | { type: 'qualifikationEinerPerson'; record: EnrichedQualifikationEinerPerson }
  | { type: 'betreutePerson'; record: EnrichedBetreutePerson }
  | { type: 'diagnose'; record: EnrichedDiagnose }
  | { type: 'medikationsplan'; record: EnrichedMedikationsplan }
  | { type: 'massnahmePflegeplan'; record: EnrichedMassnahmePflegeplan }
  | { type: 'besuch'; record: EnrichedBesuch }
  | { type: 'ereignisprotokoll'; record: EnrichedEreignisprotokoll }
  | { type: 'betreuungszuordnung'; record: EnrichedBetreuungszuordnung }
  | { type: 'dokumentation'; record: EnrichedDokumentation }
  | { type: 'anhangZurDokumentation'; record: EnrichedAnhangZurDokumentation }
  | { type: 'kiExtrakt'; record: EnrichedKiExtrakt }
  | { type: 'aufgabe'; record: EnrichedAufgabe };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  /** The action may return a sentence — the reason the step was NOT taken; the overlay shows it under the button. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void | string | Promise<void | string> } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
  /** May the signed-in user create/change records of this list? (the
   *  platform's rights — show a „+ Neu“ only when true; openCreate/openEdit
   *  refuse with a notice otherwise). */
  canWrite: boolean;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  qualifikationsart: EntityCrudApi<Qualifikationsart, QualifikationsartDialogDefaults>;
  personentyp: EntityCrudApi<Personentyp, PersonentypDialogDefaults>;
  person: EntityCrudApi<Person, PersonDialogDefaults>;
  qualifikationEinerPerson: EntityCrudApi<QualifikationEinerPerson, QualifikationEinerPersonDialogDefaults>;
  betreutePerson: EntityCrudApi<BetreutePerson, BetreutePersonDialogDefaults>;
  diagnose: EntityCrudApi<Diagnose, DiagnoseDialogDefaults>;
  medikationsplan: EntityCrudApi<Medikationsplan, MedikationsplanDialogDefaults>;
  massnahmePflegeplan: EntityCrudApi<MassnahmePflegeplan, MassnahmePflegeplanDialogDefaults>;
  besuch: EntityCrudApi<Besuch, BesuchDialogDefaults>;
  ereignisprotokoll: EntityCrudApi<Ereignisprotokoll, EreignisprotokollDialogDefaults>;
  betreuungszuordnung: EntityCrudApi<Betreuungszuordnung, BetreuungszuordnungDialogDefaults>;
  dokumentation: EntityCrudApi<Dokumentation, DokumentationDialogDefaults>;
  anhangZurDokumentation: EntityCrudApi<AnhangZurDokumentation, AnhangZurDokumentationDialogDefaults>;
  kiExtrakt: EntityCrudApi<KiExtrakt, KiExtraktDialogDefaults>;
  aufgabe: EntityCrudApi<Aufgabe, AufgabeDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { qualifikationsart: Qualifikationsart[]; personentyp: EnrichedPersonentyp[]; person: EnrichedPerson[]; qualifikationEinerPerson: EnrichedQualifikationEinerPerson[]; betreutePerson: EnrichedBetreutePerson[]; diagnose: EnrichedDiagnose[]; medikationsplan: EnrichedMedikationsplan[]; massnahmePflegeplan: EnrichedMassnahmePflegeplan[]; besuch: EnrichedBesuch[]; ereignisprotokoll: EnrichedEreignisprotokoll[]; betreuungszuordnung: EnrichedBetreuungszuordnung[]; dokumentation: EnrichedDokumentation[]; anhangZurDokumentation: EnrichedAnhangZurDokumentation[]; kiExtrakt: EnrichedKiExtrakt[]; aufgabe: EnrichedAufgabe[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  // the platform's rights of the signed-in user (lib/permissions.ts) — unknown = allowed
  const perms = usePermissions();
  const refuse = () => { toast.error(t('perm_denied_title'), { description: t('perm_denied_desc') }); };
  const [qualifikationsartDialog, setQualifikationsartDialog] = useState<{ defaults?: QualifikationsartDialogDefaults; editing?: Qualifikationsart } | null>(null);
  const [personentypDialog, setPersonentypDialog] = useState<{ defaults?: PersonentypDialogDefaults; editing?: Personentyp } | null>(null);
  const [personDialog, setPersonDialog] = useState<{ defaults?: PersonDialogDefaults; editing?: Person } | null>(null);
  const [qualifikationEinerPersonDialog, setQualifikationEinerPersonDialog] = useState<{ defaults?: QualifikationEinerPersonDialogDefaults; editing?: QualifikationEinerPerson } | null>(null);
  const [betreutePersonDialog, setBetreutePersonDialog] = useState<{ defaults?: BetreutePersonDialogDefaults; editing?: BetreutePerson } | null>(null);
  const [diagnoseDialog, setDiagnoseDialog] = useState<{ defaults?: DiagnoseDialogDefaults; editing?: Diagnose } | null>(null);
  const [medikationsplanDialog, setMedikationsplanDialog] = useState<{ defaults?: MedikationsplanDialogDefaults; editing?: Medikationsplan } | null>(null);
  const [massnahmePflegeplanDialog, setMassnahmePflegeplanDialog] = useState<{ defaults?: MassnahmePflegeplanDialogDefaults; editing?: MassnahmePflegeplan } | null>(null);
  const [besuchDialog, setBesuchDialog] = useState<{ defaults?: BesuchDialogDefaults; editing?: Besuch } | null>(null);
  const [ereignisprotokollDialog, setEreignisprotokollDialog] = useState<{ defaults?: EreignisprotokollDialogDefaults; editing?: Ereignisprotokoll } | null>(null);
  const [betreuungszuordnungDialog, setBetreuungszuordnungDialog] = useState<{ defaults?: BetreuungszuordnungDialogDefaults; editing?: Betreuungszuordnung } | null>(null);
  const [dokumentationDialog, setDokumentationDialog] = useState<{ defaults?: DokumentationDialogDefaults; editing?: Dokumentation } | null>(null);
  const [anhangZurDokumentationDialog, setAnhangZurDokumentationDialog] = useState<{ defaults?: AnhangZurDokumentationDialogDefaults; editing?: AnhangZurDokumentation } | null>(null);
  const [kiExtraktDialog, setKiExtraktDialog] = useState<{ defaults?: KiExtraktDialogDefaults; editing?: KiExtrakt } | null>(null);
  const [aufgabeDialog, setAufgabeDialog] = useState<{ defaults?: AufgabeDialogDefaults; editing?: Aufgabe } | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug personentyp.erforderliche_qualifikationsarten → qualifikationsart: hält die Hub-record_id.
  const [pickQualifikationsartPersonentyp, setPickQualifikationsartPersonentyp] = useState<string | null>(null);
  const enrichedPersonentyp = useMemo(() => enrichPersonentyp(data.personentyp, { qualifikationsartMap: data.qualifikationsartMap }), [data.personentyp, data.qualifikationsartMap]);
  const enrichedPerson = useMemo(() => enrichPerson(data.person, { personentypMap: data.personentypMap }), [data.person, data.personentypMap]);
  const enrichedQualifikationEinerPerson = useMemo(() => enrichQualifikationEinerPerson(data.qualifikationEinerPerson, { personMap: data.personMap, qualifikationsartMap: data.qualifikationsartMap }), [data.qualifikationEinerPerson, data.personMap, data.qualifikationsartMap]);
  const enrichedBetreutePerson = useMemo(() => enrichBetreutePerson(data.betreutePerson, { personMap: data.personMap }), [data.betreutePerson, data.personMap]);
  const enrichedDiagnose = useMemo(() => enrichDiagnose(data.diagnose, { betreutePersonMap: data.betreutePersonMap, personMap: data.personMap }), [data.diagnose, data.betreutePersonMap, data.personMap]);
  const enrichedMedikationsplan = useMemo(() => enrichMedikationsplan(data.medikationsplan, { betreutePersonMap: data.betreutePersonMap, personMap: data.personMap }), [data.medikationsplan, data.betreutePersonMap, data.personMap]);
  const enrichedMassnahmePflegeplan = useMemo(() => enrichMassnahmePflegeplan(data.massnahmePflegeplan, { betreutePersonMap: data.betreutePersonMap, qualifikationsartMap: data.qualifikationsartMap, personMap: data.personMap }), [data.massnahmePflegeplan, data.betreutePersonMap, data.qualifikationsartMap, data.personMap]);
  const enrichedBesuch = useMemo(() => enrichBesuch(data.besuch, { betreutePersonMap: data.betreutePersonMap, personMap: data.personMap }), [data.besuch, data.betreutePersonMap, data.personMap]);
  const enrichedEreignisprotokoll = useMemo(() => enrichEreignisprotokoll(data.ereignisprotokoll, { personMap: data.personMap, betreutePersonMap: data.betreutePersonMap }), [data.ereignisprotokoll, data.personMap, data.betreutePersonMap]);
  const enrichedBetreuungszuordnung = useMemo(() => enrichBetreuungszuordnung(data.betreuungszuordnung, { betreuungszuordnungMap: data.betreuungszuordnungMap, betreutePersonMap: data.betreutePersonMap, personMap: data.personMap }), [data.betreuungszuordnung, data.betreuungszuordnungMap, data.betreutePersonMap, data.personMap]);
  const enrichedDokumentation = useMemo(() => enrichDokumentation(data.dokumentation, { besuchMap: data.besuchMap, betreutePersonMap: data.betreutePersonMap, personMap: data.personMap, dokumentationMap: data.dokumentationMap }), [data.dokumentation, data.besuchMap, data.betreutePersonMap, data.personMap, data.dokumentationMap]);
  const enrichedAnhangZurDokumentation = useMemo(() => enrichAnhangZurDokumentation(data.anhangZurDokumentation, { personMap: data.personMap, dokumentationMap: data.dokumentationMap }), [data.anhangZurDokumentation, data.personMap, data.dokumentationMap]);
  const enrichedKiExtrakt = useMemo(() => enrichKiExtrakt(data.kiExtrakt, { dokumentationMap: data.dokumentationMap }), [data.kiExtrakt, data.dokumentationMap]);
  const enrichedAufgabe = useMemo(() => enrichAufgabe(data.aufgabe, { betreutePersonMap: data.betreutePersonMap, massnahmePflegeplanMap: data.massnahmePflegeplanMap, personMap: data.personMap, qualifikationsartMap: data.qualifikationsartMap, kiExtraktMap: data.kiExtraktMap }), [data.aufgabe, data.betreutePersonMap, data.massnahmePflegeplanMap, data.personMap, data.qualifikationsartMap, data.kiExtraktMap]);

  function detailQualifikationsart(record: Qualifikationsart, push = false) {
    const item: OverlayItem = { type: 'qualifikationsart', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitQualifikationsart(fields: Qualifikationsart['fields']) {
    const editing = qualifikationsartDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setQualifikationsart(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateQualifikationsartEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('qualifikationsart')} — ${t('crud_updated')}`, async () => {
        data.setQualifikationsart(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateQualifikationsartEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('qualifikationsart', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createQualifikationsartEntry(fields);
      undoToast(`${appLabel('qualifikationsart')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('qualifikationsart', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  // Link an EXISTING Personentyp to the Qualifikationsart hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkQualifikationsartPersonentyp(sourceId: string) {
    const hub = pickQualifikationsartPersonentyp;
    const src = data.personentyp.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.erforderliche_qualifikationsarten);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.QUALIFIKATIONSART, id));
    data.setPersonentyp(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, erforderliche_qualifikationsarten: next } } : r)));
    try {
      await LivingAppsService.updatePersonentypEntry(sourceId, { erforderliche_qualifikationsarten: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('personentyp')} — ${t('pick_linked')}`, async () => {
      data.setPersonentyp(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updatePersonentypEntry(sourceId, { erforderliche_qualifikationsarten: src.fields.erforderliche_qualifikationsarten }); } catch { data.fetchAll(); }
    });
  }

  function detailPersonentyp(record: Personentyp, push = false) {
    const rec = enrichedPersonentyp.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'personentyp', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitPersonentyp(fields: Personentyp['fields']) {
    const editing = personentypDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setPersonentyp(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updatePersonentypEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('personentyp')} — ${t('crud_updated')}`, async () => {
        data.setPersonentyp(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updatePersonentypEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('personentyp', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createPersonentypEntry(fields);
      undoToast(`${appLabel('personentyp')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('personentyp', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailPerson(record: Person, push = false) {
    const rec = enrichedPerson.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'person', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitPerson(fields: Person['fields']) {
    const editing = personDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setPerson(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updatePersonEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('person')} — ${t('crud_updated')}`, async () => {
        data.setPerson(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updatePersonEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('person', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createPersonEntry(fields);
      undoToast(`${appLabel('person')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('person', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailQualifikationEinerPerson(record: QualifikationEinerPerson, push = false) {
    const rec = enrichedQualifikationEinerPerson.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'qualifikationEinerPerson', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitQualifikationEinerPerson(fields: QualifikationEinerPerson['fields']) {
    const editing = qualifikationEinerPersonDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setQualifikationEinerPerson(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateQualifikationEinerPersonEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('qualifikation_einer_person')} — ${t('crud_updated')}`, async () => {
        data.setQualifikationEinerPerson(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateQualifikationEinerPersonEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('qualifikation_einer_person', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createQualifikationEinerPersonEntry(fields);
      undoToast(`${appLabel('qualifikation_einer_person')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('qualifikation_einer_person', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailBetreutePerson(record: BetreutePerson, push = false) {
    const rec = enrichedBetreutePerson.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'betreutePerson', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitBetreutePerson(fields: BetreutePerson['fields']) {
    const editing = betreutePersonDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setBetreutePerson(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateBetreutePersonEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('betreute_person')} — ${t('crud_updated')}`, async () => {
        data.setBetreutePerson(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateBetreutePersonEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('betreute_person', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createBetreutePersonEntry(fields);
      undoToast(`${appLabel('betreute_person')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('betreute_person', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailDiagnose(record: Diagnose, push = false) {
    const rec = enrichedDiagnose.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'diagnose', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitDiagnose(fields: Diagnose['fields']) {
    const editing = diagnoseDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setDiagnose(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateDiagnoseEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('diagnose')} — ${t('crud_updated')}`, async () => {
        data.setDiagnose(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateDiagnoseEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('diagnose', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createDiagnoseEntry(fields);
      undoToast(`${appLabel('diagnose')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('diagnose', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailMedikationsplan(record: Medikationsplan, push = false) {
    const rec = enrichedMedikationsplan.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'medikationsplan', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMedikationsplan(fields: Medikationsplan['fields']) {
    const editing = medikationsplanDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMedikationsplan(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMedikationsplanEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('medikationsplan')} — ${t('crud_updated')}`, async () => {
        data.setMedikationsplan(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMedikationsplanEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('medikationsplan', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createMedikationsplanEntry(fields);
      undoToast(`${appLabel('medikationsplan')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('medikationsplan', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailMassnahmePflegeplan(record: MassnahmePflegeplan, push = false) {
    const rec = enrichedMassnahmePflegeplan.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'massnahmePflegeplan', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMassnahmePflegeplan(fields: MassnahmePflegeplan['fields']) {
    const editing = massnahmePflegeplanDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMassnahmePflegeplan(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMassnahmePflegeplanEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('massnahme_(pflegeplan)')} — ${t('crud_updated')}`, async () => {
        data.setMassnahmePflegeplan(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMassnahmePflegeplanEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('massnahme_(pflegeplan)', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createMassnahmePflegeplanEntry(fields);
      undoToast(`${appLabel('massnahme_(pflegeplan)')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('massnahme_(pflegeplan)', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailBesuch(record: Besuch, push = false) {
    const rec = enrichedBesuch.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'besuch', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitBesuch(fields: Besuch['fields']) {
    const editing = besuchDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setBesuch(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateBesuchEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('besuch')} — ${t('crud_updated')}`, async () => {
        data.setBesuch(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateBesuchEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('besuch', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createBesuchEntry(fields);
      undoToast(`${appLabel('besuch')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('besuch', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailEreignisprotokoll(record: Ereignisprotokoll, push = false) {
    const rec = enrichedEreignisprotokoll.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'ereignisprotokoll', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitEreignisprotokoll(fields: Ereignisprotokoll['fields']) {
    const editing = ereignisprotokollDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setEreignisprotokoll(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateEreignisprotokollEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('ereignisprotokoll')} — ${t('crud_updated')}`, async () => {
        data.setEreignisprotokoll(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateEreignisprotokollEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('ereignisprotokoll', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createEreignisprotokollEntry(fields);
      undoToast(`${appLabel('ereignisprotokoll')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('ereignisprotokoll', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailBetreuungszuordnung(record: Betreuungszuordnung, push = false) {
    const rec = enrichedBetreuungszuordnung.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'betreuungszuordnung', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitBetreuungszuordnung(fields: Betreuungszuordnung['fields']) {
    const editing = betreuungszuordnungDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setBetreuungszuordnung(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateBetreuungszuordnungEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('betreuungszuordnung')} — ${t('crud_updated')}`, async () => {
        data.setBetreuungszuordnung(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateBetreuungszuordnungEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('betreuungszuordnung', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createBetreuungszuordnungEntry(fields);
      undoToast(`${appLabel('betreuungszuordnung')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('betreuungszuordnung', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailDokumentation(record: Dokumentation, push = false) {
    const rec = enrichedDokumentation.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'dokumentation', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitDokumentation(fields: Dokumentation['fields']) {
    const editing = dokumentationDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setDokumentation(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateDokumentationEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('dokumentation')} — ${t('crud_updated')}`, async () => {
        data.setDokumentation(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateDokumentationEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('dokumentation', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createDokumentationEntry(fields);
      undoToast(`${appLabel('dokumentation')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('dokumentation', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailAnhangZurDokumentation(record: AnhangZurDokumentation, push = false) {
    const rec = enrichedAnhangZurDokumentation.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'anhangZurDokumentation', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAnhangZurDokumentation(fields: AnhangZurDokumentation['fields']) {
    const editing = anhangZurDokumentationDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAnhangZurDokumentation(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAnhangZurDokumentationEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('anhang_zur_dokumentation')} — ${t('crud_updated')}`, async () => {
        data.setAnhangZurDokumentation(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAnhangZurDokumentationEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('anhang_zur_dokumentation', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createAnhangZurDokumentationEntry(fields);
      undoToast(`${appLabel('anhang_zur_dokumentation')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('anhang_zur_dokumentation', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailKiExtrakt(record: KiExtrakt, push = false) {
    const rec = enrichedKiExtrakt.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'kiExtrakt', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitKiExtrakt(fields: KiExtrakt['fields']) {
    const editing = kiExtraktDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setKiExtrakt(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateKiExtraktEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('ki_extrakt')} — ${t('crud_updated')}`, async () => {
        data.setKiExtrakt(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateKiExtraktEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('ki_extrakt', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createKiExtraktEntry(fields);
      undoToast(`${appLabel('ki_extrakt')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('ki_extrakt', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailAufgabe(record: Aufgabe, push = false) {
    const rec = enrichedAufgabe.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'aufgabe', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAufgabe(fields: Aufgabe['fields']) {
    const editing = aufgabeDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAufgabe(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAufgabeEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('aufgabe')} — ${t('crud_updated')}`, async () => {
        data.setAufgabe(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAufgabeEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('aufgabe', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createAufgabeEntry(fields);
      undoToast(`${appLabel('aufgabe')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('aufgabe', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <QualifikationsartDialog
        open={qualifikationsartDialog !== null}
        onClose={() => setQualifikationsartDialog(null)}
        onSubmit={submitQualifikationsart}
        defaultValues={qualifikationsartDialog?.defaults}
        recordId={qualifikationsartDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Qualifikationsart']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Qualifikationsart']}
      />
      <PersonentypDialog
        open={personentypDialog !== null}
        onClose={() => setPersonentypDialog(null)}
        onSubmit={submitPersonentyp}
        defaultValues={personentypDialog?.defaults}
        recordId={personentypDialog?.editing?.record_id}
        qualifikationsartList={data.qualifikationsart}
        enablePhotoScan={AI_PHOTO_SCAN['Personentyp']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Personentyp']}
      />
      <PersonDialog
        open={personDialog !== null}
        onClose={() => setPersonDialog(null)}
        onSubmit={submitPerson}
        defaultValues={personDialog?.defaults}
        recordId={personDialog?.editing?.record_id}
        personentypList={data.personentyp}
        enablePhotoScan={AI_PHOTO_SCAN['Person']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Person']}
      />
      <QualifikationEinerPersonDialog
        open={qualifikationEinerPersonDialog !== null}
        onClose={() => setQualifikationEinerPersonDialog(null)}
        onSubmit={submitQualifikationEinerPerson}
        defaultValues={qualifikationEinerPersonDialog?.defaults}
        recordId={qualifikationEinerPersonDialog?.editing?.record_id}
        personList={data.person}
        qualifikationsartList={data.qualifikationsart}
        enablePhotoScan={AI_PHOTO_SCAN['QualifikationEinerPerson']}
        enablePhotoLocation={AI_PHOTO_LOCATION['QualifikationEinerPerson']}
      />
      <BetreutePersonDialog
        open={betreutePersonDialog !== null}
        onClose={() => setBetreutePersonDialog(null)}
        onSubmit={submitBetreutePerson}
        defaultValues={betreutePersonDialog?.defaults}
        recordId={betreutePersonDialog?.editing?.record_id}
        personList={data.person}
        enablePhotoScan={AI_PHOTO_SCAN['BetreutePerson']}
        enablePhotoLocation={AI_PHOTO_LOCATION['BetreutePerson']}
      />
      <DiagnoseDialog
        open={diagnoseDialog !== null}
        onClose={() => setDiagnoseDialog(null)}
        onSubmit={submitDiagnose}
        defaultValues={diagnoseDialog?.defaults}
        recordId={diagnoseDialog?.editing?.record_id}
        betreutePersonList={data.betreutePerson}
        personList={data.person}
        enablePhotoScan={AI_PHOTO_SCAN['Diagnose']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Diagnose']}
      />
      <MedikationsplanDialog
        open={medikationsplanDialog !== null}
        onClose={() => setMedikationsplanDialog(null)}
        onSubmit={submitMedikationsplan}
        defaultValues={medikationsplanDialog?.defaults}
        recordId={medikationsplanDialog?.editing?.record_id}
        betreutePersonList={data.betreutePerson}
        personList={data.person}
        enablePhotoScan={AI_PHOTO_SCAN['Medikationsplan']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Medikationsplan']}
      />
      <MassnahmePflegeplanDialog
        open={massnahmePflegeplanDialog !== null}
        onClose={() => setMassnahmePflegeplanDialog(null)}
        onSubmit={submitMassnahmePflegeplan}
        defaultValues={massnahmePflegeplanDialog?.defaults}
        recordId={massnahmePflegeplanDialog?.editing?.record_id}
        betreutePersonList={data.betreutePerson}
        qualifikationsartList={data.qualifikationsart}
        personList={data.person}
        enablePhotoScan={AI_PHOTO_SCAN['MassnahmePflegeplan']}
        enablePhotoLocation={AI_PHOTO_LOCATION['MassnahmePflegeplan']}
      />
      <BesuchDialog
        open={besuchDialog !== null}
        onClose={() => setBesuchDialog(null)}
        onSubmit={submitBesuch}
        defaultValues={besuchDialog?.defaults}
        recordId={besuchDialog?.editing?.record_id}
        betreutePersonList={data.betreutePerson}
        personList={data.person}
        enablePhotoScan={AI_PHOTO_SCAN['Besuch']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Besuch']}
      />
      <EreignisprotokollDialog
        open={ereignisprotokollDialog !== null}
        onClose={() => setEreignisprotokollDialog(null)}
        onSubmit={submitEreignisprotokoll}
        defaultValues={ereignisprotokollDialog?.defaults}
        recordId={ereignisprotokollDialog?.editing?.record_id}
        personList={data.person}
        betreutePersonList={data.betreutePerson}
        enablePhotoScan={AI_PHOTO_SCAN['Ereignisprotokoll']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Ereignisprotokoll']}
      />
      <BetreuungszuordnungDialog
        open={betreuungszuordnungDialog !== null}
        onClose={() => setBetreuungszuordnungDialog(null)}
        onSubmit={submitBetreuungszuordnung}
        defaultValues={betreuungszuordnungDialog?.defaults}
        recordId={betreuungszuordnungDialog?.editing?.record_id}
        betreuungszuordnungList={data.betreuungszuordnung}
        betreutePersonList={data.betreutePerson}
        personList={data.person}
        enablePhotoScan={AI_PHOTO_SCAN['Betreuungszuordnung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Betreuungszuordnung']}
      />
      <DokumentationDialog
        open={dokumentationDialog !== null}
        onClose={() => setDokumentationDialog(null)}
        onSubmit={submitDokumentation}
        defaultValues={dokumentationDialog?.defaults}
        recordId={dokumentationDialog?.editing?.record_id}
        besuchList={data.besuch}
        betreutePersonList={data.betreutePerson}
        personList={data.person}
        dokumentationList={data.dokumentation}
        enablePhotoScan={AI_PHOTO_SCAN['Dokumentation']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Dokumentation']}
      />
      <AnhangZurDokumentationDialog
        open={anhangZurDokumentationDialog !== null}
        onClose={() => setAnhangZurDokumentationDialog(null)}
        onSubmit={submitAnhangZurDokumentation}
        defaultValues={anhangZurDokumentationDialog?.defaults}
        recordId={anhangZurDokumentationDialog?.editing?.record_id}
        personList={data.person}
        dokumentationList={data.dokumentation}
        enablePhotoScan={AI_PHOTO_SCAN['AnhangZurDokumentation']}
        enablePhotoLocation={AI_PHOTO_LOCATION['AnhangZurDokumentation']}
      />
      <KiExtraktDialog
        open={kiExtraktDialog !== null}
        onClose={() => setKiExtraktDialog(null)}
        onSubmit={submitKiExtrakt}
        defaultValues={kiExtraktDialog?.defaults}
        recordId={kiExtraktDialog?.editing?.record_id}
        dokumentationList={data.dokumentation}
        enablePhotoScan={AI_PHOTO_SCAN['KiExtrakt']}
        enablePhotoLocation={AI_PHOTO_LOCATION['KiExtrakt']}
      />
      <AufgabeDialog
        open={aufgabeDialog !== null}
        onClose={() => setAufgabeDialog(null)}
        onSubmit={submitAufgabe}
        defaultValues={aufgabeDialog?.defaults}
        recordId={aufgabeDialog?.editing?.record_id}
        betreutePersonList={data.betreutePerson}
        massnahmePflegeplanList={data.massnahmePflegeplan}
        personList={data.person}
        qualifikationsartList={data.qualifikationsart}
        kiExtraktList={data.kiExtrakt}
        enablePhotoScan={AI_PHOTO_SCAN['Aufgabe']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Aufgabe']}
      />
      <PickExistingDialog
        open={pickQualifikationsartPersonentyp !== null}
        onClose={() => setPickQualifikationsartPersonentyp(null)}
        title={t('pick_title', { title: appLabel('personentyp') })}
        items={data.personentyp
          .filter(r => !extractRecordIds(r.fields.erforderliche_qualifikationsarten).includes(pickQualifikationsartPersonentyp ?? ''))
          .map(r => ({ id: r.record_id, label: String(displayNameOf('personentyp', r.fields as Record<string, unknown>) || appLabel('personentyp')) }))}
        onPick={linkQualifikationsartPersonentyp}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'qualifikationsart') {
            return (
              <>
                <RecordHeader title={displayNameOf('qualifikationsart', top.record.fields as Record<string, unknown>) || appLabel('qualifikationsart')} subtitle={undefined} />
                <QualifikationsartDetails
                  record={top.record}
                  personentypList={data.personentyp}
                  onOpenPersonentyp={(r) => detailPersonentyp(r, true)}
                  onAddPersonentyp={perms.canWrite('personentyp') ? () => setPersonentypDialog({ defaults: { erforderliche_qualifikationsarten: [createRecordUrl(APP_IDS.QUALIFIKATIONSART, top.record.record_id)] } }) : undefined}
                  onPickPersonentyp={perms.canWrite('personentyp') ? () => setPickQualifikationsartPersonentyp(top.record.record_id) : undefined}
                  qualifikationEinerPersonList={data.qualifikationEinerPerson}
                  onOpenQualifikationEinerPerson={(r) => detailQualifikationEinerPerson(r, true)}
                  onAddQualifikationEinerPerson={perms.canWrite('qualifikation_einer_person') ? () => setQualifikationEinerPersonDialog({ defaults: { qualifikationsart: createRecordUrl(APP_IDS.QUALIFIKATIONSART, top.record.record_id) } }) : undefined}
                  massnahmePflegeplanList={data.massnahmePflegeplan}
                  onOpenMassnahmePflegeplan={(r) => detailMassnahmePflegeplan(r, true)}
                  onAddMassnahmePflegeplan={perms.canWrite('massnahme_(pflegeplan)') ? () => setMassnahmePflegeplanDialog({ defaults: { mindestqualifikation: createRecordUrl(APP_IDS.QUALIFIKATIONSART, top.record.record_id) } }) : undefined}
                  aufgabeList={data.aufgabe}
                  onOpenAufgabe={(r) => detailAufgabe(r, true)}
                  onAddAufgabe={perms.canWrite('aufgabe') ? () => setAufgabeDialog({ defaults: { mindestqualifikation: createRecordUrl(APP_IDS.QUALIFIKATIONSART, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'personentyp') {
            return (
              <>
                <RecordHeader title={displayNameOf('personentyp', top.record.fields as Record<string, unknown>) || appLabel('personentyp')} subtitle={undefined} />
                <PersonentypDetails
                  record={top.record}
                  qualifikationsartList={data.qualifikationsart}
                  personList={data.person}
                  onOpenPerson={(r) => detailPerson(r, true)}
                  onAddPerson={perms.canWrite('person') ? () => setPersonDialog({ defaults: { personentyp: createRecordUrl(APP_IDS.PERSONENTYP, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'person') {
            return (
              <>
                <RecordHeader title={displayNameOf('person', top.record.fields as Record<string, unknown>) || appLabel('person')} subtitle={top.record.fields.aktiv_von ? formatDate(top.record.fields.aktiv_von) : undefined} />
                <PersonDetails
                  record={top.record}
                  personentypList={data.personentyp}
                  onOpenPersonentyp={(r) => detailPersonentyp(r, true)}
                  qualifikationEinerPersonPersonList={data.qualifikationEinerPerson}
                  onOpenQualifikationEinerPersonPerson={(r) => detailQualifikationEinerPerson(r, true)}
                  onAddQualifikationEinerPersonPerson={perms.canWrite('qualifikation_einer_person') ? () => setQualifikationEinerPersonDialog({ defaults: { person: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  qualifikationEinerPersonGeprueftVonList={data.qualifikationEinerPerson}
                  onOpenQualifikationEinerPersonGeprueftVon={(r) => detailQualifikationEinerPerson(r, true)}
                  onAddQualifikationEinerPersonGeprueftVon={perms.canWrite('qualifikation_einer_person') ? () => setQualifikationEinerPersonDialog({ defaults: { geprueft_von: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  betreutePersonHausarztList={data.betreutePerson}
                  onOpenBetreutePersonHausarzt={(r) => detailBetreutePerson(r, true)}
                  onAddBetreutePersonHausarzt={perms.canWrite('betreute_person') ? () => setBetreutePersonDialog({ defaults: { hausarzt: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  betreutePersonAnsprechpersonList={data.betreutePerson}
                  onOpenBetreutePersonAnsprechperson={(r) => detailBetreutePerson(r, true)}
                  onAddBetreutePersonAnsprechperson={perms.canWrite('betreute_person') ? () => setBetreutePersonDialog({ defaults: { ansprechperson: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  betreutePersonErsatzAnsprechpersonList={data.betreutePerson}
                  onOpenBetreutePersonErsatzAnsprechperson={(r) => detailBetreutePerson(r, true)}
                  onAddBetreutePersonErsatzAnsprechperson={perms.canWrite('betreute_person') ? () => setBetreutePersonDialog({ defaults: { ersatz_ansprechperson: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  diagnoseList={data.diagnose}
                  onOpenDiagnose={(r) => detailDiagnose(r, true)}
                  onAddDiagnose={perms.canWrite('diagnose') ? () => setDiagnoseDialog({ defaults: { festgestellt_von: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  medikationsplanList={data.medikationsplan}
                  onOpenMedikationsplan={(r) => detailMedikationsplan(r, true)}
                  onAddMedikationsplan={perms.canWrite('medikationsplan') ? () => setMedikationsplanDialog({ defaults: { verordnet_von: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  massnahmePflegeplanList={data.massnahmePflegeplan}
                  onOpenMassnahmePflegeplan={(r) => detailMassnahmePflegeplan(r, true)}
                  onAddMassnahmePflegeplan={perms.canWrite('massnahme_(pflegeplan)') ? () => setMassnahmePflegeplanDialog({ defaults: { verordnet_von: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  besuchList={data.besuch}
                  onOpenBesuch={(r) => detailBesuch(r, true)}
                  onAddBesuch={perms.canWrite('besuch') ? () => setBesuchDialog({ defaults: { betreuungsperson: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  ereignisprotokollList={data.ereignisprotokoll}
                  onOpenEreignisprotokoll={(r) => detailEreignisprotokoll(r, true)}
                  onAddEreignisprotokoll={perms.canWrite('ereignisprotokoll') ? () => setEreignisprotokollDialog({ defaults: { akteur: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  betreuungszuordnungBetreuungspersonList={data.betreuungszuordnung}
                  onOpenBetreuungszuordnungBetreuungsperson={(r) => detailBetreuungszuordnung(r, true)}
                  onAddBetreuungszuordnungBetreuungsperson={perms.canWrite('betreuungszuordnung') ? () => setBetreuungszuordnungDialog({ defaults: { betreuungsperson: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  betreuungszuordnungBeauftragtDurchList={data.betreuungszuordnung}
                  onOpenBetreuungszuordnungBeauftragtDurch={(r) => detailBetreuungszuordnung(r, true)}
                  onAddBetreuungszuordnungBeauftragtDurch={perms.canWrite('betreuungszuordnung') ? () => setBetreuungszuordnungDialog({ defaults: { beauftragt_durch: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  dokumentationList={data.dokumentation}
                  onOpenDokumentation={(r) => detailDokumentation(r, true)}
                  onAddDokumentation={perms.canWrite('dokumentation') ? () => setDokumentationDialog({ defaults: { autor: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  anhangZurDokumentationList={data.anhangZurDokumentation}
                  onOpenAnhangZurDokumentation={(r) => detailAnhangZurDokumentation(r, true)}
                  onAddAnhangZurDokumentation={perms.canWrite('anhang_zur_dokumentation') ? () => setAnhangZurDokumentationDialog({ defaults: { aufgenommen_von: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  aufgabeZustaendigList={data.aufgabe}
                  onOpenAufgabeZustaendig={(r) => detailAufgabe(r, true)}
                  onAddAufgabeZustaendig={perms.canWrite('aufgabe') ? () => setAufgabeDialog({ defaults: { zustaendig: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  aufgabeWartetAufPersonList={data.aufgabe}
                  onOpenAufgabeWartetAufPerson={(r) => detailAufgabe(r, true)}
                  onAddAufgabeWartetAufPerson={perms.canWrite('aufgabe') ? () => setAufgabeDialog({ defaults: { wartet_auf_person: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  aufgabeVorgeschlagenVonList={data.aufgabe}
                  onOpenAufgabeVorgeschlagenVon={(r) => detailAufgabe(r, true)}
                  onAddAufgabeVorgeschlagenVon={perms.canWrite('aufgabe') ? () => setAufgabeDialog({ defaults: { vorgeschlagen_von: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  aufgabeAktiviertVonList={data.aufgabe}
                  onOpenAufgabeAktiviertVon={(r) => detailAufgabe(r, true)}
                  onAddAufgabeAktiviertVon={perms.canWrite('aufgabe') ? () => setAufgabeDialog({ defaults: { aktiviert_von: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  aufgabeZugeordnetVonList={data.aufgabe}
                  onOpenAufgabeZugeordnetVon={(r) => detailAufgabe(r, true)}
                  onAddAufgabeZugeordnetVon={perms.canWrite('aufgabe') ? () => setAufgabeDialog({ defaults: { zugeordnet_von: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  aufgabeBegonnenVonList={data.aufgabe}
                  onOpenAufgabeBegonnenVon={(r) => detailAufgabe(r, true)}
                  onAddAufgabeBegonnenVon={perms.canWrite('aufgabe') ? () => setAufgabeDialog({ defaults: { begonnen_von: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  aufgabeErledigtVonList={data.aufgabe}
                  onOpenAufgabeErledigtVon={(r) => detailAufgabe(r, true)}
                  onAddAufgabeErledigtVon={perms.canWrite('aufgabe') ? () => setAufgabeDialog({ defaults: { erledigt_von: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                  aufgabeVerworfenVonList={data.aufgabe}
                  onOpenAufgabeVerworfenVon={(r) => detailAufgabe(r, true)}
                  onAddAufgabeVerworfenVon={perms.canWrite('aufgabe') ? () => setAufgabeDialog({ defaults: { verworfen_von: createRecordUrl(APP_IDS.PERSON, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'qualifikationEinerPerson') {
            return (
              <>
                <RecordHeader title={displayNameOf('qualifikation_einer_person', top.record.fields as Record<string, unknown>) || appLabel('qualifikation_einer_person')} subtitle={top.record.fields.gueltig_bis ? formatDate(top.record.fields.gueltig_bis) : undefined} />
                <QualifikationEinerPersonDetails
                  record={top.record}
                  personList={data.person}
                  onOpenPerson={(r) => detailPerson(r, true)}
                  qualifikationsartList={data.qualifikationsart}
                  onOpenQualifikationsart={(r) => detailQualifikationsart(r, true)}
                />
              </>
            );
          }
          if (top.type === 'betreutePerson') {
            return (
              <>
                <RecordHeader title={displayNameOf('betreute_person', top.record.fields as Record<string, unknown>) || appLabel('betreute_person')} subtitle={top.record.fields.geburtsdatum ? formatDate(top.record.fields.geburtsdatum) : undefined} />
                <BetreutePersonDetails
                  record={top.record}
                  personList={data.person}
                  onOpenPerson={(r) => detailPerson(r, true)}
                  diagnoseList={data.diagnose}
                  onOpenDiagnose={(r) => detailDiagnose(r, true)}
                  onAddDiagnose={perms.canWrite('diagnose') ? () => setDiagnoseDialog({ defaults: { betreute_person: createRecordUrl(APP_IDS.BETREUTE_PERSON, top.record.record_id) } }) : undefined}
                  medikationsplanList={data.medikationsplan}
                  onOpenMedikationsplan={(r) => detailMedikationsplan(r, true)}
                  onAddMedikationsplan={perms.canWrite('medikationsplan') ? () => setMedikationsplanDialog({ defaults: { betreute_person: createRecordUrl(APP_IDS.BETREUTE_PERSON, top.record.record_id) } }) : undefined}
                  massnahmePflegeplanList={data.massnahmePflegeplan}
                  onOpenMassnahmePflegeplan={(r) => detailMassnahmePflegeplan(r, true)}
                  onAddMassnahmePflegeplan={perms.canWrite('massnahme_(pflegeplan)') ? () => setMassnahmePflegeplanDialog({ defaults: { betreute_person: createRecordUrl(APP_IDS.BETREUTE_PERSON, top.record.record_id) } }) : undefined}
                  besuchList={data.besuch}
                  onOpenBesuch={(r) => detailBesuch(r, true)}
                  onAddBesuch={perms.canWrite('besuch') ? () => setBesuchDialog({ defaults: { betreute_person: createRecordUrl(APP_IDS.BETREUTE_PERSON, top.record.record_id) } }) : undefined}
                  ereignisprotokollList={data.ereignisprotokoll}
                  onOpenEreignisprotokoll={(r) => detailEreignisprotokoll(r, true)}
                  onAddEreignisprotokoll={perms.canWrite('ereignisprotokoll') ? () => setEreignisprotokollDialog({ defaults: { betreute_person: createRecordUrl(APP_IDS.BETREUTE_PERSON, top.record.record_id) } }) : undefined}
                  betreuungszuordnungList={data.betreuungszuordnung}
                  onOpenBetreuungszuordnung={(r) => detailBetreuungszuordnung(r, true)}
                  onAddBetreuungszuordnung={perms.canWrite('betreuungszuordnung') ? () => setBetreuungszuordnungDialog({ defaults: { betreute_person: createRecordUrl(APP_IDS.BETREUTE_PERSON, top.record.record_id) } }) : undefined}
                  dokumentationList={data.dokumentation}
                  onOpenDokumentation={(r) => detailDokumentation(r, true)}
                  onAddDokumentation={perms.canWrite('dokumentation') ? () => setDokumentationDialog({ defaults: { betreute_person: createRecordUrl(APP_IDS.BETREUTE_PERSON, top.record.record_id) } }) : undefined}
                  aufgabeList={data.aufgabe}
                  onOpenAufgabe={(r) => detailAufgabe(r, true)}
                  onAddAufgabe={perms.canWrite('aufgabe') ? () => setAufgabeDialog({ defaults: { betreute_person: createRecordUrl(APP_IDS.BETREUTE_PERSON, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'diagnose') {
            return (
              <>
                <RecordHeader title={displayNameOf('diagnose', top.record.fields as Record<string, unknown>) || appLabel('diagnose')} subtitle={top.record.fields.gueltig_ab ? formatDate(top.record.fields.gueltig_ab) : undefined} />
                <DiagnoseDetails
                  record={top.record}
                  betreutePersonList={data.betreutePerson}
                  onOpenBetreutePerson={(r) => detailBetreutePerson(r, true)}
                  personList={data.person}
                  onOpenPerson={(r) => detailPerson(r, true)}
                />
              </>
            );
          }
          if (top.type === 'medikationsplan') {
            return (
              <>
                <RecordHeader title={displayNameOf('medikationsplan', top.record.fields as Record<string, unknown>) || appLabel('medikationsplan')} subtitle={top.record.fields.gueltig_ab ? formatDate(top.record.fields.gueltig_ab) : undefined} />
                <MedikationsplanDetails
                  record={top.record}
                  betreutePersonList={data.betreutePerson}
                  onOpenBetreutePerson={(r) => detailBetreutePerson(r, true)}
                  personList={data.person}
                  onOpenPerson={(r) => detailPerson(r, true)}
                />
              </>
            );
          }
          if (top.type === 'massnahmePflegeplan') {
            return (
              <>
                <RecordHeader title={displayNameOf('massnahme_(pflegeplan)', top.record.fields as Record<string, unknown>) || appLabel('massnahme_(pflegeplan)')} subtitle={top.record.fields.gueltig_ab ? formatDate(top.record.fields.gueltig_ab) : undefined} />
                <MassnahmePflegeplanDetails
                  record={top.record}
                  betreutePersonList={data.betreutePerson}
                  onOpenBetreutePerson={(r) => detailBetreutePerson(r, true)}
                  qualifikationsartList={data.qualifikationsart}
                  onOpenQualifikationsart={(r) => detailQualifikationsart(r, true)}
                  personList={data.person}
                  onOpenPerson={(r) => detailPerson(r, true)}
                  aufgabeList={data.aufgabe}
                  onOpenAufgabe={(r) => detailAufgabe(r, true)}
                  onAddAufgabe={perms.canWrite('aufgabe') ? () => setAufgabeDialog({ defaults: { quelle_massnahme: createRecordUrl(APP_IDS.MASSNAHME_PFLEGEPLAN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'besuch') {
            return (
              <>
                <RecordHeader title={displayNameOf('besuch', top.record.fields as Record<string, unknown>) || appLabel('besuch')} subtitle={top.record.fields.beginn ? formatDate(top.record.fields.beginn) : undefined} />
                <BesuchDetails
                  record={top.record}
                  betreutePersonList={data.betreutePerson}
                  onOpenBetreutePerson={(r) => detailBetreutePerson(r, true)}
                  personList={data.person}
                  onOpenPerson={(r) => detailPerson(r, true)}
                  dokumentationList={data.dokumentation}
                  onOpenDokumentation={(r) => detailDokumentation(r, true)}
                  onAddDokumentation={perms.canWrite('dokumentation') ? () => setDokumentationDialog({ defaults: { besuch: createRecordUrl(APP_IDS.BESUCH, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'ereignisprotokoll') {
            return (
              <>
                <RecordHeader title={displayNameOf('ereignisprotokoll', top.record.fields as Record<string, unknown>) || appLabel('ereignisprotokoll')} subtitle={top.record.fields.zeitstempel ? formatDate(top.record.fields.zeitstempel) : undefined} />
                <EreignisprotokollDetails
                  record={top.record}
                  personList={data.person}
                  onOpenPerson={(r) => detailPerson(r, true)}
                  betreutePersonList={data.betreutePerson}
                  onOpenBetreutePerson={(r) => detailBetreutePerson(r, true)}
                />
              </>
            );
          }
          if (top.type === 'betreuungszuordnung') {
            return (
              <>
                <RecordHeader title={displayNameOf('betreuungszuordnung', top.record.fields as Record<string, unknown>) || appLabel('betreuungszuordnung')} subtitle={top.record.fields.gueltig_ab ? formatDate(top.record.fields.gueltig_ab) : undefined} />
                <BetreuungszuordnungDetails
                  record={top.record}
                  betreuungszuordnungList={data.betreuungszuordnung}
                  onOpenBetreuungszuordnung={(r) => detailBetreuungszuordnung(r, true)}
                  betreutePersonList={data.betreutePerson}
                  onOpenBetreutePerson={(r) => detailBetreutePerson(r, true)}
                  personList={data.person}
                  onOpenPerson={(r) => detailPerson(r, true)}
                />
              </>
            );
          }
          if (top.type === 'dokumentation') {
            return (
              <>
                <RecordHeader title={displayNameOf('dokumentation', top.record.fields as Record<string, unknown>) || appLabel('dokumentation')} subtitle={top.record.fields.gespeichert_am ? formatDate(top.record.fields.gespeichert_am) : undefined} />
                <DokumentationDetails
                  record={top.record}
                  besuchList={data.besuch}
                  onOpenBesuch={(r) => detailBesuch(r, true)}
                  betreutePersonList={data.betreutePerson}
                  onOpenBetreutePerson={(r) => detailBetreutePerson(r, true)}
                  personList={data.person}
                  onOpenPerson={(r) => detailPerson(r, true)}
                  dokumentationList={data.dokumentation}
                  onOpenDokumentation={(r) => detailDokumentation(r, true)}
                  anhangZurDokumentationList={data.anhangZurDokumentation}
                  onOpenAnhangZurDokumentation={(r) => detailAnhangZurDokumentation(r, true)}
                  onAddAnhangZurDokumentation={perms.canWrite('anhang_zur_dokumentation') ? () => setAnhangZurDokumentationDialog({ defaults: { dokumentation: createRecordUrl(APP_IDS.DOKUMENTATION, top.record.record_id) } }) : undefined}
                  kiExtraktList={data.kiExtrakt}
                  onOpenKiExtrakt={(r) => detailKiExtrakt(r, true)}
                  onAddKiExtrakt={perms.canWrite('ki_extrakt') ? () => setKiExtraktDialog({ defaults: { dokumentation: createRecordUrl(APP_IDS.DOKUMENTATION, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'anhangZurDokumentation') {
            return (
              <>
                <RecordHeader title={displayNameOf('anhang_zur_dokumentation', top.record.fields as Record<string, unknown>) || appLabel('anhang_zur_dokumentation')} subtitle={top.record.fields.aufgenommen_am ? formatDate(top.record.fields.aufgenommen_am) : undefined} />
                <AnhangZurDokumentationDetails
                  record={top.record}
                  personList={data.person}
                  onOpenPerson={(r) => detailPerson(r, true)}
                  dokumentationList={data.dokumentation}
                  onOpenDokumentation={(r) => detailDokumentation(r, true)}
                />
              </>
            );
          }
          if (top.type === 'kiExtrakt') {
            return (
              <>
                <RecordHeader title={displayNameOf('ki_extrakt', top.record.fields as Record<string, unknown>) || appLabel('ki_extrakt')} subtitle={top.record.fields.zeitangabe_datum ? formatDate(top.record.fields.zeitangabe_datum) : undefined} />
                <KiExtraktDetails
                  record={top.record}
                  dokumentationList={data.dokumentation}
                  onOpenDokumentation={(r) => detailDokumentation(r, true)}
                  aufgabeList={data.aufgabe}
                  onOpenAufgabe={(r) => detailAufgabe(r, true)}
                  onAddAufgabe={perms.canWrite('aufgabe') ? () => setAufgabeDialog({ defaults: { quelle_ki_extrakt: createRecordUrl(APP_IDS.KI_EXTRAKT, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'aufgabe') {
            return (
              <>
                <RecordHeader title={displayNameOf('aufgabe', top.record.fields as Record<string, unknown>) || appLabel('aufgabe')} subtitle={top.record.fields.faelligkeitsdatum ? formatDate(top.record.fields.faelligkeitsdatum) : undefined} />
                <AufgabeDetails
                  record={top.record}
                  betreutePersonList={data.betreutePerson}
                  onOpenBetreutePerson={(r) => detailBetreutePerson(r, true)}
                  massnahmePflegeplanList={data.massnahmePflegeplan}
                  onOpenMassnahmePflegeplan={(r) => detailMassnahmePflegeplan(r, true)}
                  personList={data.person}
                  onOpenPerson={(r) => detailPerson(r, true)}
                  qualifikationsartList={data.qualifikationsart}
                  onOpenQualifikationsart={(r) => detailQualifikationsart(r, true)}
                  kiExtraktList={data.kiExtrakt}
                  onOpenKiExtrakt={(r) => detailKiExtrakt(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        canEdit={(top) => {
          if (top.type === 'qualifikationsart') return perms.canWrite('qualifikationsart');
          if (top.type === 'personentyp') return perms.canWrite('personentyp');
          if (top.type === 'person') return perms.canWrite('person');
          if (top.type === 'qualifikationEinerPerson') return perms.canWrite('qualifikation_einer_person');
          if (top.type === 'betreutePerson') return perms.canWrite('betreute_person');
          if (top.type === 'diagnose') return perms.canWrite('diagnose');
          if (top.type === 'medikationsplan') return perms.canWrite('medikationsplan');
          if (top.type === 'massnahmePflegeplan') return perms.canWrite('massnahme_(pflegeplan)');
          if (top.type === 'besuch') return perms.canWrite('besuch');
          if (top.type === 'ereignisprotokoll') return perms.canWrite('ereignisprotokoll');
          if (top.type === 'betreuungszuordnung') return perms.canWrite('betreuungszuordnung');
          if (top.type === 'dokumentation') return perms.canWrite('dokumentation');
          if (top.type === 'anhangZurDokumentation') return perms.canWrite('anhang_zur_dokumentation');
          if (top.type === 'kiExtrakt') return perms.canWrite('ki_extrakt');
          if (top.type === 'aufgabe') return perms.canWrite('aufgabe');
          return true;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'qualifikationsart') setQualifikationsartDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'personentyp') setPersonentypDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'person') setPersonDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'qualifikationEinerPerson') setQualifikationEinerPersonDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'betreutePerson') setBetreutePersonDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'diagnose') setDiagnoseDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'medikationsplan') setMedikationsplanDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'massnahmePflegeplan') setMassnahmePflegeplanDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'besuch') setBesuchDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'ereignisprotokoll') setEreignisprotokollDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'betreuungszuordnung') setBetreuungszuordnungDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'dokumentation') setDokumentationDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'anhangZurDokumentation') setAnhangZurDokumentationDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'kiExtrakt') setKiExtraktDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'aufgabe') setAufgabeDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    qualifikationsart: {
      openCreate: (defaults?: QualifikationsartDialogDefaults) => (perms.canWrite('qualifikationsart') ? setQualifikationsartDialog({ defaults }) : refuse()),
      openEdit: (record: Qualifikationsart) => (perms.canWrite('qualifikationsart') ? setQualifikationsartDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Qualifikationsart) => detailQualifikationsart(record, false),
      canWrite: perms.canWrite('qualifikationsart'),
    },
    personentyp: {
      openCreate: (defaults?: PersonentypDialogDefaults) => (perms.canWrite('personentyp') ? setPersonentypDialog({ defaults }) : refuse()),
      openEdit: (record: Personentyp) => (perms.canWrite('personentyp') ? setPersonentypDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Personentyp) => detailPersonentyp(record, false),
      canWrite: perms.canWrite('personentyp'),
    },
    person: {
      openCreate: (defaults?: PersonDialogDefaults) => (perms.canWrite('person') ? setPersonDialog({ defaults }) : refuse()),
      openEdit: (record: Person) => (perms.canWrite('person') ? setPersonDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Person) => detailPerson(record, false),
      canWrite: perms.canWrite('person'),
    },
    qualifikationEinerPerson: {
      openCreate: (defaults?: QualifikationEinerPersonDialogDefaults) => (perms.canWrite('qualifikation_einer_person') ? setQualifikationEinerPersonDialog({ defaults }) : refuse()),
      openEdit: (record: QualifikationEinerPerson) => (perms.canWrite('qualifikation_einer_person') ? setQualifikationEinerPersonDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: QualifikationEinerPerson) => detailQualifikationEinerPerson(record, false),
      canWrite: perms.canWrite('qualifikation_einer_person'),
    },
    betreutePerson: {
      openCreate: (defaults?: BetreutePersonDialogDefaults) => (perms.canWrite('betreute_person') ? setBetreutePersonDialog({ defaults }) : refuse()),
      openEdit: (record: BetreutePerson) => (perms.canWrite('betreute_person') ? setBetreutePersonDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: BetreutePerson) => detailBetreutePerson(record, false),
      canWrite: perms.canWrite('betreute_person'),
    },
    diagnose: {
      openCreate: (defaults?: DiagnoseDialogDefaults) => (perms.canWrite('diagnose') ? setDiagnoseDialog({ defaults }) : refuse()),
      openEdit: (record: Diagnose) => (perms.canWrite('diagnose') ? setDiagnoseDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Diagnose) => detailDiagnose(record, false),
      canWrite: perms.canWrite('diagnose'),
    },
    medikationsplan: {
      openCreate: (defaults?: MedikationsplanDialogDefaults) => (perms.canWrite('medikationsplan') ? setMedikationsplanDialog({ defaults }) : refuse()),
      openEdit: (record: Medikationsplan) => (perms.canWrite('medikationsplan') ? setMedikationsplanDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Medikationsplan) => detailMedikationsplan(record, false),
      canWrite: perms.canWrite('medikationsplan'),
    },
    massnahmePflegeplan: {
      openCreate: (defaults?: MassnahmePflegeplanDialogDefaults) => (perms.canWrite('massnahme_(pflegeplan)') ? setMassnahmePflegeplanDialog({ defaults }) : refuse()),
      openEdit: (record: MassnahmePflegeplan) => (perms.canWrite('massnahme_(pflegeplan)') ? setMassnahmePflegeplanDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: MassnahmePflegeplan) => detailMassnahmePflegeplan(record, false),
      canWrite: perms.canWrite('massnahme_(pflegeplan)'),
    },
    besuch: {
      openCreate: (defaults?: BesuchDialogDefaults) => (perms.canWrite('besuch') ? setBesuchDialog({ defaults }) : refuse()),
      openEdit: (record: Besuch) => (perms.canWrite('besuch') ? setBesuchDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Besuch) => detailBesuch(record, false),
      canWrite: perms.canWrite('besuch'),
    },
    ereignisprotokoll: {
      openCreate: (defaults?: EreignisprotokollDialogDefaults) => (perms.canWrite('ereignisprotokoll') ? setEreignisprotokollDialog({ defaults }) : refuse()),
      openEdit: (record: Ereignisprotokoll) => (perms.canWrite('ereignisprotokoll') ? setEreignisprotokollDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Ereignisprotokoll) => detailEreignisprotokoll(record, false),
      canWrite: perms.canWrite('ereignisprotokoll'),
    },
    betreuungszuordnung: {
      openCreate: (defaults?: BetreuungszuordnungDialogDefaults) => (perms.canWrite('betreuungszuordnung') ? setBetreuungszuordnungDialog({ defaults }) : refuse()),
      openEdit: (record: Betreuungszuordnung) => (perms.canWrite('betreuungszuordnung') ? setBetreuungszuordnungDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Betreuungszuordnung) => detailBetreuungszuordnung(record, false),
      canWrite: perms.canWrite('betreuungszuordnung'),
    },
    dokumentation: {
      openCreate: (defaults?: DokumentationDialogDefaults) => (perms.canWrite('dokumentation') ? setDokumentationDialog({ defaults }) : refuse()),
      openEdit: (record: Dokumentation) => (perms.canWrite('dokumentation') ? setDokumentationDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Dokumentation) => detailDokumentation(record, false),
      canWrite: perms.canWrite('dokumentation'),
    },
    anhangZurDokumentation: {
      openCreate: (defaults?: AnhangZurDokumentationDialogDefaults) => (perms.canWrite('anhang_zur_dokumentation') ? setAnhangZurDokumentationDialog({ defaults }) : refuse()),
      openEdit: (record: AnhangZurDokumentation) => (perms.canWrite('anhang_zur_dokumentation') ? setAnhangZurDokumentationDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: AnhangZurDokumentation) => detailAnhangZurDokumentation(record, false),
      canWrite: perms.canWrite('anhang_zur_dokumentation'),
    },
    kiExtrakt: {
      openCreate: (defaults?: KiExtraktDialogDefaults) => (perms.canWrite('ki_extrakt') ? setKiExtraktDialog({ defaults }) : refuse()),
      openEdit: (record: KiExtrakt) => (perms.canWrite('ki_extrakt') ? setKiExtraktDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: KiExtrakt) => detailKiExtrakt(record, false),
      canWrite: perms.canWrite('ki_extrakt'),
    },
    aufgabe: {
      openCreate: (defaults?: AufgabeDialogDefaults) => (perms.canWrite('aufgabe') ? setAufgabeDialog({ defaults }) : refuse()),
      openEdit: (record: Aufgabe) => (perms.canWrite('aufgabe') ? setAufgabeDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Aufgabe) => detailAufgabe(record, false),
      canWrite: perms.canWrite('aufgabe'),
    },
    enriched: { qualifikationsart: data.qualifikationsart, personentyp: enrichedPersonentyp, person: enrichedPerson, qualifikationEinerPerson: enrichedQualifikationEinerPerson, betreutePerson: enrichedBetreutePerson, diagnose: enrichedDiagnose, medikationsplan: enrichedMedikationsplan, massnahmePflegeplan: enrichedMassnahmePflegeplan, besuch: enrichedBesuch, ereignisprotokoll: enrichedEreignisprotokoll, betreuungszuordnung: enrichedBetreuungszuordnung, dokumentation: enrichedDokumentation, anhangZurDokumentation: enrichedAnhangZurDokumentation, kiExtrakt: enrichedKiExtrakt, aufgabe: enrichedAufgabe },
  };
}
