/**
 * useBesuchStartenUndAufgabenAbhakenFlow — the plumbing of the flow « Besuch starten und Aufgaben abhaken », generated from the plan.
 *
 * Writes `besuch`: asks `betreute_person`, `betreuungsperson`, `einstieg`, `geraet`; sets `beginn`, `status` itself.
Changes `aufgabe` (only when the person fills it): the record to change is picked (`flow.pick('aufgabe')`), the form is prefilled with its values; asks `status`, `ergebnis`, `ergebniskommentar`, `nicht_durchgefuehrt_grund`, `erledigt_von`; sets `erledigt_am` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 6)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useBesuchStartenUndAufgabenAbhakenFlow({
 *     steps: { aufgabe: 1, betreute_person: 2, betreuungsperson: 3, erledigt_von: 4, einstieg: 5, geraet: 5, status: 5, ergebnis: 5, ergebniskommentar: 5, nicht_durchgefuehrt_grund: 5 },
 *     items: { betreute_person: r => ({ id: r.id, title: fieldText(r, 'vorname') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.betreute_person.select} {...flow.pick('betreute_person')} />
 *     <EntitySelectStep {...flow.picks.betreuungsperson.select} {...flow.pick('betreuungsperson')} />
 *     <EntitySelectStep {...flow.picks.erledigt_von.select} {...flow.pick('erledigt_von')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.aufgabe.select} {...flow.pick('aufgabe')} />
 *     <Bound form={flow.forms.besuch} name="einstieg" />
 *     <Bound form={flow.forms.besuch} name="geraet" />
 *     <Bound form={flow.forms.aufgabe} name="status" />
 *     <Bound form={flow.forms.aufgabe} name="ergebnis" />
 *     <Bound form={flow.forms.aufgabe} name="ergebniskommentar" />
 *     <Bound form={flow.forms.aufgabe} name="nicht_durchgefuehrt_grund" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
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
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion, refFilter, combineFilters,  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { requestWizardStep } from '@/lib/journey/useStepForm';
import { reportReadFailure } from '@/lib/journey/readFailures';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
import { entityLabel } from '@/lib/journey/rules';

export type BesuchStartenUndAufgabenAbhakenFieldKey = 'aufgabe' | 'betreute_person' | 'betreuungsperson' | 'einstieg' | 'ergebnis' | 'ergebniskommentar' | 'erledigt_von' | 'geraet' | 'nicht_durchgefuehrt_grund' | 'status';

export interface BesuchStartenUndAufgabenAbhakenForms {
  besuch: StepForm<'besuch'>;
  aufgabe: StepForm<'aufgabe'>;
}

// Alias so the option generics stay readable.
type Key = BesuchStartenUndAufgabenAbhakenFieldKey;

export interface BesuchStartenUndAufgabenAbhakenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    betreute_person?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    betreuungsperson?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    erledigt_von?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    aufgabe?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
  /** A page-side narrowing per pick, on top of the plan's filter (J-3): the
   *  questions of the picked event, the open ones — `r => fieldRef(r, 'veranstaltung') === eventId`. */
  where?: {
    betreute_person?: (record: JourneyRecord) => boolean;
    betreuungsperson?: (record: JourneyRecord) => boolean;
    erledigt_von?: (record: JourneyRecord) => boolean;
    aufgabe?: (record: JourneyRecord) => boolean;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"aufgabe": 1, "betreute_person": 2, "betreuungsperson": 3, "einstieg": 5, "ergebnis": 5, "ergebniskommentar": 5, "erledigt_von": 4, "geraet": 5, "nicht_durchgefuehrt_grund": 5, "status": 5};
export const BESUCHSTARTENUNDAUFGABENABHAKEN_REVIEW_STEP = 6;
// a label of the plan in the page's language
function labelIn(m: Record<string, string>): string {
  const l = (typeof document !== 'undefined' ? document.documentElement.lang : '') || 'de';
  return m[l.slice(0, 2)] ?? m.de ?? Object.values(m)[0] ?? '';
}
// the counter-action (plan: undo) — what puts the changed record back
const UNDO_SETS: Record<string, unknown> = {"erledigt_von": null, "status": "offen"};

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

