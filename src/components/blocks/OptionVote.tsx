/**
 * OptionVote — one answer per option, for everybody (EF-61).
 *
 * A poll's dates with Ja / Vielleicht / Nein, a menu's dishes, a roster's shifts: a list of
 * OPTIONS, and each person answers every one with a small choice. The block owns the whole
 * exchange — a page wires it and writes the head above it (title, what it is about):
 *
 *   const vote = VOTES['termin-abstimmen'];                       // from '@/lib/journey'
 *   <OptionVote port={port} vote={vote} parentId={linkedId} draftKey="termin-abstimmen" />
 *
 * What it does, and a page must NOT rebuild:
 * - PHONE (< 640 px): the input is a LIST — one card per option with its date large, the
 *   count so far („3 Ja · 1 Vielleicht“) and a three-part choice with TEXT, 44 px high, full
 *   width. No sideways swiping to answer. The send button sticks to the bottom edge and
 *   counts („2 von 3 gewählt“); a send with something missing names it and scrolls there.
 * - WIDE (≥ 640 px): the matrix of everybody with the person's input as its last row.
 * - The matrix of everybody is for READING: one row per submission (never per record, never
 *   per name), the name column fixed, the most popular option marked (most yes, then most
 *   maybe, then the earliest — the same rule everywhere), a sum row.
 * - AFTER SENDING the form is gone: thanks, the person's own answers to check, the matrix
 *   with their row marked. „Weitere Person eintragen“ is a small second button. The device
 *   remembers: opening the link again says „Du hast am … als … abgestimmt“ with the answers;
 *   the form stays folded away. The same name again asks first.
 * - CLOSED (the link record's status, or `closed`): the result and the matrix, no input.
 * - Offline, double tap, a vote closed meanwhile: `useJourneySubmit` (saved, sent once when
 *   back online, checked fresh at send).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { locale, tx } from '@/i18n';
import { formatDate, formatDateTime } from '@/lib/formatters';
import {
  displayNameOf, fieldDate, fieldLookup, fieldRef, newRecordKey, optionsOf, readJourneyExtra, rememberOwnRecord,
  rememberSubmission, submissionsOf, topOne, useJourneySubmit, useLiveList, useStepForm, useVisitorKey, writeJourneyExtra,
  type EntityKey, type JourneyPort, type JourneyRecord, type PlanStep, type VoteSpec,
} from '@/lib/journey';
import { Bound } from '@/components/blocks/Bound';

export interface OptionVoteProps {
  /** The page's door (`createPublicPort(cfg, page)` on a public page). */
  port: JourneyPort | null | undefined;
  /** The page's pattern: `VOTES['<slug>']` from `@/lib/journey`. */
  vote: VoteSpec;
  /** The link record (the poll) — options and answers of this record only. */
  parentId?: string | null;
  /** Keeps a half-filled form across a reload; also the device's memory of what it sent. */
  draftKey: string;
  /** Overrules the link record's status (a page that knows better). */
  closed?: boolean;
  /** How an option reads on its card. Default: its date (start – end), else its display name. */
  optionTitle?: (option: JourneyRecord) => { title: string; subtitle?: string };
  /** Shown instead of „Weitere Person eintragen“ / the thank-you headline. */
  texts?: { thanks?: string; another?: string; send?: string };
  className?: string;
}

interface Mine { name: string; at: string; choices: Record<string, string>; ids: string[] }

const WIDE = '(min-width: 640px)';

function useWide(): boolean {
  const get = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(WIDE).matches;
  const [wide, setWide] = useState(get);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(WIDE);
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return wide;
}

function readMine(storeKey: string): Mine[] {
  try {
    const raw = window.localStorage.getItem(storeKey);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? (list as Mine[]).filter(m => m && typeof m.name === 'string' && m.choices && typeof m.choices === 'object') : [];
  } catch {
    return [];
  }
}

function writeMine(storeKey: string, list: Mine[]): void {
  try { window.localStorage.setItem(storeKey, JSON.stringify(list.slice(-20))); } catch { /* private mode: the page still works */ }
}

