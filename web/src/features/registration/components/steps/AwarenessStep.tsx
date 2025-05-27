import React from 'react';
import { Shield } from 'lucide-react';
import { FormStep, CheckboxField } from './FormComponents';
import type { StepProps } from './types';

export function AwarenessStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <Shield className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Awareness-Konzept</span>
      </div>
      <div className="flex flex-col gap-4 w-full items-center">
        <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-4 py-3 text-[#460b6c] w-full flex flex-col gap-2 mx-auto text-sm">
          <p>
            Damit sich möglichst alle wohlfühlen, wird es auf dem Hügelfest ein Awarenesskonzept geben. Dafür brauchen wir Deine Hilfe: kannst Du Dir vorstellen nach einer Einführung eine Awareness-Schicht im Team zu übernehmen?
          </p>
        </div>
        <CheckboxField
          id="wantsAwareness"
          checked={form.wantsAwareness}
          onChange={(v: boolean) => setForm(f => ({ ...f, wantsAwareness: v }))}
          label="Ja, ich möchte beim Awareness-Team mitmachen"
          icon={<Shield className="inline-block w-5 h-5 text-[#ff9900]" />}
        />
      </div>
    </FormStep>
  );
} 