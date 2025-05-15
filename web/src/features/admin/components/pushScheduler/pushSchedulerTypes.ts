// Typ für eine einzelne Nachricht im Pool
export interface FunPushMessage {
  id: string;
  text: string;
  createdBy: string;
  createdAt: Date;
}

// Typ für ein Zeitfenster oder eine feste Uhrzeit im Pool
export interface FunPushPoolTimeConfig {
  from?: string; // z.B. "04:00"
  to?: string;   // z.B. "08:00"
  count?: number; // Anzahl Nachrichten im Zeitfenster
  fixedTimes?: string[]; // z.B. ["19:00"]
}

// Typ für den gesamten Pool
export interface FunPushPoolConfig {
  id: string;
  name: string;
  messages: FunPushMessage[];
  startDate: string; // z.B. "2025-05-15"
  endDate: string;   // z.B. "2025-05-20"
  repeat: 'once' | 'daily' | 'custom';
  weekdays?: number[]; // falls repeat: 'custom', z.B. [1,3,5] für Mo/Mi/Fr (0=So)
  from: string; // "16:30"
  to: string;   // "17:30"
  count: number; // Nachrichten pro Tag im Zeitfenster
  createdBy: string;
  createdAt: Date;
}

// Typ für eine einzeln geplante Nachricht
export interface ScheduledPushMessage {
  id: string;
  text: string;
  sendTimes: Array<{
    date: string; // "2024-07-10"
    time: string; // "07:00"
  }>;
  repeat?: {
    from: string; // "2024-07-10"
    to: string;   // "2024-07-12"
    time: string; // "07:00"
  };
  createdBy: string;
  createdAt: Date;
} 