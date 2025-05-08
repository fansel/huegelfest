"use server";

import { deleteRide } from '../services/carpoolService';

export async function deleteRideAction(id: string) {
  return await deleteRide(id);
} 