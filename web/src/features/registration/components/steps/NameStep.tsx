import React from 'react';
import { User } from 'lucide-react';
import { FormStep, InputField } from './FormComponents';
import type { StepProps } from './types';

export function NameStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <User className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Bitte gib deinen Namen ein.</span>
      </div>
      <InputField
        label="Name"
        id="name"
        value={form.name}
        onChange={v => setForm(f => ({ ...f, name: v }))}
        required
        autoFocus
      />
    </FormStep>
  );
} 