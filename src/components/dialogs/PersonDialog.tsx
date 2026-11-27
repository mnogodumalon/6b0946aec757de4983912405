/**
 * PersonDialog — pre-generated create/edit dialog for Person.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * personentypList (full hook array — resolves the Personentyp applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * PersonDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Person['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<PersonDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Person, Personentyp, LookupValue } from '@/types/app';
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
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Person';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { displayNameOf } from '@/lib/journey/rules';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/Combobox';
import { PersonentypDialog } from '@/components/dialogs/PersonentypDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconCrosshair, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode, reverseGeocodeDetailed, geocodeAddress } from '@/lib/ai';
import { GeoMapPicker } from '@/components/GeoMapPicker';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for PersonDialog.defaultValues — see file header. */
export type PersonDialogDefaults = Omit<Person['fields'], 'geocoding_status'> & {
    geocoding_status?: LookupValue | string;
  };

interface PersonDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Person['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: PersonDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  personentypList: Personentyp[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  geocoding_status: LOOKUP_OPTIONS['person']?.['geocoding_status'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  personentyp: APP_IDS.PERSONENTYP,
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

export function PersonDialog({ open, onClose, onSubmit, defaultValues, recordId, personentypList, enablePhotoScan = true, enablePhotoLocation = true }: PersonDialogProps) {
  const [fields, setFields] = useState<Partial<Person['fields']>>({});
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
  // Inline-Create state for "Personentyp" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraPersonentyp` list, and select it in
  // the originating Combobox via the captured `createPersonentypField`.
  const [createPersonentypOpen, setCreatePersonentypOpen] = useState(false);
  const [createPersonentypInitial, setCreatePersonentypInitial] = useState('');
  const [createPersonentypField, setCreatePersonentypField] = useState<string>('');
  const [extraPersonentyp, setExtraPersonentyp] = useState< Personentyp[]>([]);
  const personentypListAll = useMemo(
    () => [...personentypList, ...extraPersonentyp],
    [personentypList, extraPersonentyp],
  );
  function openCreatePersonentyp(fieldKey: string, q: string) {
    setCreatePersonentypField(fieldKey);
    setCreatePersonentypInitial(q);
    setCreatePersonentypOpen(true);
  }
  // Fields the plan assigns to a tool (empty without a plan).
  const SYSTEM_ASSIGNED: string[] = [];
  const PLAN_CREATE_PRESETS: Record<string, unknown> = {};
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['vorname', 'nachname', 'personentyp'] as const;
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
      'personentyp': personentypList,
    },
  }), [personentypList, ]);
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
      setFields(applyDefaults({ ...(recordId ? {} : normalizeDefaults(PLAN_CREATE_PRESETS)), ...(normalizedDefaults ?? {}) }, formEnhancements.defaults) as Partial<Person['fields']>);
      setPreview(null);
      setScanSuccess(false);
      setAiText('');
      setSubmitError(null);
      setGeoFromPhoto(false);
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
      const clean = cleanFieldsForApi(merged, 'person');
      await onSubmit(clean as Person['fields']);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error && err.message ? err.message : t('submit_error'));
    } finally {
      setSaving(false);
    }
  }

  const [locating, setLocating] = useState(false);
  const [showCoords, setShowCoords] = useState(false);
  const [geoFromPhoto, setGeoFromPhoto] = useState(false);
  const geoDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // This entity has a real ADDRESS BLOCK (≥2 components), so a geo pick also
  // fills the separate address fields. The generator resolved which field is
  // which: {"road": "strasse", "houseNumber": "hausnummer", "postcode": "plz", "city": "ort"}. The marker is the source of truth, so a
  // move OVERWRITES these fields (info always; components when Nominatim returns them).
  const ADDRESS_FIELD_MAP: Record<string, string | undefined> = {"road": "strasse", "houseNumber": "hausnummer", "postcode": "plz", "city": "ort"};
  async function applyGeoAddress(fieldKey: string, lat: number, lng: number) {
    const addr = await reverseGeocodeDetailed(lat, lng);
    setFields(f => {
      const next: any = { ...f, [fieldKey]: { ...((f as any)[fieldKey] ?? {}), lat, long: lng, info: addr.display } };
      if (ADDRESS_FIELD_MAP.road && addr.road) next[ADDRESS_FIELD_MAP.road] = addr.road;
      if (ADDRESS_FIELD_MAP.houseNumber && addr.houseNumber) next[ADDRESS_FIELD_MAP.houseNumber] = addr.houseNumber;
      if (ADDRESS_FIELD_MAP.postcode && addr.postcode) next[ADDRESS_FIELD_MAP.postcode] = addr.postcode;
      if (ADDRESS_FIELD_MAP.city && addr.city) next[ADDRESS_FIELD_MAP.city] = addr.city;
      return next;
    });
  }

  // FORWARD direction (mirror of applyGeoAddress): typing the address fields
  // moves the geo point. The address-component inputs call onAddressFieldChange
  // (instead of plain setFields), which writes the field AND debounce-geocodes
  // the assembled address via Photon. The map below shows the result, draggable.
  const FORWARD_GEO_KEY = 'koordinaten';
  const fwdGeoDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fwdGeoAbortRef = useRef<AbortController | null>(null);
  // The point a forward geocode just wrote — so the picker's programmatic
  // recenter (its moveend → handleMapMove) is recognised as an ECHO and does NOT
  // reverse-geocode back over the address the user is typing. A real drag differs.
  const suppressReverseEchoRef = useRef<{ lat: number; long: number } | null>(null);
  function buildAddrQuery(f: any): string {
    const v = (c?: string) => (c ? String((f as any)[c] ?? '').trim() : '');
    const road = v(ADDRESS_FIELD_MAP.road);
    const house = v(ADDRESS_FIELD_MAP.houseNumber);
    const postcode = v(ADDRESS_FIELD_MAP.postcode);
    const city = v(ADDRESS_FIELD_MAP.city);
    // Need ≥2 of the STRONG components (road/postcode/city) — a lone token would
    // resolve to the wrong place. A house number alone never qualifies.
    if ([road, postcode, city].filter(Boolean).length < 2) return '';
    const street = [road, house].filter(Boolean).join(' ');
    return [street, postcode, city].filter(Boolean).join(', ');
  }
  function scheduleForwardGeocode(q: string) {
    clearTimeout(fwdGeoDebounceRef.current);
    if (!q) return;
    fwdGeoDebounceRef.current = setTimeout(async () => {
      fwdGeoAbortRef.current?.abort();
      const ac = new AbortController();
      fwdGeoAbortRef.current = ac;
      const hit = await geocodeAddress(q, ac.signal);
      if (!hit) return;
      suppressReverseEchoRef.current = { lat: hit.lat, long: hit.long };
      setFields(f => ({ ...f, [FORWARD_GEO_KEY]: { ...((f as any)[FORWARD_GEO_KEY] ?? {}), lat: hit.lat, long: hit.long, info: hit.label } }));
    }, 600);
  }
  function onAddressFieldChange(key: string, value: string) {
    setFields(f => ({ ...f, [key]: value }));
    scheduleForwardGeocode(buildAddrQuery({ ...fields, [key]: value }));
  }
  async function geoLocate(fieldKey: string) {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      await applyGeoAddress(fieldKey, latitude, longitude);
      setGeoFromPhoto(false);
      setLocating(false);
    }, () => { setLocating(false); });
  }
  function handleMapMove(fieldKey: string, lat: number, lng: number) {
    setFields(f => ({ ...f, [fieldKey]: { ...((f as any)[fieldKey] ?? {}), lat, long: lng } }));
    // Skip the reverse round-trip when this move is the ECHO of a forward geocode
    // (the picker recentred itself) — otherwise it would overwrite the address the
    // user just typed. A genuine user DRAG lands away from the echoed point.
    const echo = suppressReverseEchoRef.current;
    if (echo && Math.abs(echo.lat - lat) < 2e-4 && Math.abs(echo.long - lng) < 2e-4) {
      suppressReverseEchoRef.current = null;
      return;
    }
    clearTimeout(geoDebounceRef.current);
    geoDebounceRef.current = setTimeout(async () => {
      await applyGeoAddress(fieldKey, lat, lng);
    }, 600);
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
      contextParts.push(`<available-records field="personentyp" entity="Personentyp">\n${JSON.stringify(personentypList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "vorname": string | null, // Vorname\n  "nachname": string | null, // Nachname\n  "personentyp": string | null, // Display name from Personentyp (see <available-records>)\n  "strasse": string | null, // Straße\n  "hausnummer": string | null, // Hausnummer\n  "plz": string | null, // PLZ\n  "ort": string | null, // Ort\n  "land": string | null, // Land\n  "geocoding_status": LookupValue | null, // Geocoding-Status (select one key: "ok" | "fehlgeschlagen" | "ausstehend") mapping: ok=OK, fehlgeschlagen=Fehlgeschlagen, ausstehend=Ausstehend\n  "email": string | null, // E-Mail\n  "telefon": string | null, // Telefon\n  "mobil": string | null, // Mobil\n  "benutzerkonto": string | null, // Benutzerkonto\n  "aktiv_von": string | null, // YYYY-MM-DD\n  "aktiv_bis": string | null, // YYYY-MM-DD\n  "bemerkung": string | null, // Bemerkung\n  "aktiv": boolean | null, // Aktiv\n}`;
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
        const applookupKeys = new Set<string>(["personentyp"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const personentypName = raw['personentyp'] as string | null;
        if (personentypName) {
          const personentypMatch = personentypList.find(r => matchName(personentypName!, [String(r.fields.bezeichnung ?? '')]));
          if (personentypMatch) merged['personentyp'] = createRecordUrl(APP_IDS.PERSONENTYP, personentypMatch.record_id);
        }
        return merged as Partial<Person['fields']>;
      });
      if (gps) {
        setFields(f => ({ ...f, koordinaten: { lat: gps.latitude, long: gps.longitude, info: geoAddr } as any }));
        setGeoFromPhoto(true);
      }
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
    ? (formEnhancements.title?.edit ?? t('edit_entity', { entity: appLabel('person') }))
    : (formEnhancements.title?.create ?? t('new_entity', { entity: appLabel('person') }));
  // the dialog's word for a field — the config may rename it (S-3)
  const labelFor = (k: string) => dialogLabel(formEnhancements, k, fieldLabel('person', k));

  const fieldBlocks: Record<string, React.ReactNode> = {
    'vorname': (
      <div key="vorname" className="space-y-1.5">
        <Label htmlFor="vorname">{labelFor('vorname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="vorname"
          placeholder="z. B. Anna"
          value={fields.vorname ?? ''}
          onChange={e => setFields(f => ({ ...f, vorname: e.target.value }))}
          required
        />
        {showErrors && !fields.vorname && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('person', 'vorname')}</p>
        )}
      </div>
    ),
    'nachname': (
      <div key="nachname" className="space-y-1.5">
        <Label htmlFor="nachname">{labelFor('nachname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="nachname"
          placeholder="z. B. Müller"
          value={fields.nachname ?? ''}
          onChange={e => setFields(f => ({ ...f, nachname: e.target.value }))}
          required
        />
        {showErrors && !fields.nachname && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('person', 'nachname')}</p>
        )}
      </div>
    ),
    'personentyp': (
      <div key="personentyp" className="space-y-1.5">
        <Label htmlFor="personentyp">{labelFor('personentyp')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="personentyp"
          placeholder="Welcher Personentyp?"
          items={personentypListAll.map(r => ({
            id: r.record_id,
            label: displayNameOf('personentyp', r.fields as Record<string, unknown>) || r.record_id,
          }))}
          value={extractRecordId(fields.personentyp)}
          onChange={id => setFields(f => ({ ...f, personentyp: id ? createRecordUrl(APP_IDS.PERSONENTYP, id) : undefined }))}
          onCreateNew={(q) => openCreatePersonentyp("personentyp", q)}
          createLabel={t('create_in', { entity: appLabel('personentyp') })}
        />
        {showErrors && !fields.personentyp && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('person', 'personentyp')}</p>
        )}
      </div>
    ),
    'strasse': (
      <div key="strasse" className="space-y-1.5">
        <Label htmlFor="strasse">{labelFor('strasse')}</Label>
        <Input
          id="strasse"
          placeholder="z. B. Hauptstraße"
          value={fields.strasse ?? ''}
          onChange={e => onAddressFieldChange("strasse", e.target.value)}
        />
      </div>
    ),
    'hausnummer': (
      <div key="hausnummer" className="space-y-1.5">
        <Label htmlFor="hausnummer">{labelFor('hausnummer')}</Label>
        <Input
          id="hausnummer"
          placeholder="z. B. 12a"
          value={fields.hausnummer ?? ''}
          onChange={e => onAddressFieldChange("hausnummer", e.target.value)}
        />
      </div>
    ),
    'plz': (
      <div key="plz" className="space-y-1.5">
        <Label htmlFor="plz">{labelFor('plz')}</Label>
        <Input
          id="plz"
          placeholder="z. B. 10115"
          value={fields.plz ?? ''}
          onChange={e => onAddressFieldChange("plz", e.target.value)}
        />
      </div>
    ),
    'ort': (
      <div key="ort" className="space-y-1.5">
        <Label htmlFor="ort">{labelFor('ort')}</Label>
        <Input
          id="ort"
          placeholder="z. B. Berlin"
          value={fields.ort ?? ''}
          onChange={e => onAddressFieldChange("ort", e.target.value)}
        />
      </div>
    ),
    'land': (
      <div key="land" className="space-y-1.5">
        <Label htmlFor="land">{labelFor('land')}</Label>
        <Input
          id="land"
          placeholder="z. B. Deutschland"
          value={fields.land ?? ''}
          onChange={e => setFields(f => ({ ...f, land: e.target.value }))}
        />
      </div>
    ),
    'koordinaten': (
      <div key="koordinaten" className="space-y-1.5">
        <Label htmlFor="koordinaten">{labelFor('koordinaten')}</Label>
        <div className="space-y-3">
          <Button type="button" variant="outline" className="w-full max-sm:h-11" disabled={locating} onClick={() => geoLocate("koordinaten")}>
            {locating ? <IconLoader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <IconCrosshair className="h-4 w-4 mr-1.5" />}
            {t('fr_use_location')}
          </Button>
          <AddressAutocomplete
            placeholder={t('fr_search_address')}
            onSelect={r => setFields(f => ({ ...f, koordinaten: { lat: r.lat, long: r.long, info: r.label } as any }))}
          />
          {geoFromPhoto && fields.koordinaten && (
            <p className="text-xs text-primary italic">{t('fr_photo_location')}</p>
          )}
          {fields.koordinaten?.info && (
            <p className="text-sm text-muted-foreground break-words whitespace-normal">
              {fields.koordinaten.info}
            </p>
          )}
          {fields.koordinaten?.lat != null && fields.koordinaten?.long != null && (
            <GeoMapPicker
              lat={fields.koordinaten.lat}
              lng={fields.koordinaten.long}
              onChange={(lat, lng) => handleMapMove("koordinaten", lat, lng)}
            />
          )}
          <button type="button" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 py-1 max-sm:py-2 transition-colors" onClick={() => setShowCoords(v => !v)}>
            {showCoords ? t('fr_hide_coords') : t('fr_show_coords')}
            <IconChevronDown className={`h-3 w-3 transition-transform ${showCoords ? "rotate-180" : ""}`} />
          </button>
          {showCoords && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">{t('fr_lat')}</Label>
                <Input type="number" step="any"
                  value={fields.koordinaten?.lat ?? ''}
                  onChange={e => {
                    const v = e.target.value;
                    setFields(f => ({ ...f, koordinaten: { ...(f.koordinaten as any ?? {}), lat: v ? Number(v) : undefined } }));
                  }}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('fr_long')}</Label>
                <Input type="number" step="any"
                  value={fields.koordinaten?.long ?? ''}
                  onChange={e => {
                    const v = e.target.value;
                    setFields(f => ({ ...f, koordinaten: { ...(f.koordinaten as any ?? {}), long: v ? Number(v) : undefined } }));
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    'geocoding_status': (
      <div key="geocoding_status" className="space-y-1.5">
        <Label htmlFor="geocoding_status">{labelFor('geocoding_status')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.geocoding_status) === 'ok'}
            onClick={() => setFields(f => ({ ...f, geocoding_status: (lookupKey(f.geocoding_status) === 'ok' ? undefined : 'ok') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.geocoding_status) === 'ok'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('person', 'geocoding_status', 'ok') ?? 'OK'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.geocoding_status) === 'fehlgeschlagen'}
            onClick={() => setFields(f => ({ ...f, geocoding_status: (lookupKey(f.geocoding_status) === 'fehlgeschlagen' ? undefined : 'fehlgeschlagen') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.geocoding_status) === 'fehlgeschlagen'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('person', 'geocoding_status', 'fehlgeschlagen') ?? 'Fehlgeschlagen'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.geocoding_status) === 'ausstehend'}
            onClick={() => setFields(f => ({ ...f, geocoding_status: (lookupKey(f.geocoding_status) === 'ausstehend' ? undefined : 'ausstehend') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.geocoding_status) === 'ausstehend'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('person', 'geocoding_status', 'ausstehend') ?? 'Ausstehend'}
          </button>
        </div>
      </div>
    ),
    'email': (
      <div key="email" className="space-y-1.5">
        <Label htmlFor="email">{labelFor('email')}</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          placeholder="z. B. anna@beispiel.de"
          value={fields.email ?? ''}
          onChange={e => setFields(f => ({ ...f, email: e.target.value }))}
        />
      </div>
    ),
    'telefon': (
      <div key="telefon" className="space-y-1.5">
        <Label htmlFor="telefon">{labelFor('telefon')}</Label>
        <Input
          id="telefon"
          type="tel"
          inputMode="tel"
          placeholder=""
          value={fields.telefon ?? ''}
          onChange={e => setFields(f => ({ ...f, telefon: e.target.value }))}
        />
      </div>
    ),
    'mobil': (
      <div key="mobil" className="space-y-1.5">
        <Label htmlFor="mobil">{labelFor('mobil')}</Label>
        <Input
          id="mobil"
          type="tel"
          inputMode="tel"
          placeholder=""
          value={fields.mobil ?? ''}
          onChange={e => setFields(f => ({ ...f, mobil: e.target.value }))}
        />
      </div>
    ),
    'benutzerkonto': (
      <div key="benutzerkonto" className="space-y-1.5">
        <Label htmlFor="benutzerkonto">{labelFor('benutzerkonto')}</Label>
        <Input
          id="benutzerkonto"
          placeholder="z. B. anna.mueller"
          value={fields.benutzerkonto ?? ''}
          onChange={e => setFields(f => ({ ...f, benutzerkonto: e.target.value }))}
        />
      </div>
    ),
    'aktiv_von': (
      <div key="aktiv_von" className="space-y-1.5">
        <Label htmlFor="aktiv_von">{labelFor('aktiv_von')}</Label>
        <DatePicker
          id="aktiv_von"
          placeholder="Ab wann aktiv?"
          mode="date"
          value={fields.aktiv_von ?? null}
          onChange={v => setFields(f => ({ ...f, aktiv_von: v ?? undefined }))}
        />
      </div>
    ),
    'aktiv_bis': (
      <div key="aktiv_bis" className="space-y-1.5">
        <Label htmlFor="aktiv_bis">{labelFor('aktiv_bis')}</Label>
        <DatePicker
          id="aktiv_bis"
          placeholder="Bis wann aktiv?"
          mode="date"
          value={fields.aktiv_bis ?? null}
          onChange={v => setFields(f => ({ ...f, aktiv_bis: v ?? undefined }))}
        />
      </div>
    ),
    'bemerkung': (
      <div key="bemerkung" className="space-y-1.5">
        <Label htmlFor="bemerkung">{labelFor('bemerkung')}</Label>
        <Textarea
          id="bemerkung"
          placeholder="Notizen zur Person"
          value={fields.bemerkung ?? ''}
          onChange={e => setFields(f => ({ ...f, bemerkung: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'aktiv': (
      <div key="aktiv" className="space-y-1.5">
        <Label htmlFor="aktiv">{labelFor('aktiv')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="aktiv"
            checked={!!fields.aktiv}
            onCheckedChange={(v) => setFields(f => ({ ...f, aktiv: !!v }))}
          />
          <Label htmlFor="aktiv" className="font-normal">{labelFor('aktiv')}</Label>
        </div>
      </div>
    ),
  };
  // Fields this dialog never shows: the config's `hidden` and the fields the
  // OVERVIEW changes with its own button (plan.dashboard.writes, how: button —
  // a control, not a form value; S-3). A required field stays visible.
  const DASHBOARD_BUTTON_FIELDS: string[] = [];
  const ALWAYS_SHOWN: string[] = ['vorname', 'nachname', 'personentyp'];
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
  const FIELD_LABELS: Record<string, string> = {"vorname": "Vorname", "nachname": "Nachname", "personentyp": "Personentyp", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "PLZ", "ort": "Ort", "land": "Land", "koordinaten": "Koordinaten", "geocoding_status": "Geocoding-Status", "email": "E-Mail", "telefon": "Telefon", "mobil": "Mobil", "benutzerkonto": "Benutzerkonto", "aktiv_von": "Aktiv von", "aktiv_bis": "Aktiv bis", "bemerkung": "Bemerkung", "aktiv": "Aktiv"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"personentyp": {"bezeichnung": "Bezeichnung", "beschreibung": "Beschreibung", "systemrolle": "Systemrolle", "darf_betreuen": "Darf betreuen", "hat_zugang": "Hat Zugang zur Anwendung", "erforderliche_qualifikationsarten": "Erforderliche Qualifikationsarten", "aktiv": "Aktiv"}};
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
                <AttachmentsSection appId={APP_IDS.PERSON} recordId={recordId} />
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
    {createPersonentypOpen && (
      <PersonentypDialog
        open={createPersonentypOpen}
        onClose={() => setCreatePersonentypOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createPersonentypEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Personentyp;
            setExtraPersonentyp(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.PERSONENTYP, result.id);
            setFields(prev => ({ ...prev, [createPersonentypField]: url } as any));
          }
          setCreatePersonentypOpen(false);
        }}
        defaultValues={createPersonentypInitial
          ? ({ bezeichnung: createPersonentypInitial } as any)
          : undefined}
        qualifikationsartList={[]}
      />
    )}
    </>
  );
}