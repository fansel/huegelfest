import React from 'react';
import { Stethoscope } from 'lucide-react';
import { FormStep, CheckboxField } from './FormComponents';
import type { StepProps } from './types';

export function MedicStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <Stethoscope className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Bist du Sanitäter:in?</span>
      </div>
      <CheckboxField
        id="isMedic"
        checked={form.isMedic}
        onChange={(v: boolean) => setForm(f => ({ ...f, isMedic: v }))}
        label="Ich bin Sanitäter:in"
        icon={<Stethoscope className="inline-block w-5 h-5 text-[#ff9900]" />}
      />
    </FormStep>
  );
} 