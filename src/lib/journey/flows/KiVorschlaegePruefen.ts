/**
 * useKiVorschlaegePruefenFlow — the plumbing of the flow « KI-Vorschläge prüfen », generated from the plan.
 *
 * Changes `aufgabe`: the record to change is picked (`flow.pick('aufgabe')`), the form is prefilled with its values; asks `titel`, `zustaendig`, `faelligkeitsart`, `faelligkeitsdatum`, `prioritaet`, `status`, `aktiviert_von`, `verworfen_von`, `verworfen_grund`; sets `aktiviert_am`, `verworfen_am` itself.
Changes `ki_extrakt`: the record to change is picked (`flow.pick('ki_extrakt')`), the form is prefilled with its values; .
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 7)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useKiVorschlaegePruefenFlow({
 *     steps: { aufgabe: 1, ki_extrakt: 2, zustaendig: 3, aktiviert_von: 4, verworfen_von: 5, titel: 6, faelligkeitsart: 6, faelligkeitsdatum: 6, prioritaet: 6, status: 6, verworfen_grund: 6 },
 *     items: { zustaendig: r => ({ id: r.id, title: fieldText(r, 'vorname') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.zustaendig.select} {...flow.pick('zustaendig')} />
 *     <EntitySelectStep {...flow.picks.aktiviert_von.select} {...flow.pick('aktiviert_von')} />
 *     <EntitySelectStep {...flow.picks.verworfen_von.select} {...flow.pick('verworfen_von')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.aufgabe.select} {...flow.pick('aufgabe')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.ki_extrakt.select} {...flow.pick('ki_extrakt')} />
 *     <Bound form={flow.forms.aufgabe} name="titel" />
 *     <Bound form={flow.forms.aufgabe} name="faelligkeitsart" />
 *     <Bound form={flow.forms.aufgabe} name="faelligkeitsdatum" />
 *     <Bound form={flow.forms.aufgabe} name="prioritaet" />
 *     <Bound form={flow.forms.aufgabe} name="status" />
 *     <Bound form={flow.forms.aufgabe} name="verworfen_grund" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} variants={flow.actions} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} undo={flow.undo} />}
 *   </IntentWizardShell>
 */
import { useEffect, useRef, useState } from 'react';
import { readJourneyExtra, writeJourneyExtra } from '@/lib/journey/draft';
import { DOOR_PARENTS, nounOne } from '@/config/plan';
import { syncDoorsAfterWrite } from '@/lib/publicDoors';
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion, refFilter, combineFilters,  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { requestWizardStep } from '@/lib/journey/useStepForm';
import { reportReadFailure } from '@/lib/journey/readFailures';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
import { entityLabel } from '@/lib/journey/rules';

export type KiVorschlaegePruefenFieldKey = 'aktiviert_von' | 'aufgabe' | 'faelligkeitsart' | 'faelligkeitsdatum' | 'ki_extrakt' | 'prioritaet' | 'status' | 'titel' | 'verworfen_grund' | 'verworfen_von' | 'zustaendig';

export interface KiVorschlaegePruefenForms {
  aufgabe: StepForm<'aufgabe'>;
  ki_extrakt: StepForm<'ki_extrakt'>;
}

// Alias so the option generics stay readable.
type Key = KiVorschlaegePruefenFieldKey;

export interface KiVorschlaegePruefenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    zustaendig?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    aktiviert_von?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    verworfen_von?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    aufgabe?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    ki_extrakt?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
  /** A page-side narrowing per pick, on top of the plan's filter (J-3): the
   *  questions of the picked event, the open ones — `r => fieldRef(r, 'veranstaltung') === eventId`. */
  where?: {
    zustaendig?: (record: JourneyRecord) => boolean;
    aktiviert_von?: (record: JourneyRecord) => boolean;
    verworfen_von?: (record: JourneyRecord) => boolean;
    aufgabe?: (record: JourneyRecord) => boolean;
    ki_extrakt?: (record: JourneyRecord) => boolean;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"aktiviert_von": 4, "aufgabe": 1, "faelligkeitsart": 6, "faelligkeitsdatum": 6, "ki_extrakt": 2, "prioritaet": 6, "status": 6, "titel": 6, "verworfen_grund": 6, "verworfen_von": 5, "zustaendig": 3};
