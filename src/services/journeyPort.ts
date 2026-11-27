/**
 * The INTERNAL door of the journey port — authenticated, via LivingAppsService.
 * GENERATED: one lister and one creator per entity. Do not edit.
 *
 *   import { servicePort } from '@/services/journeyPort';
 *
 * Intent pages hand this to `useJourneySubmit` and to shared step blocks. It
 * exposes only list · create · ref — the public subset — so a step written
 * against it also runs on a public page. Undo, edit and delete stay on the
 * page itself (LivingAppsService), never inside a shared step.
 */
import { LivingAppsService, createRecordUrl, type RecordQuery } from '@/services/livingAppsService';
import { toWirePayload, type InternalJourneyPort, type JourneyRecord } from '@/lib/journey/port';
import { buildSearchFilter, byIdFilter, combineFilters } from '@/lib/journey/search';
import type { EntityKey } from '@/lib/journey/rules';

type RawRecord = { record_id: string; fields: Record<string, unknown>; createdat?: string | null };
type RawMutation = { record_id: string; fields?: Record<string, unknown>; created_at?: string | null };

const listers: Record<EntityKey, () => Promise<RawRecord[]>> = {
  'qualifikationsart': () => LivingAppsService.getQualifikationsart() as Promise<RawRecord[]>,
  'personentyp': () => LivingAppsService.getPersonentyp() as Promise<RawRecord[]>,
  'person': () => LivingAppsService.getPerson() as Promise<RawRecord[]>,
  'qualifikation_einer_person': () => LivingAppsService.getQualifikationEinerPerson() as Promise<RawRecord[]>,
  'betreute_person': () => LivingAppsService.getBetreutePerson() as Promise<RawRecord[]>,
  'diagnose': () => LivingAppsService.getDiagnose() as Promise<RawRecord[]>,
  'medikationsplan': () => LivingAppsService.getMedikationsplan() as Promise<RawRecord[]>,
  'massnahme_(pflegeplan)': () => LivingAppsService.getMassnahmePflegeplan() as Promise<RawRecord[]>,
  'besuch': () => LivingAppsService.getBesuch() as Promise<RawRecord[]>,
  'ereignisprotokoll': () => LivingAppsService.getEreignisprotokoll() as Promise<RawRecord[]>,
  'betreuungszuordnung': () => LivingAppsService.getBetreuungszuordnung() as Promise<RawRecord[]>,
  'dokumentation': () => LivingAppsService.getDokumentation() as Promise<RawRecord[]>,
  'anhang_zur_dokumentation': () => LivingAppsService.getAnhangZurDokumentation() as Promise<RawRecord[]>,
  'ki_extrakt': () => LivingAppsService.getKiExtrakt() as Promise<RawRecord[]>,
  'aufgabe': () => LivingAppsService.getAufgabe() as Promise<RawRecord[]>,
};

/** The query/count half — the REST parameters the plain listers never send. */
const queriers: Record<EntityKey, (q: RecordQuery) => Promise<RawRecord[]>> = {
  'qualifikationsart': q => LivingAppsService.queryQualifikationsart(q) as Promise<RawRecord[]>,
  'personentyp': q => LivingAppsService.queryPersonentyp(q) as Promise<RawRecord[]>,
  'person': q => LivingAppsService.queryPerson(q) as Promise<RawRecord[]>,
  'qualifikation_einer_person': q => LivingAppsService.queryQualifikationEinerPerson(q) as Promise<RawRecord[]>,
  'betreute_person': q => LivingAppsService.queryBetreutePerson(q) as Promise<RawRecord[]>,
  'diagnose': q => LivingAppsService.queryDiagnose(q) as Promise<RawRecord[]>,
  'medikationsplan': q => LivingAppsService.queryMedikationsplan(q) as Promise<RawRecord[]>,
  'massnahme_(pflegeplan)': q => LivingAppsService.queryMassnahmePflegeplan(q) as Promise<RawRecord[]>,
  'besuch': q => LivingAppsService.queryBesuch(q) as Promise<RawRecord[]>,
  'ereignisprotokoll': q => LivingAppsService.queryEreignisprotokoll(q) as Promise<RawRecord[]>,
  'betreuungszuordnung': q => LivingAppsService.queryBetreuungszuordnung(q) as Promise<RawRecord[]>,
  'dokumentation': q => LivingAppsService.queryDokumentation(q) as Promise<RawRecord[]>,
  'anhang_zur_dokumentation': q => LivingAppsService.queryAnhangZurDokumentation(q) as Promise<RawRecord[]>,
  'ki_extrakt': q => LivingAppsService.queryKiExtrakt(q) as Promise<RawRecord[]>,
  'aufgabe': q => LivingAppsService.queryAufgabe(q) as Promise<RawRecord[]>,
};

