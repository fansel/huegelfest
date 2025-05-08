"use server";

import { updateRide } from '../services/carpoolService';

export async function updateRideAction(_id: string, data: any) {
  return await updateRide(_id, data);
} 