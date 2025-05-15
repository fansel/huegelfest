'use server';
import { FunPushPoolConfig } from '../pushSchedulerTypes';
import { getFunPushPools, saveFunPushPool, deleteFunPushPool } from '../services/funPushPoolService';

export async function actionGetFunPushPools(): Promise<FunPushPoolConfig[]> {
  return getFunPushPools();
}

export async function actionSaveFunPushPool(pool: FunPushPoolConfig): Promise<void> {
  await saveFunPushPool(pool);
}

export async function actionDeleteFunPushPool(id: string): Promise<void> {
  await deleteFunPushPool(id);
} 