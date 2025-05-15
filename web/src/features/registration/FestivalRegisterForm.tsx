"use client";
import React, { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { toast } from "react-hot-toast";
import { Bed, Tent, Car as CarIcon, Stethoscope, Hammer, Wrench, MessageCircle, Music, ChevronLeft, ChevronRight, MoreHorizontal, User, Euro } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/shared/components/ui/popover';
import { registerFestival } from './actions/register';

// Festivaldaten
const FESTIVAL_DAYS = [
  "31.07.",
  "01.08.",
  "02.08.",
  "03.08."
];

export interface FestivalRegisterData {
  name: string;
  days: number[]; // Indizes der gewählten Tage
  priceOption: "full" | "reduced" | "free";
  isMedic: boolean;
  hasCar: boolean;
  equipment: string;
  concerns: string;
  wantsToContribute: boolean;
  wantsToOfferWorkshop: string;
  sleepingPreference: "bed" | "tent" | "car";
}

const defaultData: FestivalRegisterData = {
  name: "",
  days: [0, 1, 2, 3],
  priceOption: "full",
  isMedic: false,
  hasCar: false,
  equipment: "",
  concerns: "",
  wantsToContribute: false,
  wantsToOfferWorkshop: "",
  sleepingPreference: "tent",
};

// --- Lokale UI-Komponenten ---

// Minimaler Range-Slider für Bereichsauswahl (Instagram-Style)
interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
}
function RangeSlider({ min, max, value, onChange }: RangeSliderProps) {
  // Zwei Daumen: links und rechts
  return (
    <div className="relative w-full flex items-center h-8">
      <input
        type="range"
        min={min}
        max={max}
        value={value[0]}
        onChange={e => {
          const v = Math.min(Number(e.target.value), value[1] - 1);
          onChange([v, value[1]]);
        }}
        className="absolute w-full pointer-events-auto accent-[#ff9900]"
        style={{ zIndex: 2 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={value[1]}
        onChange={e => {
          const v = Math.max(Number(e.target.value), value[0] + 1);
          onChange([value[0], v]);
        }}
        className="absolute w-full pointer-events-auto accent-[#ff9900]"
        style={{ zIndex: 1 }}
      />
      <div className="absolute left-0 right-0 h-2 bg-gray-200 rounded-full" style={{ zIndex: 0 }} />
      <div
        className="absolute h-2 bg-[#ff9900] rounded-full"
        style={{ left: `${(value[0] / (max - min)) * 100}%`, right: `${100 - (value[1] / (max - min)) * 100}%`, zIndex: 1 }}
      />
    </div>
  );
}

// Minimalistische Checkbox
interface MyCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
}
function MyCheckbox({ checked, onChange, label }: MyCheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="accent-[#ff9900] w-5 h-5 rounded border-gray-300"
      />
      <span>{label}</span>
    </label>
  );
}

