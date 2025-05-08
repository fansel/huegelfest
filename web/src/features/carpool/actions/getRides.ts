"use server";

import { getRides } from '../services/carpoolService';

export async function getRidesAction() {
  return await getRides();
} 