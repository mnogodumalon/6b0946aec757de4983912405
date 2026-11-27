/**
 * SubmissionEditLink — „Änderungslink kopieren“ for one submission (EF-50, Doodle K10).
 *
 * A visitor changes their own answer with a personal link; when the phone is gone, the
 * organiser copies that link HERE and hands it over. The link is the published page's link
 * (`usePublicPageLink` — the slug the plan names, the linked record when the page opens
 * per record) plus `&abgabe=<key>.<id>.<id>`: the submission's key field as the
 * authenticated REST delivers it (an ordinary field of the record) and the ids of every
 * record of that send. The key itself is never printed as text — only the link.
 *
 *   submissionsOf(antworten, { key: 'bearbeitungsschluessel', names: ['name'] }).map(s =>
 *     <SubmissionEditLink key={s.key} page="termin-abstimmen" entity="umfragen"
 *       recordId={extractRecordId(s.records[0]?.fields.umfrage)} keyValue={s.key}
 *       recordIds={s.records.map(r => r.record_id)} />)
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { tx } from '@/i18n';
import { isRecordKey, submissionLink } from '@/lib/journey';
import { usePublicPageLink } from '@/components/widgets/PublicPageQr';

export interface SubmissionEditLinkProps {
  /** The public page's slug (the plan's page with `edit_own`). */
  page: string;
  /** The entity the page is about (its `link_param` entity), or the created entity for a page without one. */
  entity: string;
  /** The linked record the submission belongs to — null for a page without `link_param`. */
  recordId: string | null | undefined;
  /** The submission's key field value (from the dashboard's records). */
  keyValue: string | null | undefined;
  /** Every record of the submission. */
  recordIds: Array<string | null | undefined>;
  label?: string;
  className?: string;
}

export function SubmissionEditLink({ page, entity, recordId, keyValue, recordIds, label, className }: SubmissionEditLinkProps) {
  const { link: pageLink } = usePublicPageLink(entity, recordId ?? null, page);
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState<string | null>(null);
  const ids = recordIds.filter((id): id is string => typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id));
  if (!pageLink || !isRecordKey(keyValue) || !ids.length) return null;
  const link = submissionLink(pageLink, keyValue, ids);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setManual(null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setManual(link);
    }
  };
  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className ?? ''}`} data-submission-edit-link="">
      <Button type="button" variant="outline" size="sm" onClick={() => { void copy(); }}>
        {copied ? tx('Link kopiert') : (label ?? tx('Änderungslink kopieren'))}
      </Button>
      {manual && (
        <input readOnly value={manual} aria-label={tx('Änderungslink')} onFocus={e => e.currentTarget.select()}
          className="w-64 rounded-md border border-input bg-background px-2 py-1 text-xs" />
      )}
    </span>
  );
}

export default SubmissionEditLink;
