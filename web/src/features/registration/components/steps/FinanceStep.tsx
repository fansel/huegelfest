import React from 'react';
import { Euro } from 'lucide-react';
import { FormStep } from './FormComponents';
import type { StepProps } from './types';

export function FinanceStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <Euro className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Informationen zur Finanzierung</span>
      </div>
      <div className="flex flex-col gap-4 w-full items-center">
        <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-4 py-3 text-[#460b6c] w-full flex flex-col gap-3 mx-auto text-sm">
          <p className="font-medium">
            Wir möchten, dass es allen möglich ist, auf das Hügelfest-Festival zu kommen, egal wie viel sie gerade im Geldbeutel haben.
          </p>
          <p>
            Um die entstehenden Kosten des Festivals zu decken bräuchten wir pro Person pro Tag <strong>11€</strong> (wie diese Rechnung entstanden ist kannst du in der Hochrechnung im Konzepte Tab unter Finanzen einsehen).
          </p>
          <p>
            Welchen Betrag auch immer du beisteuern möchtest, kannst du per Paypal/Überweisung oder vor Ort bezahlen. Uns ist wichtig zu betonen, dass die Hochrechnung nur eine Orientierungshilfe und keine Erwartungshaltung sein soll.
          </p>
        </div>
      </div>
    </FormStep>
  );
} 