import { useEffect, useMemo, useState } from 'react';
import { addDays, format, isValid, parseISO } from 'date-fns';
import {
  IconAlertTriangle, IconUsers, IconPhone, IconClipboardCheck, IconSparkles,
  IconClockPlay, IconCertificate, IconCheck, IconX, IconLifebuoyOff,
} from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { flowActionFor } from '@/config/plan';
import { countOf } from '@/config/plan';
import { extractRecordId, getHeaderProfile } from '@/services/livingAppsService';
import { lookupKey } from '@/lib/formatters';
import { useClock, gruss, namen } from '@/lib/polish';
import { tx, appLabel, dateFnsLocale } from '@/i18n';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import type { EnrichedAufgabe, EnrichedBetreutePerson } from '@/types/enriched';

type Tab = 'heute' | 'erledigt' | 'info';

function toDate(s?: string): Date | null {
  if (!s) return null;
  const d = parseISO(s);
  return isValid(d) ? d : null;
}

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type !== 'aufgabe') return undefined;
      if (lookupKey(top.record.fields.status) !== 'offen') return undefined;
      const go = flowActionFor('aufgabe', 'status', top.record.record_id, 'erledigt');
      return go ? { label: tx('Als erledigt abhaken'), onClick: go } : undefined;
    },
  });
  const clock = useClock();
  const today = format(clock, 'yyyy-MM-dd');
  const in60 = format(addDays(clock, 60), 'yyyy-MM-dd');
  const loc = { locale: dateFnsLocale() };

  const personen = crud.enriched.person;
  const betreute = crud.enriched.betreutePerson;
  const aufgaben = crud.enriched.aufgabe;
  const besuche = crud.enriched.besuch;
  const quali = crud.enriched.qualifikationEinerPerson;
  const protokoll = crud.enriched.ereignisprotokoll;
  const zuordnungen = crud.enriched.betreuungszuordnung;
  const diagnosen = crud.enriched.diagnose;
  const medis = crud.enriched.medikationsplan;

  // Who is signed in → own Person record (by email / account)
  const [me, setMe] = useState<{ email: string; first: string; last: string } | null>(null);
  useEffect(() => {
    getHeaderProfile().then(p => setMe({ email: p.email, first: p.firstname, last: p.surname })).catch(() => setMe(null));
  }, []);
  const myPersonId = useMemo(() => {
    if (!me) return null;
    const hit = personen.find(p =>
      (me.email && (p.fields.email ?? '').toLowerCase() === me.email.toLowerCase()) ||
      (me.email && (p.fields.benutzerkonto ?? '').toLowerCase() === me.email.toLowerCase()));
    return hit?.record_id ?? null;
  }, [me, personen]);

  // Own (and actively substituted) active cared-for persons
  const meine = useMemo<EnrichedBetreutePerson[]>(() => {
    const aktiv = betreute.filter(b => (lookupKey(b.fields.status) ?? 'aktiv') === 'aktiv' && b.fields.aktiv !== false);
    if (!myPersonId) return aktiv;
    const ids = new Set(
      zuordnungen
        .filter(z => extractRecordId(z.fields.betreuungsperson) === myPersonId && z.fields.aktiv !== false)
        .filter(z => (!z.fields.gueltig_ab || z.fields.gueltig_ab.slice(0, 10) <= today) && (!z.fields.gueltig_bis || z.fields.gueltig_bis.slice(0, 10) >= today))
        .map(z => extractRecordId(z.fields.betreute_person)),
    );
    const own = aktiv.filter(b => ids.has(b.record_id));
    return own.length > 0 ? own : aktiv;
  }, [betreute, zuordnungen, myPersonId, today]);
  const meineIds = useMemo(() => new Set(meine.map(b => b.record_id)), [meine]);

  const lastVisit = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of besuche) {
      const pid = extractRecordId(b.fields.betreute_person);
      const beg = b.fields.beginn;
      if (!pid || !beg) continue;
      if (!m.has(pid) || beg > (m.get(pid) as string)) m.set(pid, beg);
    }
    return m;
  }, [besuche]);

  const sortedMeine = useMemo(() => [...meine].sort((a, b) =>
    `${a.fields.nachname ?? ''} ${a.fields.vorname ?? ''}`.localeCompare(`${b.fields.nachname ?? ''} ${b.fields.vorname ?? ''}`, 'de')), [meine]);

  // Tasks
  const pidOf = (a: EnrichedAufgabe) => extractRecordId(a.fields.betreute_person) ?? '';
  const meineAufgaben = aufgaben.filter(a => meineIds.has(pidOf(a)));
  const offen = meineAufgaben.filter(a => lookupKey(a.fields.status) === 'offen' || lookupKey(a.fields.status) === 'wartet_auf_dritte');
  const ueberfaellig = offen.filter(a => {
    const d = a.fields.faelligkeitsdatum?.slice(0, 10);
    return !!d && d < today;
  });
  const heuteOffen = offen.filter(a => {
    const d = a.fields.faelligkeitsdatum?.slice(0, 10);
    return !d || d <= today;
  });
  const vorschlaege = meineAufgaben
    .filter(a => lookupKey(a.fields.status) === 'vorschlag')
    .sort((a, b) => Number(lookupKey(b.fields.prioritaet) === 'dringend') - Number(lookupKey(a.fields.prioritaet) === 'dringend'));
  const dringend = vorschlaege.filter(a => lookupKey(a.fields.prioritaet) === 'dringend');
  const laufend = besuche.filter(b => lookupKey(b.fields.status) === 'laufend');

  const ablaufend = quali
    .filter(q => q.fields.gueltig_bis && q.fields.gueltig_bis.slice(0, 10) <= in60)
    .sort((a, b) => (a.fields.gueltig_bis ?? '').localeCompare(b.fields.gueltig_bis ?? ''));

  // Selection + tabs
  const [selId, setSelId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('heute');
  const sel = selId ? betreute.find(b => b.record_id === selId) ?? null : null;

  const openCount = (pid: string) => heuteOffen.filter(a => pidOf(a) === pid).length;

  const fmtDT = (s?: string) => {
    const d = toDate(s);
    return d ? format(d, 'dd.MM.yyyy HH:mm', loc) : null;
  };

  const selectPerson = (b: EnrichedBetreutePerson) => {
    setSelId(b.record_id);
    setTab('heute');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const first = sortedMeine.length === 1 ? sortedMeine[0] : null;
  const ctx = (() => {
    if (dringend.length > 0) {
      const names = namen(dringend.map(a => a.betreute_personName));
      return tx`Bei ${names} wartet ein dringender KI-Vorschlag auf dich.`;
    }
    if (ueberfaellig.length > 0) {
      const names = namen(ueberfaellig.map(a => a.betreute_personName));
      return tx`Überfällig sind Aufgaben bei ${names}.`;
    }
    if (heuteOffen.length > 0) {
      const names = namen(Array.from(new Set(heuteOffen.map(a => a.betreute_personName))));
      return tx`Heute sind noch Aufgaben offen bei ${names}.`;
    }
    if (sortedMeine.length > 0) {
      const names = namen(sortedMeine.map(b => b.fields.vorname ?? ''));
      return tx`Alles erledigt — deine Betreuten: ${names}.`;
    }
    return tx`Noch keine betreute Person zugeordnet.`;
  })();

  // Task detail rows
  const taskRow = (a: EnrichedAufgabe, withActions: boolean) => {
    const st = lookupKey(a.fields.status);
    const goDone = withActions ? flowActionFor('aufgabe', 'status', a.record_id, 'erledigt') : null;
    const goNot = withActions ? flowActionFor('aufgabe', 'status', a.record_id, 'nicht_durchgefuehrt') : null;
    const d = a.fields.faelligkeitsdatum?.slice(0, 10);
    const late = !!d && d < today && st === 'offen';
    return (
      <div key={a.record_id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => crud.aufgabe.openDetail(a)}>
          <div className="flex items-center gap-2">
            {lookupKey(a.fields.prioritaet) === 'dringend' && <IconAlertTriangle size={14} className="shrink-0 text-destructive" />}
            <span className="truncate font-medium">{a.fields.titel}</span>
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {late && <span className="font-medium text-destructive">{tx('Überfällig')} · </span>}
            {a.fields.aufgabenart?.label}
            {a.fields.tageszeitfenster?.label ? ` · ${a.fields.tageszeitfenster.label}` : ''}
            {!withActions && st ? ` · ${a.fields.status?.label}` : ''}
            {!withActions && a.fields.ergebnis ? ` · ${a.fields.ergebnis.label}` : ''}
            {!withActions && a.erledigt_vonName ? ` · ${a.erledigt_vonName}` : ''}
          </div>
          {!withActions && (a.fields.ergebniskommentar || a.fields.nicht_durchgefuehrt_grund) && (
            <div className="line-clamp-1 text-xs text-muted-foreground">{a.fields.ergebniskommentar || a.fields.nicht_durchgefuehrt_grund}</div>
          )}
        </button>
        {withActions && st === 'offen' && (goDone || goNot) && (
          <div className="flex flex-wrap gap-2">
            {goDone && (
              <button type="button" onClick={goDone} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                <IconCheck size={16} />{tx('Erledigt')}
              </button>
            )}
            {goNot && (
              <button type="button" onClick={goNot} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm">
                <IconX size={16} />{tx('Nicht durchgeführt')}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const selTasks = sel ? aufgaben.filter(a => pidOf(a) === sel.record_id) : [];
  const selHeute = selTasks.filter(a => ['offen', 'wartet_auf_dritte'].includes(lookupKey(a.fields.status) ?? '') && (!a.fields.faelligkeitsdatum || a.fields.faelligkeitsdatum.slice(0, 10) <= today));
  const selErledigt = selTasks
    .filter(a => ['erledigt', 'nicht_durchgefuehrt'].includes(lookupKey(a.fields.status) ?? ''))
    .sort((a, b) => (b.fields.erledigt_am ?? b.updatedat ?? '').localeCompare(a.fields.erledigt_am ?? a.updatedat ?? ''));
  const selVorschlaege = selTasks.filter(a => lookupKey(a.fields.status) === 'vorschlag');
  const ansprech = sel ? personen.find(p => p.record_id === extractRecordId(sel.fields.ansprechperson)) : undefined;
  const phone = ansprech?.fields.mobil || ansprech?.fields.telefon;
  const reviewLink = '#/intents/ki-vorschlaege-pruefen';

  const logRows = useMemo(() => protokoll
    .filter(p => !selId || extractRecordId(p.fields.betreute_person) === selId)
    .sort((a, b) => (b.fields.zeitstempel ?? '').localeCompare(a.fields.zeitstempel ?? ''))
    .slice(0, 8), [protokoll, selId]);

  const primary = (
    <div className="space-y-4">
      {sel ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="sticky top-0 z-10 space-y-2 border-b bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <button type="button" className="text-left text-lg font-semibold hover:underline" onClick={() => crud.betreutePerson.openDetail(sel)}>
                  {sel.fields.vorname} {sel.fields.nachname}
                </button>
                <div className="text-xs text-muted-foreground">
                  {tx('Geboren')} {toDate(sel.fields.geburtsdatum) ? format(toDate(sel.fields.geburtsdatum) as Date, 'dd.MM.yyyy', loc) : '—'}
                  {sel.fields.einrichtung ? ` · ${sel.fields.einrichtung}` : ''}{sel.fields.zimmer ? ` · ${sel.fields.zimmer}` : ''}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href="#/intents/besuch-starten-und-aufgaben-abhaken" className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                  <IconClockPlay size={16} />{tx('Besuch starten')}
                </a>
                <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => setSelId(null)}>{tx('Zur Liste')}</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-md bg-destructive/10 px-2 py-1 text-destructive">
                {tx('Allergien')}: {sel.fields.allergien || tx('keine bekannt')}
              </span>
              {sel.fields.wichtige_hinweise && (
                <span className="rounded-md bg-amber-100 px-2 py-1 text-amber-800">{sel.fields.wichtige_hinweise}</span>
              )}
              {ansprech && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                  {ansprech.fields.vorname} {ansprech.fields.nachname}
                  {sel.fields.beziehung_ansprechperson ? ` (${sel.fields.beziehung_ansprechperson})` : ''}
                  {phone && <a href={`tel:${phone.replace(/\s/g, '')}`} className="ml-1 inline-flex items-center gap-1 font-medium text-primary"><IconPhone size={14} />{phone}</a>}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 border-b px-2 pt-2">
            {([['heute', tx('Heute')], ['erledigt', tx('Erledigt')], ['info', tx('Info')]] as [Tab, string][]).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setTab(k)}
                className={`rounded-t-md px-4 py-2 text-sm font-medium ${tab === k ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-2 p-4">
            {tab === 'heute' && (
              <>
                {selVorschlaege.length > 0 && (
                  <a href={reviewLink} className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm font-medium text-primary">
                    <IconSparkles size={16} />{tx`Vorschläge prüfen (${selVorschlaege.length})`}
                  </a>
                )}
                {selHeute.length === 0
                  ? <p className="py-6 text-center text-sm text-muted-foreground">{tx('Keine offenen Aufgaben für heute.')}</p>
                  : selHeute.map(a => taskRow(a, true))}
                <button type="button" className="w-full rounded-md border border-dashed py-2 text-sm text-muted-foreground"
                  onClick={() => crud.aufgabe.openCreate({ betreute_person: sel.record_id, status: 'offen', herkunft: 'manuell', prioritaet: 'normal' })}>
                  + {appLabel('aufgabe')}
                </button>
              </>
            )}
            {tab === 'erledigt' && (selErledigt.length === 0
              ? <p className="py-6 text-center text-sm text-muted-foreground">{tx('Noch nichts erledigt.')}</p>
              : selErledigt.map(a => taskRow(a, false)))}
            {tab === 'info' && (
              <div className="space-y-3 text-sm">
                {sel.fields.zugangshinweise && <div><div className="font-medium">{tx('Zugangshinweise')}</div><p className="text-muted-foreground">{sel.fields.zugangshinweise}</p></div>}
                <div>
                  <div className="font-medium">{appLabel('diagnose')}</div>
                  {diagnosen.filter(d => extractRecordId(d.fields.betreute_person) === sel.record_id).map(d => (
                    <button key={d.record_id} type="button" className="block text-left text-muted-foreground hover:underline" onClick={() => crud.diagnose.openDetail(d)}>
                      {d.fields.bezeichnung}{d.fields.icd_code ? ` (${d.fields.icd_code})` : ''}
                    </button>
                  ))}
                </div>
                <div>
                  <div className="font-medium">{appLabel('medikationsplan')}</div>
                  {medis.filter(m => extractRecordId(m.fields.betreute_person) === sel.record_id).map(m => (
                    <button key={m.record_id} type="button" className="block text-left text-muted-foreground hover:underline" onClick={() => crud.medikationsplan.openDetail(m)}>
                      {m.fields.medikament} · {m.fields.dosierung} · {m.fields.rhythmus}
                    </button>
                  ))}
                </div>
                <div>
                  <div className="font-medium">{appLabel('betreuungszuordnung')}</div>
                  {zuordnungen.filter(z => extractRecordId(z.fields.betreute_person) === sel.record_id).map(z => (
                    <button key={z.record_id} type="button" className="block text-left text-muted-foreground hover:underline" onClick={() => crud.betreuungszuordnung.openDetail(z)}>
                      {z.fields.rolle?.label}: {z.betreuungspersonName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <h2 className="font-semibold">{tx('Meine Betreuten')}</h2>
            {crud.betreutePerson.canWrite && (
              <button type="button" className="rounded-md border px-3 py-1.5 text-sm" onClick={() => crud.betreutePerson.openCreate({ status: 'aktiv' })}>+ {appLabel('betreute_person')}</button>
            )}
          </div>
          {sortedMeine.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">{tx('Keine aktiven betreuten Personen.')}</p>
          ) : (
            <ul id="betreute-liste" className="divide-y">
              {sortedMeine.map(b => {
                const n = openCount(b.record_id);
                const lv = fmtDT(lastVisit.get(b.record_id));
                return (
                  <li key={b.record_id}>
                    <button type="button" onClick={() => selectPerson(b)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{b.fields.vorname} {b.fields.nachname}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {tx('Letzter Besuch')}: {lv ?? tx('noch keiner')}
                        </div>
                        {(b.fields.allergien || b.fields.wichtige_hinweise) && (
                          <div className="mt-1 flex flex-wrap gap-1 text-xs">
                            {b.fields.allergien && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive">{tx('Allergien')}: {b.fields.allergien}</span>}
                            {b.fields.wichtige_hinweise && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">{b.fields.wichtige_hinweise}</span>}
                          </div>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${n > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {n > 0 ? tx`${n} offen` : tx('alles erledigt')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-4">
          <h2 className="font-semibold">{appLabel('ereignisprotokoll')}</h2>
          <p className="text-xs text-muted-foreground">
            {sel ? tx`Nur lesbar — gefiltert auf ${sel.fields.vorname ?? ''} ${sel.fields.nachname ?? ''}` : tx('Nur lesbar — alle Vorgänge, neueste zuerst')}
          </p>
        </div>
        {logRows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{tx('Keine Einträge.')}</p>
        ) : (
          <ul className="divide-y">
            {logRows.map(p => (
              <li key={p.record_id}>
                <button type="button" onClick={() => crud.ereignisprotokoll.openDetail(p)} className="w-full p-3 text-left text-sm hover:bg-muted/50">
                  <div className="truncate font-medium">{p.fields.aktion} · {p.fields.objekttyp}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {fmtDT(p.fields.zeitstempel)} · {p.akteurName || p.fields.akteur_typ?.label}
                    {!sel && p.betreute_personName ? ` · ${p.betreute_personName}` : ''}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const aside = (
    <>
      <WorkList
        title={tx('KI-Vorschläge prüfen')}
        items={vorschlaege.map(a => {
          const urgent = lookupKey(a.fields.prioritaet) === 'dringend';
          const go = flowActionFor('aufgabe', 'status', a.record_id, 'offen');
          return {
            id: a.record_id,
            title: a.fields.titel ?? '',
            secondLine: (
              <>
                {urgent && <span className="font-medium text-destructive">{tx('Dringend')} · </span>}
                <span className="text-muted-foreground">{a.betreute_personName}</span>
              </>
            ),
            action: go ? { label: tx('Prüfen'), onClick: go } : undefined,
          };
        })}
        onItemClick={id => { const r = aufgaben.find(a => a.record_id === id); if (r) crud.aufgabe.openDetail(r); }}
        max={5}
        empty={{ text: tx('Keine Vorschläge offen — neue entstehen nach der nächsten Dokumentation.') }}
      />
      <WorkList
        title={tx('Qualifikationen laufen ab (60 Tage)')}
        items={ablaufend.map(q => {
          const abgelaufen = (q.fields.gueltig_bis ?? '').slice(0, 10) < today;
          const d = toDate(q.fields.gueltig_bis);
          return {
            id: q.record_id,
            title: `${q.personName} — ${q.qualifikationsartName}`,
            secondLine: (
              <span className={abgelaufen ? 'font-medium text-destructive' : 'text-muted-foreground'}>
                {abgelaufen ? tx('Abgelaufen') : tx('Läuft ab')} {d ? format(d, 'dd.MM.yyyy', loc) : ''}
              </span>
            ),
          };
        })}
        onItemClick={id => { const r = quali.find(q => q.record_id === id); if (r) crud.qualifikationEinerPerson.openDetail(r); }}
        max={5}
        empty={{ text: tx('Keine Qualifikation läuft in den nächsten 60 Tagen ab.') }}
      />
    </>
  );

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{ctx}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              if (first) selectPerson(first);
              else { setSelId(null); document.getElementById('betreute-liste')?.scrollIntoView({ behavior: 'smooth' }); }
            }}
            className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-6 text-xl font-semibold text-primary-foreground shadow-sm sm:w-auto sm:min-w-72"
          >
            <IconUsers size={28} />{appLabel('betreute_person')}
          </button>
          <div className="flex flex-col gap-1 text-sm sm:px-3">
            <button type="button" className="text-left text-primary underline" onClick={() => { setSelId(null); document.getElementById('betreute-liste')?.scrollIntoView({ behavior: 'smooth' }); }}>
              {tx('Alle meine Betreuten')}
            </button>
            <span className={ueberfaellig.length > 0 ? 'font-medium text-destructive' : 'text-muted-foreground'}>
              {ueberfaellig.length > 0 ? tx`${countOf('aufgabe', ueberfaellig.length, appLabel('aufgabe'))} überfällig` : tx('Nichts überfällig')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <IconLifebuoyOff size={18} className="shrink-0" />
          <span>{tx('Diese App ersetzt keinen Notruf. Im Notfall sofort 112 anrufen.')}</span>
        </div>
      </header>

      <DashboardGrid
        variant="split"
        hero={dringend.length > 0 ? (
          <HeroBanner
            icon={<IconAlertTriangle size={18} />}
            action={{ label: tx('Vorschlag prüfen'), onClick: () => { const go = flowActionFor('aufgabe', 'status', dringend[0].record_id, 'offen'); if (go) go(); else crud.aufgabe.openDetail(dringend[0]); } }}
          >
            <b>{namen(dringend.map(a => a.betreute_personName))}</b> — {tx`${countOf('aufgabe', dringend.length, appLabel('aufgabe'))} dringend zu prüfen`}: {dringend[0].fields.titel}
          </HeroBanner>
        ) : undefined}
        kpis={
          <StatStrip>
            <StatStripItem title={tx('Überfällig')} value={ueberfaellig.length} icon={<IconAlertTriangle size={16} />}
              tone={ueberfaellig.length > 0 ? 'warning' : 'default'}
              onClick={() => { setSelId(null); }} />
            <StatStripItem title={tx('Heute offen')} value={heuteOffen.length} icon={<IconClipboardCheck size={16} />} />
            <StatStripItem title={tx('Vorschläge')} value={vorschlaege.length} icon={<IconSparkles size={16} />} />
            <StatStripItem title={tx('Laufende Besuche')} value={laufend.length} icon={<IconClockPlay size={16} />} />
            <StatStripItem title={tx('Läuft ab ≤ 60 Tage')} value={ablaufend.length} icon={<IconCertificate size={16} />}
              tone={ablaufend.length > 0 ? 'warning' : 'default'} />
          </StatStrip>
        }
        aside={aside}
        primary={primary}
      />
      {crud.surfaces}
    </div>
  );
}
