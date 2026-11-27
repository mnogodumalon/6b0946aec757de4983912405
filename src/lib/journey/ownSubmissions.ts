/**
 * ownSubmissions — a visitor changes or withdraws exactly what THEY sent (EF-50, Doodle K10).
 *
 * A submission is every record of one send (Doodle: one per date); all of them carry the
 * same SECRET KEY in the entity's key field (`derived:record_key`): 128 bit made here at the
 * first send, kept in this browser, handed out as a personal link for another device
 * (`…&abgabe=<key>.<id>.<id>`). The public grant compares the key on PATCH/DELETE
 * (`X-Record-Key`); the read door never answers it, so the link carries the ids too.
 *
 *   const key = useRef(newRecordKey());                       // once per send
 *   values: () => ({ …, bearbeitungsschluessel: key.current }) // in EVERY record of the send
 *   const own = useOwnSubmission(port, 'antworten', { linkedId });
 *   own.adopt(ids, recordKeyOfTheAnswer ?? key.current);        // after the success
 *   <SubmissionLinkBox link={own.link} />                       // „Später ändern? …“
 *   own.update([{ id, values: { antwort: 'vielleicht' } }]);    // PATCH the changed ones
 *   own.withdraw();                                             // DELETE all of them
 *
 * The device code (`useVisitorKey`) stays a local convenience; it is no longer a field.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EntityKey } from './rules';
import type { JourneyRecord } from './port';

export const SUBMISSION_PARAM = 'abgabe';
export const RECORD_KEY_BYTES = 16;
const RECORD_KEY_RE = /^[A-Za-z0-9_-]{22,64}$/;
const ID_RE = /^[a-f0-9]{24}$/i;

/** 16 random bytes → base64url, 22 characters (W3C TAG capability URL: unguessable). */
export function newRecordKey(): string {
  const bytes = new Uint8Array(RECORD_KEY_BYTES);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  // base64url by hand — no btoa (binary strings), no Buffer (not in the browser)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += alphabet[(n >> 18) & 63] + alphabet[(n >> 12) & 63];
    if (i + 1 < bytes.length) out += alphabet[(n >> 6) & 63];
    if (i + 2 < bytes.length) out += alphabet[n & 63];
  }
  return out;
}

export function isRecordKey(v: unknown): v is string {
  return typeof v === 'string' && RECORD_KEY_RE.test(v);
}

export interface OwnSubmission {
  entity: string;
  key: string;
  recordIds: string[];
  /** The record the page was opened for (`link_param`) — a poll, an event. */
  linkedId: string | null;
  createdAt: string;
}

function storageKey(entity: string): string {
  return `${typeof window !== 'undefined' ? window.location.pathname : ''}#own-submissions:${entity}`;
}

function readAll(entity: string): OwnSubmission[] {
  try {
    const raw = window.localStorage.getItem(storageKey(entity));
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list)
      ? list.filter((s): s is OwnSubmission => Boolean(s && typeof s === 'object' && isRecordKey((s as OwnSubmission).key)
          && Array.isArray((s as OwnSubmission).recordIds)))
      : [];
  } catch {
    return [];
  }
}

function writeAll(entity: string, list: OwnSubmission[]): void {
  try {
    window.localStorage.setItem(storageKey(entity), JSON.stringify(list.slice(-50)));
  } catch {
    /* no storage: the key lives for this page view only */
  }
}

/** Keep a submission this browser made (after a successful send) — ids merge when the same
 *  key is remembered twice (a resend, a second record of the send). */
export function rememberSubmission(entity: string, recordIds: string[], key: string, opts: { linkedId?: string | null } = {}): void {
  if (!isRecordKey(key)) return;
  const ids = recordIds.filter(id => ID_RE.test(id));
  const list = readAll(entity);
  const have = list.find(s => s.key === key);
  if (have) {
    for (const id of ids) if (!have.recordIds.includes(id)) have.recordIds.push(id);
    if (opts.linkedId !== undefined) have.linkedId = opts.linkedId ?? null;
  } else {
    list.push({ entity, key, recordIds: ids, linkedId: opts.linkedId ?? null, createdAt: new Date().toISOString() });
  }
  writeAll(entity, list);
}

/** The submissions this browser made for `entity` — oldest first; `linkedId` narrows to one
 *  poll/event (a visitor who answered two polls on one device). */
export function ownSubmissions(entity: string, opts: { linkedId?: string | null } = {}): OwnSubmission[] {
  const list = readAll(entity);
  return opts.linkedId === undefined ? list : list.filter(s => s.linkedId === opts.linkedId || s.linkedId === null);
}

