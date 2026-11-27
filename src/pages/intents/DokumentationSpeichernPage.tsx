/**
 * Dokumentation speichern — 9-Schritt-Wizard.
 * Steps: 1) Laufenden Besuch wählen → 2) Betreute Person → 3) Autor → 4) Ergänzung zu (optional)
 *        → 5) Text & Eingabeart → 6) Anhänge (optional) → 7) Hinweis bestätigen → 8) Prüfen & speichern.
 * Reads: besuch, betreute_person, person, dokumentation. Writes: dokumentation, anhang_zur_dokumentation (je Eintrag),
 * besuch (ende, status) — alles über useDokumentationSpeichernFlow.
 * Composes: IntentWizardShell, EntitySelectStep, Bound, ListEntries, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IntentWizardShell,WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { ListEntries } from '@/components/blocks/ListEntries';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, fieldDate } from '@/lib/journey';
import { useDokumentationSpeichernFlow } from '@/lib/journey/flows/DokumentationSpeichern';
import { tx } from '@/i18n';

const personName = (r: { fields: Record<string, unknown> }) =>
  `${fieldText(r as never, 'vorname')} ${fieldText(r as never, 'nachname')}`.trim();

export default function DokumentationSpeichernPage() {
  const [step, setStep] = useState(1);

  const flow = useDokumentationSpeichernFlow({
    steps: {
      besuch: 1, betreute_person: 2, autor: 3, ergaenzung_zu: 4,
      text: 5, eingabeart: 5,
      aufgenommen_von: 6, datei: 6, typ: 6, beschriftung: 6,
    },
    items: {
      besuch: (r, ctx) => ({
        id: r.id,
        title: ctx.ref('betreute_person') ?? tx('Besuch'),
        subtitle: `${ctx.ref('betreuungsperson') ?? ''} ${fieldDate(r, 'beginn') ?? ''}`.trim(),
      }),
      betreute_person: r => ({ id: r.id, title: personName(r), subtitle: fieldText(r, 'einrichtung') }),
      autor: r => ({ id: r.id, title: personName(r), subtitle: fieldText(r, 'email') }),
      aufgenommen_von: r => ({ id: r.id, title: personName(r), subtitle: fieldText(r, 'email') }),
      ergaenzung_zu: r => ({ id: r.id, title: fieldText(r, 'text').slice(0, 80) || tx('Dokumentation') }),
    },
    where: {
      betreute_person: r => fieldLookup(r, 'status')?.key === 'aktiv',
      autor: r => r.fields.aktiv === true,
      ergaenzung_zu: r => fieldLookup(r, 'ki_analysestatus')?.key !== 'fehlgeschlagen',
    },
  });

  return (
    <IntentWizardShell
      title={tx('Dokumentation speichern')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Text zum Besuch festhalten, Anhänge ergänzen und den Besuch beenden.'),
        needs: [tx('Der laufende Besuch'), tx('Diktierter oder getippter Text'), tx('Optional: Foto oder Datei')],
      }}
    >
      <WizardStep label={tx('Besuch')} description={tx('Welcher laufende Besuch wird dokumentiert?')}>
        <EntitySelectStep {...flow.picks.besuch.select} {...flow.pick('besuch')} searchPlaceholder={tx('Besuch suchen …')} />
      </WizardStep>

      <WizardStep label={tx('Betreute Person')} description={tx('Wen hast du besucht?')} needs={['besuch']}>
        <EntitySelectStep {...flow.picks.betreute_person.select} {...flow.pick('betreute_person')} avatar="initials" searchPlaceholder={tx('Name suchen …')} />
      </WizardStep>

      <WizardStep label={tx('Autor')} description={tx('Wer schreibt diese Dokumentation?')}>
        <EntitySelectStep {...flow.picks.autor.select} {...flow.pick('autor')} avatar="initials" searchPlaceholder={tx('Name suchen …')} />
      </WizardStep>

      <WizardStep label={tx('Ergänzung')} description={tx('Ergänzt du eine frühere Dokumentation? Sonst einfach weiter.')}>
        <EntitySelectStep {...flow.picks.ergaenzung_zu.select} {...flow.pick('ergaenzung_zu')} searchPlaceholder={tx('Text suchen …')} />
        <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Text')} />
      </WizardStep>

      <WizardStep label={tx('Text')} description={tx('Diktiere oder tippe, was beim Besuch wichtig war.')}>
        <div className="space-y-4">
          <Bound form={flow.forms.dokumentation} name="text" rows={8} />
          <Bound form={flow.forms.dokumentation} name="eingabeart" />
          <StepNav onBack={() => setStep(4)} onNext={() => flow.validateStep(5)} nextStepLabel={tx('Anhänge')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Anhänge')} description={tx('Optional: Fotos oder Dokumente hinzufügen.')}>
        <div className="space-y-4">
          <ListEntries list={flow.lists.anhang_zur_dokumentation}>
            <Field form={flow.forms.anhang_zur_dokumentation} name="aufgenommen_von">
              <EntitySelectStep {...flow.picks.aufgenommen_von.select} {...flow.pick('aufgenommen_von')} avatar="initials" />
            </Field>
            <Bound form={flow.forms.anhang_zur_dokumentation} name="datei" />
            <Bound form={flow.forms.anhang_zur_dokumentation} name="typ" />
            <Bound form={flow.forms.anhang_zur_dokumentation} name="beschriftung" />
          </ListEntries>
          <StepNav onBack={() => setStep(5)} onNext={() => flow.validateStep(6)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')} description={tx('Alles richtig? Dann speichern und Besuch beenden.')}>
        {!flow.submit.done && (
          <div className="space-y-4">
          <Alert>
            <IconAlertTriangle size={18} className="shrink-0" />
            <AlertTitle>{tx('Bitte Text prüfen, besonders Medikamente und Zahlen')}</AlertTitle>
            <AlertDescription>{tx('Mit dem Speichern bestätigst du, dass du den Text geprüft hast.')}</AlertDescription>
          </Alert>
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'besuch_status', label: tx('Besuchsstatus'), value: tx('Abgeschlossen') }]}
            whatHappensNext={tx('Die Dokumentation wird gespeichert und der Besuch beendet.')}
          />
          </div>
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('KI-Vorschläge prüfen'), href: '#/intents/ki-vorschlaege-pruefen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Die KI analysiert den Text; Vorschläge findest du unter „KI-Vorschläge prüfen“.')}
        />
      )}
    </IntentWizardShell>
  );
}
