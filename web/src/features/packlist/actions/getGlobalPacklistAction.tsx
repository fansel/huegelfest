'use server';
import { getGlobalPacklist } from '../services/PacklistService';

export async function getGlobalPacklistAction() {
  return getGlobalPacklist();
}

