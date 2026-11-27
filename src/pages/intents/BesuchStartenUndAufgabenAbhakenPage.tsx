/**
 * Besuch starten und Aufgaben abhaken — 7-Schritt-Wizard.
 * Steps: 1) Offene Aufgabe wählen → 2) Betreute Person → 3) Betreuungsperson → 4) Einstieg & Gerät →
 *        5) Erledigt (mit Ergebnis) oder Nicht durchgeführt (mit Grund) → 6) Erledigt von → 7) Prüfen & speichern.
 * Reads: aufgabe, betreute_person, person. Writes: besuch (create), aufgabe (update) — via useBesuchStartenUndAufgabenAbhakenFlow.
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useBesuchStartenUndAufgabenAbhakenFlow } from '@/lib/journey/flows/BesuchStartenUndAufgabenAbhaken';
import { tx } from '@/i18n';

export default function BesuchStartenUndAufgabenAbhakenPage() {
  const [step, setStep] = useState(1);

  const flow = useBesuchStartenUndAufgabenAbhakenFlow({
    steps: {
      aufgabe: 1,
      betreute_person: 2,
      betreuungsperson: 3,
      einstieg: 4,
      geraet: 4,
      status: 5,
      ergebnis: 5,
      ergebniskommentar: 5,
      nicht_durchgefuehrt_grund: 5,
      erledigt_von: 6,
    },
    items: {
      betreute_person: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: fieldText(r, 'wichtige_hinweise') || undefined,
      }),
      betreuungsperson: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
      }),
      erledigt_von: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
      }),
      aufgabe: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: fieldText(r, 'beschreibung') || undefined,
        status: fieldLookup(r, 'prioritaet') ?? undefined,
      }),
    },
    where: {
      betreuungsperson: r => r.fields.aktiv === true,
    },
  });

  return (
    <IntentWizardShell
      title={tx('Besuch starten')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Besuch beginnen und die heutigen Aufgaben abhaken.'),
        needs: [tx('Name der betreuten Person'), tx('Dein Name')],
      }}
    >
      <WizardStep label={tx('Aufgabe')} description={tx('Welche offene Aufgabe möchtest du jetzt abhaken?')}>
        <EntitySelectStep
          {...flow.picks.aufgabe.select}
          {...flow.pick('aufgabe')}
          emptyText={tx('Es gibt keine offenen Aufgaben.')}
          searchPlaceholder={tx('Aufgabe suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Betreute Person')} description={tx('Wen besuchst du jetzt?')} needs={['aufgabe']}>
        <EntitySelectStep
          {...flow.picks.betreute_person.select}
          {...flow.pick('betreute_person')}
          searchPlaceholder={tx('Name suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Betreuungsperson')} description={tx('Wer führt den Besuch durch?')}>
        <EntitySelectStep
          {...flow.picks.betreuungsperson.select}
          {...flow.pick('betreuungsperson')}
          avatar="initials"
          searchPlaceholder={tx('Name suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Besuchsbeginn')} description={tx('Wie hast du den Besuch geöffnet und mit welchem Gerät?')}>
        <div className="space-y-4">
          <Bound form={flow.forms.besuch} name="einstieg" />
          <Bound form={flow.forms.besuch} name="geraet" />
          <StepNav
            onBack={() => setStep(3)}
            onNext={() => flow.validateStep(4)}
            nextStepLabel={tx('Ergebnis')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Ergebnis')}
        description={tx('Erledigt mit Ergebnis — oder nicht durchgeführt mit kurzem Grund.')}
        needs={['aufgabe']}
      >
        <div className="space-y-4">
          <Bound form={flow.forms.aufgabe} name="status" />
          <Bound form={flow.forms.aufgabe} name="ergebnis" hint={tx('Nur bei „Erledigt“.')} />
          <Bound form={flow.forms.aufgabe} name="ergebniskommentar" rows={3} />
          <Bound
            form={flow.forms.aufgabe}
            name="nicht_durchgefuehrt_grund"
            hint={tx('Nur bei „Nicht durchgeführt“ — kurz begründen.')}
          />
          <StepNav
            onBack={() => setStep(4)}
            onNext={() => flow.validateStep(5)}
            nextStepLabel={tx('Erledigt von')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Erledigt von')} description={tx('Wer hat die Aufgabe bearbeitet?')} needs={['aufgabe']}>
        <EntitySelectStep
          {...flow.picks.erledigt_von.select}
          {...flow.pick('erledigt_von')}
          avatar="initials"
          searchPlaceholder={tx('Name suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'besuch_status', label: tx('Besuchsstatus'), value: tx('Laufend') }]}
            whatHappensNext={tx('Der Besuch beginnt jetzt, die Aufgabe wird mit Zeitstempel gespeichert.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          undo={flow.undo}
          whatHappensNext={tx('Weitere Aufgaben kannst du direkt mit „Noch einmal“ abhaken. Zum Schluss dokumentierst du den Besuch.')}
          next={[
            { label: tx('Dokumentation speichern'), href: '#/intents/dokumentation-speichern' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
