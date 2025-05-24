"use server";

import { createRide } from '../services/carpoolService';

export async function createRideAction(data: any) {
  return await createRide(data);
} 