import React, { useState } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ScheduledPushMessage } from './pushSchedulerTypes';

interface ScheduledPushFormProps {
  initial?: ScheduledPushMessage;
  onSave: (msg: ScheduledPushMessage) => void;
  onCancel: () => void;
}

const emptySendTime = { date: '', time: '' };

const ScheduledPushForm: React.FC<ScheduledPushFormProps> = ({ initial, onSave, onCancel }) => {
  const [text, setText] = useState(initial?.text || '');
  const [sendTimes, setSendTimes] = useState(initial?.sendTimes || [emptySendTime]);
  const [repeat, setRepeat] = useState(initial?.repeat || undefined);
  const [error, setError] = useState<string | null>(null);

  const handleAddSendTime = () => setSendTimes([...sendTimes, { ...emptySendTime }]);
  const handleRemoveSendTime = (idx: number) => setSendTimes(sendTimes.filter((_, i) => i !== idx));
  const handleSendTimeChange = (idx: number, field: 'date' | 'time', value: string) => {
    setSendTimes(sendTimes.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const handleRepeatChange = (field: 'from' | 'to' | 'time', value: string) => {
    setRepeat(r => ({ ...(r || { from: '', to: '', time: '' }), [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return setError('Nachrichtentext ist erforderlich');
    if (sendTimes.some(t => !t.date || !t.time)) return setError('Alle Einzeltermine benötigen Datum und Uhrzeit');
    onSave({
      id: initial?.id || crypto.randomUUID(),
      text,
      sendTimes,
      repeat: repeat && repeat.from && repeat.to && repeat.time ? repeat : undefined,
      createdBy: initial?.createdBy || 'admin',
      createdAt: initial?.createdAt || new Date(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Einzel-Nachricht anlegen/bearbeiten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Nachricht (mit Emojis)" value={text} onChange={e => setText(e.target.value)} required />
          <div>
            <div className="font-semibold mb-2">Einzeltermine</div>
            {sendTimes.map((t, idx) => (
              <div key={idx} className="flex gap-2 items-center mb-2">
                <Input type="date" value={t.date} onChange={e => handleSendTimeChange(idx, 'date', e.target.value)} required />
                <Input type="time" value={t.time} onChange={e => handleSendTimeChange(idx, 'time', e.target.value)} required />
                <Button type="button" variant="destructive" onClick={() => handleRemoveSendTime(idx)}>Entfernen</Button>
              </div>
            ))}
            <Button type="button" onClick={handleAddSendTime} variant="secondary">Termin hinzufügen</Button>
          </div>
          <div>
            <div className="font-semibold mb-2">Wiederholung (optional)</div>
            <div className="flex gap-2 items-center mb-2">
              <Input type="date" value={repeat?.from || ''} onChange={e => handleRepeatChange('from', e.target.value)} placeholder="Von" />
              <Input type="date" value={repeat?.to || ''} onChange={e => handleRepeatChange('to', e.target.value)} placeholder="Bis" />
              <Input type="time" value={repeat?.time || ''} onChange={e => handleRepeatChange('time', e.target.value)} placeholder="Uhrzeit" />
            </div>
          </div>
          {error && <div className="text-red-500 font-semibold">{error}</div>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onCancel}>Abbrechen</Button>
            <Button type="submit">Speichern</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default ScheduledPushForm; 