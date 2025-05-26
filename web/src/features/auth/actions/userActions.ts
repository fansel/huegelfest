"use server";

import { 
  findOrCreateUser, 
  getUserWithRegistration, 
  updateUserPreferences,
  getAllUsers,
  deleteUser
} from '../services/userService';

/**
 * Server Action: Findet oder erstellt einen User
 */
export async function findOrCreateUserAction(deviceId: string, name?: string) {
  try {
    return await findOrCreateUser(deviceId, name);
  } catch (error) {
    console.error('[UserActions] Fehler bei findOrCreateUser:', error);
    return null;
  }
}

/**
 * Server Action: Holt User mit Registration-Details
 */
export async function getUserWithRegistrationAction(deviceId: string) {
  try {
    return await getUserWithRegistration(deviceId);
  } catch (error) {
    console.error('[UserActions] Fehler bei getUserWithRegistration:', error);
    return null;
  }
}

/**
 * Server Action: Aktualisiert User-Preferences
 */
export async function updateUserPreferencesAction(deviceId: string, updates: { name?: string }) {
  try {
    return await updateUserPreferences(deviceId, updates);
  } catch (error) {
    console.error('[UserActions] Fehler bei updateUserPreferences:', error);
    return null;
  }
}

/**
 * Server Action: Holt alle User
 */
export async function getAllUsersAction() {
  try {
    return await getAllUsers();
  } catch (error) {
    console.error('[UserActions] Fehler bei getAllUsers:', error);
    return [];
  }
}

/**
 * Server Action: Löscht einen User und seine Anmeldung
 */
export async function deleteUserAction(deviceId: string) {
  try {
    return await deleteUser(deviceId);
  } catch (error) {
    console.error('[UserActions] Fehler bei deleteUser:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
} 