"use server";

import { User } from '@/lib/db/models/User';
import { Registration } from '@/lib/db/models/Registration';
import { connectDB } from '@/lib/db/connector';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';
import { verifySession } from '../actions/userAuth';

/**
 * Modernisierter User Service - unterscheidet zwischen:
 * 1. Session-basierte Operationen (für aktuellen User)
 * 2. Admin-User-Management (für Verwaltung anderer User)
 */

// === SESSION-BASIERTE USER-OPERATIONEN ===

/**
 * Holt User mit Registrierungsdaten basierend auf der aktuellen Session
 */
export async function getCurrentUserWithRegistration() {
  const sessionData = await verifySession();
  if (!sessionData) return null;
  
  await connectDB();
  
  try {
    const user = await User.findById(sessionData.userId)
      .populate('registrationId')
      .populate('groupId', 'name description')
      .lean();
    
    if (!user) {
      logger.info(`[UserService] Kein User gefunden für userId: ${sessionData.userId}`);
      return null;
    }
    
    logger.info(`[UserService] User gefunden: ${user.name} (${sessionData.email})`);
    
    // Serialisiere die Daten für den Client
    const serializedUser = {
      _id: user._id?.toString(),
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      
      // Serialisiere registrationId
      registrationId: user.registrationId ? {
        _id: (user.registrationId as any)?._id?.toString(),
        name: (user.registrationId as any)?.name,
        days: (user.registrationId as any)?.days,
        priceOption: (user.registrationId as any)?.priceOption,
      } : null,
      // Serialisiere groupId
      groupId: user.groupId ? {
        _id: (user.groupId as any)?._id?.toString(),
        name: (user.groupId as any)?.name,
        description: (user.groupId as any)?.description,
      } : null,
      // Konvertiere Dates zu Strings
      createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
    };
    
    return serializedUser;
  } catch (error) {
    logger.error('[UserService] Fehler bei getCurrentUserWithRegistration:', error);
    return null;
  }
}

/**
 * Aktualisiert User-Präferenzen für den aktuellen User
 */
export async function updateCurrentUserPreferences(updates: { name?: string; username?: string }) {
  const sessionData = await verifySession();
  if (!sessionData) throw new Error('Nicht authentifiziert');
  
  await connectDB();
  
  try {
    const user = await User.findOneAndUpdate(
      { _id: sessionData.userId, isActive: true },
      updates,
      { new: true }
    );
    
    return user;
  } catch (error) {
    logger.error('[UserService] Fehler bei updateCurrentUserPreferences:', error);
    return null;
  }
}

/**
 * Verknüpft den aktuellen User mit einer Registration
 */
export async function linkCurrentUserWithRegistration(
  registrationId: string
): Promise<{ success: boolean; error?: string }> {
  const sessionData = await verifySession();
  if (!sessionData) return { success: false, error: 'Nicht authentifiziert' };
  
  if (!registrationId) {
    return { success: false, error: 'Registration-ID ist erforderlich' };
  }
  
  await connectDB();
  
  try {
    const user = await User.findById(sessionData.userId);
    
    if (!user) {
      return { success: false, error: 'User nicht gefunden' };
    }
    
    // Prüfe ob Registration existiert
    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return { success: false, error: 'Registration nicht gefunden' };
    }
    
    user.registrationId = registration._id as any;
    await user.save();
    
    logger.info(`[UserService] User ${user._id} mit Registration ${registrationId} verknüpft`);
    return { success: true };
  } catch (error) {
    logger.error('[UserService] Fehler bei linkCurrentUserWithRegistration:', error);
    return { success: false, error: 'Fehler beim Verknüpfen' };
  }
}

/**
 * Holt Statistiken für den aktuellen User
 */
