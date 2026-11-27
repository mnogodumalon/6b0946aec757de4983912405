/**
 * publicDoors — the dashboard's side of „Tor je Datensatz“ (EF-51, EF-56).
 *
 * A public page opened per parent record (a poll, an event) has a pair of doors PER record:
 * the Klar backend makes them with the owner's key (`/claude/public-doors`), FINDS them again
 * in the owner's list of grants (nothing of it is stored on the record — no field of the
 * structure is involved), switches the write door off when the record is closed and on again
 * when it is reopened, deletes both with the record, and renews them when a link leaked.
 * The dashboard never talks to the grants API itself.
 *
 *   const d = await doorOf('termin-abstimmen', id);                         // the record's link, null = none yet
 *   await syncDoorsAfterWrite('umfragen', id, { status: 'geschlossen' });   // after a save/flow
 *   await ensureDoors('termin-abstimmen', id);                              // „Link anlegen“
 *   await ensureDoors('termin-abstimmen', id, { renew: true });              // „Link sperren und neu vergeben“
 *   await setDoorEnabled('termin-abstimmen', id, false);                     // close
 *   await deleteDoors('termin-abstimmen', id);                               // with the record
 *   await ensureAllDoors('termin-abstimmen');                                // the admin's bulk button
 *   await reconcileDoors('termin-abstimmen');                                // doors of deleted records go
 *
 * A read that fails THROWS a DoorsError — „the list of links is unreachable“ is never shown as
 * „no link“; a page that is still being built (404) is „being set up“, not an error.
 */
import { DOOR_PARENTS } from '@/config/plan';

const APPGROUP_ID = '6b0946aec757de4983912405';
const BASE = '/claude/public-doors';

export interface DoorState {
  read: string;
  write: string;
  enabled: boolean | null;
  whole?: boolean;
  created?: boolean;
  /** more than one door of a kind for this record — `problem` says it; „neu vergeben“ clears it */
  ambiguous?: boolean;
  problem?: string;
  link: string | null;
  param: string;
}

/** A failed door call. `status` tells the widget what it is: 404 = the page (or its doors) is
 *  not set up yet, 409 = switched off or not possible here, 5xx = the links cannot be read
 *  right now. `message` is the server's text — for the log, never for the owner on a 5xx. */
