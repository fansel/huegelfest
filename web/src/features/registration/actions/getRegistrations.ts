'use server';
import { getRegistrations as getRegistrationsService } from '../services/registrationService';

export async function getRegistrations() {
  return getRegistrationsService();
}