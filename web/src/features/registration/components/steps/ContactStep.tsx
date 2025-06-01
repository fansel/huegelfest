import React from 'react';
import { Phone, MessageCircle, XCircle } from 'lucide-react';
import { FormStep, RadioGroupField, InputField } from './FormComponents';
import type { StepProps } from './types';

export function ContactStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <Phone className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">
          Wie können wir dich am besten erreichen? Wähle eine Option aus.
        </span>
      </div>

      <RadioGroupField
        label="Kontaktmöglichkeit"
        id="contactType"
        value={form.contactType}
        onChange={(v: string) => {
          setForm(f => ({ 
            ...f, 
            contactType: v as "phone" | "telegram" | "none",
            contactInfo: "" // Reset contact info when type changes
          }));
        }}
        options={[
          {
            value: "phone",
            label: "Telefonnummer",
            icon: <Phone size={20} />,
            conditionalContent: form.contactType === "phone" && (
              <InputField
                label="Deine Telefonnummer"
                id="phoneNumber"
                value={form.contactInfo}
                onChange={v => setForm(f => ({ ...f, contactInfo: v }))}
                type="tel"
                required
              />
            )
          },
          {
            value: "telegram",
            label: "Telegram",
            icon: <MessageCircle size={20} />,
            conditionalContent: form.contactType === "telegram" && (
              <InputField
                label="Dein Telegram Handle"
                id="telegramHandle"
                value={form.contactInfo}
                onChange={v => setForm(f => ({ ...f, contactInfo: v }))}
                required
              />
            )
          },
          {
            value: "none",
            label: "Keine Angabe",
            icon: <XCircle size={20} />
          }
        ]}
      />
    </FormStep>
  );
} 