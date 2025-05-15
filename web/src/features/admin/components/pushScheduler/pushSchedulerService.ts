import {
  FunPushPoolConfig,
  ScheduledPushMessage,
} from './pushSchedulerTypes';

/**
 * Mock-In-Memory-Storage für FunPushPools und ScheduledPushMessages
 * In einer echten App später durch DB ersetzen.
 */
let funPushPools: FunPushPoolConfig[] = [];
let scheduledPushMessages: ScheduledPushMessage[] = [];

// --- Pool-Methoden ---
export function getFunPushPools(): FunPushPoolConfig[] {
  return funPushPools;
}

export function addFunPushPool(pool: FunPushPoolConfig): void {
  funPushPools.push(pool);
}

export function updateFunPushPool(pool: FunPushPoolConfig): void {
  funPushPools = funPushPools.map(p => (p.id === pool.id ? pool : p));
}

export function deleteFunPushPool(poolId: string): void {
  funPushPools = funPushPools.filter(p => p.id !== poolId);
}

// --- Einzel-Nachrichten-Methoden ---
export function getScheduledPushMessages(): ScheduledPushMessage[] {
  return scheduledPushMessages;
}

export function addScheduledPushMessage(msg: ScheduledPushMessage): void {
  scheduledPushMessages.push(msg);
}

export function updateScheduledPushMessage(msg: ScheduledPushMessage): void {
  scheduledPushMessages = scheduledPushMessages.map(m => (m.id === msg.id ? msg : m));
}

export function deleteScheduledPushMessage(msgId: string): void {
  scheduledPushMessages = scheduledPushMessages.filter(m => m.id !== msgId);
}

// --- Logik für fällige Nachrichten (Mock) ---
export function getDuePushesForNow(date: Date): (FunPushPoolConfig | ScheduledPushMessage)[] {
  // TODO: Implementiere die Logik, um für das aktuelle Datum/Uhrzeit die fälligen Nachrichten zu finden
  return [];
} 