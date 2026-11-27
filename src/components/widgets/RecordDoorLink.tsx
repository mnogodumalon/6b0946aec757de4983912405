/**
 * RecordDoorLink — a parent record's OWN link („Tor je Datensatz“, EF-51/EF-56).
 *
 * The record's link carries its pair of doors (`?<param>=<id>&tor=<read>.<write>`): a visitor
 * sees this record alone, and closing the record switches the sending off. The doors are made
 * by the Klar backend and FOUND by it in the owner's list of grants — no field of the record
 * holds them. The card shows:
 *   - „Link kopieren“ + QR when the pair is there;
 *   - „Link anlegen“ when it is missing (a record made on the platform, a failed first try);
 *   - „Link sperren und neu vergeben“ behind a second click (a leaked link: the old one dies);
 *   - the reason and „Erneut versuchen“ when the links cannot be read — never „Link fehlt“
 *     for an outage, never a link built from the id alone.
 *
 *   <RecordDoorLink page="termin-abstimmen" recordId={r.record_id} />
 */
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { t, tx } from '@/i18n';
import { DOOR_PARENTS } from '@/config/plan';
import { closedFor, doorOf, DoorsError, ensureDoors, setDoorEnabled } from '@/lib/publicDoors';
import { servicePort } from '@/services/journeyPort';
import { Sentry } from '@/lib/sentry';
import { getAppMapCached } from '@/lib/appMap';
import { openQrTab, QrCode } from '@/components/widgets/QrCode';

export interface RecordDoorLinkProps {
  page: string;
  recordId: string | null | undefined;
  /** Not read any more (0.0.560–0.0.562 took the door ids from two fields of the record). */
  fields?: Record<string, unknown> | null;
  /** Show the QR symbol next to the link (a card: no; a detail overlay: yes). */
  qr?: boolean;
  className?: string;
  /** Called with the new link after „anlegen“ or „neu vergeben“. */
  onChanged?: (link: string | null) => void;
}

type Phase = 'loading' | 'ready' | 'missing' | 'unreadable' | 'pending' | 'off';

/** The owner reads one plain sentence; the server's text goes to the console and to Sentry. */
function report(what: string, page: string, e: unknown): void {
  console.error(`[doors] ${what}`, e);
  try {
    Sentry.captureMessage(`doors: ${what}`, { level: 'warning', tags: { page }, extra: { detail: e instanceof Error ? e.message : String(e), status: e instanceof DoorsError ? e.status : null } });
  } catch { /* Sentry is optional */ }
}

