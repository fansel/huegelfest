"use server";

import { 
  getCurrentUserWithRegistration, 
  updateCurrentUserPreferences,
  getAllUsers,
  deleteUser,
  getCurrentUserStats,
  linkCurrentUserWithRegistration,
  createUser,
  updateUser,
  updateUserRole,
} from '../services/userService';
import { broadcast } from '@/lib/websocket/broadcast';
import { removeUserFromGroupAction } from '@/features/admin/components/groups/actions/groupActions';
import { verifyAdminSession } from './userAuth';
import { User } from '@/lib/db/models/User';
import { connectDB } from '@/lib/db/connector';
import { authEvents, AUTH_EVENTS } from '../authEvents';
import { revalidatePath } from "next/cache";
import { unstable_cache as cache } from 'next/cache';

/**
 * Modernisierte User Actions - verwendet das neue Auth-System
 */

/**
 * Server Action: Holt aktuellen User mit Registration-Details
 */
export async function getCurrentUserWithRegistrationAction() {
  try {
    return await getCurrentUserWithRegistration();
  } catch (error) {
    console.error('[UserActions] Fehler bei getCurrentUserWithRegistration:', error);
    return null;
  }
}

/**
 * Server Action: Aktualisiert aktuelle User-Preferences
 */
export async function updateCurrentUserPreferencesAction(updates: { name?: string; username?: string }) {
  try {
    return await updateCurrentUserPreferences(updates);
  } catch (error) {
    console.error('[UserActions] Fehler bei updateCurrentUserPreferences:', error);
    return null;
  }
}

/**
 * Server Action: Verknüpft aktuellen User mit Registration
 */
export async function linkCurrentUserWithRegistrationAction(registrationId: string) {
  try {
    return await linkCurrentUserWithRegistration(registrationId);
  } catch (error) {
    console.error('[UserActions] Fehler bei linkCurrentUserWithRegistration:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Holt Statistiken für aktuellen User
 */
export async function getCurrentUserStatsAction() {
  try {
    return await getCurrentUserStats();
  } catch (error) {
    console.error('[UserActions] Fehler bei getCurrentUserStats:', error);
    return null;
  }
}

/**
 * Server Action: Holt alle User (Admin-Funktion)
 */
export async function getAllUsersAction() {
  const getAllUsersCached = cache(
    async () => getAllUsers(),
    ['get-all-users'],
    {
      revalidate: 60, // Cache für 1 Minute
      tags: ['users'],
    }
  );

  try {
    return await getAllUsersCached();
  } catch (error) {
    console.error('[UserActions] Fehler bei getAllUsers:', error);
    return [];
  }
}

/**
 * Server Action: Löscht einen User und seine Anmeldung (Admin-Funktion)
 */
export async function deleteUserAction(userId: string) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) throw new Error('Nicht autorisiert');
    const result = await deleteUser(userId);
    if (result.success) {
      await broadcast('user-deleted', { userId });
    }
    return result;
  } catch (error) {
    console.error('[UserActions] Fehler bei deleteUser:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Ändert die Rolle eines Users (Admin-Funktion)
 */
export async function changeUserRoleAction(userId: string, newRole: 'user' | 'admin') {
  try {
    // Importiere dynamisch um Circular Dependency zu vermeiden
    const { changeUserRole } = await import('../services/authService');
    const { verifyAdminSession } = await import('./userAuth');
    
    // Prüfe Admin-Berechtigung
    const adminSession = await verifyAdminSession();
    if (!adminSession) {
      return { success: false, error: 'Admin-Berechtigung erforderlich' };
    }
    
    // Verhindere Selbst-Änderung der Admin-Rolle
    if (adminSession.userId === userId && newRole === 'user') {
      return { success: false, error: 'Sie können sich nicht selbst die Admin-Berechtigung entziehen' };
    }
    
    const user = await changeUserRole(userId, newRole);

    // Broadcast für andere Clients
    await broadcast('user-role-changed', { userId, newRole });
    
    return { success: true, data: user };
  } catch (error) {
    console.error('[UserActions] Fehler bei changeUserRole:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Ändert den Shadow-User-Status eines Users (Admin-Funktion)
 */
export async function changeShadowUserStatusAction(userId: string, isShadow: boolean) {
  try {
    // Prüfe Admin-Berechtigung
    const adminSession = await verifyAdminSession();
    if (!adminSession) {
      return { success: false, error: 'Admin-Berechtigung erforderlich' };
    }
    
    await connectDB();
    
    // Finde User und aktualisiere Status
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }
    
    // Wenn User zu Shadow wird und in einer Gruppe ist, entferne ihn
    if (isShadow && user.groupId) {
      try {
        await removeUserFromGroupAction(userId);
      } catch (error) {
        console.warn('[UserActions] Fehler beim Entfernen aus Gruppe:', error);
        // Fahre trotzdem fort mit Shadow-Status-Änderung
      }
    }
    
    // Aktualisiere Shadow-Status
    user.isShadowUser = isShadow;
    await user.save();
    
    return { success: true };
  } catch (error) {
    console.error('[UserActions] Fehler bei changeShadowUserStatus:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Lädt alle Shadow Users (Admin-Funktion)
 */
export async function getShadowUsersAction() {
  try {
    const { getAllShadowUsers } = await import('../services/authService');
    const { verifyAdminSession } = await import('./userAuth');
    
    // Prüfe Admin-Berechtigung
    const adminSession = await verifyAdminSession();
    if (!adminSession) {
      return { success: false, error: 'Admin-Berechtigung erforderlich' };
    }
    
    const shadowUsers = await getAllShadowUsers();
    return { success: true, data: shadowUsers };
  } catch (error) {
    console.error('[UserActions] Fehler bei getShadowUsers:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Lädt alle Shadow Users für Archive (Admin-Funktion)
 */
export async function getShadowUsersForArchiveAction() {
  try {
    const { getAllShadowUsersForArchive } = await import('../services/authService');
    const { verifyAdminSession } = await import('./userAuth');
    
    // Prüfe Admin-Berechtigung
    const adminSession = await verifyAdminSession();
    if (!adminSession) {
      return { success: false, error: 'Admin-Berechtigung erforderlich' };
    }
    
    const shadowUsers = await getAllShadowUsersForArchive();
    return { success: true, data: shadowUsers };
  } catch (error) {
    console.error('[UserActions] Fehler bei getShadowUsersForArchive:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Löscht einen User komplett mit allen zugehörigen Daten (Admin-Funktion)
 * Diese Funktion löscht:
 * - Den User selbst
 * - Seine Registration (falls vorhanden)
 * - Entfernt ihn aus Groups
 * - Löscht alle Push-Abonnements
 * - Andere benutzerbezogene Daten
 */
export async function deleteUserCompletelyAction(userId: string) {
  try {
    const { deleteUserCompletely } = await import('../services/userService');
    const { verifyAdminSession } = await import('./userAuth');
    
    // Prüfe Admin-Berechtigung
    const adminSession = await verifyAdminSession();
    if (!adminSession) {
      return { success: false, error: 'Admin-Berechtigung erforderlich' };
    }
    
    // Verhindere Selbstlöschung
    if (adminSession.userId === userId) {
      return { success: false, error: 'Sie können sich nicht selbst löschen' };
    }
    
    const result = await deleteUserCompletely(userId);
    
    if (result.success) {
      // Broadcast für andere Clients
      await broadcast('user-deleted', { userId });
    }
    
    return result;
  } catch (error) {
    console.error('[UserActions] Fehler bei deleteUserCompletely:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
} 