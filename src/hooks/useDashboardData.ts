import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Qualifikationsart, Personentyp, Person, QualifikationEinerPerson, BetreutePerson, Diagnose, Medikationsplan, MassnahmePflegeplan, Besuch, Ereignisprotokoll, Betreuungszuordnung, Dokumentation, AnhangZurDokumentation, KiExtrakt, Aufgabe } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { t } from '@/i18n';

/** Dashboard data + the OPTIMISTIC-WRITE API.
 *
 *  The per-entity setters (`set<Entity>`) are exported for exactly one job:
 *  optimistic updates on drag writes (onEventDrop / onEventResize /
 *  onCardMove). Call the setter FIRST — the bar/card lands instantly — then
 *  fire the PATCH in the background and call `fetchAll()` ONLY in the catch.
 *  Never await the PATCH before updating state (the UI freezes for the full
 *  round-trip on every drag) and never refetch after a successful write.
 *  There is no other mechanism (no `__optimistic`, no `mutate`).
 */
/** Entities this hook can load — the same keys the journey layer uses. */
export type DashboardEntity = 'qualifikationsart' | 'personentyp' | 'person' | 'qualifikation_einer_person' | 'betreute_person' | 'diagnose' | 'medikationsplan' | 'massnahme_(pflegeplan)' | 'besuch' | 'ereignisprotokoll' | 'betreuungszuordnung' | 'dokumentation' | 'anhang_zur_dokumentation' | 'ki_extrakt' | 'aufgabe';

/** Silent re-read interval from the plan (generated): visitors or tools add records. */
const LIVE_MS = 0;
/** The lists a tick re-reads — ONE request each; the rest waits for an event or the tab's return. */
const LIVE_ENTITIES: string[] = [];
/** Marks a list the tick skipped: its rows and its forbidden state stay as they are. */
const SKIP = Symbol('skip');

export interface DashboardDataOptions {
  /** Entities this page does NOT need (picked through useRecordSearch instead).
   *  Every flow page mounts this hook on its own route, so without `omit` a
   *  page that searches 3.000 guests server-side would still pull all 3.000
   *  through the side door. */
  omit?: DashboardEntity[];
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  // A string key, not the array: an inline `omit={['gaeste']}` is a new array
  // on every render and would restart the fetch forever.
  const omitKey = (options.omit ?? []).slice().sort().join('|');
  const [qualifikationsart, setQualifikationsart] = useState<Qualifikationsart[]>([]);
  const [personentyp, setPersonentyp] = useState<Personentyp[]>([]);
  const [person, setPerson] = useState<Person[]>([]);
  const [qualifikationEinerPerson, setQualifikationEinerPerson] = useState<QualifikationEinerPerson[]>([]);
  const [betreutePerson, setBetreutePerson] = useState<BetreutePerson[]>([]);
  const [diagnose, setDiagnose] = useState<Diagnose[]>([]);
  const [medikationsplan, setMedikationsplan] = useState<Medikationsplan[]>([]);
  const [massnahmePflegeplan, setMassnahmePflegeplan] = useState<MassnahmePflegeplan[]>([]);
  const [besuch, setBesuch] = useState<Besuch[]>([]);
  const [ereignisprotokoll, setEreignisprotokoll] = useState<Ereignisprotokoll[]>([]);
  const [betreuungszuordnung, setBetreuungszuordnung] = useState<Betreuungszuordnung[]>([]);
  const [dokumentation, setDokumentation] = useState<Dokumentation[]>([]);
  const [anhangZurDokumentation, setAnhangZurDokumentation] = useState<AnhangZurDokumentation[]>([]);
  const [kiExtrakt, setKiExtrakt] = useState<KiExtrakt[]>([]);
  const [aufgabe, setAufgabe] = useState<Aufgabe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  /** Lists the signed-in user may not read (403 on the platform). They load as
   *  empty and the rest of the page loads normally — one forbidden list used to
   *  empty the whole dashboard (05.10.2026). Hide a block whose list is here. */
  const [forbidden, setForbidden] = useState<DashboardEntity[]>([]);

