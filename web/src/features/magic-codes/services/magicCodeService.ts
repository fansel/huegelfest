"use server";

import { MagicCode } from '@/lib/db/models/MagicCode';
import { User } from '@/lib/db/models/User';
import { Subscriber } from '@/lib/db/models/Subscriber';
import { connectDB } from '@/lib/db/connector';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';
import { broadcast } from '@/lib/websocket/broadcast';

export interface MagicCodeResult {
  success: boolean;
  code?: string;
  expiresAt?: Date;
  error?: string;
}

export interface DeviceTransferResult {
  success: boolean;
  userId?: string;
  userName?: string;
  error?: string;
  pushSubscriptionInfo?: {
    hadPushSubscription: boolean;
    requiresReactivation: boolean;
    message?: string;
  };
}

/**
 * Erstellt einen Magic Code für Gerätewechsel
 * @param deviceId Device ID des ursprünglichen Geräts
 * @param createdBy Wer erstellt den Code (user/admin)
 * @param adminId Admin Username bei Admin-Erstellung
 */
export async function createMagicCode(
  deviceId: string,
  createdBy: 'user' | 'admin' = 'user',
  adminId?: string
): Promise<MagicCodeResult> {
  try {
    await connectDB();

    // Validierung
    if (!deviceId) {
      return { success: false, error: 'Device ID ist erforderlich' };
    }

    // Prüfe ob User existiert
    const user = await User.findByDeviceId(deviceId);
    if (!user) {
      return { success: false, error: 'Benutzer mit dieser Device ID nicht gefunden' };
    }

    // Erstelle Magic Code
    const magicCode = await MagicCode.createForUser(deviceId, createdBy, adminId);

    logger.info(`[MagicCode] Code erstellt für User ${user.name} (${deviceId}) von ${createdBy}${adminId ? ` (${adminId})` : ''}`);

    return {
      success: true,
      code: magicCode.code,
      expiresAt: magicCode.expiresAt
    };
  } catch (error) {
    logger.error('[MagicCode] Fehler beim Erstellen des Magic Codes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
}

/**
 * Überträgt Account und Daten auf neues Gerät mit Magic Code
 * @param code 6-stelliger Magic Code
 * @param newDeviceId Device ID des neuen Geräts
 */
export async function transferDevice(
  code: string,
  newDeviceId: string
): Promise<DeviceTransferResult> {
  try {
    await connectDB();

    // Validierung
    if (!code || !newDeviceId) {
      return { success: false, error: 'Code und neue Device ID sind erforderlich' };
    }

    if (!/^\d{6}$/.test(code)) {
      return { success: false, error: 'Ungültiges Code-Format' };
    }

    // Verifiziere Magic Code
    const magicCode = await MagicCode.verifyCode(code);
    if (!magicCode) {
      return { success: false, error: 'Ungültiger oder abgelaufener Code' };
    }

    // Hhole User mit allen Daten
    const user = await User.findById(magicCode.userId)
      .populate('registrationId')
      .populate('groupId');

    if (!user) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }

    const oldDeviceId = user.deviceId;

    // Prüfe ob neue Device ID bereits verwendet wird
    const existingUser = await User.findByDeviceId(newDeviceId);
    if (existingUser && (existingUser._id as mongoose.Types.ObjectId).toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
      return { success: false, error: 'Neue Device ID wird bereits von einem anderen Benutzer verwendet' };
    }

    // 1. Push-Subscription Handling (korrigiert)
    const oldSubscription = await Subscriber.findOne({ deviceId: oldDeviceId });
    let pushSubscriptionInfo: {
      hadPushSubscription: boolean;
      requiresReactivation: boolean;
      message?: string;
    } = {
      hadPushSubscription: false,
      requiresReactivation: false
    };
    
    if (oldSubscription) {
      // ❌ ALTE LOGIC: oldSubscription.deviceId = newDeviceId; (funktioniert nicht!)
      // ✅ NEUE LOGIC: Lösche alte Subscription - User muss sich neu anmelden
      await Subscriber.deleteOne({ deviceId: oldDeviceId });
      pushSubscriptionInfo = {
        hadPushSubscription: true,
        requiresReactivation: true,
        message: 'Push-Benachrichtigungen müssen auf dem neuen Gerät neu aktiviert werden'
      };
      logger.info(`[MagicCode] Push-Subscription für ${oldDeviceId} gelöscht - User muss sich auf neuem Gerät neu für Push-Notifications anmelden`);
    }

    // 2. Aktualisiere User deviceId
    user.deviceId = newDeviceId;
    await user.save();

    // 3. Markiere Magic Code als verwendet
    magicCode.isUsed = true;
    await magicCode.save();

    // 4. Lösche eventuell bestehende Magic Codes für das alte Gerät
    await MagicCode.deleteMany({ deviceId: oldDeviceId });

    // 🔒 5. NEUER SICHERHEITS-SCHRITT: "Altes Gerät platt machen"
    // Erstelle einen "Fresh Start" User für die alte Device ID
    // Das bedeutet: Wenn jemand anders das alte Gerät bekommt, sieht er keine persönlichen Daten
    await User.create({
      deviceId: oldDeviceId,
      name: `Neuer Benutzer`, // Generischer Name
      isActive: true
      // Keine groupId, keine registrationId - alles clean
    });

    logger.info(`[MagicCode] Device Transfer erfolgreich: ${user.name} von ${oldDeviceId} auf ${newDeviceId}`);
    logger.info(`[MagicCode] SICHERHEIT: Alte Device ID ${oldDeviceId} wurde resettet - bereit für neuen User`);

    // 🔔 6. BENACHRICHTIGUNG: Informiere das alte Gerät über erfolgreichen Transfer
    try {
      await broadcast('device-transfer-confirmation', {
        oldDeviceId,
        newDeviceId, 
        userName: user.name,
        success: true,
        message: `Gerätewechsel erfolgreich! Dein Account wurde auf das neue Gerät übertragen.`
      });
      logger.info(`[MagicCode] Bestätigung an altes Gerät ${oldDeviceId} gesendet`);
    } catch (broadcastError) {
      // Broadcast-Fehler sollten den Transfer nicht verhindern
      logger.warn(`[MagicCode] Warnung: Bestätigung an altes Gerät konnte nicht gesendet werden:`, broadcastError);
    }

    return {
      success: true,
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      userName: user.name,
      pushSubscriptionInfo
    };
  } catch (error) {
    logger.error('[MagicCode] Fehler beim Device Transfer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Transfer'
    };
  }
}

/**
 * Prüft ob für eine Device ID bereits ein aktiver Magic Code existiert
 */
export async function hasActiveMagicCode(deviceId: string): Promise<boolean> {
  try {
    await connectDB();

    const user = await User.findByDeviceId(deviceId);
    if (!user) return false;

    const activeCodes = await MagicCode.countDocuments({
      userId: user._id,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    return activeCodes > 0;
  } catch (error) {
    logger.error('[MagicCode] Fehler beim Prüfen aktiver Codes:', error);
    return false;
  }
}

/**
 * Holt aktive Magic Codes für Admin-Übersicht
 */
export async function getActiveMagicCodes() {
  try {
    await connectDB();

    const activeCodes = await MagicCode.find({
      isUsed: false,
      expiresAt: { $gt: new Date() }
    })
    .populate('userId', 'name deviceId')
    .sort({ createdAt: -1 });

    return activeCodes.map(code => ({
      id: (code._id as mongoose.Types.ObjectId).toString(),
      code: code.code,
      userName: (code.userId as any)?.name || 'Unbekannt',
      deviceId: (code.userId as any)?.deviceId || 'Unbekannt',
      expiresAt: code.expiresAt,
      createdBy: code.createdBy,
      adminId: code.adminId,
      createdAt: code.createdAt
    }));
  } catch (error) {
    logger.error('[MagicCode] Fehler beim Laden aktiver Codes:', error);
    return [];
  }
}

/**
 * Bereinigt abgelaufene Magic Codes
 */
export async function cleanupExpiredCodes(): Promise<number> {
  try {
    await connectDB();
    const deletedCount = await MagicCode.cleanupExpired();
    logger.info(`[MagicCode] ${deletedCount} abgelaufene Codes bereinigt`);
    return deletedCount;
  } catch (error) {
    logger.error('[MagicCode] Fehler beim Bereinigen abgelaufener Codes:', error);
    return 0;
  }
} 