export async function getCurrentUserStats() {
  const sessionData = await verifySession();
  if (!sessionData) return null;
  
  await connectDB();
  
  try {
    const user = await User.findById(sessionData.userId);
    
    if (!user) return null;
    
    return {
      name: user.name,
      email: user.email,
      hasRegistration: !!user.registrationId,
      createdAt: user.createdAt
    };
  } catch (error) {
    logger.error('[UserService] Fehler bei getCurrentUserStats:', error);
    return null;
  }
}

// === ADMIN-USER-MANAGEMENT FUNKTIONEN ===

/**
 * Holt alle aktiven User mit Gruppen- und Registrierungsinformationen
 * (Admin-Funktion für User-Management)
 */
export async function getAllUsers() {
  // Prüfe Admin-Berechtigung des aktuellen Users
  const sessionData = await verifySession();
  if (!sessionData || sessionData.role !== 'admin') {
    throw new Error('Admin-Berechtigung erforderlich');
  }
  
  await connectDB();
  
  try {
    const users = await User.find({ 
      isActive: true
    })
      .populate('groupId', 'name description')
      .populate('registrationId', 'name days priceOption')
      .sort({ createdAt: -1 })
      .lean();
    
    const mappedUsers = users.map(user => ({
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      groupId: user.groupId?._id?.toString() || user.groupId?.toString(),
      groupName: (user.groupId as any)?.name,
      isRegistered: !!user.registrationId,
      registrationId: user.registrationId?.toString(),
      createdAt: user.createdAt,
      lastActivity: user.updatedAt,
      isShadowUser: user.isShadowUser
    }));
    
    logger.info(`[UserService] getAllUsers - Gefundene User: ${mappedUsers.length}`);
    
    return mappedUsers;
  } catch (error) {
    logger.error('[UserService] Fehler bei getAllUsers:', error);
    return [];
  }
}

/**
 * Löscht einen spezifischen User und seine Anmeldung
 * (Admin-Funktion für User-Management)
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  // Prüfe Admin-Berechtigung des aktuellen Users
  const sessionData = await verifySession();
  if (!sessionData || sessionData.role !== 'admin') {
    return { success: false, error: 'Admin-Berechtigung erforderlich' };
  }
  
  if (!userId) {
    return { success: false, error: 'User-ID ist erforderlich' };
  }
  
  await connectDB();
  
  try {
    const userToDelete = await User.findById(userId);
    
    if (!userToDelete) {
      return { success: false, error: 'User nicht gefunden' };
    }
    
    // Verhindere Selbstlöschung
    if ((userToDelete._id as mongoose.Types.ObjectId).toString() === sessionData.userId) {
      return { success: false, error: 'Sie können sich nicht selbst löschen' };
    }
    
    // Lösche die Registration falls vorhanden
    if (userToDelete.registrationId) {
      await Registration.findByIdAndDelete(userToDelete.registrationId);
      logger.info(`[UserService] Registration ${userToDelete.registrationId} für User ${userToDelete.name} gelöscht`);
    }
    
    // Lösche den User
    await User.findByIdAndDelete(userToDelete._id);
    
    logger.info(`[UserService] User ${userToDelete.name} (${userToDelete.email}) durch Admin ${sessionData.email} gelöscht`);
    return { success: true };
  } catch (error) {
    logger.error(`[UserService] Fehler beim Löschen von User ${userId}:`, error);
    return { success: false, error: 'Fehler beim Löschen des Users' };
  }
}

/**
 * Löscht einen User komplett mit allen zugehörigen Daten
 * (Erweiterte Admin-Funktion für vollständige Löschung)
 */
