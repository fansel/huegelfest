"use server";
import { getEventById } from '../services/eventService';

export async function getEventByIdAction(id: string) {
  return getEventById(id);
} 