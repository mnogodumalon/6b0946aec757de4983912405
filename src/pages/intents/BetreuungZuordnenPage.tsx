/**
 * Betreuung zuordnen — 5-Schritt-Wizard + Prüfen.
 * Steps: 1) Betreute Person → 2) Betreuungsperson → 3) Rolle → 4) Vertretung für (nur Vertretung)
 *        → 5) Gültigkeit & Auftraggeber → 6) Ausfallzeitraum (nur Hauptbetreuung, optional)
 *        → Prüfen & anlegen.
 * Reads: betreute_person, person, betreuungszuordnung. Writes: betreuungszuordnung (via useBetreuungZuordnenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, ChoiceGroup (Bound), StepNav, SummaryStep, SuccessStep.
 */
import { useRef, useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, fieldRef } from '@/lib/journey';
import { useBetreuungZuordnenFlow } from '@/lib/journey/flows/BetreuungZuordnen';
import type { BetreuungZuordnenFlow } from '@/lib/journey/flows/BetreuungZuordnen';
import { tx } from '@/i18n';

const fullName = (r: Parameters<typeof fieldText>[0]) =>
  `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim();

export default function BetreuungZuordnenPage() {
  // The Hauptbetreuung pick depends on the person picked in step 1 — read through a ref
  // (the hook is created before `flow` exists); the form change re-renders the page.
  const [step, setStep] = useState(1);
  const flowRef = useRef<BetreuungZuordnenFlow | null>(null);
  const pickedPerson = flowRef.current?.forms.betreuungszuordnung.get('betreute_person') as string | undefined;

  const flow = useBetreuungZuordnenFlow({
    steps: {
      betreute_person: 1,
      betreuungsperson: 2,
      rolle: 3,
      vertretung_fuer: 4,
      gueltig_ab: 5,
      gueltig_bis: 5,
      beauftragt_durch: 5,
      beauftragt_durch_organisation: 5,
      bemerkung: 5,
      ausfall_von: 6,
      ausfall_bis: 6,
    },
    items: {
      betreute_person: r => ({ id: r.id, title: fullName(r), subtitle: fieldLookup(r, 'status')?.label ?? '' }),
      betreuungsperson: (r, ctx) => ({ id: r.id, title: fullName(r), subtitle: ctx.ref('personentyp') ?? '' }),
      beauftragt_durch: (r, ctx) => ({ id: r.id, title: fullName(r), subtitle: ctx.ref('personentyp') ?? '' }),
      vertretung_fuer: (r, ctx) => ({
        id: r.id,
        title: ctx.ref('betreuungsperson') ?? tx('Hauptbetreuung'),
        subtitle: fieldText(r, 'gueltig_ab'),
      }),
    },
    where: {
      vertretung_fuer: r =>
        fieldLookup(r, 'rolle')?.key === 'hauptbetreuung' &&
        (!pickedPerson || fieldRef(r, 'betreute_person') === pickedPerson),
    },
  });
  flowRef.current = flow;

  const f = flow.forms.betreuungszuordnung;
  const rolle = f.get('rolle') as string | undefined;
  const isVertretung = rolle === 'vertretung';
  const isHaupt = rolle === 'hauptbetreuung';

  return (
    <IntentWizardShell
      title={tx('Betreuung zuordnen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Ordne einer betreuten Person eine Hauptbetreuung oder Vertretung zu.'),
        needs: [tx('Betreute Person'), tx('Betreuungsperson mit passender Qualifikation'), tx('Gültigkeitszeitraum')],
      }}
    >
      <WizardStep label={tx('Betreute Person')} description={tx('Für wen soll die Betreuung zugeordnet werden?')}>
        <EntitySelectStep
          {...flow.picks.betreute_person.select}
          {...flow.pick('betreute_person')}
          searchPlaceholder={tx('Name suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Betreuungsperson')} description={tx('Wer übernimmt die Betreuung? Die Person muss betreuen dürfen und alle erforderlichen Qualifikationen haben.')} needs={['betreute_person']}>
        <EntitySelectStep
          {...flow.picks.betreuungsperson.select}
          {...flow.pick('betreuungsperson')}
          searchPlaceholder={tx('Name suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Rolle')} description={tx('Soll die Person die Hauptbetreuung oder eine Vertretung sein?')} needs={['betreute_person', 'betreuungsperson']}>
        <div className="space-y-4">
          <Bound form={f} name="rolle" />
          <StepNav onNext={() => flow.validateStep(3)} nextStepLabel={tx('Gültigkeit')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Vertretung für')} description={tx('Nur bei einer Vertretung: welche Hauptbetreuung wird vertreten? Bei einer Hauptbetreuung einfach weiter.')} needs={['rolle']}>
        <div className="space-y-4">
          <Field form={f} name="vertretung_fuer">
            <EntitySelectStep
              {...flow.picks.vertretung_fuer.select}
              {...flow.pick('vertretung_fuer')}
              create={false}
              emptyText={tx('Für diese betreute Person gibt es keine Hauptbetreuung, die vertreten werden kann.')}
            />
          </Field>
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Gültigkeit')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Gültigkeit')} description={tx('Zeitraum und Auftraggeber der Zuordnung.')} needs={['rolle']}>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Bound form={f} name="gueltig_ab" />
            <Bound form={f} name="gueltig_bis" hint={tx('Leer lassen für unbefristet')} />
          </div>
          <Field form={f} name="beauftragt_durch">
            <EntitySelectStep
              {...flow.picks.beauftragt_durch.select}
              {...flow.pick('beauftragt_durch')}
              searchPlaceholder={tx('Name suchen …')}
              create={false}
            />
          </Field>
          <Bound form={f} name="beauftragt_durch_organisation" />
          <Bound form={f} name="bemerkung" rows={3} />
          <StepNav
            onBack={() => setStep(4)}
            onNext={() => flow.validateStep(5)}
            nextStepLabel={isHaupt ? tx('Ausfallzeitraum') : tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Ausfallzeitraum')}
        enabledIf={isHaupt}
        description={tx('Optional: Wann fällt die Hauptbetreuung voraussichtlich aus?')}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Bound form={f} name="ausfall_von" />
            <Bound form={f} name="ausfall_bis" />
          </div>
          <StepNav onNext={() => flow.validateStep(6)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Die Zuordnung wird angelegt. Überschneidungen und fehlende Qualifikationen werden vorher geprüft.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Vertretung aktivieren'), href: '#/intents/vertretung-aktivieren' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Die Zuordnung gilt ab dem gewählten Datum.')}
        />
      )}
    </IntentWizardShell>
  );
}