export class DoorsError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'DoorsError';
    this.status = status;
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const d = body && (body.detail ?? body.message);
    if (typeof d === 'string') return d;
    if (d && typeof d === 'object' && typeof d.message === 'string') return d.message;
  } catch { /* not JSON */ }
  return res.status === 404 ? 'Für diese Seite gibt es keine Links je Datensatz.' : `HTTP ${res.status}`;
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/${encodeURIComponent(APPGROUP_ID)}/${path}`, {
    method,
    credentials: 'include',
    headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new DoorsError(res.status, await readError(res));
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

// One list per page for every card on the screen: twenty cards are one request. Short-lived,
// and every change made here forgets it.
const LIST_FRESH_MS = 5000;
const lists = new Map<string, { at: number; doors: Promise<Record<string, DoorState>> }>();

export function forgetDoors(slug?: string): void {
  if (slug) lists.delete(slug); else lists.clear();
}

/** Every record's doors of one page: record id → state. Throws when the list cannot be read. */
export function allDoors(slug: string, opts: { fresh?: boolean } = {}): Promise<Record<string, DoorState>> {
  const hit = lists.get(slug);
  if (!opts.fresh && hit && Date.now() - hit.at < LIST_FRESH_MS) return hit.doors;
  const doors = call<{ doors: Record<string, DoorState> }>('GET', encodeURIComponent(slug)).then(r => r.doors ?? {});
  lists.set(slug, { at: Date.now(), doors });
  doors.catch(() => { if (lists.get(slug)?.doors === doors) lists.delete(slug); });
  return doors;
}

/** ONE record's doors — null while it has none. Throws when the list cannot be read. */
export async function doorOf(slug: string, recordId: string, opts: { fresh?: boolean } = {}): Promise<DoorState | null> {
  const doors = await allDoors(slug, opts);
  return doors[recordId.toLowerCase()] ?? null;
}

export function getDoors(slug: string, recordId: string): Promise<DoorState> {
  return call('GET', `${encodeURIComponent(slug)}/${encodeURIComponent(recordId)}`);
}

export async function ensureDoors(slug: string, recordId: string, opts: { renew?: boolean; enabled?: boolean | null } = {}): Promise<DoorState> {
  try {
    return await call('POST', `${encodeURIComponent(slug)}/${encodeURIComponent(recordId)}`, { renew: Boolean(opts.renew), enabled: opts.enabled ?? null });
  } finally { forgetDoors(slug); }
}

export async function setDoorEnabled(slug: string, recordId: string, enabled: boolean): Promise<DoorState> {
  try {
    return await call('PATCH', `${encodeURIComponent(slug)}/${encodeURIComponent(recordId)}`, { enabled });
  } finally { forgetDoors(slug); }
}

export async function deleteDoors(slug: string, recordId: string): Promise<void> {
  try {
    await call('DELETE', `${encodeURIComponent(slug)}/${encodeURIComponent(recordId)}`);
  } finally { forgetDoors(slug); }
}

export async function ensureAllDoors(slug: string): Promise<{ created: number; kept: number; failed: Array<{ record_id: string; error: string }> }> {
  try {
    return await call('POST', encodeURIComponent(slug));
  } finally { forgetDoors(slug); }
}

/** The platform has no cascade: doors of records deleted on the platform's list page are
 *  removed here (only this page's own doors, only for records the platform answers 404 for). */
export async function reconcileDoors(slug: string): Promise<{ orphans: string[]; deleted: string[] }> {
  try {
    return await call('POST', `${encodeURIComponent(slug)}/reconcile`);
  } finally { forgetDoors(slug); }
}

/** Does the record's status mean „closed“ for this page (its write door is then off)? null = the values do not say. */
export function closedFor(slug: string, values: Record<string, unknown>): boolean | null {
  const spec = DOOR_PARENTS[slug];
  return spec ? closedBy(values, spec.statusField, spec.closedValues) : null;
}

function closedBy(values: Record<string, unknown>, statusField: string | null, closedValues: string[]): boolean | null {
  if (!statusField || !(statusField in values)) return null;
  const v = values[statusField];
  const key = v && typeof v === 'object' && 'key' in v ? String((v as { key: unknown }).key) : String(v ?? '');
  return closedValues.includes(key);
}

/**
 * After the dashboard wrote a parent record (a dialog save, a flow, a one-click): the doors
 * follow — made when missing (a new poll), the write door switched with the status (closed →
 * off, reopened → on). Never throws: a failure is returned as a sentence for a toast, and
 * the widget offers „Link anlegen“ (or says that the links cannot be read).
 */
export async function syncDoorsAfterWrite(entity: string, recordId: string, values: Record<string, unknown> = {}): Promise<{ ok: boolean; message?: string; link?: string | null }> {
  const pages = Object.entries(DOOR_PARENTS).filter(([, p]) => p.entity === entity);
  if (!pages.length || !/^[a-f0-9]{24}$/i.test(recordId)) return { ok: true };
  let link: string | null = null;
  for (const [slug, spec] of pages) {
    try {
      const closed = closedBy(values, spec.statusField, spec.closedValues);
      const d = await ensureDoors(slug, recordId, closed === null ? {} : { enabled: !closed });
      link = d.link ?? link;
    } catch (e) {
      // the page is still being built, or its doors are switched off: nothing to keep in step
      if (e instanceof DoorsError && (e.status === 404 || e.status === 409)) continue;
      console.error('[doors]', e);
      return { ok: false, message: e instanceof DoorsError && e.status >= 500 ? undefined : (e instanceof Error ? e.message : String(e)) };
    }
  }
  return { ok: true, link };
}

export async function deleteDoorsAfterDelete(entity: string, recordId: string): Promise<void> {
  for (const [slug, spec] of Object.entries(DOOR_PARENTS)) {
    if (spec.entity !== entity) continue;
    try { await deleteDoors(slug, recordId); } catch { /* the page admin's reconcile is the second line */ }
  }
}
