import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { FunPushPoolConfig, ScheduledPushMessage } from './pushSchedulerTypes';

interface PushSchedulerListProps {
  pools?: FunPushPoolConfig[];
  singles?: ScheduledPushMessage[];
  onEditPool?: (pool: FunPushPoolConfig) => void;
  onDeletePool?: (id: string) => void;
  onAddPool?: () => void;
  onEditSingle?: (msg: ScheduledPushMessage) => void;
  onDeleteSingle?: (id: string) => void;
  onAddSingle?: () => void;
}

// Hilfsfunktion für robustes Datumsformat
const formatDate = (date: string | Date | undefined | null) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
};

const PushSchedulerList: React.FC<PushSchedulerListProps> = ({
  pools = [], singles = [], onEditPool, onDeletePool, onAddPool, onEditSingle, onDeleteSingle, onAddSingle
}) => {
  // Wenn nur Pools übergeben werden, zeige NUR die Pool-Liste
  if (pools.length > 0 || (onAddPool && !onAddSingle)) {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">Fun Pool(s)</h3>
            {onAddPool && <Button onClick={onAddPool}>Neuen Pool anlegen</Button>}
          </div>
          <div className="space-y-2">
            {pools.length === 0 && <div className="text-muted-foreground">Noch kein Pool angelegt.</div>}
            {pools.map(pool => (
              <Card key={pool.id}>
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle>{pool.name}</CardTitle>
                  <div className="flex gap-2">
                    {onEditPool && <Button size="sm" onClick={() => onEditPool(pool)}>Bearbeiten</Button>}
                    {onDeletePool && <Button size="sm" variant="destructive" onClick={() => onDeletePool(pool.id)}>Löschen</Button>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div>Zeitraum: {formatDate(pool.activeFrom)} – {formatDate(pool.activeTo)}</div>
                  <div>{pool.messages.length} Nachricht(en)</div>
                  <div>
                    Zeitfenster:
                    <ul className="list-disc ml-6">
                      {Array.isArray(pool.times) && pool.times.length > 0 ? (
                        pool.times.map((t, i) => (
                          <li key={i}>
                            {t.from && t.to ? `${t.from}–${t.to}` : ''}
                            {t.count ? `, ${t.count}x` : ''}
                            {t.fixedTimes && t.fixedTimes.length > 0 ? `, Feste Uhrzeiten: ${t.fixedTimes.join(', ')}` : ''}
                          </li>
                        ))
                      ) : (
                        <li>–</li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // Wenn nur Singles übergeben werden, zeige NUR die Einzel-Liste
  if (singles.length > 0 || (onAddSingle && !onAddPool)) {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">Geplante Einzel-Nachrichten</h3>
            {onAddSingle && <Button onClick={onAddSingle}>Neue Einzel-Nachricht</Button>}
          </div>
          <div className="space-y-2">
            {singles.length === 0 && <div className="text-muted-foreground">Noch keine Einzel-Nachricht geplant.</div>}
            {singles.map(msg => (
              <Card key={msg.id}>
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle>{msg.text}</CardTitle>
                  <div className="flex gap-2">
                    {onEditSingle && <Button size="sm" onClick={() => onEditSingle(msg)}>Bearbeiten</Button>}
                    {onDeleteSingle && <Button size="sm" variant="destructive" onClick={() => onDeleteSingle(msg.id)}>Löschen</Button>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    Einzeltermine:
                    <ul className="list-disc ml-6">
                      {msg.sendTimes.map((t, i) => (
                        <li key={i}>{t.date} um {t.time}</li>
                      ))}
                    </ul>
                  </div>
                  {msg.repeat && (
                    <div>Wiederholung: {msg.repeat.from} – {msg.repeat.to} um {msg.repeat.time}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // Fallback: nichts anzeigen
  return null;
};

export default PushSchedulerList; 