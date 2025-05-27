import React from 'react';
import { Wrench } from 'lucide-react';
import { FormStep, TextareaField } from './FormComponents';
import type { StepProps } from './types';
import { MAX_TEXTAREA } from './types';

export function EquipmentStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <Wrench className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Hast du Equipment, das du teilen möchtest?</span>
      </div>
      <TextareaField
        label="Equipment"
        id="equipment"
        icon={<Wrench className="inline-block w-5 h-5 text-[#ff9900]" />}
        value={form.equipment}
        onChange={v => setForm(f => ({ ...f, equipment: v }))}
        maxLength={MAX_TEXTAREA}
        placeholder="z.B. Musikanlage, Pavillon, Werkzeug ..."
      />
    </FormStep>
  );
} 