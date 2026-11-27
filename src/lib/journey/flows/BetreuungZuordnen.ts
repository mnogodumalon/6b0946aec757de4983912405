/**
 * useBetreuungZuordnenFlow — the plumbing of the flow « Betreuung zuordnen », generated from the plan.
 *
 * Writes `betreuungszuordnung`: asks `betreute_person`, `betreuungsperson`, `rolle`, `gueltig_ab`, `gueltig_bis`, `beauftragt_durch`, `beauftragt_durch_organisation`, `vertretung_fuer`, `ausfall_von`, `ausfall_bis`, `bemerkung`; sets `beauftragt_am` itself.
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
 *   const flow = useBetreuungZuordnenFlow({
 *     steps: { betreute_person: 1, betreuungsperson: 2, beauftragt_durch: 3, vertretung_fuer: 4, rolle: 5, gueltig_ab: 5, gueltig_bis: 5, beauftragt_durch_organisation: 5, ausfall_von: 5, ausfall_bis: 5, bemerkung: 5 },
 *     items: { betreute_person: r => ({ id: r.id, title: fieldText(r, 'vorname') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.betreute_person.select} {...flow.pick('betreute_person')} />
 *     <EntitySelectStep {...flow.picks.betreuungsperson.select} {...flow.pick('betreuungsperson')} />
 *     <EntitySelectStep {...flow.picks.beauftragt_durch.select} {...flow.pick('beauftragt_durch')} />
 *     <EntitySelectStep {...flow.picks.vertretung_fuer.select} {...flow.pick('vertretung_fuer')} />
 *     <Bound form={flow.forms.betreuungszuordnung} name="rolle" />
 *     <Bound form={flow.forms.betreuungszuordnung} name="gueltig_ab" />
 *     <Bound form={flow.forms.betreuungszuordnung} name="gueltig_bis" />
 *     <Bound form={flow.forms.betreuungszuordnung} name="beauftragt_durch_organisation" />
 *     <Bound form={flow.forms.betreuungszuordnung} name="ausfall_von" />
 *     <Bound form={flow.forms.betreuungszuordnung} name="ausfall_bis" />
 *     <Bound form={flow.forms.betreuungszuordnung} name="bemerkung" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
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
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
import { entityLabel } from '@/lib/journey/rules';

export type BetreuungZuordnenFieldKey = 'ausfall_bis' | 'ausfall_von' | 'beauftragt_durch' | 'beauftragt_durch_organisation' | 'bemerkung' | 'betreute_person' | 'betreuungsperson' | 'gueltig_ab' | 'gueltig_bis' | 'rolle' | 'vertretung_fuer';

export interface BetreuungZuordnenForms {
  betreuungszuordnung: StepForm<'betreuungszuordnung'>;
}

// Alias so the option generics stay readable.
type Key = BetreuungZuordnenFieldKey;

export interface BetreuungZuordnenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    betreute_person?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    betreuungsperson?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    beauftragt_durch?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    vertretung_fuer?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
  /** A page-side narrowing per pick, on top of the plan's filter (J-3): the
   *  questions of the picked event, the open ones — `r => fieldRef(r, 'veranstaltung') === eventId`. */
  where?: {
    betreute_person?: (record: JourneyRecord) => boolean;
    betreuungsperson?: (record: JourneyRecord) => boolean;
    beauftragt_durch?: (record: JourneyRecord) => boolean;
    vertretung_fuer?: (record: JourneyRecord) => boolean;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"ausfall_bis": 5, "ausfall_von": 5, "beauftragt_durch": 3, "beauftragt_durch_organisation": 5, "bemerkung": 5, "betreute_person": 1, "betreuungsperson": 2, "gueltig_ab": 5, "gueltig_bis": 5, "rolle": 5, "vertretung_fuer": 4};
export const BETREUUNGZUORDNEN_REVIEW_STEP = 6;

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

