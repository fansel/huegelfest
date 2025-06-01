import React from 'react';
import { ChefHat, X } from 'lucide-react';
import { FormStep, RadioGroupField } from './FormComponents';
import type { StepProps } from './types';

export function KitchenStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <ChefHat className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Hast du Lust im Vorhinein bei der Essensplanung mitzuwirken? Wir brauchen ca. 7 Personen :)</span>
      </div>
      <RadioGroupField
        label="Essensplanung"
        value={form.wantsKitchenHelp ? "ja" : "nein"}
        onChange={v => setForm(f => ({ ...f, wantsKitchenHelp: v === "ja" }))}
        options={[
          { value: "ja", label: "Ja", icon: <ChefHat className="inline-block w-5 h-5 text-[#ff9900]" /> },
          { value: "nein", label: "Nein", icon: <X className="inline-block w-5 h-5 text-[#ff9900]" />  },
        ]}
        id="wantsKitchenHelp"
      />
    </FormStep>
  );
} 