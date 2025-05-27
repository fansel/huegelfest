import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { FormStep, CheckboxField } from './FormComponents';
import type { StepProps } from './types';

export function SoberDrivingStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <AlertTriangle className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Kannst du dir vorstellen einen Abend nüchtern zu bleiben und bei einem Notfall Auto zu fahren?</span>
      </div>
      <CheckboxField
        id="canStaySober"
        checked={form.canStaySober}
        onChange={(v: boolean) => setForm(f => ({ ...f, canStaySober: v }))}
        label="Ja, ich kann nüchtern bleiben"
        icon={<AlertTriangle className="inline-block w-5 h-5 text-[#ff9900]" />}
      />
    </FormStep>
  );
} 