/** Forget a submission (after a withdrawal, after a key the door refused). */
export function forgetSubmission(entity: string, key: string): void {
  writeAll(entity, readAll(entity).filter(s => s.key !== key));
}

/** The personal link: the page's own link plus `&abgabe=<key>.<id>.<id>` — the ids are in it
 *  because the read door never hands the key out, so the page could not find its records. */
export function submissionLink(pageLink: string, key: string, recordIds: string[]): string {
  const [head, hash = ''] = pageLink.split('#');
  const [path, query = ''] = hash.split('?');
  const params = new URLSearchParams(query);
  params.set(SUBMISSION_PARAM, [key, ...recordIds.filter(id => ID_RE.test(id))].join('.'));
  return `${head}#${path}?${params.toString()}`;
}

/** `abgabe=<key>.<id>…` out of a hash (or the current one) — null when absent or malformed. */
export function parseSubmissionParam(hash?: string): { key: string; recordIds: string[] } | null {
  const h = hash ?? (typeof window !== 'undefined' ? window.location.hash : '');
  const query = h.split('?')[1] ?? '';
  const raw = new URLSearchParams(query).get(SUBMISSION_PARAM);
  if (!raw) return null;
  const [key, ...ids] = raw.split('.');
  if (!isRecordKey(key)) return null;
  const recordIds = ids.filter(id => ID_RE.test(id));
  return recordIds.length ? { key, recordIds } : null;
}

/** Take the submission out of the address (`history.replaceState`), remember it, hand it back —
 *  the key never stays in the address bar or the browser history. */
