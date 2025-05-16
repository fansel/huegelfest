"use server";
import { getDayById } from '../services/dayService';

export async function getDayByIdAction(id: string) {
  return getDayById(id);
} 