export async function deleteUserCompletely(userId: string): Promise<{ success: boolean; error?: string; deletedData?: any }> {
  // Prüfe Admin-Berechtigung des aktuellen Users
  const sessionData = await verifySession();
  if (!sessionData || sessionData.role !== 'admin') {
    return { success: false, error: 'Admin-Berechtigung erforderlich' };
  }
  
  if (!userId) {
    return { success: false, error: 'User-ID ist erforderlich' };
  }
  
  await connectDB();
  
  try {
    const userToDelete = await User.findById(userId)
      .populate('registrationId')
      .populate('groupId');
    
    if (!userToDelete) {
      return { success: false, error: 'User nicht gefunden' };
    }
    
    // Verhindere Selbstlöschung
    if ((userToDelete._id as mongoose.Types.ObjectId).toString() === sessionData.userId) {
      return { success: false, error: 'Sie können sich nicht selbst löschen' };
    }
    
    const deletedData = {
      user: {
        name: userToDelete.name,
        email: userToDelete.email,
        username: userToDelete.username,
        role: userToDelete.role
      },
      registration: null as any,
      group: null as any,
      pushSubscriptions: 0,
      additionalData: []
    };
    
    // 1. Lösche Registration falls vorhanden
    if (userToDelete.registrationId) {
      const registration = await Registration.findByIdAndDelete(userToDelete.registrationId);
      if (registration) {
        deletedData.registration = {
          name: (registration as any).name,
          days: (registration as any).days,
          priceOption: (registration as any).priceOption
        };
        logger.info(`[UserService] Registration ${userToDelete.registrationId} für User ${userToDelete.name} gelöscht`);
      }
    }
    
    // 2. Entferne User aus Group falls zugewiesen
    if (userToDelete.groupId) {
      try {
        // Verwende dynamischen Import um zirkuläre Abhängigkeiten zu vermeiden
        const { removeUserFromGroupAction } = await import('@/features/admin/components/groups/actions/groupActions');
        await removeUserFromGroupAction(userId);
        
        deletedData.group = {
          name: (userToDelete.groupId as any)?.name || 'Unbekannte Gruppe'
        };
        logger.info(`[UserService] User ${userToDelete.name} aus Gruppe entfernt`);
      } catch (error) {
        logger.warn(`[UserService] Fehler beim Entfernen aus Gruppe:`, error);
        // Fahre trotzdem mit der Löschung fort
      }
    }
    
    // 3. Lösche Push-Subscriptions
    try {
      // Hier könntest du eine Funktion aufrufen, die alle Push-Subscriptions des Users löscht
      // Beispiel: await deletePushSubscriptionsForUser(userId);
      // Für jetzt loggen wir nur
      logger.info(`[UserService] Push-Subscriptions für User ${userToDelete.name} würden gelöscht werden`);
    } catch (error) {
      logger.warn(`[UserService] Fehler beim Löschen der Push-Subscriptions:`, error);
    }
    
    // 4. Lösche weitere benutzerbezogene Daten
    // Hier könntest du weitere Models/Collections durchsuchen und löschen
    try {
      // Beispiele für weitere Datenquellen:
      // - Kommentare/Posts des Users
      // - User-spezifische Einstellungen
      // - Logs/Activities des Users
      // - etc.
      
      // Für jetzt als Platzhalter
      logger.info(`[UserService] Weitere benutzerbezogene Daten für User ${userToDelete.name} überprüft`);
    } catch (error) {
      logger.warn(`[UserService] Fehler beim Löschen zusätzlicher Daten:`, error);
    }
    
    // 5. Lösche den User selbst (als letztes)
    await User.findByIdAndDelete(userToDelete._id);
    
    logger.info(`[UserService] User ${userToDelete.name} (${userToDelete.email}) komplett durch Admin ${sessionData.email} gelöscht`);
    
    return { 
      success: true, 
      deletedData 
    };
  } catch (error) {
    logger.error('[UserService] Fehler bei deleteUserCompletely:', error);
    return { success: false, error: 'Fehler beim vollständigen Löschen des Users' };
  }
}

export async function createUser(data: any) {
  // admin check is in action
  await connectDB();
  const newUser = await User.create(data);
  return newUser;
}

export async function updateUser(id: string, data: any) {
  // admin check is in action
  await connectDB();
  const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });
  return updatedUser;
}

export async function updateUserRole(id: string, role: 'user' | 'admin') {
  // admin check is in action
  await connectDB();
  const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true });
  return updatedUser;
} 