export function OptionVote({ port, vote, parentId, draftKey, closed: closedProp, optionTitle, texts, className }: OptionVoteProps) {
  const A = vote.answer.entity as EntityKey;
  const O = vote.option.entity as EntityKey;
  const wide = useWide();
  const visitor = useVisitorKey();
  const optionList = useLiveList(port, O);
  const answerList = useLiveList(port, A);
  const choiceOptions = useMemo(() => optionsOf(A, vote.answer.choice), [A, vote.answer.choice]);
  const labelOfChoice = useCallback((key: string | undefined) => choiceOptions.find(o => o.key === key)?.label ?? '—', [choiceOptions]);

  // the link record: closed? decided?
  const [parent, setParent] = useState<JourneyRecord | null>(null);
  useEffect(() => {
    let alive = true;
    if (!port || !vote.parent || !parentId) { setParent(null); return; }
    port.get(vote.parent.entity as EntityKey, parentId).then(r => { if (alive) setParent(r); }).catch(() => { /* the lists say what is wrong */ });
    return () => { alive = false; };
  }, [port, vote.parent, parentId]);
  const isClosed = useCallback((rec: JourneyRecord | null): boolean => {
    const p = vote.parent;
    if (!p || !p.statusField || !rec) return false;
    const key = fieldLookup(rec, p.statusField)?.key;
    return Boolean(key && p.closedValues.includes(key));
  }, [vote.parent]);
  const closed = closedProp ?? isClosed(parent);
  // a decision counts only with its status (EF-62): an OPEN record that still carries a final option shows none
  const finalId = closed && parent && vote.parent?.finalField ? fieldRef(parent, vote.parent.finalField) : null;

  const options = useMemo(() => {
    const ref = vote.option.parentRef;
    const rows = optionList.records.filter(o => !ref || !parentId || fieldRef(o, ref) === parentId);
    const start = vote.option.start;
    return [...rows].sort((a, b) => (start ? (fieldDate(a, start) ?? '').localeCompare(fieldDate(b, start) ?? '') : 0) || a.id.localeCompare(b.id));
  }, [optionList.records, vote.option, parentId]);
  const answers = useMemo(() => {
    const ids = new Set(options.map(o => o.id));
    return answerList.records.filter(a => ids.has(fieldRef(a, vote.answer.optionRef) ?? ''));
  }, [answerList.records, options, vote.answer.optionRef]);

  const counts = useMemo(() => {
    const out: Record<string, Record<string, number>> = {};
    for (const a of answers) {
      const id = fieldRef(a, vote.answer.optionRef);
      const key = fieldLookup(a, vote.answer.choice)?.key;
      if (!id || !key) continue;
      (out[id] ??= {})[key] = (out[id][key] ?? 0) + 1;
    }
    return out;
  }, [answers, vote.answer]);
  const top = useMemo(() => topOne(
    options,
    [o => counts[o.id]?.[vote.yes] ?? 0, o => (vote.maybe ? counts[o.id]?.[vote.maybe] ?? 0 : 0)],
    o => (vote.option.start ? fieldDate(o, vote.option.start) : o.id),
  ), [options, counts, vote]);
  const submissions = useMemo(
    () => submissionsOf(answers, { names: vote.answer.names }),
    [answers, vote.answer.names],
  );

  const titleOf = useCallback((o: JourneyRecord): { title: string; subtitle?: string } => {
    if (optionTitle) return optionTitle(o);
    const start = vote.option.start ? fieldDate(o, vote.option.start) : null;
    if (!start) return { title: displayNameOf(O, o.fields) || '—' };
    const timed = start.length > 10 && !/T00:00(:00)?/.test(start);
    const end = vote.option.end ? fieldDate(o, vote.option.end) : null;
    const day = new Date(start).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
    const time = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    if (!timed) return { title: day || formatDate(start) || start };
    return { title: day || formatDateTime(start) || start, subtitle: end && end.slice(0, 10) === start.slice(0, 10) ? `${time(start)} – ${time(end)}` : time(start) };
  }, [optionTitle, vote.option, O]);
  const tally = useCallback((id: string): string => {
    const parts = choiceOptions.filter(o => o.key === vote.yes || o.key === vote.maybe).map(o => `${counts[id]?.[o.key] ?? 0} ${o.label}`);
    return parts.join(' · ');
  }, [choiceOptions, counts, vote]);

  // ── the person's input ──────────────────────────────────────────────────────
  const required = useMemo(() => Object.fromEntries(vote.answer.names.map(k => [k, true])), [vote.answer.names]);
  const form = useStepForm(A, { fields: vote.answer.fields, required });
  const [choices, setChoicesState] = useState<Record<string, string>>(() => readJourneyExtra<Record<string, string>>(draftKey, 'choices') ?? {});
  const choicesRef = useRef(choices);
  const setChoices = useCallback((next: Record<string, string>) => {
    choicesRef.current = next;
    setChoicesState(next);
    writeJourneyExtra(draftKey, 'choices', Object.keys(next).length ? next : null);
  }, [draftKey]);
  const keyRef = useRef<string>(newRecordKey());
  const nameNow = () => vote.answer.names.map(k => String(form.get(k) ?? '').trim()).filter(Boolean).join(' ');

  const storeKey = `klar:vote:${draftKey}:${parentId ?? ''}`;
  const [mine, setMine] = useState<Mine[]>(() => readMine(storeKey));
  useEffect(() => { setMine(readMine(storeKey)); }, [storeKey]);
  const [mode, setMode] = useState<'form' | 'done'>(() => (readMine(storeKey).length > 0 ? 'done' : 'form'));
  const [justSent, setJustSent] = useState(false);
  const [tried, setTried] = useState(false);
  const [askDouble, setAskDouble] = useState(false);

  const plan: PlanStep[] = useMemo(() => options.map((o, i) => ({
    key: `vote:${o.id}`,
    entity: A,
    form,
    primary: i === 0,
    values: () => ({
      [vote.answer.optionRef]: o.id,
      [vote.answer.choice]: choicesRef.current[o.id],
      ...(vote.answer.parentRef && parentId ? { [vote.answer.parentRef]: parentId } : {}),
      ...(vote.answer.deviceField ? { [vote.answer.deviceField]: visitor } : {}),
      ...(vote.answer.keyField ? { [vote.answer.keyField]: keyRef.current } : {}),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [options, A, vote.answer, parentId, visitor]);

  const submit = useJourneySubmit(port as JourneyPort, plan, {
    draftKey,
    // read fresh at every send and resend: a vote closed meanwhile takes nothing. A failed read
    // throws — offline is the layer's way (saved, sent when back online)
    check: async () => {
      if (!port || !vote.parent || !vote.parent.statusField || !parentId) return null;
      const rec = await port.get(vote.parent.entity as EntityKey, parentId);
      if (!rec) return tx('Diese Abstimmung gibt es nicht mehr.');
      return isClosed(rec) ? tx('Diese Abstimmung ist inzwischen geschlossen.') : null;
    },
  });

  // sent: the device remembers, the form gives way to the closing state
  const handled = useRef<unknown>(null);
  useEffect(() => {
    const result = submit.result;
    if (!result || handled.current === result) return;
    handled.current = result;
    const ids = Object.values(result.records).map(r => r.id).filter(Boolean);
    const entry: Mine = { name: nameNow(), at: new Date().toISOString(), choices: { ...choicesRef.current }, ids };
    const next = [...readMine(storeKey), entry];
    writeMine(storeKey, next);
    setMine(next);
    for (const id of ids) rememberOwnRecord(A, id);
    if (vote.answer.keyField) rememberSubmission(A, ids, keyRef.current, { linkedId: parentId ?? null });
    setJustSent(true);
    setMode('done');
    setTried(false);
    setAskDouble(false);
    void answerList.reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submit.result]);

  const missing = options.filter(o => !choices[o.id]);
  const chosen = options.length - missing.length;
  const firstMissing = useRef<HTMLDivElement | null>(null);

  const send = async (e?: FormEvent, confirmed = false) => {
    e?.preventDefault();
    if (submit.submitting || mode !== 'form') return;
    setTried(true);
    const namesOk = form.validate();
    if (!namesOk) return;
    if (missing.length > 0) {
      firstMissing.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      return;
    }
    const name = nameNow().toLowerCase();
    if (!confirmed && name && mine.some(m => m.name.toLowerCase() === name)) {
      setAskDouble(true);
      return;
    }
    setAskDouble(false);
    await submit.run();
  };

  const another = () => {
    submit.reset();
    form.reset();
    setChoices({});
    keyRef.current = newRecordKey();
    handled.current = null;
    setJustSent(false);
    setTried(false);
    setAskDouble(false);
    setMode('form');
  };

  // ── pieces ──────────────────────────────────────────────────────────────────
  const pick = (optionId: string, compact: boolean) => (
    <div
      role="radiogroup"
      aria-label={`${titleOf(options.find(o => o.id === optionId)!).title}: ${tx('deine Antwort')}`}
      aria-invalid={(tried && !choices[optionId]) || undefined}
      data-vote-option={optionId}
      id={`vote-${optionId}-${vote.answer.choice}`}
      className={`grid gap-1 ${compact ? 'grid-cols-1' : ''} ${tried && !choices[optionId] ? 'rounded-xl ring-2 ring-destructive/40 ring-offset-2 ring-offset-background' : ''}`}
      style={compact ? undefined : { gridTemplateColumns: `repeat(${choiceOptions.length}, minmax(0, 1fr))` }}
    >
      {choiceOptions.map(c => {
        const on = choices[optionId] === c.key;
        return (
          <button
            key={c.key}
            type="button"
            role="radio"
            data-key={c.key}
            aria-checked={on}
            onClick={() => setChoices({ ...choicesRef.current, [optionId]: c.key })}
            className={`min-h-11 rounded-xl border px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              on ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card text-foreground hover:border-foreground/40'
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );

  const matrix = (inputRow: boolean, markName?: string) => (
    <div className="relative" data-vote-matrix="">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th scope="col" className="sticky left-0 z-10 max-w-[40vw] bg-muted px-3 py-2 text-left text-xs font-semibold text-muted-foreground">{tx('Teilnehmende')}</th>
              {options.map(o => {
                const t = titleOf(o);
                const best = top?.id === o.id;
                return (
                  <th key={o.id} scope="col" className={`min-w-28 px-3 py-2 text-left align-top text-xs font-semibold ${best || finalId === o.id ? 'text-primary' : 'text-foreground'}`} data-vote-top={best || undefined}>
                    <div>{t.title}</div>
                    {t.subtitle ? <div className="font-normal text-muted-foreground">{t.subtitle}</div> : null}
                    {finalId === o.id ? <div className="mt-1 font-semibold">{tx('Finaler Termin')}</div> : best ? <div className="mt-1 font-semibold">{tx('Beliebteste')}</div> : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {submissions.map(s => {
              const own = Boolean(markName) && s.name.toLowerCase() === markName!.toLowerCase();
              return (
                <tr key={s.key} className={`border-b border-border last:border-b-0 ${own ? 'bg-accent/60' : ''}`} data-vote-own={own || undefined}>
                  <th scope="row" className={`sticky left-0 z-10 max-w-[40vw] truncate px-3 py-2 text-left font-medium ${own ? 'bg-accent' : 'bg-card'}`}>{s.label || '—'}</th>
                  {options.map(o => {
                    const rec = s.records.find(r => fieldRef(r as JourneyRecord, vote.answer.optionRef) === o.id) as JourneyRecord | undefined;
                    const key = rec ? fieldLookup(rec, vote.answer.choice)?.key : undefined;
                    return (
                      <td key={o.id} className={`px-3 py-2 ${key === vote.yes ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{labelOfChoice(key)}</td>
                    );
                  })}
                </tr>
              );
            })}
            {submissions.length === 0 && !inputRow ? (
              <tr><td colSpan={options.length + 1} className="px-3 py-4 text-muted-foreground">{tx('Noch hat niemand abgestimmt.')}</td></tr>
            ) : null}
            {inputRow ? (
              <tr className="border-t-2 border-border bg-muted/20" data-vote-input-row="">
                <th scope="row" className="sticky left-0 z-10 max-w-[40vw] bg-muted px-3 py-2 text-left font-semibold">{tx('Deine Antwort')}</th>
                {options.map(o => <td key={o.id} className="px-2 py-2 align-top">{pick(o.id, true)}</td>)}
              </tr>
            ) : null}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/40 text-xs text-muted-foreground">
              <th scope="row" className="sticky left-0 z-10 max-w-[40vw] bg-muted px-3 py-2 text-left font-semibold">{tx('Summe')}</th>
              {options.map(o => <td key={o.id} className="px-3 py-2">{tally(o.id)}</td>)}
            </tr>
          </tfoot>
        </table>
      </div>
      {/* a sideways scroll says so: the right edge fades while there is more */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-px right-px w-6 rounded-r-xl bg-gradient-to-l from-card to-transparent sm:hidden" />
      {options.length > 2 ? <p className="mt-1 text-xs text-muted-foreground sm:hidden">{tx('Zur Seite wischen für alle Termine.')}</p> : null}
    </div>
  );

  const offlineNote = submit.offline ? (
    <p role="status" className="rounded-xl bg-muted px-3 py-2 text-sm" data-vote-offline="">
      {tx('Keine Verbindung — deine Eingaben sind gesichert. Sobald das Netz wieder da ist, senden wir sie automatisch.')}
    </p>
  ) : submit.limited ? (
    <p role="status" className="rounded-xl bg-muted px-3 py-2 text-sm">{tx('Gerade viele Teilnehmende — wir senden gleich noch einmal.')}</p>
  ) : submit.error ? (
    <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{submit.error.message}</p>
  ) : null;

  // ── states ──────────────────────────────────────────────────────────────────
  if (!port || (optionList.loading && !optionList.loaded)) {
    return <p className="text-sm text-muted-foreground" data-vote-loading="">{tx('Wird geladen …')}</p>;
  }
  if (optionList.error && !optionList.loaded) {
    return (
      <div className="flex flex-wrap items-center gap-2" role="alert">
        <p className="text-sm text-destructive">{tx('Die Abstimmung konnte gerade nicht geladen werden.')}</p>
        <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => { void optionList.reload(); void answerList.reload(); }}>{tx('Erneut versuchen')}</Button>
      </div>
    );
  }
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground" data-vote-empty="">{tx('Für diese Abstimmung gibt es noch keine Auswahl.')}</p>;
  }

  if (closed) {
    const final = finalId ? options.find(o => o.id === finalId) : null;
    return (
      <div className={`flex flex-col gap-4 ${className ?? ''}`} data-vote-state="closed">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{tx('Diese Abstimmung ist geschlossen.')}</p>
          {final ? <p className="mt-1 text-lg font-semibold">{tx('Finaler Termin')}: {[titleOf(final).title, titleOf(final).subtitle].filter(Boolean).join(', ')}</p> : null}
        </div>
        {matrix(false)}
      </div>
    );
  }

  if (mode === 'done') {
    const last = mine[mine.length - 1];
    return (
      <div className={`flex flex-col gap-4 ${className ?? ''}`} data-vote-state="done">
        <div className="rounded-2xl border border-border bg-card p-4" {...(justSent ? { 'data-journey-success': '' } : {})} role="status">
          <h2 className="text-lg font-semibold tracking-tight">
            {justSent ? (texts?.thanks ?? tx('Danke — deine Antworten sind gespeichert.')) : tx('Du hast schon abgestimmt.')}
          </h2>
          {mine.slice(justSent ? -1 : 0).map((m, i) => (
            <div key={`${m.at}-${i}`} className="mt-3" data-vote-mine="">
              <p className="text-sm text-muted-foreground">
                {justSent ? m.name : `${formatDateTime(m.at) || ''} · ${m.name}`}
              </p>
              <ul className="mt-1 flex flex-col gap-1 text-sm">
                {options.filter(o => m.choices[o.id]).map(o => (
                  <li key={o.id} className="flex justify-between gap-3">
                    <span>{[titleOf(o).title, titleOf(o).subtitle].filter(Boolean).join(', ')}</span>
                    <span className="font-medium">{labelOfChoice(m.choices[o.id])}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="mt-3 text-xs text-muted-foreground">
            {tx('Etwas falsch? Trage dich noch einmal ein — die Organisatorin oder der Organisator kann die alte Zeile entfernen.')}
          </p>
          <div className="mt-3">
            <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={another} data-journey-again="">
              {texts?.another ?? tx('Weitere Person eintragen')}
            </Button>
          </div>
        </div>
        {matrix(false, last?.name)}
      </div>
    );
  }

  const fields = (
    <div className="grid gap-3 sm:grid-cols-2" data-vote-names="">
      {vote.answer.fields.map(k => <Bound key={k} form={form} name={k} />)}
    </div>
  );
  const missingNote = tried && missing.length > 0 ? (
    <p role="alert" className="text-sm text-destructive" data-vote-missing="">
      {tx('Bitte noch wählen')}: {missing.map(o => [titleOf(o).title, titleOf(o).subtitle].filter(Boolean).join(', ')).join(' · ')}
    </p>
  ) : null;
  const doubleAsk = askDouble ? (
    <div role="alertdialog" aria-label={tx('Schon abgestimmt')} className="rounded-xl border border-border bg-muted p-3 text-sm" data-vote-double="">
      <p>{tx('{name} hat schon abgestimmt. Trotzdem eine weitere Zeile anlegen?').replace('{name}', nameNow())}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => { void send(undefined, true); }}>{tx('Ja, weitere Zeile')}</Button>
        <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={() => setAskDouble(false)}>{tx('Abbrechen')}</Button>
      </div>
    </div>
  ) : null;
  const counter = chosen < options.length
    ? tx('{n} von {m} gewählt').replace('{n}', String(chosen)).replace('{m}', String(options.length))
    : tx('Alles gewählt');
  const sendButton = (
    <Button type="submit" disabled={submit.submitting} className="min-h-11 w-full sm:w-auto" data-journey-confirm="">
      {submit.submitting ? tx('Wird gesendet …') : (texts?.send ?? tx('Abstimmen'))}
    </Button>
  );

  if (wide) {
    return (
      <form onSubmit={e => { void send(e); }} noValidate className={`flex flex-col gap-4 ${className ?? ''}`} data-vote-state="form" data-vote-layout="matrix">
        {fields}
        {matrix(true)}
        {missingNote}
        {doubleAsk}
        {offlineNote}
        <div className="flex items-center gap-3">
          {sendButton}
          <span className="text-sm text-muted-foreground" aria-live="polite">{counter}</span>
        </div>
      </form>
    );
  }

  let missingRefSet = false;
  return (
    <form onSubmit={e => { void send(e); }} noValidate className={`flex flex-col gap-4 ${className ?? ''}`} data-vote-state="form" data-vote-layout="list">
      {fields}
      <ol className="flex flex-col gap-3" data-vote-list="">
        {options.map(o => {
          const t = titleOf(o);
          const open = !choices[o.id];
          const ref = open && !missingRefSet ? (missingRefSet = true, firstMissing) : undefined;
          return (
            <li key={o.id}>
              <div ref={ref} id={`vote-card-${o.id}-${vote.answer.optionRef}`} className={`rounded-2xl border bg-card p-4 ${top?.id === o.id ? 'border-primary' : 'border-border'}`} data-vote-card={o.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold leading-tight">{t.title}</div>
                    {t.subtitle ? <div className="text-sm text-muted-foreground">{t.subtitle}</div> : null}
                  </div>
                  {top?.id === o.id ? <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">{tx('Beliebteste')}</span> : null}
                </div>
                <div className="mt-1 text-sm text-muted-foreground" data-vote-tally="">{tally(o.id)}</div>
                <div className="mt-3">{pick(o.id, false)}</div>
              </div>
            </li>
          );
        })}
      </ol>
      {missingNote}
      {doubleAsk}
      {offlineNote}
      {/* the send button stays in reach: fixed to the bottom edge, above the phone's home bar */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-card px-4 pt-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }} data-vote-bar="">
        <div className="mb-2 text-center text-sm text-muted-foreground" aria-live="polite">{counter}</div>
        {sendButton}
      </div>
      <details className="rounded-xl" data-vote-others="">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">
          {tx('Was die anderen gewählt haben')} ({submissions.length})
        </summary>
        <div className="mt-2">{matrix(false)}</div>
      </details>
    </form>
  );
}

export default OptionVote;