const counters: Record<EntityKey, (filter?: string, signal?: AbortSignal) => Promise<number>> = {
  'qualifikationsart': (filter, signal) => LivingAppsService.countQualifikationsart(filter, signal),
  'personentyp': (filter, signal) => LivingAppsService.countPersonentyp(filter, signal),
  'person': (filter, signal) => LivingAppsService.countPerson(filter, signal),
  'qualifikation_einer_person': (filter, signal) => LivingAppsService.countQualifikationEinerPerson(filter, signal),
  'betreute_person': (filter, signal) => LivingAppsService.countBetreutePerson(filter, signal),
  'diagnose': (filter, signal) => LivingAppsService.countDiagnose(filter, signal),
  'medikationsplan': (filter, signal) => LivingAppsService.countMedikationsplan(filter, signal),
  'massnahme_(pflegeplan)': (filter, signal) => LivingAppsService.countMassnahmePflegeplan(filter, signal),
  'besuch': (filter, signal) => LivingAppsService.countBesuch(filter, signal),
  'ereignisprotokoll': (filter, signal) => LivingAppsService.countEreignisprotokoll(filter, signal),
  'betreuungszuordnung': (filter, signal) => LivingAppsService.countBetreuungszuordnung(filter, signal),
  'dokumentation': (filter, signal) => LivingAppsService.countDokumentation(filter, signal),
  'anhang_zur_dokumentation': (filter, signal) => LivingAppsService.countAnhangZurDokumentation(filter, signal),
  'ki_extrakt': (filter, signal) => LivingAppsService.countKiExtrakt(filter, signal),
  'aufgabe': (filter, signal) => LivingAppsService.countAufgabe(filter, signal),
};

const creators: Record<EntityKey, (fields: Record<string, unknown>) => Promise<RawMutation>> = {
  'qualifikationsart': fields => LivingAppsService.createQualifikationsartEntry(fields as never),
  'personentyp': fields => LivingAppsService.createPersonentypEntry(fields as never),
  'person': fields => LivingAppsService.createPersonEntry(fields as never),
  'qualifikation_einer_person': fields => LivingAppsService.createQualifikationEinerPersonEntry(fields as never),
  'betreute_person': fields => LivingAppsService.createBetreutePersonEntry(fields as never),
  'diagnose': fields => LivingAppsService.createDiagnoseEntry(fields as never),
  'medikationsplan': fields => LivingAppsService.createMedikationsplanEntry(fields as never),
  'massnahme_(pflegeplan)': fields => LivingAppsService.createMassnahmePflegeplanEntry(fields as never),
  'besuch': fields => LivingAppsService.createBesuchEntry(fields as never),
  'ereignisprotokoll': fields => LivingAppsService.createEreignisprotokollEntry(fields as never),
  'betreuungszuordnung': fields => LivingAppsService.createBetreuungszuordnungEntry(fields as never),
  'dokumentation': fields => LivingAppsService.createDokumentationEntry(fields as never),
  'anhang_zur_dokumentation': fields => LivingAppsService.createAnhangZurDokumentationEntry(fields as never),
  'ki_extrakt': fields => LivingAppsService.createKiExtraktEntry(fields as never),
  'aufgabe': fields => LivingAppsService.createAufgabeEntry(fields as never),
};

