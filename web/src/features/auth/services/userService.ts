"use server";

import { User } from '@/lib/db/models/User';
import { Registration } from '@/lib/db/models/Registration';
import { connectDB } from '@/lib/db/connector';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';

/**
 * Findet oder erstellt einen User basierend auf deviceId
 */
export async function findOrCreateUser(deviceId: string, name?: string) {
  if (!deviceId) return null;
  
  await connectDB();
  
  try {
    // Versuche existierenden User zu finden
    let user = await User.findByDeviceId(deviceId);
    
    if (user && name && user.name !== name) {
      // Update Name falls vorhanden und anders
      user.name = name;
      await user.save();
    }
    
    // Falls kein User gefunden und Name vorhanden, erstelle neuen
    if (!user && name) {
      user = await User.create({
        deviceId,
        name,
        isActive: true
      });
      logger.info(`[UserService] Neuer User erstellt: ${user._id} für Device: ${deviceId}`);
    }
    
    return user;
  } catch (error) {
    logger.error('[UserService] Fehler bei findOrCreateUser:', error);
    return null;
  }
}

/**
 * Holt User mit Registrierungsdaten
 */
export async function getUserWithRegistration(deviceId: string) {
  if (!deviceId) return null;
  
  await connectDB();
  
  try {
    const user = await User.findOne({ deviceId, isActive: true })
      .populate('registrationId')
      .populate('groupId', 'name description')
      .lean(); // Wichtig: lean() für plain objects
    
    if (!user) {
      logger.info(`[UserService] Kein User gefunden für deviceId: ${deviceId}`);
      return null;
    }
    
    logger.info(`[UserService] User gefunden: ${user.name} (${deviceId})`);
    
    // Serialisiere die Daten für den Client
    const serializedUser = {
      _id: user._id?.toString(),
      deviceId: user.deviceId,
      name: user.name,
      isActive: user.isActive,
      // Serialisiere registrationId
      registrationId: user.registrationId ? {
        _id: (user.registrationId as any)?._id?.toString(),
        name: (user.registrationId as any)?.name,
        days: (user.registrationId as any)?.days,
        priceOption: (user.registrationId as any)?.priceOption,
        // Weitere Felder falls nötig
      } : null,
      // Serialisiere groupId
      groupId: user.groupId ? {
        _id: (user.groupId as any)?._id?.toString(),
        name: (user.groupId as any)?.name,
        description: (user.groupId as any)?.description,
      } : null,
      // Konvertiere Dates zu Strings (mit null-Check)
      createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
    };
    
    logger.info(`[UserService] Serialisierter User:`, {
      name: serializedUser.name,
      hasRegistration: !!serializedUser.registrationId,
      deviceId: serializedUser.deviceId
    });
    
    return serializedUser;
  } catch (error) {
    logger.error('[UserService] Fehler bei getUserWithRegistration:', error);
    return null;
  }
}

/**
 * Aktualisiert User-Präferenzen (vereinfacht)
 */
export async function updateUserPreferences(deviceId: string, updates: { name?: string }) {
  if (!deviceId) return null;
  
  await connectDB();
  
  try {
    const user = await User.findOneAndUpdate(
      { deviceId, isActive: true },
      updates,
      { new: true }
    );
    
    return user;
  } catch (error) {
    logger.error('[UserService] Fehler bei updateUserPreferences:', error);
    return null;
  }
}

/**
 * Verknüpft einen User mit einer Registration
 */
export async function linkUserWithRegistration(
  deviceId: string, 
  registrationId: string
): Promise<{ success: boolean; error?: string }> {
  if (!deviceId || !registrationId) {
    return { success: false, error: 'Fehlende Parameter' };
  }
  
  await connectDB();
  
  try {
    const user = await User.findByDeviceId(deviceId);
    
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
    logger.error('[UserService] Fehler bei linkUserWithRegistration:', error);
    return { success: false, error: 'Fehler beim Verknüpfen' };
  }
}

/**
 * Holt User-Statistiken
 */
export async function getUserStats(deviceId: string) {
  if (!deviceId) return null;
  
  await connectDB();
  
  try {
    const user = await User.findByDeviceId(deviceId);
    
    if (!user) return null;
    
    return {
      name: user.name,
      deviceId: user.deviceId,
      hasRegistration: !!user.registrationId,
      createdAt: user.createdAt
    };
  } catch (error) {
    logger.error('[UserService] Fehler bei getUserStats:', error);
    return null;
  }
}

/**
 * Holt alle aktiven User mit Gruppen- und Registrierungsinformationen
 */
export async function getAllUsers() {
  await connectDB();
  
  try {
    const users = await User.find({ isActive: true })
      .populate('groupId', 'name description')
      .populate('registrationId', 'name days priceOption')
      .sort({ createdAt: -1 })
      .lean();
    
    const mappedUsers = users.map(user => ({
      deviceId: user.deviceId,
      name: user.name,
      groupId: user.groupId?._id?.toString() || user.groupId?.toString(),
      groupName: (user.groupId as any)?.name,
      isRegistered: !!user.registrationId,
      registrationId: user.registrationId?.toString(),
      createdAt: user.createdAt,
      lastActivity: user.updatedAt
    }));
    
    // Debug logging
    console.log('[UserService] getAllUsers - Gefundene User:', {
      total: mappedUsers.length,
      withGroups: mappedUsers.filter(u => u.groupId).length,
      userSample: mappedUsers.slice(0, 3).map(u => ({ 
        name: u.name, 
        deviceId: u.deviceId,
        groupId: u.groupId,
        groupName: u.groupName 
      })),
      groupIdTypes: mappedUsers.slice(0, 3).map(u => ({ 
        name: u.name, 
        groupIdType: typeof u.groupId,
        groupIdValue: u.groupId
      }))
    });
    
    return mappedUsers;
  } catch (error) {
    logger.error('[UserService] Fehler bei getAllUsers:', error);
    return [];
  }
}

/**
 * Löscht einen User und seine Anmeldung
 */
export async function deleteUser(deviceId: string): Promise<{ success: boolean; error?: string }> {
  if (!deviceId) {
    return { success: false, error: 'Device-ID ist erforderlich' };
  }
  
  await connectDB();
  
  try {
    const user = await User.findByDeviceId(deviceId);
    
    if (!user) {
      return { success: false, error: 'User nicht gefunden' };
    }
    
    // Lösche die Registration falls vorhanden
    if (user.registrationId) {
      await Registration.findByIdAndDelete(user.registrationId);
      logger.info(`[UserService] Registration ${user.registrationId} für User ${user.name} gelöscht`);
    }
    
    // Lösche den User
    await User.findByIdAndDelete(user._id);
    
    logger.info(`[UserService] User ${user.name} (${deviceId}) und zugehörige Registration gelöscht`);
    return { success: true };
  } catch (error) {
    logger.error('[UserService] Fehler bei deleteUser:', error);
    return { success: false, error: 'Fehler beim Löschen des Users' };
  }
} 