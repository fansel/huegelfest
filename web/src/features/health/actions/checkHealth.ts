"use server";

import { checkHealth } from '../services/healthService';

export async function checkHealthAction() {
  return await checkHealth();
} 