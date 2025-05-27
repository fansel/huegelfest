import React from 'react';
import { SwatchBook, ChevronRight } from 'lucide-react';
import { FormStep } from './FormComponents';
import type { StepProps } from './types';

export function IntroStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-semibold text-[#460b6c] text-center flex items-center gap-2">
          <SwatchBook className="inline-block w-8 h-8 text-[#ff9900]" />
          Festival-Anmeldung
        </h1>
        <p className="text-lg text-center text-[#460b6c]/80">
          Willkommen! Diese Anmeldung hilft uns, alles für das Festival zu organisieren und dir den bestmöglichen Aufenthalt zu bieten.
        </p>
        <div className="flex flex-col items-center gap-2 mt-4">
          <span className="text-sm text-[#460b6c]/70 text-center flex items-center gap-1">
            <ChevronRight className="inline-block w-4 h-4 text-[#ff9900]" />
            Nutze den Button rechts, um zu starten
          </span>
        </div>
      </div>
    </FormStep>
  );
} 