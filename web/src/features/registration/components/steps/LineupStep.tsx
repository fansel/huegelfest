import React from 'react';
import { Music, X } from 'lucide-react';
import { FormStep, RadioGroupField, TextareaField } from './FormComponents';
import type { StepProps } from './types';
import { MAX_TEXTAREA } from './types';

export function LineupStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <Music className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Kannst du dir vorstellen als Live Act auf dem Hügelfest aufzutreten und Teil des Lineups zu werden? (z.B. Gesangseinlage, Band, Tanz, DJ, Theater, Comedy, Flöten Vorspiel etc.)</span>
      </div>
      <RadioGroupField
        label="Line-Up Beitrag"
        value={form.wantsLineupContribution ? "ja" : "nein"}
        onChange={v => setForm(f => ({ 
          ...f, 
          wantsLineupContribution: v === "ja",
          lineupContribution: v === "ja" ? f.lineupContribution : ""
        }))}
        options={[
          { 
            value: "ja", 
            label: "Ja, ich will das Hügelfest begeistern", 
            icon: <Music className="inline-block w-5 h-5 text-[#ff9900]" />,
            conditionalContent: (
              <TextareaField
                label="Dein Beitrag"
                id="lineupDetails"
                value={form.lineupContribution}
                onChange={v => setForm(f => ({ ...f, lineupContribution: v }))}
                maxLength={MAX_TEXTAREA}
                placeholder="Beschreibe deinen Beitrag (z.B. Gesangseinlage, Band, Tanz, DJ, Theater, Comedy, Flöten Vorspiel etc.)..."
              />
            )
          },
          { value: "nein", label: "Nein", icon: <X className="inline-block w-5 h-5 text-[#ff9900]" /> },
        ]}
        id="lineupContribution"
      />
    </FormStep>
  );
} 