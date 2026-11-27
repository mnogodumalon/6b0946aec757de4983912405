/**
 * widgets/PublicPageQr.tsx — the QR code and link of a public page about ONE record.
 *
 * @since 2026-11-04 (Abnahme 5: the beamer QR encoded a record's seeded link field)
 *
 *   <PublicPageQr entity="veranstaltungen" recordId={v.record_id} size="34vh" />
 *   const { link } = usePublicPageLink('veranstaltungen', v.record_id);
 *
 * The link is BUILT from the published page whose `link_param` names the entity
 * (public-pages.json — a kept or renamed slug cannot drift): `{origin}{path}
 * #/public/<slug>?<param>=<record id>`, the link the page admin's QR dialog
 * hands out. Never read it from a record's field (check-dashboard gate 27).
 */
import { useEffect, useMemo, useState } from 'react';
import { forgetPublicPagesConfig, loadPublicPagesConfig, type PublicPagesConfig } from '@/lib/publicClient';
import { tx } from '@/i18n';
import { doorOf, ensureDoors } from '@/lib/publicDoors';
import { openQrTab, QrCode, type QrCodeProps } from '@/components/widgets/QrCode';

let pagesPromise: Promise<PublicPagesConfig | null> | null = null;

/** The slugs of the PLAN's public pages (generated). A slug named here is a page the plan orders. */
const PLAN_SLUGS: readonly string[] = [];

/** The slug to look for. A bound component (widgets/JoinQr) names the PLAN's slug; a rebuild keeps
 *  the owner's live slug for a page (the shared links), so a named PLAN slug that is not published
 *  falls back to the ONE published page about the same entity whose slug is NOT a plan slug — the
 *  kept one. Never to another page of the plan: public-pages.json lists published pages only, so a
 *  plan page that is still a draft looks exactly like a renamed one (26.11.2026: the tile „QR-Code
 *  für die Abschlussbewertung“ carried the link of the published feedback page). */
export function slugFor(cfg: PublicPagesConfig, entity: string, page: string | undefined): string | undefined {
  if (page === undefined || cfg.pages?.[page] || !entity || !PLAN_SLUGS.includes(page)) return page;
  const kept = Object.entries(cfg.pages ?? {}).filter(([slug, p]) => p.link_param?.entity === entity && !PLAN_SLUGS.includes(slug));
  return kept.length === 1 ? kept[0][0] : page;
}

/** The join link for ONE record of `entity`: the published page whose link_param
 *  is that entity (or `page` when several are). null while loading, or when no
 *  such page is published yet. */
