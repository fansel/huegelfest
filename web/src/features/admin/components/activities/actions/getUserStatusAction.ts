'use server';

import { getUserStatus } from '../services/ActivitiesService';

export async function getUserStatusAction() {
  return await getUserStatus();
} 