export function takeSubmissionFromLink(entity: string, opts: { linkedId?: string | null } = {}): OwnSubmission | null {
  const got = parseSubmissionParam();
  if (!got) return null;
  rememberSubmission(entity, got.recordIds, got.key, opts);
  try {
    const [path, query = ''] = window.location.hash.split('?');
    const params = new URLSearchParams(query);
    params.delete(SUBMISSION_PARAM);
    const rest = params.toString();
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${path}${rest ? `?${rest}` : ''}`);
  } catch {
    /* no history API: the address keeps the key for this view */
  }
  return readAll(entity).find(s => s.key === got.key) ?? null;
}

/** The door the hook needs — the public port implements it (`@/lib/journey/publicPort`); a
 *  structural type so the barrel never pulls a data client. */
export interface OwnEditPort {
  editOwn?: { entity: string; fields: string[]; keyField: string } | null;
  list(entity: EntityKey, opts?: { limit?: number }): Promise<JourneyRecord[]>;
  updateOwn(entity: EntityKey, id: string, values: Record<string, unknown>, key: string): Promise<JourneyRecord>;
  removeOwn(entity: EntityKey, id: string, key: string): Promise<void>;
}

export interface OwnSubmissionOptions {
  /** The record the page is opened for (`?<link_param>=`) — narrows the stored submissions. */
  linkedId?: string | null;
  /** The page's live list of the entity; the hook picks its own records out of it instead of
   *  reading again. Without it the hook lists once. */
  records?: JourneyRecord[] | null;
  /** Called after a change or a withdrawal succeeded — re-read the list here. */
  onChanged?: () => void;
}

export interface OwnSubmissionState {
  /** The submission's key, or null when this browser has none for the page. */
  key: string | null;
  recordIds: string[];
  /** This visitor's records, as far as the list shows them. */
  own: JourneyRecord[];
  loading: boolean;
  /** The page was opened with a personal link (`abgabe=`). */
  fromLink: boolean;
  /** The door refused the key (403): say „Dieser Link passt nicht zu deiner Antwort.“, change nothing. */
  invalidLink: boolean;
  /** Can the page change submissions at all (port + page declare it)? */
  enabled: boolean;
  busy: boolean;
  /** A 429 after the client's own waits — the hook sends again by itself. */
  limited: boolean;
  error: Error | null;
  /** The personal link of the current submission, null without one. */
  link: string | null;
  /** After the first send: the created ids and the key the records carry. */
  adopt(recordIds: string[], key: string): void;
  /** PATCH the changed records (only the fields `edit_own` allows). True when every write went through. */
  update(changes: Array<{ id: string; values: Record<string, unknown> }>): Promise<boolean>;
  /** DELETE every record of the submission and forget it. */
  withdraw(): Promise<boolean>;
}

/**
 * The page's side of EF-50: finds the visitor's submission (storage, or the personal link —
 * which it strips from the address), picks their records out of the list, changes or
 * withdraws them through the port, waits a 429 out and repeats, and reads a refused key as
 * „this link does not fit“ (nothing is changed, the stored key goes).
 */
export function useOwnSubmission(port: OwnEditPort | null | undefined, entity: EntityKey, opts: OwnSubmissionOptions = {}): OwnSubmissionState {
  const { linkedId = null, records = null, onChanged } = opts;
  const enabled = Boolean(port && port.editOwn && port.editOwn.entity === entity);
  const [sub, setSub] = useState<OwnSubmission | null>(null);
  const [fromLink, setFromLink] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [listed, setListed] = useState<JourneyRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [limited, setLimited] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pending = useRef<null | (() => Promise<boolean>)>(null);

  // the submission: the link first (it is the newer truth), then what the browser kept
  useEffect(() => {
    const linked = takeSubmissionFromLink(entity, { linkedId });
    if (linked) { setSub(linked); setFromLink(true); return; }
    const mine = ownSubmissions(entity, { linkedId });
    setSub(mine.length ? mine[mine.length - 1] : null);
  }, [entity, linkedId]);

  // the records: the page's list, else one read
  useEffect(() => {
    if (records) { setListed(records); setLoading(false); return; }
    if (!port || !sub) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    port.list(entity, { limit: 500 }).then(rows => { if (alive) { setListed(rows); setLoading(false); } })
      .catch(e => { if (alive) { setError(e instanceof Error ? e : new Error(String(e))); setLoading(false); } });
    return () => { alive = false; };
  }, [port, entity, sub, records]);

  const own = useMemo(() => {
    if (!sub || !listed) return [];
    const ids = new Set(sub.recordIds);
    return listed.filter(r => ids.has(r.id));
  }, [sub, listed]);

  const link = useMemo(() => {
    if (!sub || typeof window === 'undefined') return null;
    return submissionLink(`${window.location.origin}${window.location.pathname}${window.location.hash}`, sub.key, sub.recordIds);
  }, [sub]);

  const adopt = useCallback((recordIds: string[], key: string) => {
    rememberSubmission(entity, recordIds, key, { linkedId });
    const mine = ownSubmissions(entity).find(s => s.key === key) ?? null;
    setSub(mine);
    setFromLink(false);
    setInvalidLink(false);
  }, [entity, linkedId]);

  const run = useCallback(async (job: () => Promise<boolean>): Promise<boolean> => {
    if (!port || !sub) return false;
    setBusy(true);
    setError(null);
    setLimited(false);
    try {
      const ok = await job();
      pending.current = null;
      onChanged?.();
      return ok;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      if (err.name === 'RecordKeyInvalidError') {
        // the key does not fit: nothing changed, the link is wrong — forget what the link brought
        setInvalidLink(true);
        if (fromLink) { forgetSubmission(entity, sub.key); setSub(null); }
        pending.current = null;
        return false;
      }
      if (err.name === 'RateLimitedError') {
        pending.current = job;
        setLimited(true);
        return false;
      }
      setError(err);
      return false;
    } finally {
      setBusy(false);
    }
  }, [port, sub, fromLink, entity, onChanged]);

  // the 429 queue: the client waited three times already — one more try after the server's pause
  useEffect(() => {
    if (!limited || !pending.current) return;
    const t = window.setTimeout(() => { const job = pending.current; if (job) void run(job); }, 10_000);
    return () => window.clearTimeout(t);
  }, [limited, run]);

  const update = useCallback((changes: Array<{ id: string; values: Record<string, unknown> }>) => run(async () => {
    if (!port || !sub) return false;
    const mine = new Set(sub.recordIds);
    for (const c of changes) {
      if (!mine.has(c.id)) continue;
      const r = await port.updateOwn(entity, c.id, c.values, sub.key);
      setListed(rows => (rows ?? []).map(x => (x.id === c.id ? { ...x, fields: { ...x.fields, ...r.fields } } : x)));
    }
    return true;
  }), [run, port, sub, entity]);

  const withdraw = useCallback(() => run(async () => {
    if (!port || !sub) return false;
    const gone: string[] = [];
    try {
      for (const id of sub.recordIds) {
        await port.removeOwn(entity, id, sub.key);
        gone.push(id);
      }
    } finally {
      if (gone.length) setListed(rows => (rows ?? []).filter(x => !gone.includes(x.id)));
    }
    forgetSubmission(entity, sub.key);
    setSub(null);
    return true;
  }), [run, port, sub, entity]);

  return { key: sub?.key ?? null, recordIds: sub?.recordIds ?? [], own, loading: loading && Boolean(sub), fromLink, invalidLink,
    enabled, busy, limited, error, link, adopt, update, withdraw };
}
