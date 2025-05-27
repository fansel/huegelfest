import React from 'react';
import {WheatOff } from 'lucide-react';
import { FormStep, TextareaField } from './FormComponents';
import type { StepProps } from './types';
import { MAX_TEXTAREA } from './types';

export function AllergiesStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <WheatOff className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Hast du Allergien oder Unverträglichkeiten, die wir bei der Essensplanung berücksichtigen sollten?</span>
      </div>
      <TextareaField
        label="Allergien & Unverträglichkeiten"
        id="allergies"
        icon={<WheatOff className="inline-block w-5 h-5 text-[#ff9900]" />}
        value={form.allergies}
        onChange={v => setForm(f => ({ ...f, allergies: v }))}
        maxLength={MAX_TEXTAREA}
        placeholder="z.B. Nussallergie, Laktoseintoleranz..."
      />
    </FormStep>
  );
} 