export const KIVORSCHLAEGEPRUEFEN_REVIEW_STEP = 7;
// a label of the plan in the page's language
function labelIn(m: Record<string, string>): string {
  const l = (typeof document !== 'undefined' ? document.documentElement.lang : '') || 'de';
  return m[l.slice(0, 2)] ?? m.de ?? Object.values(m)[0] ?? '';
}
// the ways this flow may END (plan: success.actions) — the review shows one
// button per entry, the chosen one sets these values on the primary record
const ACTION_SETS: Record<string, FormValues> = { 'verwerfen': {"status": "verworfen"} };
// the counter-action (plan: undo) — what puts the changed record back
const UNDO_SETS: Record<string, unknown> = {"aktiviert_von": null, "status": "vorschlag", "verworfen_von": null, "zustaendig": null};

function fromPick<T>(pick: { recordOf(id: string): JourneyRecord | undefined }, form: StepForm, field: string, read: (r: JourneyRecord) => T): T | undefined {
  const id = form.get(field);
  const rec = typeof id === 'string' && id ? pick.recordOf(id) : undefined;
  return rec ? read(rec) : undefined;
}
// local calendar day — the ISO-string of a Date is UTC and flips the date in the evening (J-7)
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Returns T, not Partial<T>: a Record's index signature is already "maybe
// absent", and Partial<Record<string, string>> does not assign to the
// Record<string, string> useStepForm wants (tsc, live 23.09.2026 — eight
// errors, one per hook, caught only in the sandbox build).
function only<T extends Record<string, unknown>>(obj: T | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

function hasValues(form: StepForm): boolean {
  return form.keys.some(k => !isEmptyValue(form.values[k]));
}
// The picked record as `?record=<id>` in the address — a reload or a shared
// address opens the flow on the same record (J-8). replaceState: no navigation.
function mirrorRecordParam(id: string | null): void {
  try {
    const [base, query = ''] = window.location.hash.split('?');
    const q = new URLSearchParams(query);
    if (id) q.set('record', id); else q.delete('record');
    const qs = q.toString();
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${base}${qs ? `?${qs}` : ''}`);
  } catch {
    /* ignore */
  }
}

export function useKiVorschlaegePruefenFlow(options: KiVorschlaegePruefenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const variantRef = useRef<string | null>(null);   // the end action the person chose (PV-14)
  const [aufgabeTargetId, setAufgabeTargetId] = useState<string | null>(null);
  const [ki_extraktTargetId, setKiExtraktTargetId] = useState<string | null>(null);
  const aufgabe = useStepForm('aufgabe', {
    fields: ["titel", "zustaendig", "faelligkeitsart", "faelligkeitsdatum", "prioritaet", "status", "aktiviert_von", "verworfen_von", "verworfen_grund"],
    steps: only(steps, ["titel", "zustaendig", "faelligkeitsart", "faelligkeitsdatum", "prioritaet", "status", "aktiviert_von", "verworfen_von", "verworfen_grund"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["titel", "zustaendig", "faelligkeitsart", "faelligkeitsdatum", "prioritaet", "status", "aktiviert_von", "verworfen_von", "verworfen_grund"]),
    messages: only(options.messages as Record<string, string> | undefined, ["titel", "zustaendig", "faelligkeitsart", "faelligkeitsdatum", "prioritaet", "status", "aktiviert_von", "verworfen_von", "verworfen_grund"]),
  });
  const ki_extrakt = useStepForm('ki_extrakt', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const forms: KiVorschlaegePruefenForms = { aufgabe, ki_extrakt };
  // the editor of a list is not a record of its own: the review and the success
  // page read the entries (PlanStep.review), never the half-filled editor
  const formList: StepForm[] = [aufgabe, ki_extrakt];
  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  // a pick that belongs to another pick's record (A9): server filter + its client twin
  const dependsOn = (dep: unknown, field: string) => (typeof dep === 'string' && /^[a-f0-9]{24}$/i.test(dep) ? refFilter(field, dep) : undefined);
  const dependsWhere = (r: JourneyRecord, field: string, dep: unknown) => typeof dep !== 'string' || dep === '' || fieldRef(r, field) === dep;
  const searches = {
    zustaendig: useRecordSearch(servicePort, 'person', withPickPolicy('zustaendig', {
      searchFields: ["vorname", "nachname"] as never,
      where: options.where?.zustaendig,
      toItem: options.items?.zustaendig as never,
      claim: 'aufgabe.zustaendig',
    })),
    aktiviert_von: useRecordSearch(servicePort, 'person', withPickPolicy('aktiviert_von', {
      searchFields: ["vorname", "nachname"] as never,
      where: options.where?.aktiviert_von,
      toItem: options.items?.aktiviert_von as never,
      claim: 'aufgabe.aktiviert_von',
    })),
    verworfen_von: useRecordSearch(servicePort, 'person', withPickPolicy('verworfen_von', {
      searchFields: ["vorname", "nachname"] as never,
      where: options.where?.verworfen_von,
      toItem: options.items?.verworfen_von as never,
      claim: 'aufgabe.verworfen_von',
    })),
    aufgabe: useRecordSearch(servicePort, 'aufgabe', withPickPolicy('aufgabe', {
      searchFields: ["titel", "beschreibung"] as never,
      // only the aufgabe of the ki_extrakt picked before
      filter: combineFilters("r.v_status == 'vorschlag'", dependsOn(ki_extraktTargetId, 'quelle_ki_extrakt')),
      where: (r: JourneyRecord) => ((fieldLookup(r, "status")?.key ?? null) === "vorschlag") && dependsWhere(r, 'quelle_ki_extrakt', ki_extraktTargetId) && (options.where?.aufgabe?.(r) ?? true),
      toItem: options.items?.aufgabe as never,
      includeTaken: true,
    })),
    ki_extrakt: useRecordSearch(servicePort, 'ki_extrakt', withPickPolicy('ki_extrakt', {
      searchFields: ["inhalt", "belegstelle", "zeitangabe_rohtext"] as never,
      filter: "r.v_status == 'neu'",
      where: (r: JourneyRecord) => ((fieldLookup(r, "status")?.key ?? null) === "neu") && (options.where?.ki_extrakt?.(r) ?? true),
      toItem: options.items?.ki_extrakt as never,
      includeTaken: true,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:ki-vorschlaege-pruefen:read:${entity}`);
  const picks = {
    zustaendig: { ...searches.zustaendig, select: { ...searches.zustaendig.select, create: true as boolean, hint: hintFor('zustaendig', 'person', null as PickWhere | null) } },
    aktiviert_von: { ...searches.aktiviert_von, select: { ...searches.aktiviert_von.select, create: true as boolean, hint: hintFor('aktiviert_von', 'person', null as PickWhere | null) } },
    verworfen_von: { ...searches.verworfen_von, select: { ...searches.verworfen_von.select, create: true as boolean, hint: hintFor('verworfen_von', 'person', null as PickWhere | null) } },
    aufgabe: { ...searches.aufgabe, select: { ...searches.aufgabe.select, create: false as boolean, hint: hintFor('aufgabe', 'aufgabe', {"conditions": [{"field": "status", "op": "eq", "value": "vorschlag"}], "mode": "all"} as PickWhere | null) } },
    ki_extrakt: { ...searches.ki_extrakt, select: { ...searches.ki_extrakt.select, create: false as boolean, hint: hintFor('ki_extrakt', 'ki_extrakt', {"conditions": [{"field": "status", "op": "eq", "value": "neu"}], "mode": "all"} as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'aufgabe', entity: 'aufgabe', form: aufgabe, label: nounOne('aufgabe', entityLabel('aufgabe')),
      updates: () => aufgabeTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => aufgabeTargetId
        ? { key: 'target:aufgabe', label: nounOne('aufgabe', entityLabel('aufgabe')), value: picks.aufgabe.labelOf(aufgabeTargetId) ?? aufgabeTargetId, step: steps.aufgabe }
        : undefined,
      values: (): FormValues => ({
        aktiviert_am: policyFixedValue('aufgabe', 'aktiviert_am') ?? nowIso(),
        verworfen_am: policyFixedValue('aufgabe', 'verworfen_am') ?? nowIso(),
      }),
    },
    {
      key: 'ki_extrakt', entity: 'ki_extrakt', form: ki_extrakt, label: nounOne('ki_extrakt', entityLabel('ki_extrakt')), primary: true,
      updates: () => ki_extraktTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => ki_extraktTargetId
        ? { key: 'target:ki_extrakt', label: nounOne('ki_extrakt', entityLabel('ki_extrakt')), value: picks.ki_extrakt.labelOf(ki_extraktTargetId) ?? ki_extraktTargetId, step: steps.ki_extrakt }
        : undefined,
      values: (): FormValues => ({
        ...(variantRef.current ? ACTION_SETS[variantRef.current] ?? {} : {}),
      }),
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'ki-vorschlaege-pruefen', onSuccess: (r) => {
    // EF-51: a created or changed parent record keeps its pair of doors in step (made, closed, reopened)
    for (const [k, rec] of Object.entries(r.records)) {
      const ent = plan.find(s => s.key === k)?.entity;
      if (ent && Object.values(DOOR_PARENTS).some(d => d.entity === ent)) void syncDoorsAfterWrite(ent, rec.id, rec.fields);
    }
  } });

  // A typed field the plan prefills from the picked record (`user:from_pick`),
  // still the person's to change: filled once, only while empty (PV-12)
  const prefillFrom = (pickKey: string, rec: JourneyRecord) => {
    void pickKey; void rec;
  };

  // Opened with `?<field>=<value>` for a field this flow asks — a dashboard
  // link that pre-picks the event, a form that hands the question on (J-2):
  // a typed field takes the value while it is empty (a draft wins), a pick
  // loads the record, takes it into the pick and selects it WITH its name.
  // `initial` with a bare record id gets its name the same way.
  const [linkedParams] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? ''));
  useEffect(() => {
    let on = true;
    const coerce = (form: StepForm, key: string, raw: string): unknown => {
      const kind = form.rules[key]?.kind;
      if (kind === 'number') { const n = Number(raw); return Number.isFinite(n) ? n : raw; }
      if (kind === 'bool') return raw === 'true' || raw === '1' || raw === 'ja';
      return raw;
    };
    { const v = linkedParams.get('titel'); if (v !== null && isEmptyValue(aufgabe.get('titel'))) (aufgabe.set as (k: string, v: unknown) => void)('titel', coerce(aufgabe, 'titel', v)); }
    { const v = linkedParams.get('faelligkeitsart'); if (v !== null && isEmptyValue(aufgabe.get('faelligkeitsart'))) (aufgabe.set as (k: string, v: unknown) => void)('faelligkeitsart', coerce(aufgabe, 'faelligkeitsart', v)); }
    { const v = linkedParams.get('faelligkeitsdatum'); if (v !== null && isEmptyValue(aufgabe.get('faelligkeitsdatum'))) (aufgabe.set as (k: string, v: unknown) => void)('faelligkeitsdatum', coerce(aufgabe, 'faelligkeitsdatum', v)); }
    { const v = linkedParams.get('prioritaet'); if (v !== null && isEmptyValue(aufgabe.get('prioritaet'))) (aufgabe.set as (k: string, v: unknown) => void)('prioritaet', coerce(aufgabe, 'prioritaet', v)); }
    { const v = linkedParams.get('status'); if (v !== null && isEmptyValue(aufgabe.get('status'))) (aufgabe.set as (k: string, v: unknown) => void)('status', coerce(aufgabe, 'status', v)); }
    { const v = linkedParams.get('verworfen_grund'); if (v !== null && isEmptyValue(aufgabe.get('verworfen_grund'))) (aufgabe.set as (k: string, v: unknown) => void)('verworfen_grund', coerce(aufgabe, 'verworfen_grund', v)); }
    {
      const cur = forms.aufgabe.get('zustaendig');
      const fromLink = linkedParams.get('zustaendig');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.aufgabe.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('person', id).then(rec => {
        if (!on || !rec) return;
        picks.zustaendig.adopt(rec);
        const name = picks.zustaendig.labelOf(rec.id) ?? rec.id;
        (forms.aufgabe.set as (k: string, v: unknown, l?: string) => void)('zustaendig', rec.id, name);
        prefillFrom('zustaendig', rec);
      }).catch(() => undefined);
    }
    {
      const cur = forms.aufgabe.get('aktiviert_von');
      const fromLink = linkedParams.get('aktiviert_von');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.aufgabe.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('person', id).then(rec => {
        if (!on || !rec) return;
        picks.aktiviert_von.adopt(rec);
        const name = picks.aktiviert_von.labelOf(rec.id) ?? rec.id;
        (forms.aufgabe.set as (k: string, v: unknown, l?: string) => void)('aktiviert_von', rec.id, name);
        prefillFrom('aktiviert_von', rec);
      }).catch(() => undefined);
    }
    {
      const cur = forms.aufgabe.get('verworfen_von');
      const fromLink = linkedParams.get('verworfen_von');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.aufgabe.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('person', id).then(rec => {
        if (!on || !rec) return;
        picks.verworfen_von.adopt(rec);
        const name = picks.verworfen_von.labelOf(rec.id) ?? rec.id;
        (forms.aufgabe.set as (k: string, v: unknown, l?: string) => void)('verworfen_von', rec.id, name);
        prefillFrom('verworfen_von', rec);
      }).catch(() => undefined);
    }
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, []);

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    aufgabe: {
      selectedId: aufgabeTargetId,
      onSelect: (id: string) => {
        setAufgabeTargetId(id);
        const rec = picks.aufgabe.recordOf(id);
        if (rec) aufgabe.reset({ titel: fieldText(rec, "titel"), zustaendig: fieldRef(rec, "zustaendig"), faelligkeitsart: fieldLookup(rec, "faelligkeitsart")?.key, faelligkeitsdatum: fieldDate(rec, "faelligkeitsdatum"), prioritaet: fieldLookup(rec, "prioritaet")?.key, status: fieldLookup(rec, "status")?.key, aktiviert_von: fieldRef(rec, "aktiviert_von"), verworfen_von: fieldRef(rec, "verworfen_von"), verworfen_grund: fieldText(rec, "verworfen_grund"), });
        // survives a reload: in the draft's side data, and as `?record=` in the address (J-8)
        writeJourneyExtra('ki-vorschlaege-pruefen', 'target:aufgabe', id);
        mirrorRecordParam(id);
      },
      get record(): JourneyRecord | undefined { return aufgabeTargetId ? picks.aufgabe.recordOf(aufgabeTargetId) : undefined; },
    },
    ki_extrakt: {
      selectedId: ki_extraktTargetId,
      onSelect: (id: string) => {
        setKiExtraktTargetId(id);
        const rec = picks.ki_extrakt.recordOf(id);
        if (rec) ki_extrakt.reset({ });
        // survives a reload: in the draft's side data, and (J-8)
        writeJourneyExtra('ki-vorschlaege-pruefen', 'target:ki_extrakt', id);
      },
      get record(): JourneyRecord | undefined { return ki_extraktTargetId ? picks.ki_extrakt.recordOf(ki_extraktTargetId) : undefined; },
    },
  };
  // Opened for one record — `#/intents/ki-vorschlaege-pruefen?record=<id>`, the dashboard's
  // flowActionFor(): that record is the one to change. Loaded, taken into the
  // pick and selected — when this flow may change it at all (the pick's rule).
  // After a reload the pick comes back the same way: from the address, else
  // from the draft's side data (J-8).
  const [linkedId] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('record')
    ?? readJourneyExtra<string>('ki-vorschlaege-pruefen', 'target:aufgabe'));
  useEffect(() => {
    if (!linkedId) return;
    let on = true;
    void servicePort.get('aufgabe', linkedId).then(rec => {
      if (!on || !rec || !((r: JourneyRecord) => (fieldLookup(r, "status")?.key ?? null) === "vorschlag")(rec)) return;
      reportReadFailure('ki-vorschlaege-pruefen:linked', null);
      picks.aufgabe.adopt(rec);
      targets.aufgabe.onSelect(rec.id);
      // the link named the record — start after the steps that pick it, without the start screen
      const after = Math.max(...Object.keys(targets).map(k => steps[k] ?? 1)) + 1;
      if (new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('record') === linkedId) requestWizardStep(after);
    }).catch(() => { if (on) reportReadFailure('ki-vorschlaege-pruefen:linked', 'aufgabe'); });
    return () => { on = false; reportReadFailure('ki-vorschlaege-pruefen:linked', null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, [linkedId]);
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: KiVorschlaegePruefenFieldKey) => {
    if (field in targets) {
      const t = targets[field as keyof typeof targets];
      return { selectedId: t.selectedId, onSelect: t.onSelect };
    }
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined; recordOf?(id: string): JourneyRecord | undefined }>)[field];
    return {
      selectedId: (typeof owner.get(field) === 'string' ? (owner.get(field) as string) : null) || null,
      // `field as never` collapsed the conditional SetArgs<E, never> to never and
      // no argument was assignable any more (tsc, live 23.09.2026); widen `set`
      // itself instead — the label stays a required third argument.
      onSelect: (id: string) => {
        (owner.set as (k: string, v: unknown, l?: string) => void)(field, id, search?.labelOf(id));
        const rec = search?.recordOf?.(id);
        if (rec) prefillFrom(field, rec);
      },
    };
  };
  /** Props for a multi-record pick step: {...flow.picks.x.select} {...flow.pickMany('x')} */
  const pickMany = (field: KiVorschlaegePruefenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setAufgabeTargetId(null); writeJourneyExtra('ki-vorschlaege-pruefen', 'target:aufgabe', null); setKiExtraktTargetId(null); writeJourneyExtra('ki-vorschlaege-pruefen', 'target:ki_extrakt', null); mirrorRecordParam(null); };

  /** The ways this flow may end — spread as `variants={flow.actions}` onto <SummaryStep> (PV-14). */
  const flowActions = [
    { id: 'verwerfen', label: labelIn({"de": "Verwerfen", "en": "Discard"}), confirm: () => { variantRef.current = 'verwerfen'; return submit.run(); } },
  ];
  /** The counter-action of the changed record — `undo={flow.undo}` on <SuccessStep> (PV-15). */
  const flowUndo = aufgabeTargetId
    ? { label: labelIn({"de": "Zur\u00fcck zum Vorschlag", "en": "Back to suggestion"}), run: async () => {
        const id = aufgabeTargetId;
        await servicePort.update('aufgabe', id, UNDO_SETS);
        // the way back is a write like any other: the record's doors follow (a reopened record
        // takes submissions again, EF-58) and the overview re-reads
        if (Object.values(DOOR_PARENTS).some(d => d.entity === 'aufgabe')) await syncDoorsAfterWrite('aufgabe', id, UNDO_SETS);
        window.dispatchEvent(new CustomEvent('assistant:data-changed'));
      } }
    : undefined;
  return {
    slug: 'ki-vorschlaege-pruefen' as const,
    draftKey: 'ki-vorschlaege-pruefen' as const,    actions: flowActions,    undo: flowUndo,    entity: 'ki_extrakt' as const,
    form: ki_extrakt,
    forms, formList, picks, submit, steps, targets,    reviewStep: KIVORSCHLAEGEPRUEFEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type KiVorschlaegePruefenFlow = ReturnType<typeof useKiVorschlaegePruefenFlow>;