export function useBetreuungZuordnenFlow(options: BetreuungZuordnenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const betreuungszuordnung = useStepForm('betreuungszuordnung', {
    fields: ["betreute_person", "betreuungsperson", "rolle", "gueltig_ab", "gueltig_bis", "beauftragt_durch", "beauftragt_durch_organisation", "vertretung_fuer", "ausfall_von", "ausfall_bis", "bemerkung"],
    steps: only(steps, ["betreute_person", "betreuungsperson", "rolle", "gueltig_ab", "gueltig_bis", "beauftragt_durch", "beauftragt_durch_organisation", "vertretung_fuer", "ausfall_von", "ausfall_bis", "bemerkung"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["betreute_person", "betreuungsperson", "rolle", "gueltig_ab", "gueltig_bis", "beauftragt_durch", "beauftragt_durch_organisation", "vertretung_fuer", "ausfall_von", "ausfall_bis", "bemerkung"]),
    messages: only(options.messages as Record<string, string> | undefined, ["betreute_person", "betreuungsperson", "rolle", "gueltig_ab", "gueltig_bis", "beauftragt_durch", "beauftragt_durch_organisation", "vertretung_fuer", "ausfall_von", "ausfall_bis", "bemerkung"]),
  });
  const forms: BetreuungZuordnenForms = { betreuungszuordnung };
  // the editor of a list is not a record of its own: the review and the success
  // page read the entries (PlanStep.review), never the half-filled editor
  const formList: StepForm[] = [betreuungszuordnung];
  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  // a pick that belongs to another pick's record (A9): server filter + its client twin
  const dependsOn = (dep: unknown, field: string) => (typeof dep === 'string' && /^[a-f0-9]{24}$/i.test(dep) ? refFilter(field, dep) : undefined);
  const dependsWhere = (r: JourneyRecord, field: string, dep: unknown) => typeof dep !== 'string' || dep === '' || fieldRef(r, field) === dep;
  const searches = {
    betreute_person: useRecordSearch(servicePort, 'betreute_person', withPickPolicy('betreute_person', {
      searchFields: ["vorname", "nachname"] as never,
      filter: "r.v_status != 'beendet'",
      where: (r: JourneyRecord) => ((fieldLookup(r, "status")?.key ?? null) !== "beendet") && (options.where?.betreute_person?.(r) ?? true),
      toItem: options.items?.betreute_person as never,
      claim: 'betreuungszuordnung.betreute_person',
    })),
    betreuungsperson: useRecordSearch(servicePort, 'person', withPickPolicy('betreuungsperson', {
      searchFields: ["vorname", "nachname"] as never,
      filter: "r.v_aktiv == True",
      where: (r: JourneyRecord) => (r.fields["aktiv"] === true) && (options.where?.betreuungsperson?.(r) ?? true),
      toItem: options.items?.betreuungsperson as never,
      claim: 'betreuungszuordnung.betreuungsperson',
    })),
    beauftragt_durch: useRecordSearch(servicePort, 'person', withPickPolicy('beauftragt_durch', {
      searchFields: ["vorname", "nachname"] as never,
      filter: "r.v_aktiv == True",
      where: (r: JourneyRecord) => (r.fields["aktiv"] === true) && (options.where?.beauftragt_durch?.(r) ?? true),
      toItem: options.items?.beauftragt_durch as never,
      claim: 'betreuungszuordnung.beauftragt_durch',
    })),
    vertretung_fuer: useRecordSearch(servicePort, 'betreuungszuordnung', withPickPolicy('vertretung_fuer', {
      searchFields: ["beauftragt_durch_organisation"] as never,
      // only the betreuungszuordnung of the betreute_person picked before
      filter: combineFilters(undefined, dependsOn(betreuungszuordnung.get("betreute_person"), 'betreute_person')),
      where: (r: JourneyRecord) => (true) && dependsWhere(r, 'betreute_person', betreuungszuordnung.get("betreute_person")) && (options.where?.vertretung_fuer?.(r) ?? true),
      toItem: options.items?.vertretung_fuer as never,
      claim: 'betreuungszuordnung.vertretung_fuer',
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:betreuung-zuordnen:read:${entity}`);
  const picks = {
    betreute_person: { ...searches.betreute_person, select: { ...searches.betreute_person.select, create: true as boolean, hint: hintFor('betreute_person', 'betreute_person', {"conditions": [{"field": "status", "op": "ne", "value": "beendet"}], "mode": "all"} as PickWhere | null) } },
    betreuungsperson: { ...searches.betreuungsperson, select: { ...searches.betreuungsperson.select, create: true as boolean, hint: hintFor('betreuungsperson', 'person', {"conditions": [{"field": "aktiv", "op": "eq", "value": "true"}], "mode": "all"} as PickWhere | null) } },
    beauftragt_durch: { ...searches.beauftragt_durch, select: { ...searches.beauftragt_durch.select, create: true as boolean, hint: hintFor('beauftragt_durch', 'person', {"conditions": [{"field": "aktiv", "op": "eq", "value": "true"}], "mode": "all"} as PickWhere | null) } },
    vertretung_fuer: { ...searches.vertretung_fuer, select: { ...searches.vertretung_fuer.select, create: false as boolean, hint: hintFor('vertretung_fuer', 'betreuungszuordnung', null as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'betreuungszuordnung', entity: 'betreuungszuordnung', form: betreuungszuordnung, label: nounOne('betreuungszuordnung', entityLabel('betreuungszuordnung')), primary: true,
      values: (): FormValues => ({
        beauftragt_am: policyFixedValue('betreuungszuordnung', 'beauftragt_am') ?? todayIso(),
      }),
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'betreuung-zuordnen', onSuccess: (r) => {
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
    { const v = linkedParams.get('rolle'); if (v !== null && isEmptyValue(betreuungszuordnung.get('rolle'))) (betreuungszuordnung.set as (k: string, v: unknown) => void)('rolle', coerce(betreuungszuordnung, 'rolle', v)); }
    { const v = linkedParams.get('gueltig_ab'); if (v !== null && isEmptyValue(betreuungszuordnung.get('gueltig_ab'))) (betreuungszuordnung.set as (k: string, v: unknown) => void)('gueltig_ab', coerce(betreuungszuordnung, 'gueltig_ab', v)); }
    { const v = linkedParams.get('gueltig_bis'); if (v !== null && isEmptyValue(betreuungszuordnung.get('gueltig_bis'))) (betreuungszuordnung.set as (k: string, v: unknown) => void)('gueltig_bis', coerce(betreuungszuordnung, 'gueltig_bis', v)); }
    { const v = linkedParams.get('beauftragt_durch_organisation'); if (v !== null && isEmptyValue(betreuungszuordnung.get('beauftragt_durch_organisation'))) (betreuungszuordnung.set as (k: string, v: unknown) => void)('beauftragt_durch_organisation', coerce(betreuungszuordnung, 'beauftragt_durch_organisation', v)); }
    { const v = linkedParams.get('ausfall_von'); if (v !== null && isEmptyValue(betreuungszuordnung.get('ausfall_von'))) (betreuungszuordnung.set as (k: string, v: unknown) => void)('ausfall_von', coerce(betreuungszuordnung, 'ausfall_von', v)); }
    { const v = linkedParams.get('ausfall_bis'); if (v !== null && isEmptyValue(betreuungszuordnung.get('ausfall_bis'))) (betreuungszuordnung.set as (k: string, v: unknown) => void)('ausfall_bis', coerce(betreuungszuordnung, 'ausfall_bis', v)); }
    { const v = linkedParams.get('bemerkung'); if (v !== null && isEmptyValue(betreuungszuordnung.get('bemerkung'))) (betreuungszuordnung.set as (k: string, v: unknown) => void)('bemerkung', coerce(betreuungszuordnung, 'bemerkung', v)); }
    {
      const cur = forms.betreuungszuordnung.get('betreute_person');
      const fromLink = linkedParams.get('betreute_person');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.betreuungszuordnung.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('betreute_person', id).then(rec => {
        if (!on || !rec) return;
        picks.betreute_person.adopt(rec);
        const name = picks.betreute_person.labelOf(rec.id) ?? rec.id;
        (forms.betreuungszuordnung.set as (k: string, v: unknown, l?: string) => void)('betreute_person', rec.id, name);
        prefillFrom('betreute_person', rec);
      }).catch(() => undefined);
    }
    {
      const cur = forms.betreuungszuordnung.get('betreuungsperson');
      const fromLink = linkedParams.get('betreuungsperson');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.betreuungszuordnung.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('person', id).then(rec => {
        if (!on || !rec) return;
        picks.betreuungsperson.adopt(rec);
        const name = picks.betreuungsperson.labelOf(rec.id) ?? rec.id;
        (forms.betreuungszuordnung.set as (k: string, v: unknown, l?: string) => void)('betreuungsperson', rec.id, name);
        prefillFrom('betreuungsperson', rec);
      }).catch(() => undefined);
    }
    {
      const cur = forms.betreuungszuordnung.get('beauftragt_durch');
      const fromLink = linkedParams.get('beauftragt_durch');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.betreuungszuordnung.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('person', id).then(rec => {
        if (!on || !rec) return;
        picks.beauftragt_durch.adopt(rec);
        const name = picks.beauftragt_durch.labelOf(rec.id) ?? rec.id;
        (forms.betreuungszuordnung.set as (k: string, v: unknown, l?: string) => void)('beauftragt_durch', rec.id, name);
        prefillFrom('beauftragt_durch', rec);
      }).catch(() => undefined);
    }
    {
      const cur = forms.betreuungszuordnung.get('vertretung_fuer');
      const fromLink = linkedParams.get('vertretung_fuer');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.betreuungszuordnung.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('betreuungszuordnung', id).then(rec => {
        if (!on || !rec) return;
        picks.vertretung_fuer.adopt(rec);
        const name = picks.vertretung_fuer.labelOf(rec.id) ?? rec.id;
        (forms.betreuungszuordnung.set as (k: string, v: unknown, l?: string) => void)('vertretung_fuer', rec.id, name);
        prefillFrom('vertretung_fuer', rec);
      }).catch(() => undefined);
    }
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, []);

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: BetreuungZuordnenFieldKey) => {
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
  const pickMany = (field: BetreuungZuordnenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'betreuung-zuordnen' as const,
    draftKey: 'betreuung-zuordnen' as const,    entity: 'betreuungszuordnung' as const,
    form: betreuungszuordnung,
    forms, formList, picks, submit, steps,    reviewStep: BETREUUNGZUORDNEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type BetreuungZuordnenFlow = ReturnType<typeof useBetreuungZuordnenFlow>;
