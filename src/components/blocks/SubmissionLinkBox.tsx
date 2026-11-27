/**
 * SubmissionLinkBox — „Später ändern? Dein persönlicher Link“ (EF-50, Doodle K10).
 *
 * Shown under the thank-you text of a public page whose plan says `edit_own`: the link
 * carries the submission's secret key and its record ids (`own.link` from
 * `useOwnSubmission`), so the same person can change or withdraw their answer from
 * another device. The copy button never fails silently (EF-28): without clipboard
 * access the link is selected and the person is told to copy it. No mail is sent.
 *
 *   <SubmissionLinkBox link={own.link} />
 */
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';

export interface SubmissionLinkBoxProps {
  /** The personal link; nothing renders without one. */
  link: string | null | undefined;
  title?: string;
  hint?: string;
  className?: string;
}

export function SubmissionLinkBox({ link, title, hint, className }: SubmissionLinkBoxProps) {
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  if (!link) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setManual(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      input.current?.focus();
      input.current?.select();
      setManual(true);
    }
  };
  return (
    <section className={`mt-4 rounded-lg border border-border bg-muted/30 p-3 ${className ?? ''}`} data-journey-own-link="">
      <p className="text-sm font-medium">{title ?? t('slb_title')}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint ?? t('slb_hint')}</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input ref={input} readOnly value={link} aria-label={t('slb_title')} onFocus={e => e.currentTarget.select()}
          className="min-h-11 w-full flex-1 rounded-md border border-input bg-background px-3 text-sm" />
        <Button type="button" variant="outline" className="min-h-11" onClick={() => { void copy(); }} data-journey-own-link-copy="">
          {copied ? t('slb_copied') : t('slb_copy')}
        </Button>
      </div>
      {manual && <p role="status" className="mt-1 text-xs text-muted-foreground">{t('slb_copy_manual')}</p>}
    </section>
  );
}

export default SubmissionLinkBox;
