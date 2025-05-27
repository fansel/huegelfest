import React from 'react';
import { MessageCircle } from 'lucide-react';
import { FormStep, TextareaField } from './FormComponents';
import type { StepProps } from './types';
import { MAX_TEXTAREA } from './types';

export function ConcernsStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <MessageCircle className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Gibt es etwas, das du uns mitteilen möchtest?</span>
      </div>
      <TextareaField
        label="Anliegen"
        id="concerns"
        icon={<MessageCircle className="inline-block w-5 h-5 text-[#ff9900]" />}
        value={form.concerns}
        onChange={v => setForm(f => ({ ...f, concerns: v }))}
        maxLength={MAX_TEXTAREA}
        placeholder="Dein Anliegen ..."
      />
    </FormStep>
  );
} 