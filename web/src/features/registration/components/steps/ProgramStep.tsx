import React from 'react';
import { Lightbulb, HelpCircle, MessageCircle, X } from 'lucide-react';
import { FormStep, RadioGroupField, TextareaField } from './FormComponents';
import type { StepProps } from './types';
import { MAX_TEXTAREA } from './types';

export function ProgramStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <Lightbulb className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Kannst du dir vorstellen, einen Programmpunkt anzubieten oder mitzuwirken? (z.B. Workshop, Spielleitung, Aktivität etc.)</span>
      </div>
      <RadioGroupField
        label="Programmpunkt"
        value={form.programContribution}
        onChange={v => setForm(f => ({ ...f, programContribution: v }))}
        options={[
          { 
            value: "ja_mit_idee", 
            label: "Ja, ich habe schon eine konkrete Idee", 
            icon: <Lightbulb className="inline-block w-5 h-5 text-[#ff9900]" />,
            conditionalContent: (
              <TextareaField
                label="Deine Idee"
                id="programIdea"
                value={form.wantsToOfferWorkshop}
                onChange={v => setForm(f => ({ ...f, wantsToOfferWorkshop: v }))}
                maxLength={MAX_TEXTAREA}
                placeholder="Lass es uns hier gerne wissen..."
              />
            )
          },
          { value: "ja_ohne_idee", label: "Ja, aber ich habe noch keine konkrete Idee", icon: <HelpCircle className="inline-block w-5 h-5 text-[#ff9900]" /> },
          { value: "nein", label: "Nein", icon: <X className="inline-block w-5 h-5 text-[#ff9900]" /> },
        ]}
        id="programContribution"
      />
    </FormStep>
  );
} 