const updaters: Record<EntityKey, (id: string, fields: Record<string, unknown>) => Promise<RawMutation>> = {
  'qualifikationsart': (id, fields) => LivingAppsService.updateQualifikationsartEntry(id, fields as never),
  'personentyp': (id, fields) => LivingAppsService.updatePersonentypEntry(id, fields as never),
  'person': (id, fields) => LivingAppsService.updatePersonEntry(id, fields as never),
  'qualifikation_einer_person': (id, fields) => LivingAppsService.updateQualifikationEinerPersonEntry(id, fields as never),
  'betreute_person': (id, fields) => LivingAppsService.updateBetreutePersonEntry(id, fields as never),
  'diagnose': (id, fields) => LivingAppsService.updateDiagnoseEntry(id, fields as never),
  'medikationsplan': (id, fields) => LivingAppsService.updateMedikationsplanEntry(id, fields as never),
  'massnahme_(pflegeplan)': (id, fields) => LivingAppsService.updateMassnahmePflegeplanEntry(id, fields as never),
  'besuch': (id, fields) => LivingAppsService.updateBesuchEntry(id, fields as never),
  'ereignisprotokoll': (id, fields) => LivingAppsService.updateEreignisprotokollEntry(id, fields as never),
  'betreuungszuordnung': (id, fields) => LivingAppsService.updateBetreuungszuordnungEntry(id, fields as never),
  'dokumentation': (id, fields) => LivingAppsService.updateDokumentationEntry(id, fields as never),
  'anhang_zur_dokumentation': (id, fields) => LivingAppsService.updateAnhangZurDokumentationEntry(id, fields as never),
  'ki_extrakt': (id, fields) => LivingAppsService.updateKiExtraktEntry(id, fields as never),
  'aufgabe': (id, fields) => LivingAppsService.updateAufgabeEntry(id, fields as never),
};

function toJourneyRecord(r: RawRecord): JourneyRecord {
  return { id: r.record_id, fields: r.fields ?? {}, createdAt: r.createdat ?? null };
}

export const servicePort: InternalJourneyPort = {
  door: 'internal',
  async list(entity, opts) {
    // Only a bare list(entity) (or an empty options object) takes the historic
    // load-everything path. ANY explicit option — `limit` included — goes to the
    // server: useRecordSearch's first page of a big entity must not pull the
    // whole table (live 2026-09-02: all 263 employees travelled for a limit-50
    // first page because `limit` alone did not count as a query).
    const usesQuery = !!opts && (opts.search !== undefined || opts.offset !== undefined
      || opts.orderby !== undefined || opts.fields !== undefined || opts.signal !== undefined
      || opts.limit !== undefined || opts.filter !== undefined);
    if (!usesQuery) {
      const rows = await listers[entity]();
      const limited = opts?.limit ? rows.slice(0, opts.limit) : rows;
      return limited.map(toJourneyRecord);
    }
    const filter = combineFilters(opts.filter, opts.search ? buildSearchFilter(opts.search.query, opts.search.fields) : undefined);
    const rows = await queriers[entity]({
      filter, orderby: opts.orderby, limit: opts.limit, offset: opts.offset, fields: opts.fields, signal: opts.signal,
    });
    return rows.map(toJourneyRecord);
  },
  async count(entity, opts) {
    const filter = combineFilters(opts?.filter, opts?.search ? buildSearchFilter(opts.search.query, opts.search.fields) : undefined);
    return counters[entity](filter, opts?.signal);
  },
  async get(entity, id) {
    // One query on the server, not the whole table: `r.id` is the vSQL name
    // of the record id (a live page wrote `r.record_id` and got a 400).
    const rows = await queriers[entity]({ filter: byIdFilter(id), limit: 1 });
    return rows[0] ? toJourneyRecord(rows[0]) : null;
  },
  async create(entity, values) {
    const r = await creators[entity](toWirePayload(entity, values, servicePort));
    return { id: r.record_id, fields: r.fields ?? {}, createdAt: r.created_at ?? null };
  },
  // The same payload rules as create — plain ids in, references shaped here.
  async update(entity, id, values) {
    const r = await updaters[entity](id, toWirePayload(entity, values, servicePort));
    return { id: r.record_id || id, fields: r.fields ?? {}, createdAt: r.created_at ?? null };
  },
  ref: (appId, recordId) => createRecordUrl(appId, recordId),
};
