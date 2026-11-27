/**
 * The PUBLIC door of the journey port — anonymous, grant-scoped.
 *
 *   const port = createPublicPort(cfg, page);
 *
 * `list` reads through the page's list endpoints (a `scope` on the grant
 * decides what a visitor sees), `create` writes through ANY create endpoint
 * the page declares in `_public/surface.json` (a guest, then the booking that
 * links it — one plan, two steps), `ref` yields the grant-scoped record
 * reference. An entity without a create endpoint on this page throws a
 * JourneyPortError with the fix in the message. The page's `entity`/`app_id`
 * is only the FIRST of its create targets; the port never depends on that
 * order (live: a reordered surface broke the second write of a booking page).
 */
import {
  createPublicRecord,
  deletePublicRecord,
  doorsFromHash,
  getPublicRecord,
  listPublicRecords,
  PageUnavailableError,
  prepareChallenge,
  recordRef,
  updatePublicRecord,
  type PublicPageConfig,
  type PublicPagesConfig,
} from '@/lib/publicClient';
import { JourneyPortError, toWirePayload, type JourneyPort, type JourneyRecord } from './port';
import { matchesSearch } from './search';
import { ENTITIES, type EntityKey } from './rules';
import { LOOKUP_OPTIONS } from '@/types/app';

/**
 * Lookup values in the SAME shape on both doors. The internal door hands
 * `{ key, label }` objects out (livingAppsService hydrates every read); a
 * grant answers with the bare key (`status: "verfuegbar"`). A page written
 * against the dashboard — `fields.status?.key === 'verfuegbar'` — therefore
 * matched nothing on a public page and showed an empty list without any
 * error (live 2026-09-16: a booking form offered no apartment although the
 * grant returned two). Hydrating here removes the difference: whatever the
 * page compares against, it sees the object it sees everywhere else. Values
 * that already are objects (a legacy grant, a hand-built record) pass through;
 * a key the schema does not know keeps itself as label, like the internal door.
 */
export function hydrateLookups(entity: EntityKey, fields: Record<string, unknown>): Record<string, unknown> {
  const opts = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>> | undefined>)[entity];
  if (!opts) return fields;
  let out: Record<string, unknown> | null = null;
  const objectFor = (options: Array<{ key: string; label: string }>, v: string) => options.find(o => o.key === v) ?? { key: v, label: v };
  for (const [fieldKey, options] of Object.entries(opts)) {
    const val = fields[fieldKey];
    if (typeof val === 'string' && val !== '') {
      (out ??= { ...fields })[fieldKey] = objectFor(options, val);
    } else if (Array.isArray(val) && val.some(v => typeof v === 'string')) {
      (out ??= { ...fields })[fieldKey] = val.map(v => (typeof v === 'string' ? objectFor(options, v) : v));
    }
  }
  return out ?? fields;
}

function appIdOf(entity: EntityKey): string {
  const info = (ENTITIES as Record<string, { appId: string } | undefined>)[entity];
  if (!info) throw new JourneyPortError(`Unknown entity '${entity}' — use one of: ${Object.keys(ENTITIES).join(', ')}.`);
  return info.appId;
}

/** The public door with EF-50's two extra ways: a visitor changes or withdraws a record of
 *  THEIR OWN submission, proven by the submission's key (`useOwnSubmission` drives them).
 *  `editOwn` is null while the page (or the deployment) does not offer it. */
export interface PublicJourneyPort extends JourneyPort {
  editOwn: { entity: string; fields: string[]; keyField: string } | null;
  updateOwn(entity: EntityKey, id: string, values: Record<string, unknown>, key: string): Promise<JourneyRecord>;
  removeOwn(entity: EntityKey, id: string, key: string): Promise<void>;
}

