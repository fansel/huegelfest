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
    logger.error('[UserService] Fehler bei deleteUser:', error);
    return { success: false, error: 'Fehler beim Löschen des Users' };
  }
} 