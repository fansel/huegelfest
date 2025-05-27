import React from 'react';
import { Bed, Tent, Car as CarIcon } from 'lucide-react';
import { FormStep, RadioGroupField } from './FormComponents';
import type { StepProps } from './types';

export function SleepingStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <Bed className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Wie möchtest du übernachten?</span>
      </div>
      <RadioGroupField
        label="Schlafpräferenz"
        value={form.sleepingPreference}
        onChange={v => setForm(f => ({ ...f, sleepingPreference: v as "bed" | "tent" | "car" }))}
        options={[
          { value: "bed", label: "Bett", icon: <Bed className="inline-block w-5 h-5 text-[#ff9900]" /> },
          { value: "tent", label: "Zelt", icon: <Tent className="inline-block w-5 h-5 text-[#ff9900]" /> },
          { value: "car", label: "Auto", icon: <CarIcon className="inline-block w-5 h-5 text-[#ff9900]" /> },
        ]}
        id="sleepingPreference"
      />
    </FormStep>
  );
} 