export function RecordDoorLink({ page, recordId, qr = false, className, onChanged }: RecordDoorLinkProps) {
  const spec = DOOR_PARENTS[page];
  const [link, setLink] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  // EF-62: the plan's page was not made by the build — „being set up“ would never end
  const [notBuilt, setNotBuilt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [twice, setTwice] = useState(false);
  // EF-58: the record is open but its write door is off (the status was changed on the
  // platform, or a reopen did not reach the door) — said on the card, with the way out
  const [sendOff, setSendOff] = useState(false);
  const load = useCallback(async (fresh: boolean) => {
    if (!spec || !recordId) return;
    setPhase('loading');
    try {
      const d = await doorOf(page, recordId, { fresh });
      setLink(d?.link ?? null);
      setTwice(Boolean(d?.ambiguous));
      setProblem(d?.ambiguous ? (d.problem ?? null) : null);
      setPhase(d?.link || d?.ambiguous ? 'ready' : 'missing');
      setSendOff(false);
      if (d?.link && d.enabled === false) {
        try {
          const rec = await servicePort.get(spec.entity as never, recordId);
          setSendOff(rec ? closedFor(page, rec.fields as Record<string, unknown>) === false : false);
        } catch { /* the record is not readable: nothing to compare */ }
      }
    } catch (e) {
      setLink(null);
      setProblem(null);
      // 404: the public page is still being built — „being set up“, not an error;
      // 409: the owner switched the links off (or the page cannot have them): nothing to show
      if (e instanceof DoorsError && e.status === 404) {
        setPhase('pending');
        getAppMapCached()
          .then(s => setNotBuilt(Boolean(s.map?.lines.some(l => l.id === `page:${page}:failed`))))
          .catch(() => { /* no map: the neutral sentence stays */ });
        return;
      }
      if (e instanceof DoorsError && e.status === 409) { setPhase('off'); return; }
      report('links unreadable', page, e);
      setPhase('unreadable');
    }
  }, [page, recordId, spec]);
  useEffect(() => { void load(false); }, [load]);
  if (!spec || !recordId) return null;
  const make = async (renew: boolean) => {
    setBusy(true);
    setProblem(null);
    try {
      const d = await ensureDoors(page, recordId, { renew });
      setLink(d.link ?? null);
      setTwice(false);
      setPhase(d.link ? 'ready' : 'missing');
      setArmed(false);
      onChanged?.(d.link ?? null);
    } catch (e) {
      // a 409 carries a sentence for the owner (two doors, the way out); anything else is technique
      if (e instanceof DoorsError && e.status === 409) setProblem(e.message);
      else { report('link not made', page, e); setProblem(t('door_failed_later')); }
    } finally {
      setBusy(false);
    }
  };
  const sendOn = async () => {
    setBusy(true);
    try {
      await setDoorEnabled(page, recordId, true);
      setSendOff(false);
    } catch (e) {
      report('sending not switched on', page, e);
      setProblem(t('door_failed_later'));
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setProblem(t('door_copy_manual'));
    }
  };
  if (phase === 'loading') {
    return <div className={`text-xs text-muted-foreground ${className ?? ''}`} data-record-door="loading">{t('door_loading')}</div>;
  }
  if (phase === 'off') return null;
  if (phase === 'pending') {
    if (notBuilt) {
      return (
        <div className={`text-xs text-muted-foreground ${className ?? ''}`} data-record-door="not-built">
          {t('door_page_missing')}{' '}
          <a href={`#/verwaltung/anwendung?line=${encodeURIComponent(`page:${page}:failed`)}`} className="font-semibold text-primary hover:underline">{t('door_page_missing_link')}</a>
        </div>
      );
    }
    return <div className={`text-xs text-muted-foreground ${className ?? ''}`} data-record-door="pending">{t('door_pending')}</div>;
  }
  if (phase === 'unreadable') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`} data-record-door="unreadable">
        <p role="alert" className="text-xs text-destructive">{t('door_unreadable')}</p>
        <Button type="button" variant="outline" size="sm" className="max-sm:min-h-11" onClick={() => { void load(true); }}>{t('door_retry')}</Button>
      </div>
    );
  }
  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`} data-record-door={link ? 'ready' : twice ? 'ambiguous' : 'missing'}>
      {phase === 'ready' ? (
        <>
          {qr && link && (
            <button type="button" onClick={() => openQrTab(link)} title={t('door_qr_open')} aria-label={t('door_qr_open')} className="w-fit cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" data-record-door-qr="">
              <QrCode value={link} size={160} title={tx('QR-Code zum Mitmachen')} />
            </button>
          )}
          <div className="flex flex-wrap gap-2">
            {link && <Button type="button" variant="outline" size="sm" className="max-sm:min-h-11" onClick={() => { void copy(); }}>{copied ? t('door_copied') : t('door_copy')}</Button>}
            {link && <Button type="button" variant="outline" size="sm" className="max-sm:min-h-11" onClick={() => openQrTab(link)} data-record-door-qr-open="">{t('door_qr_open')}</Button>}
            <Button type="button" variant="ghost" size="sm" className="max-sm:min-h-11" disabled={busy} onClick={() => (armed ? void make(true) : setArmed(true))}>
              {armed ? t('door_renew_confirm') : t('door_renew')}
            </Button>
            {armed && <Button type="button" variant="ghost" size="sm" className="max-sm:min-h-11" onClick={() => setArmed(false)}>{t('door_renew_cancel')}</Button>}
          </div>
          {sendOff && (
            <div className="flex flex-wrap items-center gap-2" data-record-door-send="off">
              <p role="alert" className="text-xs text-destructive">{t('door_send_off')}</p>
              <Button type="button" variant="outline" size="sm" className="max-sm:min-h-11" disabled={busy} onClick={() => { void sendOn(); }}>{t('door_send_on')}</Button>
            </div>
          )}
          {problem && <p role={twice ? 'alert' : 'status'} className={twice ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>{problem}</p>}
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('door_missing')}</span>
          <Button type="button" variant="outline" size="sm" className="max-sm:min-h-11" disabled={busy} onClick={() => { void make(false); }}>{busy ? t('door_making') : t('door_make')}</Button>
          {problem && <p role="alert" className="text-xs text-destructive">{problem}</p>}
        </div>
      )}
    </div>
  );
}

export default RecordDoorLink;
