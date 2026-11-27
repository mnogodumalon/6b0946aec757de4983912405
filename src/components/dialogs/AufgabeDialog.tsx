/**
 * AufgabeDialog — pre-generated create/edit dialog for Aufgabe.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * betreutePersonList (full hook array — resolves the BetreutePerson applookup),
 * massnahmePflegeplanList (full hook array — resolves the MassnahmePflegeplan applookup),
 * personList (full hook array — resolves the Person applookup),
 * qualifikationsartList (full hook array — resolves the Qualifikationsart applookup),
 * kiExtraktList (full hook array — resolves the KiExtrakt applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * AufgabeDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Aufgabe['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<AufgabeDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Aufgabe, BetreutePerson, MassnahmePflegeplan, Person, Qualifikationsart, KiExtrakt, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, getUserProfile, LivingAppsService } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef, dialogLabel, dropHidden } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Aufgabe';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { displayNameOf } from '@/lib/journey/rules';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/Combobox';
import { BetreutePersonDialog } from '@/components/dialogs/BetreutePersonDialog';
import { MassnahmePflegeplanDialog } from '@/components/dialogs/MassnahmePflegeplanDialog';
import { PersonDialog } from '@/components/dialogs/PersonDialog';
import { QualifikationsartDialog } from '@/components/dialogs/QualifikationsartDialog';
import { KiExtraktDialog } from '@/components/dialogs/KiExtraktDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for AufgabeDialog.defaultValues — see file header. */
export type AufgabeDialogDefaults = Omit<Aufgabe['fields'], 'aufgabenart' | 'herkunft' | 'prioritaet' | 'faelligkeitsart' | 'tageszeitfenster' | 'status' | 'ergebnis'> & {
    aufgabenart?: LookupValue | string;
    herkunft?: LookupValue | string;
    prioritaet?: LookupValue | string;
    faelligkeitsart?: LookupValue | string;
    tageszeitfenster?: LookupValue | string;
    status?: LookupValue | string;
    ergebnis?: LookupValue | string;
  };