// Minimalistische RadioGroup
interface MyRadioGroupProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
}
function MyRadioGroup<T extends string>({ value, onChange, options }: MyRadioGroupProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(opt => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="radio"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="accent-[#ff9900] w-5 h-5"
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

// --- Formular-UI ---

export interface FestivalRegisterFormProps {
  onRegister?: (data: FestivalRegisterData) => void;
}

export default function FestivalRegisterForm({ onRegister }: FestivalRegisterFormProps) {
  const [form, setForm] = useState<FestivalRegisterData>(defaultData);
  const [loading, setLoading] = useState(false);
  // Multi-Step State
  const [step, setStep] = useState(0);
  // Zeitraum-Stepper
  const [fromDay, setFromDay] = useState(0);
  const [toDay, setToDay] = useState(FESTIVAL_DAYS.length - 1);

  // Steps-Definition
  const steps = [
    {
      label: 'Name',
      content: (
        <div className="flex flex-col gap-4">
          <label className="block font-medium mb-1 text-[#460b6c]" htmlFor="name">Name</label>
          <Input
            id="name"
            type="text"
            placeholder="Dein Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            className="w-full rounded border border-gray-300 p-2 min-h-[40px]"
            autoFocus
          />
        </div>
      ),
      isValid: !!form.name.trim(),
    },
    {
      label: 'Zeitraum',
      content: (
        <div className="flex flex-col gap-4">
          <label className="block font-medium mb-2 text-[#460b6c]">Wann bist du da?</label>
          <div className="flex gap-4 items-center justify-center">
            <div className="flex flex-col items-center">
              <span className="text-xs mb-1">Von</span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={fromDay === 0} onClick={() => setFromDay(d => Math.max(0, d - 1))} className="p-1"><ChevronLeft /></button>
                <select value={fromDay} onChange={e => setFromDay(Number(e.target.value))} className="rounded border px-2 py-1">
                  {FESTIVAL_DAYS.map((d, i) => i <= toDay && <option key={d} value={i}>{d}</option>)}
                </select>
                <button type="button" disabled={fromDay === toDay} onClick={() => setFromDay(d => Math.min(toDay, d + 1))} className="p-1"><ChevronRight /></button>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs mb-1">Bis</span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={toDay === fromDay} onClick={() => setToDay(d => Math.max(fromDay, d - 1))} className="p-1"><ChevronLeft /></button>
                <select value={toDay} onChange={e => setToDay(Number(e.target.value))} className="rounded border px-2 py-1">
                  {FESTIVAL_DAYS.map((d, i) => i >= fromDay && <option key={d} value={i}>{d}</option>)}
                </select>
                <button type="button" disabled={toDay === FESTIVAL_DAYS.length - 1} onClick={() => setToDay(d => Math.min(FESTIVAL_DAYS.length - 1, d + 1))} className="p-1"><ChevronRight /></button>
              </div>
            </div>
          </div>
        </div>
      ),
      isValid: fromDay <= toDay,
      onNext: () => setForm(f => ({ ...f, days: Array.from({ length: toDay - fromDay + 1 }, (_, i) => i + fromDay) })),
    },
    {
      label: 'Preisoption',
      content: (
        <div className="flex flex-col gap-4">
          <label className="block font-medium mb-2 text-[#460b6c]">Finanzkonzept</label>
          <MyRadioGroup
            value={form.priceOption}
            onChange={v => setForm(f => ({ ...f, priceOption: v }))}
            options={[
              { value: "full", label: "Voller Preis" },
              { value: "reduced", label: "Reduziert" },
              { value: "free", label: "Kostenlos" },
            ]}
          />
        </div>
      ),
      isValid: !!form.priceOption,
    },
    {
      label: 'Sanitätsausbildung',
      content: (
        <div className="flex flex-col gap-4">
          <MyCheckbox
            checked={form.isMedic}
            onChange={v => setForm(f => ({ ...f, isMedic: v }))}
            label={<span className="flex items-center gap-2"><Stethoscope className="inline-block w-5 h-5 text-[#ff9900]" />Ich habe eine Sanitätsausbildung</span>}
          />
        </div>
      ),
      isValid: true,
    },
    {
      label: 'Auto',
      content: (
        <div className="flex flex-col gap-4">
          <MyCheckbox
            checked={form.hasCar}
            onChange={v => setForm(f => ({ ...f, hasCar: v }))}
            label={<span className="flex items-center gap-2"><CarIcon className="inline-block w-5 h-5 text-[#ff9900]" />Ich habe ein Auto und kann nach Truchtlaching fahren</span>}
          />
        </div>
      ),
      isValid: true,
    },
    {
      label: 'Equipment',
      content: (
        <div className="flex flex-col gap-4">
          <label className="block font-medium mb-1 text-[#460b6c] flex items-center gap-2"><Wrench className="inline-block w-5 h-5 text-[#ff9900]" />Ich habe folgendes Equipment, das ich zur Verfügung stellen kann</label>
          <Textarea
            placeholder="z.B. Musikanlage, Pavillon, Werkzeug ..."
            value={form.equipment}
            onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}
            className="w-full rounded border border-gray-300 p-2 min-h-[48px]"
          />
        </div>
      ),
      isValid: true,
    },
    {
      label: 'Anliegen',
      content: (
        <div className="flex flex-col gap-4">
          <label className="block font-medium mb-1 text-[#460b6c] flex items-center gap-2"><MessageCircle className="inline-block w-5 h-5 text-[#ff9900]" />Ich habe folgendes Anliegen</label>
          <Textarea
            placeholder="Dein Anliegen ..."
            value={form.concerns}
            onChange={e => setForm(f => ({ ...f, concerns: e.target.value }))}
            className="w-full rounded border border-gray-300 p-2 min-h-[48px]"
          />
        </div>
      ),
      isValid: true,
    },
    {
      label: 'Line-Up',
      content: (
        <div className="flex flex-col gap-4">
          <MyCheckbox
            checked={form.wantsToContribute}
            onChange={v => setForm(f => ({ ...f, wantsToContribute: v }))}
            label={<span className="flex items-center gap-2"><Music className="inline-block w-5 h-5 text-[#ff9900]" />Ich habe Lust zum Line-Up beizutragen</span>}
          />
        </div>
      ),
      isValid: true,
    },
    {
      label: 'Workshop',
      content: (
        <div className="flex flex-col gap-4">
          <label className="block font-medium mb-1 text-[#460b6c] flex items-center gap-2"><Hammer className="inline-block w-5 h-5 text-[#ff9900]" />Ich habe Lust, einen Workshop anzubieten</label>
          <Textarea
            placeholder="Workshop-Idee ..."
            value={form.wantsToOfferWorkshop}
            onChange={e => setForm(f => ({ ...f, wantsToOfferWorkshop: e.target.value }))}
            className="w-full rounded border border-gray-300 p-2 min-h-[48px]"
          />
        </div>
      ),
      isValid: true,
    },
    {
      label: 'Schlafpräferenz',
      content: (
        <div className="flex flex-col gap-4">
          <label className="block font-medium mb-2 text-[#460b6c]">Schlafpräferenz</label>
          <MyRadioGroup
            value={form.sleepingPreference}
            onChange={v => setForm(f => ({ ...f, sleepingPreference: v }))}
            options={[
              { value: "bed", label: <span className="flex items-center gap-2"><Bed className="inline-block w-5 h-5 text-[#ff9900]" /> Bett (5€ pro Nacht mehr)</span> },
              { value: "tent", label: <span className="flex items-center gap-2"><Tent className="inline-block w-5 h-5 text-[#ff9900]" /> Zelt</span> },
              { value: "car", label: <span className="flex items-center gap-2"><CarIcon className="inline-block w-5 h-5 text-[#ff9900]" /> Auto</span> },
            ]}
          />
        </div>
      ),
      isValid: !!form.sleepingPreference,
    },
    {
      label: 'Zusammenfassung',
      content: (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-[#460b6c] mb-2">Zusammenfassung</h3>
          <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl p-4 text-[#460b6c] max-w-md mx-auto flex flex-col gap-3">
            <div className="flex items-center gap-2 font-semibold text-lg mb-2">
              <span className="text-[#ff9900]"><User className="w-5 h-5" /></span>
              {form.name}
            </div>
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Schlafplatz:</span>
              <span>{form.sleepingPreference === 'bed' ? 'Bett' : form.sleepingPreference === 'tent' ? 'Zelt' : 'Auto'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Sani:</span>
              <span>{form.isMedic ? 'Ja' : 'Nein'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CarIcon className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Auto:</span>
              <span>{form.hasCar ? 'Ja' : 'Nein'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Workshop:</span>
              {form.wantsToOfferWorkshop ? (
                <>
                  <span>Vorhanden</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="ml-1 p-1 rounded hover:bg-[#ff9900]/10"><MoreHorizontal className="w-4 h-4" /></button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs text-sm">{form.wantsToOfferWorkshop}</PopoverContent>
                  </Popover>
                </>
              ) : <span>—</span>}
            </div>
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Line-Up:</span>
              <span>{form.wantsToContribute ? 'Ja' : 'Nein'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Equipment:</span>
              {form.equipment ? (
                <>
                  <span>Vorhanden</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="ml-1 p-1 rounded hover:bg-[#ff9900]/10"><MoreHorizontal className="w-4 h-4" /></button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs text-sm">{form.equipment}</PopoverContent>
                  </Popover>
                </>
              ) : <span>—</span>}
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Anliegen:</span>
              {form.concerns ? (
                <>
                  <span>Vorhanden</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="ml-1 p-1 rounded hover:bg-[#ff9900]/10"><MoreHorizontal className="w-4 h-4" /></button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs text-sm">{form.concerns}</PopoverContent>
                  </Popover>
                </>
              ) : <span>—</span>}
            </div>
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Tage:</span>
              <span>{FESTIVAL_DAYS[form.days[0]]} – {FESTIVAL_DAYS[form.days[form.days.length - 1]]}</span>
            </div>
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Preisoption:</span>
              <span>{form.priceOption === 'full' ? 'Voller Preis' : form.priceOption === 'reduced' ? 'Reduziert' : 'Kostenlos'}</span>
            </div>
          </div>
        </div>
      ),
      isValid: true,
    },
  ];

  // Slide-Animation (einfach, ohne externe Lib)
  const slideClass = "transition-transform duration-300 ease-in-out";

  const handleNext = () => {
    if (steps[step].onNext) steps[step].onNext();
    setStep(s => Math.min(steps.length - 1, s + 1));
  };
  const handlePrev = () => setStep(s => Math.max(0, s - 1));

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await registerFestival(form);
      if (result.success) {
        toast.success("Anmeldung erfolgreich gespeichert!");
        if (onRegister) onRegister(form);
        setForm(defaultData);
        setStep(0);
        setFromDay(0);
        setToDay(FESTIVAL_DAYS.length - 1);
      } else {
        toast.error(result.error || "Fehler beim Speichern der Anmeldung.");
      }
    } catch (err) {
      toast.error("Fehler beim Speichern der Anmeldung.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleFinalSubmit} className="max-w-xl mx-auto bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col gap-6 mt-8">
      <h2 className="text-2xl font-bold text-[#460b6c] mb-2 text-center">Festival Anmeldung</h2>
      {/* Fortschrittsanzeige */}
      <div className="flex justify-center gap-2 mb-4">
        {steps.map((s, i) => (
          <span key={s.label} className={`w-3 h-3 rounded-full ${i === step ? 'bg-[#ff9900]' : 'bg-gray-300'} transition-colors`} />
        ))}
      </div>
      {/* Slide-Content */}
      <div className={`relative min-h-[120px] flex items-center justify-center ${slideClass}`}>
        {steps[step].content}
      </div>
      {/* Navigation */}
      <div className="flex w-full gap-2 mt-10">
        <Button type="button" onClick={handlePrev} disabled={step === 0} variant="outline" className="flex-1">Zurück</Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={handleNext} disabled={!steps[step].isValid} className="flex-1 bg-[#ff9900] text-white">Weiter</Button>
        ) : (
          <div className="flex flex-col items-end gap-2 flex-1">
            <Button type="submit" disabled={loading} className="bg-[#ff9900] text-white w-full">{loading ? "Wird gespeichert ..." : "Bestätigen & Absenden"}</Button>
          </div>
        )}
      </div>
    </form>
  );
} 