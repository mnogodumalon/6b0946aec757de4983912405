/**
 * Vertretung aktivieren — 3-Schritt-Wizard für die Pflegedienstleitung.
 * Steps: 1) Betreuungszuordnung der Hauptbetreuung wählen → 2) Ausfallzeitraum melden & Vertretung aktivieren → 3) Prüfen & speichern.
 * Reads: betreuungszuordnung (Pick inkl. betreute Person / Betreuungsperson). Writes: betreuungszuordnung (update: ausfall_von, ausfall_bis, manuell_aktiviert).
 * Composes: IntentWizardShell, EntitySelectStep, AvailabilityRangePicker, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldDate, fieldLookup } from '@/lib/journey';
import { useVertretungAktivierenFlow } from '@/lib/journey/flows/VertretungAktivieren';
import { tx } from '@/i18n';

export default function VertretungAktivierenPage() {
  const [step, setStep] = useState(1);
  const flow = useVertretungAktivierenFlow({
    steps: { betreuungszuordnung: 1, ausfall_von: 2, ausfall_bis: 2, manuell_aktiviert: 2 },
    initial: { manuell_aktiviert: true },
    items: {
      betreuungszuordnung: (r, ctx) => ({
        id: r.id,
        title: ctx.ref('betreute_person') ?? tx('Ohne betreute Person'),
        subtitle: ctx.ref('betreuungsperson') ?? undefined,
        status: fieldLookup(r, 'rolle') ?? undefined,
        stats: fieldDate(r, 'gueltig_ab') ? [{ label: tx('Gültig ab'), value: fieldDate(r, 'gueltig_ab') ?? '' }] : undefined,
      }),
    },
    where: {
      betreuungszuordnung: r => fieldLookup(r, 'rolle')?.key === 'hauptbetreuung',
    },
  });
  const form = flow.forms.betreuungszuordnung;

  return (
    <IntentWizardShell
      title={tx('Vertretung aktivieren')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Ausfall der Hauptbetreuung melden und die Vertretung aktivieren.'),
        needs: [tx('Die betroffene Zuordnung der Hauptbetreuung'), tx('Zeitraum des Ausfalls')],
      }}
    >
      <WizardStep label={tx('Hauptbetreuung')} description={tx('Welche Zuordnung der Hauptbetreuung fällt aus?')}>
        <EntitySelectStep
          {...flow.picks.betreuungszuordnung.select}
          {...flow.pick('betreuungszuordnung')}
          searchPlaceholder={tx('Betreute Person oder Betreuungsperson suchen …')}
          emptyText={tx('Keine Zuordnung der Hauptbetreuung gefunden.')}
        />
      </WizardStep>

      <WizardStep
        label={tx('Ausfallzeitraum')}
        description={tx('Von wann bis wann fällt die Hauptbetreuung aus? Danach die Vertretung aktivieren.')}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Bound form={form} name="ausfall_von" />
            <Bound form={form} name="ausfall_bis" />
          </div>
          <Bound form={form} name="manuell_aktiviert" />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Die Vertretung wird für den gemeldeten Zeitraum aktiviert. Du kannst die Aktivierung danach zurücknehmen.')}
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
            { label: tx('Betreuung zuordnen'), href: '#/intents/betreuung-zuordnen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
