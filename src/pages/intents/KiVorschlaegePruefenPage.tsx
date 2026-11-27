/**
 * KI-Vorschläge prüfen — 7-Schritt-Wizard, ein Vorschlag pro Durchlauf (kein „Alle aktivieren“).
 * Steps: 1) KI-Extrakt wählen → 2) Vorschlag mit Belegstelle ansehen → 3) Zuständigen wählen →
 *        4) Titel, Fälligkeit, Priorität anpassen → 5) Prüfer (aktiviert von) → 6) Prüfer (verworfen von) →
 *        7) Aktivieren oder Verwerfen & bestätigen.
 * Reads: ki_extrakt, aufgabe, person. Writes: aufgabe (Änderung über den Flow-Hook).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, fieldDate, refFilter } from '@/lib/journey';
import type { JourneyRecord } from '@/lib/journey';
import { useKiVorschlaegePruefenFlow } from '@/lib/journey/flows/KiVorschlaegePruefen';
import { tx } from '@/i18n';

const isActive = (r: JourneyRecord) => r.fields.aktiv === true;
const personItem = (r: JourneyRecord) => ({
  id: r.id,
  title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
  subtitle: fieldText(r, 'email'),
});

export default function KiVorschlaegePruefenPage() {
  const [step, setStep] = useState(1);
  const [lookupMissing, setLookupMissing] = useState(false);

  const flow = useKiVorschlaegePruefenFlow({
    steps: {
      ki_extrakt: 1, aufgabe: 2, zustaendig: 3,
      titel: 4, faelligkeitsart: 4, faelligkeitsdatum: 4, prioritaet: 4, verworfen_grund: 4,
      aktiviert_von: 5, verworfen_von: 6,
    },
    items: {
      ki_extrakt: r => ({
        id: r.id,
        title: fieldText(r, 'inhalt'),
        subtitle: `„${fieldText(r, 'belegstelle')}“`,
        status: fieldLookup(r, 'kategorie') ?? undefined,
      }),
      zustaendig: personItem,
      aktiviert_von: personItem,
      verworfen_von: personItem,
    },
    where: {
      ki_extrakt: r => fieldLookup(r, 'status')?.key === 'neu',
      zustaendig: isActive,
      aktiviert_von: isActive,
      verworfen_von: isActive,
    },
  });

  const extraktId = flow.pick('ki_extrakt').selectedId as string | undefined;
  const aufgabeId = flow.pick('aufgabe').selectedId as string | undefined;
  const extrakt = extraktId ? flow.picks.ki_extrakt.recordOf(extraktId) : undefined;

  // The suggestion belongs to exactly one task: find it from the picked extract.
  const pickExtrakt = async (id: string) => {
    flow.pick('ki_extrakt').onSelect(id);
    setLookupMissing(false);
    const hits = await flow.port.list('aufgabe', { filter: refFilter('quelle_ki_extrakt', id), limit: 5 });
    const task = hits.find(h => fieldLookup(h, 'status')?.key === 'vorschlag') ?? hits[0];
    if (task) {
      flow.pick('aufgabe').onSelect(task.id);
      setStep(2);
    } else {
      setLookupMissing(true);
    }
  };

  return (
    <IntentWizardShell
      title={tx('KI-Vorschläge prüfen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Jeder KI-Vorschlag wird von dir geprüft: aktivieren, anpassen oder verwerfen.'),
        needs: [tx('Den Vorschlag, den du prüfen willst'), tx('Deinen Namen als Prüfer')],
      }}
    >
      <WizardStep label={tx('Vorschlag')} description={tx('Welchen neuen KI-Vorschlag möchtest du prüfen?')}>
        <EntitySelectStep
          {...flow.picks.ki_extrakt.select}
          selectedId={extraktId}
          onSelect={id => { void pickExtrakt(id); }}
          searchPlaceholder={tx('Inhalt oder Belegstelle suchen …')}
          emptyText={tx('Es gibt keine neuen KI-Vorschläge zu prüfen.')}
        />
        {lookupMissing && (
          <p className="mt-3 text-sm text-destructive">{tx('Zu diesem KI-Extrakt gibt es keine Aufgabe.')}</p>
        )}
      </WizardStep>

      <WizardStep label={tx('Belegstelle')} description={tx('Prüfe, ob der Vorschlag zur Originalstelle passt.')}>
        {extraktId ? (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-4 space-y-2 overflow-hidden">
              <p className="text-xs text-muted-foreground">{fieldLookup(extrakt as JourneyRecord, 'kategorie')?.label}</p>
              <p className="font-medium break-words">{extrakt ? fieldText(extrakt, 'inhalt') : flow.picks.ki_extrakt.labelOf(extraktId)}</p>
              {extrakt && (
                <blockquote className="border-l-4 border-primary/40 pl-3 text-sm italic text-muted-foreground break-words">
                  „{fieldText(extrakt, 'belegstelle')}“
                </blockquote>
              )}
              {extrakt && fieldText(extrakt, 'zeitangabe_rohtext') && (
                <p className="text-sm">
                  {tx('Genannte Zeit:')} {fieldText(extrakt, 'zeitangabe_rohtext')}
                  {fieldDate(extrakt, 'zeitangabe_datum') ? ` (${fieldDate(extrakt, 'zeitangabe_datum')})` : ''}
                </p>
              )}
            </div>
            <StepNav
              onBack={() => setStep(1)}
              onNext={() => (aufgabeId ? true : tx('Zu diesem Vorschlag gibt es keine Aufgabe.'))}
              nextStepLabel={tx('Zuständiger')}
            />
          </div>
        ) : (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        )}
      </WizardStep>

      <WizardStep label={tx('Zuständig')} description={tx('Wer soll die Aufgabe übernehmen?')}>
        <EntitySelectStep
          {...flow.picks.zustaendig.select}
          {...flow.pick('zustaendig')}
          searchPlaceholder={tx('Name suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Anpassen')} description={tx('Titel, Fälligkeit und Priorität prüfen oder ändern.')}>
        <div className="space-y-4">
          <Bound form={flow.forms.aufgabe} name="titel" />
          <Bound form={flow.forms.aufgabe} name="faelligkeitsart" />
          <Bound form={flow.forms.aufgabe} name="faelligkeitsdatum" />
          <Bound form={flow.forms.aufgabe} name="prioritaet" />
          <Bound form={flow.forms.aufgabe} name="verworfen_grund" hint={tx('Nur nötig, wenn du den Vorschlag verwirfst')} />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfer')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfer')} description={tx('Wer aktiviert den Vorschlag?')}>
        <EntitySelectStep
          {...flow.picks.aktiviert_von.select}
          {...flow.pick('aktiviert_von')}
          searchPlaceholder={tx('Name suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Verwerfer')} description={tx('Wer würde den Vorschlag verwerfen?')}>
        <EntitySelectStep
          {...flow.picks.verworfen_von.select}
          {...flow.pick('verworfen_von')}
          searchPlaceholder={tx('Name suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            variants={flow.actions}
            whatHappensNext={tx('Beim Aktivieren wird der Vorschlag zur offenen Aufgabe, beim Verwerfen wird er als verworfen markiert.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          undo={flow.undo}
          next={[
            { label: tx('Nächsten Vorschlag prüfen'), onClick: () => { flow.reset(); setStep(1); } },
            { label: tx('Besuch starten und Aufgaben abhaken'), href: '#/intents/besuch-starten-und-aufgaben-abhaken' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