  // Every list on its own: a 403 is „not yours“, any other failure is an error.
  const forbiddenRef = useRef<DashboardEntity[]>([]);
  const settle = useCallback((settled: PromiseSettledResult<unknown>[]) => {
    const denied: DashboardEntity[] = [];
    let failure: unknown = null;
    // null = this list failed for another reason, or the tick skipped it: its current data stays
    const pick = <T,>(i: number, key: DashboardEntity): T[] | null => {
      const s = settled[i];
      if (s.status === 'fulfilled') return s.value as T[];
      if (s.reason === SKIP) { if (forbiddenRef.current.includes(key)) denied.push(key); return null; }
      if ((s.reason as { status?: number } | null)?.status === 403) { denied.push(key); return []; }
      failure = failure ?? s.reason;
      return null;
    };
    { const rows = pick<Qualifikationsart>(0, 'qualifikationsart'); if (rows) setQualifikationsart(rows); }
    { const rows = pick<Personentyp>(1, 'personentyp'); if (rows) setPersonentyp(rows); }
    { const rows = pick<Person>(2, 'person'); if (rows) setPerson(rows); }
    { const rows = pick<QualifikationEinerPerson>(3, 'qualifikation_einer_person'); if (rows) setQualifikationEinerPerson(rows); }
    { const rows = pick<BetreutePerson>(4, 'betreute_person'); if (rows) setBetreutePerson(rows); }
    { const rows = pick<Diagnose>(5, 'diagnose'); if (rows) setDiagnose(rows); }
    { const rows = pick<Medikationsplan>(6, 'medikationsplan'); if (rows) setMedikationsplan(rows); }
    { const rows = pick<MassnahmePflegeplan>(7, 'massnahme_(pflegeplan)'); if (rows) setMassnahmePflegeplan(rows); }
    { const rows = pick<Besuch>(8, 'besuch'); if (rows) setBesuch(rows); }
    { const rows = pick<Ereignisprotokoll>(9, 'ereignisprotokoll'); if (rows) setEreignisprotokoll(rows); }
    { const rows = pick<Betreuungszuordnung>(10, 'betreuungszuordnung'); if (rows) setBetreuungszuordnung(rows); }
    { const rows = pick<Dokumentation>(11, 'dokumentation'); if (rows) setDokumentation(rows); }
    { const rows = pick<AnhangZurDokumentation>(12, 'anhang_zur_dokumentation'); if (rows) setAnhangZurDokumentation(rows); }
    { const rows = pick<KiExtrakt>(13, 'ki_extrakt'); if (rows) setKiExtrakt(rows); }
    { const rows = pick<Aufgabe>(14, 'aufgabe'); if (rows) setAufgabe(rows); }
    forbiddenRef.current = denied;
    setForbidden(prev => (prev.join('|') === denied.join('|') ? prev : denied));
    return failure;
  }, []);

