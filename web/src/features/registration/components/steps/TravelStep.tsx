import React from 'react';
import { Train, Car as CarIcon, Bike, HelpCircle } from 'lucide-react';
import { FormStep, RadioGroupField } from './FormComponents';
import type { StepProps } from './types';

export function TravelStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <Train className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Wie reist du an?</span>
      </div>
      <RadioGroupField
        label="Ich reise an mit:"
        value={form.travelType}
        onChange={v => setForm(f => ({ ...f, travelType: v as "zug" | "auto" | "fahrrad" | "andere" }))}
        options={[
          { value: "zug", label: "Zug", icon: <Train className="inline-block w-5 h-5 text-[#ff9900]" /> },
          { value: "auto", label: "Auto", icon: <CarIcon className="inline-block w-5 h-5 text-[#ff9900]" /> },
          { value: "fahrrad", label: "Fahrrad", icon: <Bike className="inline-block w-5 h-5 text-[#ff9900]" /> },
          { value: "andere", label: "Unklar", icon: <HelpCircle className="inline-block w-5 h-5 text-[#ff9900]" /> },
        ]}
        id="travelType"
      />
    </FormStep>
  );
} 