export function useBesuchStartenUndAufgabenAbhakenFlow(options: BesuchStartenUndAufgabenAbhakenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [aufgabeTargetId, setAufgabeTargetId] = useState<string | null>(null);
  const besuch = useStepForm('besuch', {
    fields: ["betreute_person", "betreuungsperson", "einstieg", "geraet"],
    steps: only(steps, ["betreute_person", "betreuungsperson", "einstieg", "geraet"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["betreute_person", "betreuungsperson", "einstieg", "geraet"]),
    messages: only(options.messages as Record<string, string> | undefined, ["betreute_person", "betreuungsperson", "einstieg", "geraet"]),
  });
  const aufgabe = useStepForm('aufgabe', {
    fields: ["status", "ergebnis", "ergebniskommentar", "nicht_durchgefuehrt_grund", "erledigt_von"],
    steps: only(steps, ["status", "ergebnis", "ergebniskommentar", "nicht_durchgefuehrt_grund", "erledigt_von"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["status", "ergebnis", "ergebniskommentar", "nicht_durchgefuehrt_grund", "erledigt_von"]),
    messages: only(options.messages as Record<string, string> | undefined, ["status", "ergebnis", "ergebniskommentar", "nicht_durchgefuehrt_grund", "erledigt_von"]),
  });
  const forms: BesuchStartenUndAufgabenAbhakenForms = { besuch, aufgabe };
  // the editor of a list is not a record of its own: the review and the success
  // page read the entries (PlanStep.review), never the half-filled editor
  const formList: StepForm[] = [besuch, aufgabe];
  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  // a pick that belongs to another pick's record (A9): server filter + its client twin
  const dependsOn = (dep: unknown, field: string) => (typeof dep === 'string' && /^[a-f0-9]{24}$/i.test(dep) ? refFilter(field, dep) : undefined);
  const dependsWhere = (r: JourneyRecord, field: string, dep: unknown) => typeof dep !== 'string' || dep === '' || fieldRef(r, field) === dep;
  const searches = {
    betreute_person: useRecordSearch(servicePort, 'betreute_person', withPickPolicy('betreute_person', {
      searchFields: ["vorname", "nachname", "allergien", "wichtige_hinweise"] as never,
      filter: "r.v_status == 'aktiv'",
      where: (r: JourneyRecord) => ((fieldLookup(r, "status")?.key ?? null) === "aktiv") && (options.where?.betreute_person?.(r) ?? true),
      toItem: options.items?.betreute_person as never,
      claim: 'besuch.betreute_person',
    })),
    betreuungsperson: useRecordSearch(servicePort, 'person', withPickPolicy('betreuungsperson', {
      searchFields: ["vorname", "nachname"] as never,
      where: options.where?.betreuungsperson,
      toItem: options.items?.betreuungsperson as never,
      claim: 'besuch.betreuungsperson',
    })),
    erledigt_von: useRecordSearch(servicePort, 'person', withPickPolicy('erledigt_von', {
      searchFields: ["vorname", "nachname"] as never,
      where: options.where?.erledigt_von,
      toItem: options.items?.erledigt_von as never,
      claim: 'aufgabe.erledigt_von',
    })),
    aufgabe: useRecordSearch(servicePort, 'aufgabe', withPickPolicy('aufgabe', {
      searchFields: ["titel", "beschreibung"] as never,
      // only the aufgabe of the betreute_person picked before
      filter: combineFilters("r.v_status == 'offen'", dependsOn(besuch.get("betreute_person"), 'betreute_person')),
      where: (r: JourneyRecord) => ((fieldLookup(r, "status")?.key ?? null) === "offen") && dependsWhere(r, 'betreute_person', besuch.get("betreute_person")) && (options.where?.aufgabe?.(r) ?? true),
      toItem: options.items?.aufgabe as never,
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
    `#/verwaltung/anwendung?line=intent:besuch-starten-und-aufgaben-abhaken:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:besuch-starten-und-aufgaben-abhaken:write:${entity}.${field}`,
  });
  const picks = {
    betreute_person: { ...searches.betreute_person, select: { ...searches.betreute_person.select, create: true as boolean, hint: hintFor('betreute_person', 'betreute_person', {"conditions": [{"field": "status", "op": "eq", "value": "aktiv"}], "mode": "all"} as PickWhere | null) } },
    betreuungsperson: { ...searches.betreuungsperson, select: { ...searches.betreuungsperson.select, create: true as boolean, hint: hintFor('betreuungsperson', 'person', null as PickWhere | null) } },
    erledigt_von: { ...searches.erledigt_von, select: { ...searches.erledigt_von.select, create: true as boolean, hint: hintFor('erledigt_von', 'person', null as PickWhere | null) } },
    aufgabe: { ...searches.aufgabe, select: { ...searches.aufgabe.select, create: false as boolean, hint: hintFor('aufgabe', 'aufgabe', {"conditions": [{"field": "status", "op": "eq", "value": "offen"}], "mode": "all"} as PickWhere | null) } },
  };

  const aufgabeFilled = hasValues(aufgabe);
  const plan: PlanStep[] = [
    {
      key: 'besuch', entity: 'besuch', form: besuch, label: nounOne('besuch', entityLabel('besuch')), primary: true,
      values: (): FormValues => ({
        beginn: policyFixedValue('besuch', 'beginn') ?? nowIso(),
        status: policyFixedValue('besuch', 'status') ?? "laufend",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('besuch', 'status', policyFixedValue('besuch', 'status') ?? "laufend")],
    },
    ...(aufgabeFilled ? [{
      key: 'aufgabe', entity: 'aufgabe', form: aufgabe, label: nounOne('aufgabe', entityLabel('aufgabe')),
      updates: () => aufgabeTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => aufgabeTargetId
        ? { key: 'target:aufgabe', label: nounOne('aufgabe', entityLabel('aufgabe')), value: picks.aufgabe.labelOf(aufgabeTargetId) ?? aufgabeTargetId, step: steps.aufgabe }
        : undefined,
      values: (): FormValues => ({
        erledigt_am: policyFixedValue('aufgabe', 'erledigt_am') ?? nowIso(),
      }),
    } as PlanStep] : []),
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'besuch-starten-und-aufgaben-abhaken', onSuccess: (r) => {
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
    { const v = linkedParams.get('einstieg'); if (v !== null && isEmptyValue(besuch.get('einstieg'))) (besuch.set as (k: string, v: unknown) => void)('einstieg', coerce(besuch, 'einstieg', v)); }
    { const v = linkedParams.get('geraet'); if (v !== null && isEmptyValue(besuch.get('geraet'))) (besuch.set as (k: string, v: unknown) => void)('geraet', coerce(besuch, 'geraet', v)); }
    { const v = linkedParams.get('status'); if (v !== null && isEmptyValue(aufgabe.get('status'))) (aufgabe.set as (k: string, v: unknown) => void)('status', coerce(aufgabe, 'status', v)); }
    { const v = linkedParams.get('ergebnis'); if (v !== null && isEmptyValue(aufgabe.get('ergebnis'))) (aufgabe.set as (k: string, v: unknown) => void)('ergebnis', coerce(aufgabe, 'ergebnis', v)); }
    { const v = linkedParams.get('ergebniskommentar'); if (v !== null && isEmptyValue(aufgabe.get('ergebniskommentar'))) (aufgabe.set as (k: string, v: unknown) => void)('ergebniskommentar', coerce(aufgabe, 'ergebniskommentar', v)); }
    { const v = linkedParams.get('nicht_durchgefuehrt_grund'); if (v !== null && isEmptyValue(aufgabe.get('nicht_durchgefuehrt_grund'))) (aufgabe.set as (k: string, v: unknown) => void)('nicht_durchgefuehrt_grund', coerce(aufgabe, 'nicht_durchgefuehrt_grund', v)); }
    {
      const cur = forms.besuch.get('betreute_person');
      const fromLink = linkedParams.get('betreute_person');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.besuch.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('betreute_person', id).then(rec => {
        if (!on || !rec) return;
        picks.betreute_person.adopt(rec);
        const name = picks.betreute_person.labelOf(rec.id) ?? rec.id;
        (forms.besuch.set as (k: string, v: unknown, l?: string) => void)('betreute_person', rec.id, name);
        prefillFrom('betreute_person', rec);
      }).catch(() => undefined);
    }
    {
      const cur = forms.besuch.get('betreuungsperson');
      const fromLink = linkedParams.get('betreuungsperson');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.besuch.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('person', id).then(rec => {
        if (!on || !rec) return;
        picks.betreuungsperson.adopt(rec);
        const name = picks.betreuungsperson.labelOf(rec.id) ?? rec.id;
        (forms.besuch.set as (k: string, v: unknown, l?: string) => void)('betreuungsperson', rec.id, name);
        prefillFrom('betreuungsperson', rec);
      }).catch(() => undefined);
    }
    {
      const cur = forms.aufgabe.get('erledigt_von');
      const fromLink = linkedParams.get('erledigt_von');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.aufgabe.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('person', id).then(rec => {
        if (!on || !rec) return;
        picks.erledigt_von.adopt(rec);
        const name = picks.erledigt_von.labelOf(rec.id) ?? rec.id;
        (forms.aufgabe.set as (k: string, v: unknown, l?: string) => void)('erledigt_von', rec.id, name);
        prefillFrom('erledigt_von', rec);
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
        if (rec) aufgabe.reset({ status: fieldLookup(rec, "status")?.key, ergebnis: fieldLookup(rec, "ergebnis")?.key, ergebniskommentar: fieldText(rec, "ergebniskommentar"), nicht_durchgefuehrt_grund: fieldText(rec, "nicht_durchgefuehrt_grund"), erledigt_von: fieldRef(rec, "erledigt_von"), });
        // survives a reload: in the draft's side data, and as `?record=` in the address (J-8)
        writeJourneyExtra('besuch-starten-und-aufgaben-abhaken', 'target:aufgabe', id);
        mirrorRecordParam(id);
      },
      get record(): JourneyRecord | undefined { return aufgabeTargetId ? picks.aufgabe.recordOf(aufgabeTargetId) : undefined; },
    },
  };
  // Opened for one record — `#/intents/besuch-starten-und-aufgaben-abhaken?record=<id>`, the dashboard's
  // flowActionFor(): that record is the one to change. Loaded, taken into the
  // pick and selected — when this flow may change it at all (the pick's rule).
  // After a reload the pick comes back the same way: from the address, else
  // from the draft's side data (J-8).
  const [linkedId] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('record')
    ?? readJourneyExtra<string>('besuch-starten-und-aufgaben-abhaken', 'target:aufgabe'));
  useEffect(() => {
    if (!linkedId) return;
    let on = true;
    void servicePort.get('aufgabe', linkedId).then(rec => {
      if (!on || !rec || !((r: JourneyRecord) => (fieldLookup(r, "status")?.key ?? null) === "offen")(rec)) return;
      reportReadFailure('besuch-starten-und-aufgaben-abhaken:linked', null);
      picks.aufgabe.adopt(rec);
      targets.aufgabe.onSelect(rec.id);
      // the link named the record — start after the steps that pick it, without the start screen
      const after = Math.max(...Object.keys(targets).map(k => steps[k] ?? 1)) + 1;
      if (new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('record') === linkedId) requestWizardStep(after);
    }).catch(() => { if (on) reportReadFailure('besuch-starten-und-aufgaben-abhaken:linked', 'aufgabe'); });
    return () => { on = false; reportReadFailure('besuch-starten-und-aufgaben-abhaken:linked', null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, [linkedId]);
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: BesuchStartenUndAufgabenAbhakenFieldKey) => {
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
  const pickMany = (field: BesuchStartenUndAufgabenAbhakenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setAufgabeTargetId(null); writeJourneyExtra('besuch-starten-und-aufgaben-abhaken', 'target:aufgabe', null); mirrorRecordParam(null); };

  /** The counter-action of the changed record — `undo={flow.undo}` on <SuccessStep> (PV-15). */
  const flowUndo = aufgabeTargetId
    ? { label: labelIn({"de": "Aufgabe wieder \u00f6ffnen", "en": "Reopen task"}), run: async () => {
        const id = aufgabeTargetId;
        await servicePort.update('aufgabe', id, UNDO_SETS);
        // the way back is a write like any other: the record's doors follow (a reopened record
        // takes submissions again, EF-58) and the overview re-reads
        if (Object.values(DOOR_PARENTS).some(d => d.entity === 'aufgabe')) await syncDoorsAfterWrite('aufgabe', id, UNDO_SETS);
        window.dispatchEvent(new CustomEvent('assistant:data-changed'));
      } }
    : undefined;
  return {
    slug: 'besuch-starten-und-aufgaben-abhaken' as const,
    draftKey: 'besuch-starten-und-aufgaben-abhaken' as const,    undo: flowUndo,    entity: 'besuch' as const,
    form: besuch,
    forms, formList, picks, submit, steps, targets,    reviewStep: BESUCHSTARTENUNDAUFGABENABHAKEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type BesuchStartenUndAufgabenAbhakenFlow = ReturnType<typeof useBesuchStartenUndAufgabenAbhakenFlow>;
