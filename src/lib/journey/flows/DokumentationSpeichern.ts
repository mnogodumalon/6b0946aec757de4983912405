/**
 * useDokumentationSpeichernFlow — the plumbing of the flow « Dokumentation speichern », generated from the plan.
 *
 * Writes `dokumentation`: asks `betreute_person`, `autor`, `text`, `eingabeart`, `ergaenzung_zu`; sets `erfasst_am`, `besuch` itself.
Writes `anhang_zur_dokumentation` (only when the person fills it) SEVERAL times — one record per entry of `flow.lists.anhang_zur_dokumentation`; the form is the editor of one entry: asks `datei`, `typ`, `aufgenommen_von`, `beschriftung`; sets `aufgenommen_am` itself; links `dokumentation` ← the created `dokumentation`.
Changes `besuch`: the record to change is picked (`flow.pick('besuch')`), the form is prefilled with its values; ; sets `ende`, `status` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 8)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   Lists (several records of one entity per run): `flow.lists.<key>` holds the
 *   entries — `add()` validates the editor form and takes its values as one more
 *   record, `remove(id)`, `edit(id)` (back into the editor), `entries`, `count`.
 *   Render the editor's fields INSIDE <ListEntries list={flow.lists.<key>}> (the
 *   block adds „Hinzufügen“ and the entry list); „Weiter“ on that step takes a
 *   filled editor as one more entry and needs at least one entry.
 *
 *   const flow = useDokumentationSpeichernFlow({
 *     steps: { besuch: 1, betreute_person: 2, autor: 3, ergaenzung_zu: 4, aufgenommen_von: 5, text: 6, eingabeart: 6, datei: 7, typ: 7, beschriftung: 7 },
 *     items: { betreute_person: r => ({ id: r.id, title: fieldText(r, 'vorname') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.betreute_person.select} {...flow.pick('betreute_person')} />
 *     <EntitySelectStep {...flow.picks.autor.select} {...flow.pick('autor')} />
 *     <EntitySelectStep {...flow.picks.ergaenzung_zu.select} {...flow.pick('ergaenzung_zu')} />
 *     <EntitySelectStep {...flow.picks.aufgenommen_von.select} {...flow.pick('aufgenommen_von')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.besuch.select} {...flow.pick('besuch')} />
 *     <Bound form={flow.forms.dokumentation} name="text" />
 *     <Bound form={flow.forms.dokumentation} name="eingabeart" />
 *     <ListEntries list={flow.lists.anhang_zur_dokumentation}><Bound form={flow.forms.anhang_zur_dokumentation} name="datei" /><Bound form={flow.forms.anhang_zur_dokumentation} name="typ" /><Bound form={flow.forms.anhang_zur_dokumentation} name="beschriftung" /></ListEntries>
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
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion, refFilter, combineFilters,  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { requestWizardStep } from '@/lib/journey/useStepForm';
import { reportReadFailure } from '@/lib/journey/readFailures';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
import { entityLabel } from '@/lib/journey/rules';

export type DokumentationSpeichernFieldKey = 'aufgenommen_von' | 'autor' | 'beschriftung' | 'besuch' | 'betreute_person' | 'datei' | 'eingabeart' | 'ergaenzung_zu' | 'text' | 'typ';

export interface DokumentationSpeichernForms {
  dokumentation: StepForm<'dokumentation'>;
  anhang_zur_dokumentation: StepForm<'anhang_zur_dokumentation'>;
  besuch: StepForm<'besuch'>;
}

// Alias so the option generics stay readable.
type Key = DokumentationSpeichernFieldKey;

export interface DokumentationSpeichernFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    betreute_person?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    autor?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    ergaenzung_zu?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    aufgenommen_von?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    besuch?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
  /** A page-side narrowing per pick, on top of the plan's filter (J-3): the
   *  questions of the picked event, the open ones — `r => fieldRef(r, 'veranstaltung') === eventId`. */
  where?: {
    betreute_person?: (record: JourneyRecord) => boolean;
    autor?: (record: JourneyRecord) => boolean;
    ergaenzung_zu?: (record: JourneyRecord) => boolean;
    aufgenommen_von?: (record: JourneyRecord) => boolean;
    besuch?: (record: JourneyRecord) => boolean;
  };
}