interface AufgabeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Aufgabe['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: AufgabeDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  betreutePersonList: BetreutePerson[];
  massnahmePflegeplanList: MassnahmePflegeplan[];
  personList: Person[];
  qualifikationsartList: Qualifikationsart[];
  kiExtraktList: KiExtrakt[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  aufgabenart: LOOKUP_OPTIONS['aufgabe']?.['aufgabenart'] ?? [],
  herkunft: LOOKUP_OPTIONS['aufgabe']?.['herkunft'] ?? [],
  prioritaet: LOOKUP_OPTIONS['aufgabe']?.['prioritaet'] ?? [],
  faelligkeitsart: LOOKUP_OPTIONS['aufgabe']?.['faelligkeitsart'] ?? [],
  tageszeitfenster: LOOKUP_OPTIONS['aufgabe']?.['tageszeitfenster'] ?? [],
  status: LOOKUP_OPTIONS['aufgabe']?.['status'] ?? [],
  ergebnis: LOOKUP_OPTIONS['aufgabe']?.['ergebnis'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  betreute_person: APP_IDS.BETREUTE_PERSON,
  quelle_massnahme: APP_IDS.MASSNAHME_PFLEGEPLAN,
  zustaendig: APP_IDS.PERSON,
  mindestqualifikation: APP_IDS.QUALIFIKATIONSART,
  wartet_auf_person: APP_IDS.PERSON,
  vorgeschlagen_von: APP_IDS.PERSON,
  aktiviert_von: APP_IDS.PERSON,
  zugeordnet_von: APP_IDS.PERSON,
  begonnen_von: APP_IDS.PERSON,
  erledigt_von: APP_IDS.PERSON,
  verworfen_von: APP_IDS.PERSON,
  quelle_ki_extrakt: APP_IDS.KI_EXTRAKT,
};
function normalizeDefaults(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const [k, opts] of Object.entries(NORMALIZE_LOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string') out[k] = opts.find(o => o.key === v) ?? { key: v, label: v };
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' ? opts.find(o => o.key === x) ?? { key: x, label: x } : x));
  }
  for (const [k, appId] of Object.entries(NORMALIZE_APPLOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string' && v !== '' && !v.startsWith('http')) out[k] = createRecordUrl(appId, v);
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' && x !== '' && !x.startsWith('http') ? createRecordUrl(appId, x) : x));
  }
  return out;
}

export function AufgabeDialog({ open, onClose, onSubmit, defaultValues, recordId, betreutePersonList, massnahmePflegeplanList, personList, qualifikationsartList, kiExtraktList, enablePhotoScan = true, enablePhotoLocation = true }: AufgabeDialogProps) {
  const [fields, setFields] = useState<Partial<Aufgabe['fields']>>({});
  const [saving, setSaving] = useState(false);
  const normalizedDefaults = useMemo<Record<string, unknown> | undefined>(
    () => (defaultValues ? normalizeDefaults(defaultValues as Record<string, unknown>) : undefined),
    [defaultValues],
  );
  // Dirty-tracking: in edit-mode the Speichern button is disabled until the
  // user actually changes something. JSON.stringify is good enough for our
  // fields (plain values + LookupValue objects + string arrays).
  const isDirty = useMemo(() => {
    if (!normalizedDefaults) return true;  // create-mode: always allow submit
    try {
      return JSON.stringify(fields) !== JSON.stringify(normalizedDefaults);
    } catch {
      return true;
    }
  }, [fields, normalizedDefaults]);
  // Inline-Create state for "BetreutePerson" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraBetreutePerson` list, and select it in
  // the originating Combobox via the captured `createBetreutePersonField`.
  const [createBetreutePersonOpen, setCreateBetreutePersonOpen] = useState(false);
  const [createBetreutePersonInitial, setCreateBetreutePersonInitial] = useState('');
  const [createBetreutePersonField, setCreateBetreutePersonField] = useState<string>('');
  const [extraBetreutePerson, setExtraBetreutePerson] = useState< BetreutePerson[]>([]);
  const betreutePersonListAll = useMemo(
    () => [...betreutePersonList, ...extraBetreutePerson],
    [betreutePersonList, extraBetreutePerson],
  );
  function openCreateBetreutePerson(fieldKey: string, q: string) {
    setCreateBetreutePersonField(fieldKey);
    setCreateBetreutePersonInitial(q);
    setCreateBetreutePersonOpen(true);
  }
  // Inline-Create state for "MassnahmePflegeplan" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraMassnahmePflegeplan` list, and select it in
  // the originating Combobox via the captured `createMassnahmePflegeplanField`.
  const [createMassnahmePflegeplanOpen, setCreateMassnahmePflegeplanOpen] = useState(false);
  const [createMassnahmePflegeplanInitial, setCreateMassnahmePflegeplanInitial] = useState('');
  const [createMassnahmePflegeplanField, setCreateMassnahmePflegeplanField] = useState<string>('');
  const [extraMassnahmePflegeplan, setExtraMassnahmePflegeplan] = useState< MassnahmePflegeplan[]>([]);
  const massnahmePflegeplanListAll = useMemo(
    () => [...massnahmePflegeplanList, ...extraMassnahmePflegeplan],
    [massnahmePflegeplanList, extraMassnahmePflegeplan],
  );
  function openCreateMassnahmePflegeplan(fieldKey: string, q: string) {
    setCreateMassnahmePflegeplanField(fieldKey);
    setCreateMassnahmePflegeplanInitial(q);
    setCreateMassnahmePflegeplanOpen(true);
  }
  // Inline-Create state for "Person" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraPerson` list, and select it in
  // the originating Combobox via the captured `createPersonField`.
  const [createPersonOpen, setCreatePersonOpen] = useState(false);
  const [createPersonInitial, setCreatePersonInitial] = useState('');
  const [createPersonField, setCreatePersonField] = useState<string>('');
  const [extraPerson, setExtraPerson] = useState< Person[]>([]);
  const personListAll = useMemo(
    () => [...personList, ...extraPerson],
    [personList, extraPerson],
  );
  function openCreatePerson(fieldKey: string, q: string) {
    setCreatePersonField(fieldKey);
    setCreatePersonInitial(q);
    setCreatePersonOpen(true);
  }
  // Inline-Create state for "Qualifikationsart" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraQualifikationsart` list, and select it in
  // the originating Combobox via the captured `createQualifikationsartField`.
  const [createQualifikationsartOpen, setCreateQualifikationsartOpen] = useState(false);
  const [createQualifikationsartInitial, setCreateQualifikationsartInitial] = useState('');
  const [createQualifikationsartField, setCreateQualifikationsartField] = useState<string>('');
  const [extraQualifikationsart, setExtraQualifikationsart] = useState< Qualifikationsart[]>([]);
  const qualifikationsartListAll = useMemo(
    () => [...qualifikationsartList, ...extraQualifikationsart],
    [qualifikationsartList, extraQualifikationsart],
  );
  function openCreateQualifikationsart(fieldKey: string, q: string) {
    setCreateQualifikationsartField(fieldKey);
    setCreateQualifikationsartInitial(q);
    setCreateQualifikationsartOpen(true);
  }
  // Inline-Create state for "KiExtrakt" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraKiExtrakt` list, and select it in
  // the originating Combobox via the captured `createKiExtraktField`.
  const [createKiExtraktOpen, setCreateKiExtraktOpen] = useState(false);
  const [createKiExtraktInitial, setCreateKiExtraktInitial] = useState('');
  const [createKiExtraktField, setCreateKiExtraktField] = useState<string>('');
  const [extraKiExtrakt, setExtraKiExtrakt] = useState< KiExtrakt[]>([]);
  const kiExtraktListAll = useMemo(
    () => [...kiExtraktList, ...extraKiExtrakt],
    [kiExtraktList, extraKiExtrakt],
  );
  function openCreateKiExtrakt(fieldKey: string, q: string) {
    setCreateKiExtraktField(fieldKey);
    setCreateKiExtraktInitial(q);
    setCreateKiExtraktOpen(true);
  }
  // Fields the plan assigns to a tool (empty without a plan).
  const SYSTEM_ASSIGNED: string[] = [];
  const PLAN_CREATE_PRESETS: Record<string, unknown> = {};
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['betreute_person', 'titel', 'aufgabenart', 'herkunft', 'prioritaet', 'status'] as const;
  const missingRequired = REQUIRED_FIELDS.filter(k => {
    const v = (fields as Record<string, unknown>)[k];
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiText, setAiText] = useState('');

  // Computed-field plumbing. Pure no-op when formEnhancements.computed is {}.
  // The number renderer uses computedValues only as a fallback when the user
  // hasn't typed anything — clearing the input always restores the computation.
  // computedContext exposes applookup list props so { kind: 'applookup', ... }
  // operands can resolve to numeric fields on the target record.
  const computedContext = useMemo<ComputedContext>(() => ({
    lookupLists: {
      'betreute_person': betreutePersonList,
      'quelle_massnahme': massnahmePflegeplanList,
      'zustaendig': personList,
      'mindestqualifikation': qualifikationsartList,
      'wartet_auf_person': personList,
      'vorgeschlagen_von': personList,
      'aktiviert_von': personList,
      'zugeordnet_von': personList,
      'begonnen_von': personList,
      'erledigt_von': personList,
      'verworfen_von': personList,
      'quelle_ki_extrakt': kiExtraktList,
    },
  }), [betreutePersonList, massnahmePflegeplanList, personList, qualifikationsartList, personList, personList, personList, personList, personList, personList, personList, kiExtraktList, ]);
  const computedValues = useMemo<Record<string, number | null>>(() => {
    let out: Record<string, number | null> = {};
    const entries = Object.entries(formEnhancements.computed);
    for (let i = 0; i < 5; i++) {
      const merged: Record<string, unknown> = { ...(fields as Record<string, unknown>) };
      for (const [k, v] of Object.entries(out)) {
        if (v === null) continue;
        const cur = merged[k];
        if (cur === undefined || cur === null || cur === '') merged[k] = v;
      }
      const next: Record<string, number | null> = {};
      let changed = false;
      for (const [key, spec] of entries) {
        const v = evalComputed(spec, merged, computedContext);
        next[key] = v;
        if (v !== out[key]) changed = true;
      }
      out = next;
      if (!changed) break;
    }
    return out;
  }, [fields, computedContext]);

  useEffect(() => {
    if (open) {
      setFields(applyDefaults({ ...(recordId ? {} : normalizeDefaults(PLAN_CREATE_PRESETS)), ...(normalizedDefaults ?? {}) }, formEnhancements.defaults) as Partial<Aufgabe['fields']>);
      setPreview(null);
      setScanSuccess(false);
      setAiText('');
      setSubmitError(null);
    }
  }, [open, normalizedDefaults]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  // Submit errors surface IN the dialog (it is modal — a banner in the page
  // body would be hidden behind it). A consumer onSubmit that THROWS (the
  // documented "throw to prevent closing" validation pattern) lands here:
  // the dialog stays open, nothing is saved, the message is visible.
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      // Fill empty number slots from computed values; user-typed values always win.
      // CRITICAL: only backend-mapped keys may be backfilled. Virtual computeds
      // (sub-agent invents `_netto`, `_bestellung_gesamtbetrag` etc. for the
      // "Berechnungen" display) have no backend counterpart — writing them
      // triggers a 422 from the Living-Apps API ("field does not exist").
      const merged = { ...fields };
      for (const [key, val] of Object.entries(computedValues)) {
        if (val === null) continue;
        if (!backendFieldSet.has(key)) continue;
        const cur = (merged as Record<string, unknown>)[key];
        if (cur === undefined || cur === null || cur === '') {
          (merged as Record<string, unknown>)[key] = val;
        }
      }
      const clean = cleanFieldsForApi(merged, 'aufgabe');
      await onSubmit(clean as Aufgabe['fields']);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error && err.message ? err.message : t('submit_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAiExtract(file?: File) {
    if (!file && !aiText.trim()) return;
    setScanning(true);
    setScanSuccess(false);
    try {
      let uri: string | undefined;
      let gps: { latitude: number; longitude: number } | null = null;
      let geoAddr = '';
      const parts: string[] = [];
      if (file) {
        const [dataUri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
        uri = dataUri;
        if (file.type.startsWith('image/')) setPreview(uri);
        gps = enablePhotoLocation ? meta?.gps ?? null : null;
        if (gps) {
          geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
          parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
          if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
        }
        if (meta?.dateTime) {
          parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
        }
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      contextParts.push(`<available-records field="betreute_person" entity="Betreute Person">\n${JSON.stringify(betreutePersonList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="quelle_massnahme" entity="Maßnahme (Pflegeplan)">\n${JSON.stringify(massnahmePflegeplanList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="zustaendig" entity="Person">\n${JSON.stringify(personList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="mindestqualifikation" entity="Qualifikationsart">\n${JSON.stringify(qualifikationsartList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="wartet_auf_person" entity="Person">\n${JSON.stringify(personList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="vorgeschlagen_von" entity="Person">\n${JSON.stringify(personList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="aktiviert_von" entity="Person">\n${JSON.stringify(personList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="zugeordnet_von" entity="Person">\n${JSON.stringify(personList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="begonnen_von" entity="Person">\n${JSON.stringify(personList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="erledigt_von" entity="Person">\n${JSON.stringify(personList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="verworfen_von" entity="Person">\n${JSON.stringify(personList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="quelle_ki_extrakt" entity="KI-Extrakt">\n${JSON.stringify(kiExtraktList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "betreute_person": string | null, // Display name from Betreute Person (see <available-records>)\n  "titel": string | null, // Titel\n  "beschreibung": string | null, // Beschreibung\n  "aufgabenart": LookupValue | null, // Aufgabenart (select one key: "pflegemassnahme" | "allgemeinzustand" | "medikation_klaeren" | "besorgung" | "behoerde_recht" | "arzt_verstaendigen" | "vermerk_naechster_besuch" | "sonstiges") mapping: pflegemassnahme=Pflegemaßnahme, allgemeinzustand=Allgemeinzustand, medikation_klaeren=Medikation klären, besorgung=Besorgung, behoerde_recht=Behörde / Recht, arzt_verstaendigen=Arzt verständigen, vermerk_naechster_besuch=Vermerk nächster Besuch, sonstiges=Sonstiges\n  "herkunft": LookupValue | null, // Herkunft (select one key: "pflegeplan" | "manuell" | "ki_vorschlag") mapping: pflegeplan=Pflegeplan, manuell=Manuell, ki_vorschlag=KI-Vorschlag\n  "quelle_massnahme": string | null, // Display name from Maßnahme (Pflegeplan) (see <available-records>)\n  "prioritaet": LookupValue | null, // Priorität (select one key: "normal" | "dringend") mapping: normal=Normal, dringend=Dringend\n  "zustaendig": string | null, // Display name from Person (see <available-records>)\n  "faelligkeitsart": LookupValue | null, // Fälligkeitsart (select one key: "naechster_besuch" | "datum" | "tageszeitfenster") mapping: naechster_besuch=Beim nächsten Besuch, datum=Datum, tageszeitfenster=Tageszeitfenster\n  "faelligkeitsdatum": string | null, // YYYY-MM-DD\n  "tageszeitfenster": LookupValue | null, // Tageszeitfenster (select one key: "morgens" | "mittags" | "abends" | "egal") mapping: morgens=Morgens, mittags=Mittags, abends=Abends, egal=Egal\n  "mindestqualifikation": string | null, // Display name from Qualifikationsart (see <available-records>)\n  "status": LookupValue | null, // Status (select one key: "vorschlag" | "offen" | "erledigt" | "nicht_durchgefuehrt" | "wartet_auf_dritte" | "verworfen") mapping: vorschlag=Vorschlag, offen=Offen, erledigt=Erledigt, nicht_durchgefuehrt=Nicht durchgeführt, wartet_auf_dritte=Wartet auf Dritte, verworfen=Verworfen\n  "nicht_durchgefuehrt_grund": string | null, // Grund für Nicht durchgeführt\n  "wartet_auf_person": string | null, // Display name from Person (see <available-records>)\n  "verworfen_grund": string | null, // Grund für Verwerfen\n  "ergebnis": LookupValue | null, // Ergebnis (nur bei Erledigt) (select one key: "erfolgreich" | "mit_schwierigkeiten" | "nicht_erfolgreich") mapping: erfolgreich=Erfolgreich, mit_schwierigkeiten=Mit Schwierigkeiten, nicht_erfolgreich=Nicht erfolgreich\n  "ergebniskommentar": string | null, // Ergebniskommentar\n  "vorgeschlagen_am": string | null, // YYYY-MM-DDTHH:MM\n  "vorgeschlagen_von": string | null, // Display name from Person (see <available-records>)\n  "aktiviert_am": string | null, // YYYY-MM-DDTHH:MM\n  "aktiviert_von": string | null, // Display name from Person (see <available-records>)\n  "zugeordnet_am": string | null, // YYYY-MM-DDTHH:MM\n  "zugeordnet_von": string | null, // Display name from Person (see <available-records>)\n  "begonnen_am": string | null, // YYYY-MM-DDTHH:MM\n  "begonnen_von": string | null, // Display name from Person (see <available-records>)\n  "erledigt_am": string | null, // YYYY-MM-DDTHH:MM\n  "erledigt_von": string | null, // Display name from Person (see <available-records>)\n  "verworfen_am": string | null, // YYYY-MM-DDTHH:MM\n  "verworfen_von": string | null, // Display name from Person (see <available-records>)\n  "quelle_ki_extrakt": string | null, // Display name from KI-Extrakt (see <available-records>)\n}`;
      const raw = await extractFromInput<Record<string, unknown>>(schema, {
        dataUri: uri,
        userText: aiText.trim() || undefined,
        photoContext,
        intent: DIALOG_INTENT,
      });
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["betreute_person", "quelle_massnahme", "zustaendig", "mindestqualifikation", "wartet_auf_person", "vorgeschlagen_von", "aktiviert_von", "zugeordnet_von", "begonnen_von", "erledigt_von", "verworfen_von", "quelle_ki_extrakt"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const betreute_personName = raw['betreute_person'] as string | null;
        if (betreute_personName) {
          const betreute_personMatch = betreutePersonList.find(r => matchName(betreute_personName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (betreute_personMatch) merged['betreute_person'] = createRecordUrl(APP_IDS.BETREUTE_PERSON, betreute_personMatch.record_id);
        }
        const quelle_massnahmeName = raw['quelle_massnahme'] as string | null;
        if (quelle_massnahmeName) {
          const quelle_massnahmeMatch = massnahmePflegeplanList.find(r => matchName(quelle_massnahmeName!, [String(r.fields.bezeichnung ?? '')]));
          if (quelle_massnahmeMatch) merged['quelle_massnahme'] = createRecordUrl(APP_IDS.MASSNAHME_PFLEGEPLAN, quelle_massnahmeMatch.record_id);
        }
        const zustaendigName = raw['zustaendig'] as string | null;
        if (zustaendigName) {
          const zustaendigMatch = personList.find(r => matchName(zustaendigName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (zustaendigMatch) merged['zustaendig'] = createRecordUrl(APP_IDS.PERSON, zustaendigMatch.record_id);
        }
        const mindestqualifikationName = raw['mindestqualifikation'] as string | null;
        if (mindestqualifikationName) {
          const mindestqualifikationMatch = qualifikationsartList.find(r => matchName(mindestqualifikationName!, [String(r.fields.bezeichnung ?? '')]));
          if (mindestqualifikationMatch) merged['mindestqualifikation'] = createRecordUrl(APP_IDS.QUALIFIKATIONSART, mindestqualifikationMatch.record_id);
        }
        const wartet_auf_personName = raw['wartet_auf_person'] as string | null;
        if (wartet_auf_personName) {
          const wartet_auf_personMatch = personList.find(r => matchName(wartet_auf_personName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (wartet_auf_personMatch) merged['wartet_auf_person'] = createRecordUrl(APP_IDS.PERSON, wartet_auf_personMatch.record_id);
        }
        const vorgeschlagen_vonName = raw['vorgeschlagen_von'] as string | null;
        if (vorgeschlagen_vonName) {
          const vorgeschlagen_vonMatch = personList.find(r => matchName(vorgeschlagen_vonName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (vorgeschlagen_vonMatch) merged['vorgeschlagen_von'] = createRecordUrl(APP_IDS.PERSON, vorgeschlagen_vonMatch.record_id);
        }
        const aktiviert_vonName = raw['aktiviert_von'] as string | null;
        if (aktiviert_vonName) {
          const aktiviert_vonMatch = personList.find(r => matchName(aktiviert_vonName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (aktiviert_vonMatch) merged['aktiviert_von'] = createRecordUrl(APP_IDS.PERSON, aktiviert_vonMatch.record_id);
        }
        const zugeordnet_vonName = raw['zugeordnet_von'] as string | null;
        if (zugeordnet_vonName) {
          const zugeordnet_vonMatch = personList.find(r => matchName(zugeordnet_vonName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (zugeordnet_vonMatch) merged['zugeordnet_von'] = createRecordUrl(APP_IDS.PERSON, zugeordnet_vonMatch.record_id);
        }
        const begonnen_vonName = raw['begonnen_von'] as string | null;
        if (begonnen_vonName) {
          const begonnen_vonMatch = personList.find(r => matchName(begonnen_vonName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (begonnen_vonMatch) merged['begonnen_von'] = createRecordUrl(APP_IDS.PERSON, begonnen_vonMatch.record_id);
        }
        const erledigt_vonName = raw['erledigt_von'] as string | null;
        if (erledigt_vonName) {
          const erledigt_vonMatch = personList.find(r => matchName(erledigt_vonName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (erledigt_vonMatch) merged['erledigt_von'] = createRecordUrl(APP_IDS.PERSON, erledigt_vonMatch.record_id);
        }
        const verworfen_vonName = raw['verworfen_von'] as string | null;
        if (verworfen_vonName) {
          const verworfen_vonMatch = personList.find(r => matchName(verworfen_vonName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (verworfen_vonMatch) merged['verworfen_von'] = createRecordUrl(APP_IDS.PERSON, verworfen_vonMatch.record_id);
        }
        const quelle_ki_extraktName = raw['quelle_ki_extrakt'] as string | null;
        if (quelle_ki_extraktName) {
          const quelle_ki_extraktMatch = kiExtraktList.find(r => matchName(quelle_ki_extraktName!, [String(r.fields.inhalt ?? '')]));
          if (quelle_ki_extraktMatch) merged['quelle_ki_extrakt'] = createRecordUrl(APP_IDS.KI_EXTRAKT, quelle_ki_extraktMatch.record_id);
        }
        return merged as Partial<Aufgabe['fields']>;
      });
      setAiText('');
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error(`${t('scan_error')}:`, err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleAiExtract(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleAiExtract(file);
    }
  }, []);

  // EDIT is a record, not a prefill: openCreate(defaults) used to read „bearbeiten“
  // (acceptance 4, L-42) because the title keyed on defaultValues
  const DIALOG_INTENT = recordId
    ? (formEnhancements.title?.edit ?? t('edit_entity', { entity: appLabel('aufgabe') }))
    : (formEnhancements.title?.create ?? t('new_entity', { entity: appLabel('aufgabe') }));
  // the dialog's word for a field — the config may rename it (S-3)
  const labelFor = (k: string) => dialogLabel(formEnhancements, k, fieldLabel('aufgabe', k));

  const fieldBlocks: Record<string, React.ReactNode> = {
    'betreute_person': (
      <div key="betreute_person" className="space-y-1.5">
        <Label htmlFor="betreute_person">{labelFor('betreute_person')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="betreute_person"
          placeholder="Welche Person wird betreut?"
          items={betreutePersonListAll.map(r => ({
            id: r.record_id,
            label: displayNameOf('betreute_person', r.fields as Record<string, unknown>) || r.record_id,
          }))}
          value={extractRecordId(fields.betreute_person)}
          onChange={id => setFields(f => ({ ...f, betreute_person: id ? createRecordUrl(APP_IDS.BETREUTE_PERSON, id) : undefined }))}
          onCreateNew={(q) => openCreateBetreutePerson("betreute_person", q)}
          createLabel={t('create_in', { entity: appLabel('betreute_person') })}
        />
        {showErrors && !fields.betreute_person && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('aufgabe', 'betreute_person')}</p>
        )}
      </div>
    ),
    'titel': (
      <div key="titel" className="space-y-1.5">
        <Label htmlFor="titel">{labelFor('titel')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="titel"
          placeholder="z. B. Blutdruck messen"
          value={fields.titel ?? ''}
          onChange={e => setFields(f => ({ ...f, titel: e.target.value }))}
          required
        />
        {showErrors && !fields.titel && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('aufgabe', 'titel')}</p>
        )}
      </div>
    ),
    'beschreibung': (
      <div key="beschreibung" className="space-y-1.5">
        <Label htmlFor="beschreibung">{labelFor('beschreibung')}</Label>
        <Textarea
          id="beschreibung"
          placeholder="Was ist zu tun?"
          value={fields.beschreibung ?? ''}
          onChange={e => setFields(f => ({ ...f, beschreibung: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'aufgabenart': (
      <div key="aufgabenart" className="space-y-1.5">
        <Label htmlFor="aufgabenart">{labelFor('aufgabenart')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.aufgabenart) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, aufgabenart: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="aufgabenart" className="max-sm:h-11"><SelectValue placeholder="z. B. Besorgung, Pflegemaßnahme" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="pflegemassnahme">{lookupLabel('aufgabe', 'aufgabenart', 'pflegemassnahme') ?? 'Pflegemaßnahme'}</SelectItem>
            <SelectItem value="allgemeinzustand">{lookupLabel('aufgabe', 'aufgabenart', 'allgemeinzustand') ?? 'Allgemeinzustand'}</SelectItem>
            <SelectItem value="medikation_klaeren">{lookupLabel('aufgabe', 'aufgabenart', 'medikation_klaeren') ?? 'Medikation klären'}</SelectItem>
            <SelectItem value="besorgung">{lookupLabel('aufgabe', 'aufgabenart', 'besorgung') ?? 'Besorgung'}</SelectItem>
            <SelectItem value="behoerde_recht">{lookupLabel('aufgabe', 'aufgabenart', 'behoerde_recht') ?? 'Behörde / Recht'}</SelectItem>
            <SelectItem value="arzt_verstaendigen">{lookupLabel('aufgabe', 'aufgabenart', 'arzt_verstaendigen') ?? 'Arzt verständigen'}</SelectItem>
            <SelectItem value="vermerk_naechster_besuch">{lookupLabel('aufgabe', 'aufgabenart', 'vermerk_naechster_besuch') ?? 'Vermerk nächster Besuch'}</SelectItem>
            <SelectItem value="sonstiges">{lookupLabel('aufgabe', 'aufgabenart', 'sonstiges') ?? 'Sonstiges'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.aufgabenart && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('aufgabe', 'aufgabenart')}</p>
        )}
      </div>
    ),
    'herkunft': (
      <div key="herkunft" className="space-y-1.5">
        <Label htmlFor="herkunft">{labelFor('herkunft')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.herkunft) === 'pflegeplan'}
            onClick={() => setFields(f => ({ ...f, herkunft: (lookupKey(f.herkunft) === 'pflegeplan' ? undefined : 'pflegeplan') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.herkunft) === 'pflegeplan'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'herkunft', 'pflegeplan') ?? 'Pflegeplan'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.herkunft) === 'manuell'}
            onClick={() => setFields(f => ({ ...f, herkunft: (lookupKey(f.herkunft) === 'manuell' ? undefined : 'manuell') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.herkunft) === 'manuell'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'herkunft', 'manuell') ?? 'Manuell'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.herkunft) === 'ki_vorschlag'}
            onClick={() => setFields(f => ({ ...f, herkunft: (lookupKey(f.herkunft) === 'ki_vorschlag' ? undefined : 'ki_vorschlag') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.herkunft) === 'ki_vorschlag'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'herkunft', 'ki_vorschlag') ?? 'KI-Vorschlag'}
          </button>
        </div>
        {showErrors && !fields.herkunft && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('aufgabe', 'herkunft')}</p>
        )}
      </div>
    ),
    'quelle_massnahme': (
      <div key="quelle_massnahme" className="space-y-1.5">
        <Label htmlFor="quelle_massnahme">{labelFor('quelle_massnahme')}</Label>
        <Combobox
          id="quelle_massnahme"
          placeholder="Welche Maßnahme?"
          items={((pid) => (pid ? massnahmePflegeplanListAll.filter(r => extractRecordId(r.fields.betreute_person) === pid) : massnahmePflegeplanListAll))(extractRecordId(fields.betreute_person)).map(r => ({
            id: r.record_id,
            label: displayNameOf('massnahme_(pflegeplan)', r.fields as Record<string, unknown>) || r.record_id,
          }))}
          value={extractRecordId(fields.quelle_massnahme)}
          onChange={id => setFields(f => ({ ...f, quelle_massnahme: id ? createRecordUrl(APP_IDS.MASSNAHME_PFLEGEPLAN, id) : undefined }))}
          onCreateNew={(q) => openCreateMassnahmePflegeplan("quelle_massnahme", q)}
          createLabel={t('create_in', { entity: appLabel('massnahme_(pflegeplan)') })}
        />
      </div>
    ),
    'prioritaet': (
      <div key="prioritaet" className="space-y-1.5">
        <Label htmlFor="prioritaet">{labelFor('prioritaet')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.prioritaet) === 'normal'}
            onClick={() => setFields(f => ({ ...f, prioritaet: (lookupKey(f.prioritaet) === 'normal' ? undefined : 'normal') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.prioritaet) === 'normal'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'prioritaet', 'normal') ?? 'Normal'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.prioritaet) === 'dringend'}
            onClick={() => setFields(f => ({ ...f, prioritaet: (lookupKey(f.prioritaet) === 'dringend' ? undefined : 'dringend') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.prioritaet) === 'dringend'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'prioritaet', 'dringend') ?? 'Dringend'}
          </button>
        </div>
        {showErrors && !fields.prioritaet && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('aufgabe', 'prioritaet')}</p>
        )}
      </div>
    ),
    'zustaendig': (
      <div key="zustaendig" className="space-y-1.5">
        <Label htmlFor="zustaendig">{labelFor('zustaendig')}</Label>
        <Combobox
          id="zustaendig"
          placeholder="Wer ist zuständig?"
          items={personListAll.map(r => ({
            id: r.record_id,
            label: displayNameOf('person', r.fields as Record<string, unknown>) || r.record_id,
          }))}
          value={extractRecordId(fields.zustaendig)}
          onChange={id => setFields(f => ({ ...f, zustaendig: id ? createRecordUrl(APP_IDS.PERSON, id) : undefined }))}
          onCreateNew={(q) => openCreatePerson("zustaendig", q)}
          createLabel={t('create_in', { entity: appLabel('person') })}
        />
      </div>
    ),
    'faelligkeitsart': (
      <div key="faelligkeitsart" className="space-y-1.5">
        <Label htmlFor="faelligkeitsart">{labelFor('faelligkeitsart')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.faelligkeitsart) === 'naechster_besuch'}
            onClick={() => setFields(f => ({ ...f, faelligkeitsart: (lookupKey(f.faelligkeitsart) === 'naechster_besuch' ? undefined : 'naechster_besuch') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.faelligkeitsart) === 'naechster_besuch'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'faelligkeitsart', 'naechster_besuch') ?? 'Beim nächsten Besuch'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.faelligkeitsart) === 'datum'}
            onClick={() => setFields(f => ({ ...f, faelligkeitsart: (lookupKey(f.faelligkeitsart) === 'datum' ? undefined : 'datum') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.faelligkeitsart) === 'datum'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'faelligkeitsart', 'datum') ?? 'Datum'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.faelligkeitsart) === 'tageszeitfenster'}
            onClick={() => setFields(f => ({ ...f, faelligkeitsart: (lookupKey(f.faelligkeitsart) === 'tageszeitfenster' ? undefined : 'tageszeitfenster') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.faelligkeitsart) === 'tageszeitfenster'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'faelligkeitsart', 'tageszeitfenster') ?? 'Tageszeitfenster'}
          </button>
        </div>
      </div>
    ),
    'faelligkeitsdatum': (
      <div key="faelligkeitsdatum" className="space-y-1.5">
        <Label htmlFor="faelligkeitsdatum">{labelFor('faelligkeitsdatum')}</Label>
        <DatePicker
          id="faelligkeitsdatum"
          placeholder="Bis wann ist es fällig?"
          mode="date"
          value={fields.faelligkeitsdatum ?? null}
          onChange={v => setFields(f => ({ ...f, faelligkeitsdatum: v ?? undefined }))}
        />
      </div>
    ),
    'tageszeitfenster': (
      <div key="tageszeitfenster" className="space-y-1.5">
        <Label htmlFor="tageszeitfenster">{labelFor('tageszeitfenster')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.tageszeitfenster) === 'morgens'}
            onClick={() => setFields(f => ({ ...f, tageszeitfenster: (lookupKey(f.tageszeitfenster) === 'morgens' ? undefined : 'morgens') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.tageszeitfenster) === 'morgens'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'tageszeitfenster', 'morgens') ?? 'Morgens'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.tageszeitfenster) === 'mittags'}
            onClick={() => setFields(f => ({ ...f, tageszeitfenster: (lookupKey(f.tageszeitfenster) === 'mittags' ? undefined : 'mittags') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.tageszeitfenster) === 'mittags'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'tageszeitfenster', 'mittags') ?? 'Mittags'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.tageszeitfenster) === 'abends'}
            onClick={() => setFields(f => ({ ...f, tageszeitfenster: (lookupKey(f.tageszeitfenster) === 'abends' ? undefined : 'abends') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.tageszeitfenster) === 'abends'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'tageszeitfenster', 'abends') ?? 'Abends'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.tageszeitfenster) === 'egal'}
            onClick={() => setFields(f => ({ ...f, tageszeitfenster: (lookupKey(f.tageszeitfenster) === 'egal' ? undefined : 'egal') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.tageszeitfenster) === 'egal'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'tageszeitfenster', 'egal') ?? 'Egal'}
          </button>
        </div>
      </div>
    ),
    'mindestqualifikation': (
      <div key="mindestqualifikation" className="space-y-1.5">
        <Label htmlFor="mindestqualifikation">{labelFor('mindestqualifikation')}</Label>
        <Combobox
          id="mindestqualifikation"
          placeholder="Welche Qualifikation?"
          items={qualifikationsartListAll.map(r => ({
            id: r.record_id,
            label: displayNameOf('qualifikationsart', r.fields as Record<string, unknown>) || r.record_id,
          }))}
          value={extractRecordId(fields.mindestqualifikation)}
          onChange={id => setFields(f => ({ ...f, mindestqualifikation: id ? createRecordUrl(APP_IDS.QUALIFIKATIONSART, id) : undefined }))}
          onCreateNew={(q) => openCreateQualifikationsart("mindestqualifikation", q)}
          createLabel={t('create_in', { entity: appLabel('qualifikationsart') })}
        />
      </div>
    ),
    'status': (
      <div key="status" className="space-y-1.5">
        <Label htmlFor="status">{labelFor('status')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.status) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, status: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="status" className="max-sm:h-11"><SelectValue placeholder="z. B. Offen, Erledigt" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="vorschlag">{lookupLabel('aufgabe', 'status', 'vorschlag') ?? 'Vorschlag'}</SelectItem>
            <SelectItem value="offen">{lookupLabel('aufgabe', 'status', 'offen') ?? 'Offen'}</SelectItem>
            <SelectItem value="erledigt">{lookupLabel('aufgabe', 'status', 'erledigt') ?? 'Erledigt'}</SelectItem>
            <SelectItem value="nicht_durchgefuehrt">{lookupLabel('aufgabe', 'status', 'nicht_durchgefuehrt') ?? 'Nicht durchgeführt'}</SelectItem>
            <SelectItem value="wartet_auf_dritte">{lookupLabel('aufgabe', 'status', 'wartet_auf_dritte') ?? 'Wartet auf Dritte'}</SelectItem>
            <SelectItem value="verworfen">{lookupLabel('aufgabe', 'status', 'verworfen') ?? 'Verworfen'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.status && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('aufgabe', 'status')}</p>
        )}
      </div>
    ),
    'nicht_durchgefuehrt_grund': (
      <div key="nicht_durchgefuehrt_grund" className="space-y-1.5">
        <Label htmlFor="nicht_durchgefuehrt_grund">{labelFor('nicht_durchgefuehrt_grund')}</Label>
        <Input
          id="nicht_durchgefuehrt_grund"
          placeholder="z. B. Person nicht angetroffen"
          value={fields.nicht_durchgefuehrt_grund ?? ''}
          onChange={e => setFields(f => ({ ...f, nicht_durchgefuehrt_grund: e.target.value }))}
        />
      </div>
    ),
    'wartet_auf_person': (
      <div key="wartet_auf_person" className="space-y-1.5">
        <Label htmlFor="wartet_auf_person">{labelFor('wartet_auf_person')}</Label>
        <Combobox
          id="wartet_auf_person"
          placeholder="Auf wen wird gewartet?"
          items={personListAll.map(r => ({
            id: r.record_id,
            label: displayNameOf('person', r.fields as Record<string, unknown>) || r.record_id,
          }))}
          value={extractRecordId(fields.wartet_auf_person)}
          onChange={id => setFields(f => ({ ...f, wartet_auf_person: id ? createRecordUrl(APP_IDS.PERSON, id) : undefined }))}
          onCreateNew={(q) => openCreatePerson("wartet_auf_person", q)}
          createLabel={t('create_in', { entity: appLabel('person') })}
        />
      </div>
    ),
    'verworfen_grund': (
      <div key="verworfen_grund" className="space-y-1.5">
        <Label htmlFor="verworfen_grund">{labelFor('verworfen_grund')}</Label>
        <Input
          id="verworfen_grund"
          placeholder="z. B. Nicht mehr nötig"
          value={fields.verworfen_grund ?? ''}
          onChange={e => setFields(f => ({ ...f, verworfen_grund: e.target.value }))}
        />
      </div>
    ),
    'ergebnis': (
      <div key="ergebnis" className="space-y-1.5">
        <Label htmlFor="ergebnis">{labelFor('ergebnis')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.ergebnis) === 'erfolgreich'}
            onClick={() => setFields(f => ({ ...f, ergebnis: (lookupKey(f.ergebnis) === 'erfolgreich' ? undefined : 'erfolgreich') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.ergebnis) === 'erfolgreich'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'ergebnis', 'erfolgreich') ?? 'Erfolgreich'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.ergebnis) === 'mit_schwierigkeiten'}
            onClick={() => setFields(f => ({ ...f, ergebnis: (lookupKey(f.ergebnis) === 'mit_schwierigkeiten' ? undefined : 'mit_schwierigkeiten') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.ergebnis) === 'mit_schwierigkeiten'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'ergebnis', 'mit_schwierigkeiten') ?? 'Mit Schwierigkeiten'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.ergebnis) === 'nicht_erfolgreich'}
            onClick={() => setFields(f => ({ ...f, ergebnis: (lookupKey(f.ergebnis) === 'nicht_erfolgreich' ? undefined : 'nicht_erfolgreich') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.ergebnis) === 'nicht_erfolgreich'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('aufgabe', 'ergebnis', 'nicht_erfolgreich') ?? 'Nicht erfolgreich'}
          </button>
        </div>
      </div>
    ),
    'ergebniskommentar': (
      <div key="ergebniskommentar" className="space-y-1.5">
        <Label htmlFor="ergebniskommentar">{labelFor('ergebniskommentar')}</Label>
        <Textarea
          id="ergebniskommentar"
          placeholder="Wie ist es gelaufen?"
          value={fields.ergebniskommentar ?? ''}
          onChange={e => setFields(f => ({ ...f, ergebniskommentar: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'vorgeschlagen_am': (
      <div key="vorgeschlagen_am" className="space-y-1.5">
        <Label htmlFor="vorgeschlagen_am">{labelFor('vorgeschlagen_am')}</Label>
        <DatePicker
          id="vorgeschlagen_am"
          placeholder="Wann wurde es vorgeschlagen?"
          mode="datetime"
          value={fields.vorgeschlagen_am ?? null}
          onChange={v => setFields(f => ({ ...f, vorgeschlagen_am: v ?? undefined }))}
        />
      </div>
    ),
    'vorgeschlagen_von': (
      <div key="vorgeschlagen_von" className="space-y-1.5">
        <Label htmlFor="vorgeschlagen_von">{labelFor('vorgeschlagen_von')}</Label>
        <Combobox
          id="vorgeschlagen_von"
          placeholder="Wer hat es vorgeschlagen?"
          items={personListAll.map(r => ({
            id: r.record_id,
            label: displayNameOf('person', r.fields as Record<string, unknown>) || r.record_id,
          }))}
          value={extractRecordId(fields.vorgeschlagen_von)}
          onChange={id => setFields(f => ({ ...f, vorgeschlagen_von: id ? createRecordUrl(APP_IDS.PERSON, id) : undefined }))}
          onCreateNew={(q) => openCreatePerson("vorgeschlagen_von", q)}
          createLabel={t('create_in', { entity: appLabel('person') })}
        />
      </div>
    ),
    'aktiviert_am': (
      <div key="aktiviert_am" className="space-y-1.5">
        <Label htmlFor="aktiviert_am">{labelFor('aktiviert_am')}</Label>
        <DatePicker
          id="aktiviert_am"
          placeholder="Wann wurde es aktiviert?"
          mode="datetime"
          value={fields.aktiviert_am ?? null}
          onChange={v => setFields(f => ({ ...f, aktiviert_am: v ?? undefined }))}
        />
      </div>
    ),
    'aktiviert_von': (
      <div key="aktiviert_von" className="space-y-1.5">
        <Label htmlFor="aktiviert_von">{labelFor('aktiviert_von')}</Label>
        <Combobox
          id="aktiviert_von"
          placeholder="Wer hat es aktiviert?"
          items={personListAll.map(r => ({
            id: r.record_id,
            label: displayNameOf('person', r.fields as Record<string, unknown>) || r.record_id,
          }))}
          value={extractRecordId(fields.aktiviert_von)}
          onChange={id => setFields(f => ({ ...f, aktiviert_von: id ? createRecordUrl(APP_IDS.PERSON, id) : undefined }))}
          onCreateNew={(q) => openCreatePerson("aktiviert_von", q)}
          createLabel={t('create_in', { entity: appLabel('person') })}
        />
      </div>
    ),
    'zugeordnet_am': (
      <div key="zugeordnet_am" className="space-y-1.5">
        <Label htmlFor="zugeordnet_am">{labelFor('zugeordnet_am')}</Label>
        <DatePicker
          id="zugeordnet_am"
          placeholder="Wann wurde es zugeordnet?"
          mode="datetime"
          value={fields.zugeordnet_am ?? null}
          onChange={v => setFields(f => ({ ...f, zugeordnet_am: v ?? undefined }))}
        />
      </div>
    ),
    'zugeordnet_von': (
      <div key="zugeordnet_von" className="space-y-1.5">
        <Label htmlFor="zugeordnet_von">{labelFor('zugeordnet_von')}</Label>
        <Combobox
          id="zugeordnet_von"
          placeholder="Wer hat es zugeordnet?"
          items={personListAll.map(r => ({
            id: r.record_id,
            label: displayNameOf('person', r.fields as Record<string, unknown>) || r.record_id,
          }))}
          value={extractRecordId(fields.zugeordnet_von)}
          onChange={id => setFields(f => ({ ...f, zugeordnet_von: id ? createRecordUrl(APP_IDS.PERSON, id) : undefined }))}
          onCreateNew={(q) => openCreatePerson("zugeordnet_von", q)}
          createLabel={t('create_in', { entity: appLabel('person') })}
        />
      </div>
    ),
    'begonnen_am': (
      <div key="begonnen_am" className="space-y-1.5">
        <Label htmlFor="begonnen_am">{labelFor('begonnen_am')}</Label>
        <DatePicker
          id="begonnen_am"
          placeholder="Wann wurde begonnen?"
          mode="datetime"
          value={fields.begonnen_am ?? null}
          onChange={v => setFields(f => ({ ...f, begonnen_am: v ?? undefined }))}
        />
      </div>
    ),
    'begonnen_von': (
      <div key="begonnen_von" className="space-y-1.5">
        <Label htmlFor="begonnen_von">{labelFor('begonnen_von')}</Label>
        <Combobox
          id="begonnen_von"
          placeholder="Wer hat begonnen?"
          items={personListAll.map(r => ({
            id: r.record_id,
            label: displayNameOf('person', r.fields as Record<string, unknown>) || r.record_id,
          }))}
          value={extractRecordId(fields.begonnen_von)}
          onChange={id => setFields(f => ({ ...f, begonnen_von: id ? createRecordUrl(APP_IDS.PERSON, id) : undefined }))}
          onCreateNew={(q) => openCreatePerson("begonnen_von", q)}
          createLabel={t('create_in', { entity: appLabel('person') })}
        />
      </div>
    ),
    'erledigt_am': (
      <div key="erledigt_am" className="space-y-1.5">
        <Label htmlFor="erledigt_am">{labelFor('erledigt_am')}</Label>
        <DatePicker
          id="erledigt_am"
          placeholder="Wann wurde es erledigt?"
          mode="datetime"
          value={fields.erledigt_am ?? null}
          onChange={v => setFields(f => ({ ...f, erledigt_am: v ?? undefined }))}
        />
      </div>
    ),
    'erledigt_von': (
      <div key="erledigt_von" className="space-y-1.5">
        <Label htmlFor="erledigt_von">{labelFor('erledigt_von')}</Label>
        <Combobox
          id="erledigt_von"
          placeholder="Wer hat es erledigt?"
          items={personListAll.map(r => ({
            id: r.record_id,
            label: displayNameOf('person', r.fields as Record<string, unknown>) || r.record_id,
          }))}
          value={extractRecordId(fields.erledigt_von)}
          onChange={id => setFields(f => ({ ...f, erledigt_von: id ? createRecordUrl(APP_IDS.PERSON, id) : undefined }))}
          onCreateNew={(q) => openCreatePerson("erledigt_von", q)}
          createLabel={t('create_in', { entity: appLabel('person') })}
        />
      </div>
    ),
    'verworfen_am': (
      <div key="verworfen_am" className="space-y-1.5">
        <Label htmlFor="verworfen_am">{labelFor('verworfen_am')}</Label>
        <DatePicker
          id="verworfen_am"
          placeholder="Wann wurde es verworfen?"
          mode="datetime"
          value={fields.verworfen_am ?? null}
          onChange={v => setFields(f => ({ ...f, verworfen_am: v ?? undefined }))}
        />
      </div>
    ),
    'verworfen_von': (
      <div key="verworfen_von" className="space-y-1.5">
        <Label htmlFor="verworfen_von">{labelFor('verworfen_von')}</Label>
        <Combobox
          id="verworfen_von"
          placeholder="Wer hat es verworfen?"
          items={personListAll.map(r => ({
            id: r.record_id,
            label: displayNameOf('person', r.fields as Record<string, unknown>) || r.record_id,
          }))}
          value={extractRecordId(fields.verworfen_von)}
          onChange={id => setFields(f => ({ ...f, verworfen_von: id ? createRecordUrl(APP_IDS.PERSON, id) : undefined }))}
          onCreateNew={(q) => openCreatePerson("verworfen_von", q)}
          createLabel={t('create_in', { entity: appLabel('person') })}
        />
      </div>
    ),
    'quelle_ki_extrakt': (
      <div key="quelle_ki_extrakt" className="space-y-1.5">
        <Label htmlFor="quelle_ki_extrakt">{labelFor('quelle_ki_extrakt')}</Label>
        <Combobox
          id="quelle_ki_extrakt"
          placeholder="Welcher KI-Extrakt?"
          items={kiExtraktListAll.map(r => ({
            id: r.record_id,
            label: displayNameOf('ki_extrakt', r.fields as Record<string, unknown>) || r.record_id,
          }))}
          value={extractRecordId(fields.quelle_ki_extrakt)}
          onChange={id => setFields(f => ({ ...f, quelle_ki_extrakt: id ? createRecordUrl(APP_IDS.KI_EXTRAKT, id) : undefined }))}
          onCreateNew={(q) => openCreateKiExtrakt("quelle_ki_extrakt", q)}
          createLabel={t('create_in', { entity: appLabel('ki_extrakt') })}
        />
      </div>
    ),
  };
  // Fields this dialog never shows: the config's `hidden` and the fields the
  // OVERVIEW changes with its own button (plan.dashboard.writes, how: button —
  // a control, not a form value; S-3). A required field stays visible.
  const DASHBOARD_BUTTON_FIELDS: string[] = [];
  const ALWAYS_SHOWN: string[] = ['betreute_person', 'titel', 'aufgabenart', 'herkunft', 'prioritaet', 'status'];
  // the values the plan's create flow sets itself (fixed:…): preset on create and
  // not asked — the dialog is the record's door, the flow's rule still holds (S-12)
  const HIDDEN = new Set<string>([...(formEnhancements.hidden ?? []), ...DASHBOARD_BUTTON_FIELDS, ...(recordId ? [] : Object.keys(PLAN_CREATE_PRESETS))].filter(k => !ALWAYS_SHOWN.includes(k)));
  const orderedFields = dropHidden(applyFieldOrder(Object.keys(fieldBlocks), formEnhancements.fieldOrder), HIDDEN);
  const orderedFieldsKey = orderedFields.map((it) => typeof it === 'string' ? it : it.row.join('+')).join(',');

  // Render-Modell für Computed-Felder:
  //
  //   • BACKEND-FELDER mit computed-Eintrag (z.B. gesamtpreis bei einer
  //     Katzenpension) bleiben als normales Eingabe-Feld stehen. Der Number-
  //     Input nutzt den computed-Wert als Vorschlag, der User kann jederzeit
  //     überschreiben (clearing → restore computed).
  //   • VIRTUELLE computed-Keys (Eintrag in formEnhancements.computed, ABER
  //     kein passendes Backend-Feld in orderedFields) erscheinen NICHT als
  //     Input, sondern unten als kompakte 'Berechnungen'-Übersicht oder als
  //     Inline-Hint unter dem letzten beitragenden Input.
  const FIELD_LABELS: Record<string, string> = {"betreute_person": "Betreute Person", "titel": "Titel", "beschreibung": "Beschreibung", "aufgabenart": "Aufgabenart", "herkunft": "Herkunft", "quelle_massnahme": "Quelle: Maßnahme", "prioritaet": "Priorität", "zustaendig": "Zuständig", "faelligkeitsart": "Fälligkeitsart", "faelligkeitsdatum": "Fälligkeitsdatum", "tageszeitfenster": "Tageszeitfenster", "mindestqualifikation": "Mindestqualifikation", "status": "Status", "nicht_durchgefuehrt_grund": "Grund für Nicht durchgeführt", "wartet_auf_person": "Wartet auf (Person)", "verworfen_grund": "Grund für Verwerfen", "ergebnis": "Ergebnis (nur bei Erledigt)", "ergebniskommentar": "Ergebniskommentar", "vorgeschlagen_am": "Vorgeschlagen am", "vorgeschlagen_von": "Vorgeschlagen von", "aktiviert_am": "Aktiviert am", "aktiviert_von": "Aktiviert von", "zugeordnet_am": "Zugeordnet am", "zugeordnet_von": "Zugeordnet von", "begonnen_am": "Begonnen am", "begonnen_von": "Begonnen von", "erledigt_am": "Erledigt am", "erledigt_von": "Erledigt von", "verworfen_am": "Verworfen am", "verworfen_von": "Verworfen von", "quelle_ki_extrakt": "Quelle: KI-Extrakt"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"betreute_person": {"vorname": "Vorname", "nachname": "Nachname", "geburtsdatum": "Geburtsdatum", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "PLZ", "ort": "Ort", "land": "Land", "koordinaten": "Koordinaten", "geocoding_status": "Geocoding-Status", "einrichtung": "Einrichtung", "zimmer": "Zimmer / Wohnbereich", "zugangshinweise": "Zugangshinweise", "betreuungsbeginn": "Betreuungsbeginn", "betreuungsende": "Betreuungsende (leer = laufend)", "status": "Status", "allergien": "Allergien und Unverträglichkeiten", "wichtige_hinweise": "Wichtige Hinweise", "hausarzt": "Hausarzt", "ansprechperson": "Ansprechperson", "beziehung_ansprechperson": "Beziehung der Ansprechperson", "ersatz_ansprechperson": "Ersatz-Ansprechperson", "aktiv": "Aktiv"}, "quelle_massnahme": {"betreute_person": "Betreute Person", "bezeichnung": "Bezeichnung", "massnahmenart": "Maßnahmenart", "beschreibung": "Beschreibung", "wiederholungsregel": "Wiederholungsregel", "intervall_tage": "Intervall in Tagen (bei jeden n-ten Tag)", "wochentage": "Wochentage", "tageszeitfenster": "Tageszeitfenster", "gueltig_ab": "Gültig ab", "gueltig_bis": "Gültig bis", "mindestqualifikation": "Mindestqualifikation", "verordnet_von": "Verordnet von", "aktiv": "Aktiv"}, "zustaendig": {"vorname": "Vorname", "nachname": "Nachname", "personentyp": "Personentyp", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "PLZ", "ort": "Ort", "land": "Land", "koordinaten": "Koordinaten", "geocoding_status": "Geocoding-Status", "email": "E-Mail", "telefon": "Telefon", "mobil": "Mobil", "benutzerkonto": "Benutzerkonto", "aktiv_von": "Aktiv von", "aktiv_bis": "Aktiv bis", "bemerkung": "Bemerkung", "aktiv": "Aktiv"}, "mindestqualifikation": {"bezeichnung": "Bezeichnung", "beschreibung": "Beschreibung", "nachweis_erforderlich": "Nachweis erforderlich", "aktiv": "Aktiv"}, "wartet_auf_person": {"vorname": "Vorname", "nachname": "Nachname", "personentyp": "Personentyp", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "PLZ", "ort": "Ort", "land": "Land", "koordinaten": "Koordinaten", "geocoding_status": "Geocoding-Status", "email": "E-Mail", "telefon": "Telefon", "mobil": "Mobil", "benutzerkonto": "Benutzerkonto", "aktiv_von": "Aktiv von", "aktiv_bis": "Aktiv bis", "bemerkung": "Bemerkung", "aktiv": "Aktiv"}, "vorgeschlagen_von": {"vorname": "Vorname", "nachname": "Nachname", "personentyp": "Personentyp", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "PLZ", "ort": "Ort", "land": "Land", "koordinaten": "Koordinaten", "geocoding_status": "Geocoding-Status", "email": "E-Mail", "telefon": "Telefon", "mobil": "Mobil", "benutzerkonto": "Benutzerkonto", "aktiv_von": "Aktiv von", "aktiv_bis": "Aktiv bis", "bemerkung": "Bemerkung", "aktiv": "Aktiv"}, "aktiviert_von": {"vorname": "Vorname", "nachname": "Nachname", "personentyp": "Personentyp", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "PLZ", "ort": "Ort", "land": "Land", "koordinaten": "Koordinaten", "geocoding_status": "Geocoding-Status", "email": "E-Mail", "telefon": "Telefon", "mobil": "Mobil", "benutzerkonto": "Benutzerkonto", "aktiv_von": "Aktiv von", "aktiv_bis": "Aktiv bis", "bemerkung": "Bemerkung", "aktiv": "Aktiv"}, "zugeordnet_von": {"vorname": "Vorname", "nachname": "Nachname", "personentyp": "Personentyp", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "PLZ", "ort": "Ort", "land": "Land", "koordinaten": "Koordinaten", "geocoding_status": "Geocoding-Status", "email": "E-Mail", "telefon": "Telefon", "mobil": "Mobil", "benutzerkonto": "Benutzerkonto", "aktiv_von": "Aktiv von", "aktiv_bis": "Aktiv bis", "bemerkung": "Bemerkung", "aktiv": "Aktiv"}, "begonnen_von": {"vorname": "Vorname", "nachname": "Nachname", "personentyp": "Personentyp", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "PLZ", "ort": "Ort", "land": "Land", "koordinaten": "Koordinaten", "geocoding_status": "Geocoding-Status", "email": "E-Mail", "telefon": "Telefon", "mobil": "Mobil", "benutzerkonto": "Benutzerkonto", "aktiv_von": "Aktiv von", "aktiv_bis": "Aktiv bis", "bemerkung": "Bemerkung", "aktiv": "Aktiv"}, "erledigt_von": {"vorname": "Vorname", "nachname": "Nachname", "personentyp": "Personentyp", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "PLZ", "ort": "Ort", "land": "Land", "koordinaten": "Koordinaten", "geocoding_status": "Geocoding-Status", "email": "E-Mail", "telefon": "Telefon", "mobil": "Mobil", "benutzerkonto": "Benutzerkonto", "aktiv_von": "Aktiv von", "aktiv_bis": "Aktiv bis", "bemerkung": "Bemerkung", "aktiv": "Aktiv"}, "verworfen_von": {"vorname": "Vorname", "nachname": "Nachname", "personentyp": "Personentyp", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "PLZ", "ort": "Ort", "land": "Land", "koordinaten": "Koordinaten", "geocoding_status": "Geocoding-Status", "email": "E-Mail", "telefon": "Telefon", "mobil": "Mobil", "benutzerkonto": "Benutzerkonto", "aktiv_von": "Aktiv von", "aktiv_bis": "Aktiv bis", "bemerkung": "Bemerkung", "aktiv": "Aktiv"}, "quelle_ki_extrakt": {"dokumentation": "Dokumentation", "kategorie": "Kategorie", "inhalt": "Inhalt (Kurztext)", "belegstelle": "Belegstelle (wörtlich)", "belegstelle_position": "Position der Belegstelle im Text", "zeitangabe_rohtext": "Genannte Zeitangabe (Rohtext)", "zeitangabe_datum": "Aufgelöstes Datum", "status": "Status", "modellbezeichnung": "Modellbezeichnung", "promptversion": "Promptversion"}};
  const inputFields = useMemo(() => flattenFieldOrder(orderedFields), [orderedFieldsKey]);
  const backendFieldSet = useMemo(() => new Set(inputFields), [inputFields.join(',')]);
  const virtualComputed = useMemo(
    () => Object.fromEntries(
      Object.entries(formEnhancements.computed).filter(([k]) => !backendFieldSet.has(k)),
    ),
    [backendFieldSet],
  );
  const virtualFormEnhancements = useMemo(
    () => ({ ...formEnhancements, computed: virtualComputed }),
    [virtualComputed],
  );
  const computedLayout = useMemo(
    () => classifyComputed(virtualFormEnhancements, inputFields, computedDeps),
    [virtualFormEnhancements, inputFields.join(',')],
  );
  // Applookup-Referenzen: pro ownKey (Lookup-Feld im Form) die Liste der
  // lookupKeys, die in irgendeiner computed-Formel referenziert werden.
  // MODUS-1: aus dem Spec-Tree extrahiert. MODUS-2: aus dem Build-Time-
  // Export computedApplookupRefs (parse-formulas hat Regex-Pairs gesammelt).
  // Pro (ownKey, lookupKey)-Paar nur einmal; pro ownKey können aber mehrere
  // lookupKeys gleichzeitig auftauchen (z.B. einzelpreis UND karten10_preis
  // beim Yoga-Kurs), und alle werden separat als Inline-Hint gerendert.
  const applookupRefs = useMemo(
    () => mergeApplookupRefs(
      extractApplookupRefs(formEnhancements.computed),
      computedApplookupRefs,
    ),
    [],
  );
  function summaryLabel(k: string): string {
    if (FIELD_LABELS[k]) return FIELD_LABELS[k];
    // Leading underscore(s) als Virtual-Marker abstreifen; Unterstriche zu
    // Leerzeichen, jedes Wort kapitalisieren. Umlaute kommen vom Sub-Agent
    // direkt im Key (z. B. `_buchung_dauer_nächte`) — JS/TS/Vite unterstützen
    // Unicode-Identifier nativ, daher keine ASCII-Transliteration nötig.
    return k.replace(/^_+/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  function formatSummaryValue(k: string, v: unknown): string {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return String(v);
    // Backend-Feld mit €-Label ODER virtueller Computed-Key, dessen Name nach Geld aussieht.
    const looksLikeCurrency = CURRENCY_KEYS.has(k) || /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k);
    if (looksLikeCurrency) {
      return n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col overflow-hidden p-0 gap-0 max-sm:[&>button]:size-10 max-sm:[&>button]:grid max-sm:[&>button]:place-items-center max-sm:[&>button]:rounded-full max-sm:[&>button]:border max-sm:[&>button]:border-input max-sm:[&>button]:bg-background max-sm:[&>button]:opacity-100 max-sm:[&>button>svg]:size-5">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center gap-3 space-y-0">
          <DialogTitle className="flex-1 truncate text-left">{DIALOG_INTENT}</DialogTitle>
          {enablePhotoScan && (
            <button
              type="button"
              onClick={() => setAiOpen(o => !o)}
              aria-expanded={aiOpen}
              aria-controls="ai-fill-panel"
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 max-sm:py-2.5 max-sm:px-4 text-xs font-semibold transition-all mr-7 max-sm:mr-12 shadow-sm ${
                aiOpen
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 hover:border-primary/50'
              }`}
            >
              <IconSparkles className={`h-3.5 w-3.5 ${aiOpen ? '' : 'text-primary'}`} />
              <span className="hidden sm:inline">{t('smart_fill')}</span>
              <IconChevronDown className={`h-3 w-3 transition-transform ${aiOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </DialogHeader>
        {enablePhotoScan && aiOpen && (
          <div id="ai-fill-panel" className="border-b bg-muted/20 px-6 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">{t('scan_header_sub')}</p>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  {t('useinfo_label')}
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? t('useinfo_loading') : `(${t('useinfo_more')})`}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">{t('profile_preamble')}</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">{t('useinfo_error')}</span>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconLoader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_analyzing')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_analyzing_sub')}</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconCircleCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('scan_success')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_success_sub')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <IconPhotoPlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_upload')}</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center"
                    >
                      <IconX className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1" />{t('scan_camera_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1" />{t('scan_file_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <IconFileText className="h-3.5 w-3.5 mr-1" />{t('scan_doc_btn')}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                placeholder={t('scan_text_placeholder')}
                value={aiText}
                onChange={e => {
                  setAiText(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(Math.max(el.scrollHeight, 56), 96) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && aiText.trim() && !scanning) {
                    e.preventDefault();
                    handleAiExtract();
                  }
                }}
                disabled={scanning}
                rows={2}
                className="pr-12 resize-none text-sm overflow-y-auto"
              />
              <button
                type="button"
                className="absolute right-2 top-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                disabled={scanning}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setAiText(prev => prev ? prev + '\n' + text : text);
                  } catch {}
                }}
                title={t('paste')}
              >
                <IconClipboard className="h-4 w-4" />
              </button>
            </div>
            {aiText.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                disabled={scanning}
                onClick={() => handleAiExtract()}
              >
                <IconSparkles className="h-3.5 w-3.5 mr-1.5" />{t('scan_text_analyze')}
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0 min-w-0 max-sm:[&_input]:h-11">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4 min-w-0">
            {(() => {
              const renderField = (k: string) => {
                const inlineHints = computedLayout.anchors[k] ?? [];
                const refs = applookupRefs[k] ?? [];
                // A field the plan gives to a TOOL. On CREATE it is not shown
                // at all — the value does not exist yet and typing one only
                // gets overwritten. On EDIT it stays a normal input with a
                // note: when a tool could not compose its value (a missing
                // ingredient), this is the only place to repair the record.
                if (SYSTEM_ASSIGNED.includes(k) && !recordId) {
                  return (
                    <div key={k} className="space-y-1.5 min-w-0">
                      <Label>{labelFor(k)}</Label>
                      <p className="text-sm text-muted-foreground">{t('assigned_by_system')}</p>
                    </div>
                  );
                }
                return (
                  <div key={k} className="space-y-1.5 min-w-0">
                    {fieldBlocks[k]}
                    {SYSTEM_ASSIGNED.includes(k) && (
                      <p className="text-xs text-muted-foreground">{t('assigned_by_system')}</p>
                    )}
                    {refs.map(({ lookupKey }) => {
                      // Show the live numeric value the formula will pull from
                      // the selected lookup target (e.g. "Monatspreis: 34,90 €"
                      // under the Tarif combobox). Hidden while no lookup is
                      // selected or the target field is non-numeric.
                      const v = resolveApplookupRef(k, lookupKey, fields as Record<string, unknown>, computedContext);
                      if (v === null) return null;
                      const lbl = APPLOOKUP_LABELS[k]?.[lookupKey] ?? lookupKey;
                      const text = formatSummaryValue(lookupKey, v);
                      return (
                        <div key={`alh-${k}-${lookupKey}`} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{lbl}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                    {inlineHints.map((cKey) => {
                      const v = computedValues[cKey];
                      const text = formatSummaryValue(cKey, v);
                      if (text === '—') return null;
                      return (
                        <div key={cKey} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{summaryLabel(cKey)}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              };
              return orderedFields.map((item, idx) => {
                if (typeof item === 'string') return renderField(item);
                const cols = item.cols ?? `repeat(${item.row.length}, minmax(0, 1fr))`;
                return (
                  <div key={`row-${idx}`} className="grid gap-3" style={{ gridTemplateColumns: cols }}>
                    {item.row.map(renderField)}
                  </div>
                );
              });
            })()}
            {(computedLayout.aggregates.length > 0 || computedLayout.finalTotal) && (
              <div className="mt-6 pt-4 border-t border-border space-y-1.5">
                {computedLayout.aggregates.length > 0 && (
                  <dl className="space-y-1.5 pb-2">
                    {computedLayout.aggregates.map((k) => {
                      const userVal = (fields as Record<string, unknown>)[k];
                      const computed = computedValues[k];
                      const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                      return (
                        <div key={k} className="flex justify-between items-baseline gap-3">
                          <dt className="text-sm text-muted-foreground truncate">{summaryLabel(k)}</dt>
                          <dd className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSummaryValue(k, v)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                {computedLayout.finalTotal && (() => {
                  const k = computedLayout.finalTotal;
                  const userVal = (fields as Record<string, unknown>)[k];
                  const computed = computedValues[k];
                  const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                  // Innere Border nur wenn aggregates existieren — sonst hätten wir
                  // zwei direkt aufeinanderfolgende Striche (Outer + Inner) mit nur
                  // einer Aggregat-Zeile dazwischen → zu viel visuelles Rauschen.
                  const sep = computedLayout.aggregates.length > 0 ? 'pt-3 border-t border-border' : 'pt-1';
                  return (
                    <div className={`flex justify-between items-baseline gap-3 ${sep}`}>
                      <span className="text-base font-semibold text-foreground">{summaryLabel(k)}</span>
                      <span className="text-lg font-bold tabular-nums whitespace-nowrap text-foreground">{formatSummaryValue(k, v)}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            {showErrors && missingRequired.length > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
                <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                {t('missing_required')}
              </p>
            )}
            {recordId && (
              <div className="pt-2 border-t border-border">
                <AttachmentsSection appId={APP_IDS.AUFGABE} recordId={recordId} />
              </div>
            )}
          </div>
          {submitError && (
            <div className="flex items-start gap-2 border-t border-destructive/20 bg-destructive/10 px-6 py-2.5 text-sm text-destructive" role="alert">
              <IconAlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{submitError}</span>
            </div>
          )}
          <DialogFooter className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-6 py-3 gap-2 max-sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="max-sm:h-12 max-sm:flex-1 max-sm:text-base">{t('cancel')}</Button>
            <Button
              type="submit"
              className="max-sm:h-12 max-sm:flex-1 max-sm:text-base"
              disabled={saving || !isDirty || (showErrors && missingRequired.length > 0)}
            >
              {saving ? t('saving') : defaultValues ? t('save') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {createBetreutePersonOpen && (
      <BetreutePersonDialog
        open={createBetreutePersonOpen}
        onClose={() => setCreateBetreutePersonOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createBetreutePersonEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as BetreutePerson;
            setExtraBetreutePerson(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.BETREUTE_PERSON, result.id);
            setFields(prev => ({ ...prev, [createBetreutePersonField]: url } as any));
          }
          setCreateBetreutePersonOpen(false);
        }}
        defaultValues={createBetreutePersonInitial
          ? ({ vorname: createBetreutePersonInitial } as any)
          : undefined}
        personList={personList}
      />
    )}
    {createMassnahmePflegeplanOpen && (
      <MassnahmePflegeplanDialog
        open={createMassnahmePflegeplanOpen}
        onClose={() => setCreateMassnahmePflegeplanOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createMassnahmePflegeplanEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as MassnahmePflegeplan;
            setExtraMassnahmePflegeplan(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.MASSNAHME_PFLEGEPLAN, result.id);
            setFields(prev => ({ ...prev, [createMassnahmePflegeplanField]: url } as any));
          }
          setCreateMassnahmePflegeplanOpen(false);
        }}
        defaultValues={createMassnahmePflegeplanInitial
          ? ({ bezeichnung: createMassnahmePflegeplanInitial } as any)
          : undefined}
        betreutePersonList={betreutePersonList}
        qualifikationsartList={qualifikationsartList}
        personList={personList}
      />
    )}
    {createPersonOpen && (
      <PersonDialog
        open={createPersonOpen}
        onClose={() => setCreatePersonOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createPersonEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Person;
            setExtraPerson(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.PERSON, result.id);
            setFields(prev => ({ ...prev, [createPersonField]: url } as any));
          }
          setCreatePersonOpen(false);
        }}
        defaultValues={createPersonInitial
          ? ({ vorname: createPersonInitial } as any)
          : undefined}
        personentypList={[]}
      />
    )}
    {createQualifikationsartOpen && (
      <QualifikationsartDialog
        open={createQualifikationsartOpen}
        onClose={() => setCreateQualifikationsartOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createQualifikationsartEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Qualifikationsart;
            setExtraQualifikationsart(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.QUALIFIKATIONSART, result.id);
            setFields(prev => ({ ...prev, [createQualifikationsartField]: url } as any));
          }
          setCreateQualifikationsartOpen(false);
        }}
        defaultValues={createQualifikationsartInitial
          ? ({ bezeichnung: createQualifikationsartInitial } as any)
          : undefined}
      />
    )}
    {createKiExtraktOpen && (
      <KiExtraktDialog
        open={createKiExtraktOpen}
        onClose={() => setCreateKiExtraktOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createKiExtraktEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as KiExtrakt;
            setExtraKiExtrakt(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.KI_EXTRAKT, result.id);
            setFields(prev => ({ ...prev, [createKiExtraktField]: url } as any));
          }
          setCreateKiExtraktOpen(false);
        }}
        defaultValues={createKiExtraktInitial
          ? ({ inhalt: createKiExtraktInitial } as any)
          : undefined}
        dokumentationList={[]}
      />
    )}
    </>
  );
}