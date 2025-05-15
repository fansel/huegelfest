'use server';
import { ScheduledPushMessage } from '../pushSchedulerTypes';
import { getScheduledPushMessages, saveScheduledPushMessage, deleteScheduledPushMessage } from '../services/scheduledPushService';

export async function actionGetScheduledPushMessages(): Promise<ScheduledPushMessage[]> {
  return getScheduledPushMessages();
}

export async function actionSaveScheduledPushMessage(msg: ScheduledPushMessage): Promise<void> {
  await saveScheduledPushMessage(msg);
}

export async function actionDeleteScheduledPushMessage(id: string): Promise<void> {
  await deleteScheduledPushMessage(id);
} 