/** One entry of a list the flow creates several records from (`flow.lists.<key>`). */
export interface ListEntry { id: string; values: FormValues; labels: Record<string, string>; rows: SummaryItem[] }

const DEFAULT_STEPS: Record<string, number> = {"aufgenommen_von": 5, "autor": 3, "beschriftung": 7, "besuch": 1, "betreute_person": 2, "datei": 7, "eingabeart": 6, "ergaenzung_zu": 4, "text": 6, "typ": 7};
export const DOKUMENTATIONSPEICHERN_REVIEW_STEP = 8;

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

export function useDokumentationSpeichernFlow(options: DokumentationSpeichernFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [besuchTargetId, setBesuchTargetId] = useState<string | null>(null);
  const dokumentation = useStepForm('dokumentation', {
    fields: ["betreute_person", "autor", "text", "eingabeart", "ergaenzung_zu"],
    steps: only(steps, ["betreute_person", "autor", "text", "eingabeart", "ergaenzung_zu"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["betreute_person", "autor", "text", "eingabeart", "ergaenzung_zu"]),
    messages: only(options.messages as Record<string, string> | undefined, ["betreute_person", "autor", "text", "eingabeart", "ergaenzung_zu"]),
  });
  const anhang_zur_dokumentation = useStepForm('anhang_zur_dokumentation', {
    fields: ["datei", "typ", "aufgenommen_von", "beschriftung"],
    steps: only(steps, ["datei", "typ", "aufgenommen_von", "beschriftung"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["datei", "typ", "aufgenommen_von", "beschriftung"]),
    messages: only(options.messages as Record<string, string> | undefined, ["datei", "typ", "aufgenommen_von", "beschriftung"]),
  });
  const besuch = useStepForm('besuch', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const [anhang_zur_dokumentationEntries, setAnhangZurDokumentationEntries] = useState<ListEntry[]>(() => readJourneyExtra<ListEntry[]>('dokumentation-speichern', 'list:anhang_zur_dokumentation') ?? []);
  useEffect(() => { writeJourneyExtra('dokumentation-speichern', 'list:anhang_zur_dokumentation', anhang_zur_dokumentationEntries.length ? anhang_zur_dokumentationEntries : null); }, [anhang_zur_dokumentationEntries]);
  const forms: DokumentationSpeichernForms = { dokumentation, anhang_zur_dokumentation, besuch };
  // the editor of a list is not a record of its own: the review and the success
  // page read the entries (PlanStep.review), never the half-filled editor
  const formList: StepForm[] = [dokumentation, besuch];
  const allForms: StepForm[] = [dokumentation, anhang_zur_dokumentation, besuch];
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
      where: options.where?.betreute_person,
      toItem: options.items?.betreute_person as never,
      claim: 'dokumentation.betreute_person',
    })),
    autor: useRecordSearch(servicePort, 'person', withPickPolicy('autor', {
      searchFields: ["vorname", "nachname"] as never,
      where: options.where?.autor,
      toItem: options.items?.autor as never,
      claim: 'dokumentation.autor',
    })),
    ergaenzung_zu: useRecordSearch(servicePort, 'dokumentation', withPickPolicy('ergaenzung_zu', {
      searchFields: ["text"] as never,
      // only the dokumentation of the betreute_person picked before
      filter: combineFilters(undefined, dependsOn(dokumentation.get("betreute_person"), 'betreute_person')),
      where: (r: JourneyRecord) => (true) && dependsWhere(r, 'betreute_person', dokumentation.get("betreute_person")) && (options.where?.ergaenzung_zu?.(r) ?? true),
      toItem: options.items?.ergaenzung_zu as never,
      claim: 'dokumentation.ergaenzung_zu',
    })),
    aufgenommen_von: useRecordSearch(servicePort, 'person', withPickPolicy('aufgenommen_von', {
      searchFields: ["vorname", "nachname"] as never,
      where: options.where?.aufgenommen_von,
      toItem: options.items?.aufgenommen_von as never,
      claim: 'anhang_zur_dokumentation.aufgenommen_von',
    })),
    besuch: useRecordSearch(servicePort, 'besuch', withPickPolicy('besuch', {
      searchFields: ["geraet"] as never,
      // only the besuch of the betreute_person picked before
      filter: combineFilters("r.v_status == 'laufend'", dependsOn(dokumentation.get("betreute_person"), 'betreute_person')),
      where: (r: JourneyRecord) => ((fieldLookup(r, "status")?.key ?? null) === "laufend") && dependsWhere(r, 'betreute_person', dokumentation.get("betreute_person")) && (options.where?.besuch?.(r) ?? true),
      toItem: options.items?.besuch as never,
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
    `#/verwaltung/anwendung?line=intent:dokumentation-speichern:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:dokumentation-speichern:write:${entity}.${field}`,
  });
  const picks = {
    betreute_person: { ...searches.betreute_person, select: { ...searches.betreute_person.select, create: true as boolean, hint: hintFor('betreute_person', 'betreute_person', null as PickWhere | null) } },
    autor: { ...searches.autor, select: { ...searches.autor.select, create: true as boolean, hint: hintFor('autor', 'person', null as PickWhere | null) } },
    ergaenzung_zu: { ...searches.ergaenzung_zu, select: { ...searches.ergaenzung_zu.select, create: false as boolean, hint: hintFor('ergaenzung_zu', 'dokumentation', null as PickWhere | null) } },
    aufgenommen_von: { ...searches.aufgenommen_von, select: { ...searches.aufgenommen_von.select, create: true as boolean, hint: hintFor('aufgenommen_von', 'person', null as PickWhere | null) } },
    besuch: { ...searches.besuch, select: { ...searches.besuch.select, create: false as boolean, hint: hintFor('besuch', 'besuch', {"conditions": [{"field": "status", "op": "eq", "value": "laufend"}], "mode": "all"} as PickWhere | null) } },
  };

  const anhang_zur_dokumentationFilled = hasValues(anhang_zur_dokumentation);
  // Lists — several records of one entity in one run („ein paar Termine“): the
  // editor form takes one entry at a time, `add()` validates it and puts it on
  // the list, the plan creates one record per entry (02.11.2026: the wish said
  // several, the flow made exactly one and nobody reported the difference)
  const lists = {
    anhang_zur_dokumentation: {
      entries: anhang_zur_dokumentationEntries,
      count: anhang_zur_dokumentationEntries.length,
      label: nounOne('anhang_zur_dokumentation', entityLabel('anhang_zur_dokumentation')),
      /** Validates the editor and takes its values as one more `anhang_zur_dokumentation`; false when a required field is empty. */
      add: (): boolean => {
        if (!anhang_zur_dokumentation.validate()) return false;
        const rows = anhang_zur_dokumentation.summary().filter(r => r.value !== '—');
        const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        // the snapshot is taken HERE, never inside the updater: React may run the updater in the
        // next render, after reset() below emptied the editor — and payload() reads the latest
        // values (EF-38), so every entry arrived without its dates (EF-41, Doodle KB 5)
        const values = anhang_zur_dokumentation.payload();
        const labels = { ...anhang_zur_dokumentation.labels };
        setAnhangZurDokumentationEntries(list => [...list, { id, values, labels, rows }]);
        anhang_zur_dokumentation.reset();
        return true;
      },
      remove: (id: string) => setAnhangZurDokumentationEntries(list => list.filter(e => e.id !== id)),
      /** Takes an entry back into the editor to change it. */
      edit: (id: string) => {
        const e = anhang_zur_dokumentationEntries.find(x => x.id === id);
        if (!e) return;
        setAnhangZurDokumentationEntries(list => list.filter(x => x.id !== id));
        anhang_zur_dokumentation.reset(e.values, e.labels);
      },
    },
  };
  const plan: PlanStep[] = [
    {
      key: 'dokumentation', entity: 'dokumentation', form: dokumentation, label: nounOne('dokumentation', entityLabel('dokumentation')), primary: true,
      values: (): FormValues => ({
        erfasst_am: policyFixedValue('dokumentation', 'erfasst_am') ?? nowIso(),
        besuch: policyFixedValue('dokumentation', 'besuch') ?? (besuchTargetId ?? undefined),
      }),
    },
    ...anhang_zur_dokumentationEntries.map((entry, i) => ({
      key: `anhang_zur_dokumentation:${entry.id}`, entity: 'anhang_zur_dokumentation', label: `${nounOne('anhang_zur_dokumentation', entityLabel('anhang_zur_dokumentation'))} ${i + 1}`,
      needs: ['dokumentation'],
      link: { dokumentation: 'dokumentation' },
      values: (): FormValues => ({
        ...entry.values,
        aufgenommen_am: policyFixedValue('anhang_zur_dokumentation', 'aufgenommen_am') ?? nowIso(),
      }),
      // the review lists every entry („1. Termin: …“); „Ändern“ leads back to the list's step
      review: () => entry.rows.map(r => ({ ...r, key: `anhang_zur_dokumentation:${entry.id}:${r.key}`, label: `${i + 1}. ${r.label}`, step: steps[r.key] })),
    } as PlanStep)),
    {
      key: 'besuch', entity: 'besuch', form: besuch, label: nounOne('besuch', entityLabel('besuch')),
      updates: () => besuchTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => besuchTargetId
        ? { key: 'target:besuch', label: nounOne('besuch', entityLabel('besuch')), value: picks.besuch.labelOf(besuchTargetId) ?? besuchTargetId, step: steps.besuch }
        : undefined,
      values: (): FormValues => ({
        ende: policyFixedValue('besuch', 'ende') ?? nowIso(),
        status: policyFixedValue('besuch', 'status') ?? "abgeschlossen",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('besuch', 'status', policyFixedValue('besuch', 'status') ?? "abgeschlossen")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'dokumentation-speichern', onSuccess: (r) => {
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
    { const v = linkedParams.get('text'); if (v !== null && isEmptyValue(dokumentation.get('text'))) (dokumentation.set as (k: string, v: unknown) => void)('text', coerce(dokumentation, 'text', v)); }
    { const v = linkedParams.get('eingabeart'); if (v !== null && isEmptyValue(dokumentation.get('eingabeart'))) (dokumentation.set as (k: string, v: unknown) => void)('eingabeart', coerce(dokumentation, 'eingabeart', v)); }
    {
      const cur = forms.dokumentation.get('betreute_person');
      const fromLink = linkedParams.get('betreute_person');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.dokumentation.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('betreute_person', id).then(rec => {
        if (!on || !rec) return;
        picks.betreute_person.adopt(rec);
        const name = picks.betreute_person.labelOf(rec.id) ?? rec.id;
        (forms.dokumentation.set as (k: string, v: unknown, l?: string) => void)('betreute_person', rec.id, name);
        prefillFrom('betreute_person', rec);
      }).catch(() => undefined);
    }
    {
      const cur = forms.dokumentation.get('autor');
      const fromLink = linkedParams.get('autor');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.dokumentation.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('person', id).then(rec => {
        if (!on || !rec) return;
        picks.autor.adopt(rec);
        const name = picks.autor.labelOf(rec.id) ?? rec.id;
        (forms.dokumentation.set as (k: string, v: unknown, l?: string) => void)('autor', rec.id, name);
        prefillFrom('autor', rec);
      }).catch(() => undefined);
    }
    {
      const cur = forms.dokumentation.get('ergaenzung_zu');
      const fromLink = linkedParams.get('ergaenzung_zu');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.dokumentation.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('dokumentation', id).then(rec => {
        if (!on || !rec) return;
        picks.ergaenzung_zu.adopt(rec);
        const name = picks.ergaenzung_zu.labelOf(rec.id) ?? rec.id;
        (forms.dokumentation.set as (k: string, v: unknown, l?: string) => void)('ergaenzung_zu', rec.id, name);
        prefillFrom('ergaenzung_zu', rec);
      }).catch(() => undefined);
    }
    {
      const cur = forms.anhang_zur_dokumentation.get('aufgenommen_von');
      const fromLink = linkedParams.get('aufgenommen_von');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.anhang_zur_dokumentation.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('person', id).then(rec => {
        if (!on || !rec) return;
        picks.aufgenommen_von.adopt(rec);
        const name = picks.aufgenommen_von.labelOf(rec.id) ?? rec.id;
        (forms.anhang_zur_dokumentation.set as (k: string, v: unknown, l?: string) => void)('aufgenommen_von', rec.id, name);
        prefillFrom('aufgenommen_von', rec);
      }).catch(() => undefined);
    }
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, []);

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    besuch: {
      selectedId: besuchTargetId,
      onSelect: (id: string) => {
        setBesuchTargetId(id);
        const rec = picks.besuch.recordOf(id);
        if (rec) besuch.reset({ });
        // survives a reload: in the draft's side data, and as `?record=` in the address (J-8)
        writeJourneyExtra('dokumentation-speichern', 'target:besuch', id);
        mirrorRecordParam(id);
      },
      get record(): JourneyRecord | undefined { return besuchTargetId ? picks.besuch.recordOf(besuchTargetId) : undefined; },
    },
  };
  // Opened for one record — `#/intents/dokumentation-speichern?record=<id>`, the dashboard's
  // flowActionFor(): that record is the one to change. Loaded, taken into the
  // pick and selected — when this flow may change it at all (the pick's rule).
  // After a reload the pick comes back the same way: from the address, else
  // from the draft's side data (J-8).
  const [linkedId] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('record')
    ?? readJourneyExtra<string>('dokumentation-speichern', 'target:besuch'));
  useEffect(() => {
    if (!linkedId) return;
    let on = true;
    void servicePort.get('besuch', linkedId).then(rec => {
      if (!on || !rec || !((r: JourneyRecord) => (fieldLookup(r, "status")?.key ?? null) === "laufend")(rec)) return;
      reportReadFailure('dokumentation-speichern:linked', null);
      picks.besuch.adopt(rec);
      targets.besuch.onSelect(rec.id);
      // the link named the record — start after the steps that pick it, without the start screen
      const after = Math.max(...Object.keys(targets).map(k => steps[k] ?? 1)) + 1;
      if (new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('record') === linkedId) requestWizardStep(after);
    }).catch(() => { if (on) reportReadFailure('dokumentation-speichern:linked', 'besuch'); });
    return () => { on = false; reportReadFailure('dokumentation-speichern:linked', null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, [linkedId]);
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: DokumentationSpeichernFieldKey) => {
    if (field in targets) {
      const t = targets[field as keyof typeof targets];
      return { selectedId: t.selectedId, onSelect: t.onSelect };
    }
    const owner = allForms.find(f => f.keys.includes(field)) ?? formList[0];
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
  const pickMany = (field: DokumentationSpeichernFieldKey) => {
    const owner = allForms.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    // the list's step: a filled editor is taken as one more entry; at least one entry is needed
    && (steps['datei'] !== n || (hasValues(anhang_zur_dokumentation) ? lists.anhang_zur_dokumentation.add() : anhang_zur_dokumentationEntries.length > 0 || anhang_zur_dokumentation.validate()))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); anhang_zur_dokumentation.reset(); setAnhangZurDokumentationEntries([]); setBesuchTargetId(null); writeJourneyExtra('dokumentation-speichern', 'target:besuch', null); mirrorRecordParam(null); };

  return {
    slug: 'dokumentation-speichern' as const,
    draftKey: 'dokumentation-speichern' as const,    entity: 'dokumentation' as const,
    form: dokumentation,
    forms, formList, picks, submit, steps, targets, lists,    reviewStep: DOKUMENTATIONSPEICHERN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type DokumentationSpeichernFlow = ReturnType<typeof useDokumentationSpeichernFlow>;
