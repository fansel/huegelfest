"use server";

import { MagicCode } from '@/lib/db/models/MagicCode';
import { User } from '@/lib/db/models/User';
import { Subscriber } from '@/lib/db/models/Subscriber';
import { Registration } from '@/lib/db/models/Registration';
import { connectDB } from '@/lib/db/connector';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';
import { broadcast } from '@/lib/websocket/broadcast';
import { sendPushNotificationToDevice } from '@/features/push/services/pushService';

export interface MagicCodeResult {
  success: boolean;
  code?: string;
  expiresAt?: string;
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
  transferredDeviceId?: string;
  newFreshDeviceId?: string;
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
      expiresAt: magicCode.expiresAt.toISOString()
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

    // Hole User mit allen Daten
    const user = await User.findById(magicCode.userId)
      .populate('registrationId')
      .populate('groupId');

    if (!user) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }

    const oldDeviceId = user.deviceId;
    
    // 🚨 CRITICAL: Verhindere Self-Transfer 
    if (oldDeviceId === newDeviceId) {
      logger.warn(`[MagicCode] Self-Transfer verhindert: ${oldDeviceId} → ${newDeviceId}`);
      return { 
        success: false, 
        error: 'Transfer auf das gleiche Gerät ist nicht möglich. Verwende ein anderes Gerät.' 
      };
    }
    
    logger.info(`[MagicCode] Starte Device Transfer: User ${user.name} von Gerät ${oldDeviceId} → ${newDeviceId}`);

    // 1. 🔥 WICHTIG: Markiere Magic Code als verwendet SOFORT - bevor er gelöscht werden könnte
    magicCode.isUsed = true;
    await magicCode.save();
    logger.info(`[MagicCode] Magic Code ${code} als verwendet markiert`);

    // 2. Push-Subscription Info initialisieren
    let pushSubscriptionInfo: {
      hadPushSubscription: boolean;
      requiresReactivation: boolean;
      message?: string;
    } = {
      hadPushSubscription: false,
      requiresReactivation: false
    };

    // 3. Prüfe was auf dem neuen Gerät bereits existiert und lösche es komplett
    logger.info(`[MagicCode] Bereite neues Gerät ${newDeviceId} vor - lösche alle existierenden Daten`);
    
    // Lösche existierende User auf neuem Gerät (egal ob leer oder nicht)
    const existingNewUser = await User.findByDeviceId(newDeviceId);
    if (existingNewUser) {
      logger.info(`[MagicCode] Lösche existierenden User ${existingNewUser._id} auf neuem Gerät ${newDeviceId}`);
      // Lösche auch dessen Registration falls vorhanden
      if (existingNewUser.registrationId) {
        await Registration.findByIdAndDelete(existingNewUser.registrationId);
        logger.info(`[MagicCode] Registration ${existingNewUser.registrationId} auf neuem Gerät gelöscht`);
      }
      await User.findByIdAndDelete(existingNewUser._id);
    }

    // Lösche existierende Push-Subscription auf neuem Gerät
    const existingNewPushSub = await Subscriber.findOne({ deviceId: newDeviceId });
    if (existingNewPushSub) {
      logger.info(`[MagicCode] Lösche existierende Push-Subscription auf neuem Gerät ${newDeviceId}`);
      await Subscriber.deleteOne({ deviceId: newDeviceId });
    }

    // Lösche existierende Magic Codes auf neuem Gerät
    await MagicCode.deleteMany({ deviceId: newDeviceId });

    // 4. Push-Subscription Handling für altes Gerät 
    const oldPushSub = await Subscriber.findOne({ deviceId: oldDeviceId });
    if (oldPushSub) {
      pushSubscriptionInfo = {
        hadPushSubscription: true,
        requiresReactivation: true,
        message: 'Push-Benachrichtigungen müssen auf dem neuen Gerät neu aktiviert werden'
      };
      logger.info(`[MagicCode] User hatte Push-Subscription auf altem Gerät - muss neu aktiviert werden`);
      // Subscription wird später gelöscht wenn altes Gerät resettet wird
    }

    // 5. ✨ KERNPUNKT: User-DeviceID bleibt gleich, aber User "wandert" zum neuen Gerät
    // Das bedeutet: Alle Daten (Registration, Groups etc.) bleiben mit der alten deviceId verknüpft
    // Aber das neue Gerät nimmt diese deviceId an!
    
    // Die alte deviceId wird zum neuen Gerät transferiert
    const transferredDeviceId = oldDeviceId; // Das ist die "Identität" des Users
    
    logger.info(`[MagicCode] TRANSFER: User-Identität ${transferredDeviceId} wandert von physischem Gerät ${oldDeviceId} zu ${newDeviceId}`);
    
    // User behält seine deviceId (seine "Identität") - nur das physische Gerät ändert sich
    // KEINE Änderung an user.deviceId nötig - die bleibt gleich!
    
    // 6. Erstelle neue deviceId für das alte (nun verlassene) physische Gerät
    // KEIN neuer User wird erstellt - nur eine neue deviceId generiert für Referenzierung
    const newFreshDeviceId = generateDeviceId(); // Neue zufällige deviceId für altes Gerät
    
    logger.info(`[MagicCode] Altes Gerät resettet: Neue deviceId ${newFreshDeviceId} für das verlassene Gerät erstellt`);

    // 7. Lösche alte Push-Subscription (das alte Gerät hat jetzt neue deviceId)
    if (oldPushSub) {
      await Subscriber.deleteOne({ deviceId: oldDeviceId });
      logger.info(`[MagicCode] Push-Subscription von altem Gerät gelöscht`);
    }

    // 8. Lösche verbrauchte Magic Codes für das alte Gerät (AUSSER den gerade verwendeten!)
    await MagicCode.deleteMany({ 
      deviceId: oldDeviceId,
      _id: { $ne: magicCode._id } // Behalte den gerade verwendeten Code für Logging
    });

    logger.info(`[MagicCode] Device Transfer Kern-Logik abgeschlossen:`);
    logger.info(`[MagicCode] - User ${user.name} behält Identität ${transferredDeviceId}`);
    logger.info(`[MagicCode] - Neues Gerät übernimmt diese Identität`);
    logger.info(`[MagicCode] - Altes Gerät bekommt neue Identität ${newFreshDeviceId}`);

    // 🔔 9. BENACHRICHTIGUNG: Informiere das alte Gerät über erfolgreichen Transfer
    try {
      await broadcast('device-transfer-confirmation', {
        oldDeviceId, // Das physische alte Gerät
        newDeviceId, // Das physische neue Gerät
        newFreshDeviceId, // Die neue deviceId für das alte Gerät
        transferredDeviceId, // Die User-Identität die gewandert ist
        userName: user.name,
        success: true,
        message: `Gerätewechsel erfolgreich! Dein Account ist jetzt auf dem neuen Gerät verfügbar.`
      });
      logger.info(`[MagicCode] Transfer-Bestätigung gesendet`);
    } catch (broadcastError) {
      logger.warn(`[MagicCode] Warnung: Transfer-Bestätigung konnte nicht gesendet werden:`, broadcastError);
    }

    // 🎯 10. PUSH-BEHANDLUNG für neues Gerät: Automatisch fragen nach Push-Erlaubnis
    try {
      logger.info(`[MagicCode] Trigger Push-Aktivierung auf neuem Gerät ${newDeviceId}`);
      
      await broadcast('device-transfer-push-prompt', {
        deviceId: newDeviceId,
        transferredDeviceId, // Die User-Identität
        userName: user.name,
        reason: 'device-transfer',
        hadPreviousPush: !!oldPushSub,
        // 🚨 NEUE PUSH-STATUS-INFO: Informiere das neue Gerät über den Push-Status
        pushWasActive: !!oldPushSub // Explizit: ob Push-Nachrichten vorher aktiv waren
      });
      
      logger.info(`[MagicCode] Push-Aktivierungs-Prompt an neues Gerät gesendet (hadPreviousPush: ${!!oldPushSub})`);
      pushSubscriptionInfo.requiresReactivation = true;
      pushSubscriptionInfo.message = !!oldPushSub 
        ? 'Push-Benachrichtigungen werden automatisch reaktiviert'
        : 'Push-Benachrichtigungen können aktiviert werden';
    } catch (broadcastError) {
      logger.warn(`[MagicCode] Push-Prompt-Trigger konnte nicht gesendet werden:`, broadcastError);
    }

    return {
      success: true,
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      userName: user.name,
      transferredDeviceId, // Die User-Identität die mit wandert
      newFreshDeviceId, // Die neue deviceId für das alte Gerät
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

// Import der einheitlichen Device-ID-Generierung
function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
    .sort({ createdAt: -1 })
    .lean(); // Wichtig: lean() für plain objects

    return activeCodes.map(code => ({
      id: (code._id as mongoose.Types.ObjectId).toString(),
      code: code.code,
      userName: (code.userId as any)?.name || 'Unbekannt',
      deviceId: (code.userId as any)?.deviceId || 'Unbekannt',
      expiresAt: code.expiresAt.toISOString(), // Serialisiere zu ISO String
      createdBy: code.createdBy,
      adminId: code.adminId,
      createdAt: code.createdAt.toISOString() // Serialisiere zu ISO String
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