export function usePublicPageLink(entity: string, recordId: string | null | undefined, pageProp?: string): { link: string | null; loading: boolean; noDoor?: boolean } {
  const [cfg, setCfg] = useState<PublicPagesConfig | null | undefined>(undefined);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    pagesPromise ??= loadPublicPagesConfig().catch(() => null);
    void pagesPromise.then(c => { if (alive) setCfg(c); });
    return () => { alive = false; };
  }, [tick]);
  const plain = useMemo(() => {
    if (!cfg) return null;
    const page = slugFor(cfg, entity, pageProp);
    if (!recordId && !(page !== undefined && cfg.pages?.[page] && !cfg.pages[page].link_param)) return null;
    // EF-50: a page named by its slug that is about nobody in particular (no link_param) still
    // has ONE link — the bare page — so an edit link can be built for it too
    const hit = Object.entries(cfg.pages ?? {}).find(([slug, p]) =>
      (p.link_param?.entity === entity && (page === undefined || slug === page)) || (page !== undefined && slug === page && !p.link_param));
    if (!hit) return null;
    const [slug, p] = hit;
    const base = `${window.location.origin}${window.location.pathname}`;
    if (!p.link_param) return `${base}#/public/${slug}`;
    if (!recordId) return null;
    return `${base}#/public/${slug}?${encodeURIComponent(p.link_param!.name)}=${encodeURIComponent(recordId)}`;
  }, [cfg, entity, recordId, pageProp]);
  // EF-57: a page with a door per record is reached through the record's OWN link
  // (`&tor=<read>.<write>`) — the plain link opens nothing. The doors are looked up; a record
  // that has none yet (made on the platform) gets its pair here, once.
  const doorSlug = useMemo(() => {
    if (!cfg || !recordId) return null;
    const page = slugFor(cfg, entity, pageProp);
    const hit = Object.entries(cfg.pages ?? {}).find(([slug, p]) => p.link_param?.entity === entity && (page === undefined || slug === page));
    return hit && hit[1].door_per_record ? hit[0] : null;
  }, [cfg, entity, recordId, pageProp]);
  const [door, setDoor] = useState<{ key: string; link: string | null } | null>(null);
  const doorKey = doorSlug && recordId ? `${doorSlug}:${recordId}` : null;
  useEffect(() => {
    if (!doorSlug || !recordId || !doorKey) return;
    let alive = true;
    (async () => {
      try {
        const d = (await doorOf(doorSlug, recordId)) ?? (await ensureDoors(doorSlug, recordId));
        if (alive) setDoor({ key: doorKey, link: d?.link ?? null });
      } catch {
        if (alive) setDoor({ key: doorKey, link: null });
      }
    })();
    return () => { alive = false; };
  }, [doorSlug, recordId, doorKey, tick]);
  const doorState = doorKey && door?.key === doorKey ? door : null;
  const link = doorKey ? (doorState?.link ?? null) : plain;
  // a page published while the beamer is already open (Abnahme 7): look again every 30 s until it is there
  useEffect(() => {
    if (link || cfg === undefined) return;
    // both caches go: this hook's and publicClient's page-load cache (S-24: the second kept `{pages: {}}`)
    const t = window.setInterval(() => { pagesPromise = null; forgetPublicPagesConfig(); setTick(n => n + 1); }, 30_000);
    return () => window.clearInterval(t);
  }, [link, cfg]);
  return { link, loading: cfg === undefined || Boolean(doorKey && !doorState), noDoor: Boolean(doorKey && doorState && !doorState.link) };
}

export interface PublicPageQrProps extends Omit<QrCodeProps, 'value'> {
  /** The entity the public page is about (its link_param), e.g. 'veranstaltungen'. */
  entity: string;
  /** The record the link names. */
  recordId: string | null | undefined;
  /** The page's slug when several published pages name the same entity. */
  page?: string;
  /** The link as text under the symbol (default true — a phone that cannot scan still gets in). */
  showLink?: boolean;
  linkClassName?: string;
}

/** A QR code of the join link for one record — never of a record's own link field. */
export function PublicPageQr({ entity, recordId, page, showLink = true, linkClassName, ...qr }: PublicPageQrProps) {
  const { link, loading, noDoor } = usePublicPageLink(entity, recordId, page);
  if (loading) return null;
  if (!link) {
    return <p data-public-qr-missing className={`text-sm text-muted-foreground ${linkClassName ?? ''}`}>{noDoor ? tx('Der Link für diesen Eintrag ist gerade nicht verfügbar.') : tx('Die Teilnahmeseite ist noch nicht veröffentlicht.')}</p>;
  }
  return (
    <div className="flex flex-col items-center gap-3" data-public-qr data-public-link={link}>
      <button type="button" onClick={() => openQrTab(link)} title={tx('QR-Code in eigenem Tab öffnen')} aria-label={tx('QR-Code in eigenem Tab öffnen')} className="cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" data-public-qr-open="">
        <QrCode value={link} {...qr} />
      </button>
      {showLink ? <p className={`break-all text-center ${linkClassName ?? 'text-sm text-muted-foreground'}`}>{tx('Oder öffne:')} {link}</p> : null}
    </div>
  );
}
