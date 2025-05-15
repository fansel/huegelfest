import React, { useState } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { FunPushPoolConfig, FunPushMessage, FunPushPoolTimeConfig } from './pushSchedulerTypes';
import { Calendar, Clock, MessageCircle, CheckCircle } from 'lucide-react';
import { safeUUID } from '@/shared/utils/uuid';

interface FunPushPoolFormProps {
  initial?: FunPushPoolConfig;
  onSave: (pool: FunPushPoolConfig) => void;
  onCancel: () => void;
}

const emptyTime: FunPushPoolTimeConfig = { from: '', to: '', count: 1, fixedTimes: [] };
const emptyMessage: FunPushMessage = { id: '', text: '', createdBy: '', createdAt: new Date() };

const steps = [
  { label: 'Basisdaten', icon: Calendar },
  { label: 'Zeitfenster', icon: Clock },
  { label: 'Nachrichten', icon: MessageCircle },
  { label: 'Review', icon: CheckCircle },
];

const FunPushPoolForm: React.FC<FunPushPoolFormProps> = ({ initial, onSave, onCancel }) => {
  const [step, setStep] = useState(0);
  // Step 1
  const [name, setName] = useState(initial?.name || '');
  const [startDate, setStartDate] = useState(initial?.startDate || '');
  const [endDate, setEndDate] = useState(initial?.endDate || '');
  const [repeat, setRepeat] = useState<'once' | 'daily' | 'custom'>(initial?.repeat || 'once');
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays || []);
  const [from, setFrom] = useState(initial?.from || '');
  const [to, setTo] = useState(initial?.to || '');
  const [count, setCount] = useState(initial?.count || 1);
  // Step 3
  const [messages, setMessages] = useState<FunPushMessage[]>(initial?.messages?.length ? initial.messages : [{ ...emptyMessage }]);
  // Error
  const [error, setError] = useState<string | null>(null);

  // Stepper
  const StepIcon = steps[step].icon;

  // Step 1: Basisdaten valid
  const isStep1Valid = name.trim() && startDate && endDate && from && to && count > 0;
  // Step 3: Nachrichten valid
  const isStep3Valid = messages.length > 0 && messages.every(m => m.text.trim());

  // Stepper UI
  const Stepper = () => (
    <div className="flex items-center justify-center gap-4 mb-8">
      {steps.map((s, i) => (
        <div key={s.label} className="flex flex-col items-center">
          <div className={`rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold border-2 ${i === step ? 'border-[#ff9900] bg-[#ff9900]/10 text-[#ff9900]' : 'border-gray-200 bg-gray-100 text-gray-400'}`}>{<s.icon className="w-5 h-5" />}</div>
          <span className={`text-xs mt-1 ${i === step ? 'text-[#ff9900] font-semibold' : 'text-gray-400'}`}>{s.label}</span>
        </div>
      ))}
    </div>
  );

  // Step 4: Review
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep1Valid) return setError('Bitte alle Basisdaten ausfüllen.');
    if (!isStep3Valid) return setError('Bitte mindestens eine Nachricht angeben.');
    onSave({
      id: initial?.id || safeUUID(),
      name,
      startDate,
      endDate,
      repeat,
      weekdays,
      from,
      to,
      count,
      messages: messages.map(m => ({ ...m, id: m.id || safeUUID(), createdAt: m.createdAt || new Date(), createdBy: m.createdBy || 'admin' })),
      createdBy: initial?.createdBy || 'admin',
      createdAt: initial?.createdAt || new Date(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6">
      <Stepper />
      {/* Step 1: Basisdaten */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="font-semibold text-base text-[#460b6c] mb-2">Basisdaten</div>
          <label className="flex flex-col text-xs font-semibold text-gray-700">Name
            <Input value={name} onChange={e => setName(e.target.value)} required className="h-8 text-xs" />
          </label>
          <div className="flex gap-2">
            <label className="flex flex-col text-xs font-semibold text-gray-700">Startdatum
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="h-8 text-xs" />
            </label>
            <label className="flex flex-col text-xs font-semibold text-gray-700">Enddatum
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="h-8 text-xs" />
            </label>
          </div>
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="radio" checked={repeat === 'once'} onChange={() => setRepeat('once')} /> Einmalig
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="radio" checked={repeat === 'daily'} onChange={() => setRepeat('daily')} /> Täglich
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="radio" checked={repeat === 'custom'} onChange={() => setRepeat('custom')} /> Bestimmte Wochentage
            </label>
            {repeat === 'custom' && (
              <div className="flex gap-1 ml-2">
                {[0,1,2,3,4,5,6].map(d => (
                  <label key={d} className="flex items-center gap-1">
                    <input type="checkbox" checked={weekdays.includes(d)} onChange={() => setWeekdays(w => w.includes(d) ? w.filter(x => x !== d) : [...w, d])} />
                    {['So','Mo','Di','Mi','Do','Fr','Sa'][d]}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <label className="flex flex-col text-xs font-semibold text-gray-700">Von
              <Input type="time" value={from} onChange={e => setFrom(e.target.value)} required className="h-8 text-xs" />
            </label>
            <label className="flex flex-col text-xs font-semibold text-gray-700">Bis
              <Input type="time" value={to} onChange={e => setTo(e.target.value)} required className="h-8 text-xs" />
            </label>
            <label className="flex flex-col text-xs font-semibold text-gray-700">Anzahl Nachrichten
              <Input type="number" min={1} value={count} onChange={e => setCount(Number(e.target.value))} required className="h-8 text-xs" />
            </label>
          </div>
        </div>
      )}
      {/* Step 3: Nachrichten */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="font-semibold text-base text-[#460b6c] mb-2">Nachrichten</div>
          {messages.map((m, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-2 items-end mb-2">
              <label className="flex flex-col w-full text-xs font-semibold text-gray-700">Nachricht
                <Input value={m.text} onChange={e => {
                  setMessages(messages.map((m, i) => i === idx ? { ...m, text: e.target.value } : m));
                }} placeholder="Nachricht (mit Emojis)" required className="flex-1" />
              </label>
              <Button type="button" variant="destructive" onClick={() => {
                setMessages(messages.filter((_, i) => i !== idx));
              }} className="w-full sm:w-auto mt-5">Entfernen</Button>
            </div>
          ))}
          <Button type="button" onClick={() => setMessages([...messages, { ...emptyMessage }])} variant="secondary" className="mt-2">Nachricht hinzufügen</Button>
        </div>
      )}
      {/* Step 4: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="font-semibold text-[#ff9900] text-lg mb-2">Zusammenfassung</div>
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="mb-2"><span className="font-semibold">Name:</span> {name}</div>
            <div className="mb-2"><span className="font-semibold">Zeitraum:</span> {startDate} – {endDate}</div>
            <div className="mb-2"><span className="font-semibold">Wiederholung:</span> {repeat === 'once' ? 'Einmalig' : repeat === 'daily' ? 'Täglich' : 'Bestimmte Wochentage (' + weekdays.map(d => ['So','Mo','Di','Mi','Do','Fr','Sa'][d]).join(', ') + ')'}</div>
            <div className="mb-2"><span className="font-semibold">Zeitfenster:</span> {from} – {to}</div>
            <div className="mb-2"><span className="font-semibold">Anzahl Nachrichten pro Tag:</span> {count}</div>
            <div className="mb-2"><span className="font-semibold">Nachrichten:</span>
              <ul className="list-disc ml-6">
                {messages.map((m, i) => (
                  <li key={i}>{m.text}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {error && <div className="text-red-500 font-semibold">{error}</div>}
      {/* Navigation */}
      <div className="flex gap-2 justify-between pt-2">
        <Button type="button" variant="secondary" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)} className="w-1/2">{step === 0 ? 'Abbrechen' : 'Zurück'}</Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={() => {
            if (step === 0 && !isStep1Valid) return setError('Bitte alle Basisdaten ausfüllen.');
            if (step === 2 && !isStep3Valid) return setError('Bitte mindestens eine Nachricht angeben.');
            setError(null); setStep(s => s + 1);
          }} className="w-1/2" disabled={
            (step === 0 && !isStep1Valid) ||
            (step === 2 && !isStep3Valid)
          }>Weiter</Button>
        ) : (
          <Button type="submit" className="w-1/2">Speichern</Button>
        )}
      </div>
    </form>
  );
};

export default FunPushPoolForm; 