export function createPublicPort(cfg: PublicPagesConfig, page: PublicPageConfig): PublicJourneyPort {
  // The proof-of-work for every create is solved while the visitor reads and
  // types, not when they press „Senden“ (Abnahme 7: the confirmation took
  // 1.8 s, most of it the challenge; PublicFormPage did this, the port did not).
  // A token goes stale after 4 min — submit then solves a fresh one as before.
  try {
    const creates = (page.endpoints ?? []).filter(e => e.op === 'create' && e.app_id);
    for (const ep of creates.length ? creates : [{ app_id: page.app_id }]) {
      if (ep.app_id) prepareChallenge(cfg, page, 'POST', `/apps/${ep.app_id}/records`);
    }
  } catch { /* a pre-solve never blocks the page */ }
  const eo = page.edit_own && page.edit_own.app_id && page.edit_own.key_field ? page.edit_own : null;
  // the page runs on a record's doors (the link carried `tor=`): its parent is read by its single path
  const doorParent = page.door_per_record && doorsFromHash(page) ? page.door_per_record : null;
  const linkedId = (): string | null => (page.link_param && typeof window !== 'undefined'
    ? new URLSearchParams(window.location.hash.split('?')[1] ?? '').get(page.link_param.name) : null);
  const parentRecord = async (id?: string): Promise<JourneyRecord | null> => {
    const rid = id ?? linkedId();
    if (!doorParent || !rid || !/^[a-f0-9]{24}$/i.test(rid)) return null;
    try {
      const r = await getPublicRecord(cfg, page, doorParent.app_id, rid);
      return { id: r.id ?? rid, fields: hydrateLookups(doorParent.entity as EntityKey, (r.fields ?? {}) as Record<string, unknown>), createdAt: r.created_at ?? null };
    } catch (e) {
      if (e instanceof PageUnavailableError) return null;      // not this door's record — „gone“, like a list without it
      throw e;                                                  // a network error stays one (offline way)
    }
  };
  const port: PublicJourneyPort = {
    door: 'public',
    editOwn: eo ? { entity: eo.entity, fields: [...eo.fields], keyField: eo.key_field } : null,
    async list(entity, opts) {
      // EF-60: on a page reached through a record's doors the PARENT has no collection — the
      // read door answers the linked record alone. `list` and `get` of the parent are that one
      // record, so a page (and freshRef / freshFlag in a submit's check) reads it like any other.
      if (doorParent && entity === doorParent.entity) {
        const one = await parentRecord();
        return one ? [one] : [];
      }
      const map = await listPublicRecords(cfg, page, {
        appId: appIdOf(entity), limit: opts?.limit ?? 500, offset: opts?.offset,
      });
      const rows = Object.entries(map).map(([id, r]): JourneyRecord => ({
        id: r.id ?? id,
        fields: hydrateLookups(entity, (r.fields ?? {}) as Record<string, unknown>),
        createdAt: r.created_at ?? null,
      }));
      // A grant's allowed query is field/limit/offset — no `filter`. So the
      // search happens here, over the page the grant handed out, and a
      // standing `filter` (vSQL) cannot be honoured at all: check-public
      // rejects it on a public page; useRecordSearch's `where` is the
      // client-side restriction that works on this door.
      const search = opts?.search;
      return search ? rows.filter(r => matchesSearch(r.fields, search.query, search.fields)) : rows;
    },
    // Grants allow field/limit/offset only — no aggregate, no filter. null
    // means "this door cannot count", which is not the same as zero.
    async count() {
      return null;
    },
    // No per-record path on a grant: the page the grant hands out is searched.
    async get(entity, id) {
      if (doorParent && entity === doorParent.entity) return parentRecord(id);
      const rows = await port.list(entity);
      return rows.find(r => r.id === id) ?? null;
    },
    async create(entity, values) {
      const appId = appIdOf(entity);
      // The endpoint for THIS entity — the page's own fields/preset apply per
      // target (createPublicRecord reads them by app_id). A legacy page
      // without endpoints creates its one entity as before.
      const ep = (page.endpoints ?? []).find(e => e.op === 'create' && e.app_id === appId);
      const target: PublicPageConfig = ep ? { ...page, entity: ep.entity, app_id: ep.app_id, fields: ep.fields } : page;
      if (appId !== target.app_id) {
        const declared = (page.endpoints ?? []).filter(e => e.op === 'create').map(e => e.entity);
        throw new JourneyPortError(
          `This public page has no create endpoint for '${entity}' (declared: ${declared.length ? declared.join(', ') : page.entity}). ` +
            `Add { op: 'create', entity: '${entity}', fields: [...] } to the page in _public/surface.json.`,
        );
      }
      const r = await createPublicRecord(cfg, target, toWirePayload(entity, values, port));
      return { id: r.id, fields: hydrateLookups(entity, (r.fields ?? {}) as Record<string, unknown>), createdAt: r.created_at ?? null,
        recordKey: r.record_key ?? null };
    },
    // EF-50: the visitor's own record — only the entity the page declared, only its fields
    async updateOwn(entity, id, values, key) {
      const appId = appIdOf(entity);
      if (!eo || eo.app_id !== appId) {
        throw new JourneyPortError(`This public page lets nobody change '${entity}' records (edit_own: ${eo ? eo.entity : 'none'}).`);
      }
      const r = await updatePublicRecord(cfg, page, appId, id, toWirePayload(entity, values, port), key);
      return { id: r.id ?? id, fields: hydrateLookups(entity, (r.fields ?? {}) as Record<string, unknown>), createdAt: r.created_at ?? null };
    },
    async removeOwn(entity, id, key) {
      const appId = appIdOf(entity);
      if (!eo || eo.app_id !== appId) {
        throw new JourneyPortError(`This public page lets nobody withdraw '${entity}' records (edit_own: ${eo ? eo.entity : 'none'}).`);
      }
      await deletePublicRecord(cfg, page, appId, id, key);
    },
    ref: (appId, recordId) => recordRef(cfg, page, appId, recordId),
  };
  return port;
}
