'use server';

import { getUserStatus } from '../services/ActivitiesService';

export async function getUserStatusAction(deviceId: string) {
  return await getUserStatus(deviceId);
} 