  const fetchAll = useCallback(async () => {
    setError(null);
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    try {
      const failure = settle(await Promise.allSettled([
        omit.has('qualifikationsart') ? Promise.resolve([] as Qualifikationsart[]) : LivingAppsService.getQualifikationsart(),
        omit.has('personentyp') ? Promise.resolve([] as Personentyp[]) : LivingAppsService.getPersonentyp(),
        omit.has('person') ? Promise.resolve([] as Person[]) : LivingAppsService.getPerson(),
        omit.has('qualifikation_einer_person') ? Promise.resolve([] as QualifikationEinerPerson[]) : LivingAppsService.getQualifikationEinerPerson(),
        omit.has('betreute_person') ? Promise.resolve([] as BetreutePerson[]) : LivingAppsService.getBetreutePerson(),
        omit.has('diagnose') ? Promise.resolve([] as Diagnose[]) : LivingAppsService.getDiagnose(),
        omit.has('medikationsplan') ? Promise.resolve([] as Medikationsplan[]) : LivingAppsService.getMedikationsplan(),
        omit.has('massnahme_(pflegeplan)') ? Promise.resolve([] as MassnahmePflegeplan[]) : LivingAppsService.getMassnahmePflegeplan(),
        omit.has('besuch') ? Promise.resolve([] as Besuch[]) : LivingAppsService.getBesuch(),
        omit.has('ereignisprotokoll') ? Promise.resolve([] as Ereignisprotokoll[]) : LivingAppsService.getEreignisprotokoll(),
        omit.has('betreuungszuordnung') ? Promise.resolve([] as Betreuungszuordnung[]) : LivingAppsService.getBetreuungszuordnung(),
        omit.has('dokumentation') ? Promise.resolve([] as Dokumentation[]) : LivingAppsService.getDokumentation(),
        omit.has('anhang_zur_dokumentation') ? Promise.resolve([] as AnhangZurDokumentation[]) : LivingAppsService.getAnhangZurDokumentation(),
        omit.has('ki_extrakt') ? Promise.resolve([] as KiExtrakt[]) : LivingAppsService.getKiExtrakt(),
        omit.has('aufgabe') ? Promise.resolve([] as Aufgabe[]) : LivingAppsService.getAufgabe(),
      ]));
      if (failure) throw failure;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(t('data_load_failed')));
    } finally {
      setLoading(false);
    }
  }, [omitKey, settle]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    async function silentRefresh() {
      try {
        // a failed list keeps its stale data out of the way: settle() only
        // replaces what loaded or was refused
        settle(await Promise.allSettled([
          omit.has('qualifikationsart') ? Promise.resolve([] as Qualifikationsart[]) : LivingAppsService.getQualifikationsart(),
          omit.has('personentyp') ? Promise.resolve([] as Personentyp[]) : LivingAppsService.getPersonentyp(),
          omit.has('person') ? Promise.resolve([] as Person[]) : LivingAppsService.getPerson(),
          omit.has('qualifikation_einer_person') ? Promise.resolve([] as QualifikationEinerPerson[]) : LivingAppsService.getQualifikationEinerPerson(),
          omit.has('betreute_person') ? Promise.resolve([] as BetreutePerson[]) : LivingAppsService.getBetreutePerson(),
          omit.has('diagnose') ? Promise.resolve([] as Diagnose[]) : LivingAppsService.getDiagnose(),
          omit.has('medikationsplan') ? Promise.resolve([] as Medikationsplan[]) : LivingAppsService.getMedikationsplan(),
          omit.has('massnahme_(pflegeplan)') ? Promise.resolve([] as MassnahmePflegeplan[]) : LivingAppsService.getMassnahmePflegeplan(),
          omit.has('besuch') ? Promise.resolve([] as Besuch[]) : LivingAppsService.getBesuch(),
          omit.has('ereignisprotokoll') ? Promise.resolve([] as Ereignisprotokoll[]) : LivingAppsService.getEreignisprotokoll(),
          omit.has('betreuungszuordnung') ? Promise.resolve([] as Betreuungszuordnung[]) : LivingAppsService.getBetreuungszuordnung(),
          omit.has('dokumentation') ? Promise.resolve([] as Dokumentation[]) : LivingAppsService.getDokumentation(),
          omit.has('anhang_zur_dokumentation') ? Promise.resolve([] as AnhangZurDokumentation[]) : LivingAppsService.getAnhangZurDokumentation(),
          omit.has('ki_extrakt') ? Promise.resolve([] as KiExtrakt[]) : LivingAppsService.getKiExtrakt(),
          omit.has('aufgabe') ? Promise.resolve([] as Aufgabe[]) : LivingAppsService.getAufgabe(),
        ]));
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    // assistant:data-changed comes from the assistant (<la-klar-assistant>)
    // after every mutation. The element additionally fires the legacy
    // dashboard-refresh event for OLD deployed bundles — do NOT subscribe to
    // both here, or every mutation fetches twice.
    window.addEventListener('assistant:data-changed', handleRefresh);
    // Records that arrive without the team (a visitor on a public page, a
    // tool) show up by themselves: a silent re-read every LIVE_MS while the
    // tab is visible, once on return (S-1/W-19, acceptance 4 — the moderation
    // saw new contributions only after a reload). 0 = events only.
    // the tick: only LIVE_ENTITIES, one request each
    const only = new Set(LIVE_ENTITIES);
    async function tick() {
      try {
        settle(await Promise.allSettled([
          !only.has('qualifikationsart') ? Promise.reject(SKIP) : omit.has('qualifikationsart') ? Promise.resolve([] as Qualifikationsart[]) : LivingAppsService.getQualifikationsart(),
          !only.has('personentyp') ? Promise.reject(SKIP) : omit.has('personentyp') ? Promise.resolve([] as Personentyp[]) : LivingAppsService.getPersonentyp(),
          !only.has('person') ? Promise.reject(SKIP) : omit.has('person') ? Promise.resolve([] as Person[]) : LivingAppsService.getPerson(),
          !only.has('qualifikation_einer_person') ? Promise.reject(SKIP) : omit.has('qualifikation_einer_person') ? Promise.resolve([] as QualifikationEinerPerson[]) : LivingAppsService.getQualifikationEinerPerson(),
          !only.has('betreute_person') ? Promise.reject(SKIP) : omit.has('betreute_person') ? Promise.resolve([] as BetreutePerson[]) : LivingAppsService.getBetreutePerson(),
          !only.has('diagnose') ? Promise.reject(SKIP) : omit.has('diagnose') ? Promise.resolve([] as Diagnose[]) : LivingAppsService.getDiagnose(),
          !only.has('medikationsplan') ? Promise.reject(SKIP) : omit.has('medikationsplan') ? Promise.resolve([] as Medikationsplan[]) : LivingAppsService.getMedikationsplan(),
          !only.has('massnahme_(pflegeplan)') ? Promise.reject(SKIP) : omit.has('massnahme_(pflegeplan)') ? Promise.resolve([] as MassnahmePflegeplan[]) : LivingAppsService.getMassnahmePflegeplan(),
          !only.has('besuch') ? Promise.reject(SKIP) : omit.has('besuch') ? Promise.resolve([] as Besuch[]) : LivingAppsService.getBesuch(),
          !only.has('ereignisprotokoll') ? Promise.reject(SKIP) : omit.has('ereignisprotokoll') ? Promise.resolve([] as Ereignisprotokoll[]) : LivingAppsService.getEreignisprotokoll(),
          !only.has('betreuungszuordnung') ? Promise.reject(SKIP) : omit.has('betreuungszuordnung') ? Promise.resolve([] as Betreuungszuordnung[]) : LivingAppsService.getBetreuungszuordnung(),
          !only.has('dokumentation') ? Promise.reject(SKIP) : omit.has('dokumentation') ? Promise.resolve([] as Dokumentation[]) : LivingAppsService.getDokumentation(),
          !only.has('anhang_zur_dokumentation') ? Promise.reject(SKIP) : omit.has('anhang_zur_dokumentation') ? Promise.resolve([] as AnhangZurDokumentation[]) : LivingAppsService.getAnhangZurDokumentation(),
          !only.has('ki_extrakt') ? Promise.reject(SKIP) : omit.has('ki_extrakt') ? Promise.resolve([] as KiExtrakt[]) : LivingAppsService.getKiExtrakt(),
          !only.has('aufgabe') ? Promise.reject(SKIP) : omit.has('aufgabe') ? Promise.resolve([] as Aufgabe[]) : LivingAppsService.getAufgabe(),
        ]));
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    const timer = LIVE_MS > 0 && only.size > 0 ? window.setInterval(() => { if (!document.hidden) void tick(); }, LIVE_MS) : null;
    const onVisible = () => { if (!document.hidden && LIVE_MS > 0) void silentRefresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('assistant:data-changed', handleRefresh);
      if (timer !== null) window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [omitKey, settle]);

  const qualifikationsartMap = useMemo(() => {
    const m = new Map<string, Qualifikationsart>();
    qualifikationsart.forEach(r => m.set(r.record_id, r));
    return m;
  }, [qualifikationsart]);

  const personentypMap = useMemo(() => {
    const m = new Map<string, Personentyp>();
    personentyp.forEach(r => m.set(r.record_id, r));
    return m;
  }, [personentyp]);

  const personMap = useMemo(() => {
    const m = new Map<string, Person>();
    person.forEach(r => m.set(r.record_id, r));
    return m;
  }, [person]);

  const betreutePersonMap = useMemo(() => {
    const m = new Map<string, BetreutePerson>();
    betreutePerson.forEach(r => m.set(r.record_id, r));
    return m;
  }, [betreutePerson]);

  const massnahmePflegeplanMap = useMemo(() => {
    const m = new Map<string, MassnahmePflegeplan>();
    massnahmePflegeplan.forEach(r => m.set(r.record_id, r));
    return m;
  }, [massnahmePflegeplan]);

  const besuchMap = useMemo(() => {
    const m = new Map<string, Besuch>();
    besuch.forEach(r => m.set(r.record_id, r));
    return m;
  }, [besuch]);

  const betreuungszuordnungMap = useMemo(() => {
    const m = new Map<string, Betreuungszuordnung>();
    betreuungszuordnung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [betreuungszuordnung]);

  const dokumentationMap = useMemo(() => {
    const m = new Map<string, Dokumentation>();
    dokumentation.forEach(r => m.set(r.record_id, r));
    return m;
  }, [dokumentation]);

  const kiExtraktMap = useMemo(() => {
    const m = new Map<string, KiExtrakt>();
    kiExtrakt.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kiExtrakt]);

  return { qualifikationsart, setQualifikationsart, personentyp, setPersonentyp, person, setPerson, qualifikationEinerPerson, setQualifikationEinerPerson, betreutePerson, setBetreutePerson, diagnose, setDiagnose, medikationsplan, setMedikationsplan, massnahmePflegeplan, setMassnahmePflegeplan, besuch, setBesuch, ereignisprotokoll, setEreignisprotokoll, betreuungszuordnung, setBetreuungszuordnung, dokumentation, setDokumentation, anhangZurDokumentation, setAnhangZurDokumentation, kiExtrakt, setKiExtrakt, aufgabe, setAufgabe, loading, error, fetchAll, forbidden, qualifikationsartMap, personentypMap, personMap, betreutePersonMap, massnahmePflegeplanMap, besuchMap, betreuungszuordnungMap, dokumentationMap, kiExtraktMap };
}

/** The hook's return — the `data` prop of DashboardOverview in the Ready-Wrapper form. */
export type DashboardData = ReturnType<typeof useDashboardData>;