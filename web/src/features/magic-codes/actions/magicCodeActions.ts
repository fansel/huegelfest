"use server";

import { 
  createMagicCode, 
  transferDevice, 
  hasActiveMagicCode,
  getActiveMagicCodes,
  cleanupExpiredCodes,
  type MagicCodeResult,
  type DeviceTransferResult
} from '../services/magicCodeService';
import { verifyToken } from '@/features/auth/services/authService';
import { cookies } from 'next/headers';

/**
 * Server Action: Erstellt Magic Code für eigenes Gerät (User)
 */
export async function createMagicCodeAction(deviceId: string): Promise<MagicCodeResult> {
  if (!deviceId) {
    return { success: false, error: 'Device ID ist erforderlich' };
  }

  return await createMagicCode(deviceId, 'user');
}

/**
 * Server Action: Erstellt Magic Code für Benutzer (Admin)
 */
export async function createMagicCodeByAdminAction(deviceId: string): Promise<MagicCodeResult> {
  try {
    // Prüfe Admin-Berechtigung
    const cookiesStore = await cookies();
    const token = cookiesStore.get('authToken')?.value;
    
    if (!token) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.isAdmin) {
      return { success: false, error: 'Admin-Berechtigung erforderlich' };
    }

    if (!deviceId) {
      return { success: false, error: 'Device ID ist erforderlich' };
    }

    return await createMagicCode(deviceId, 'admin', payload.username);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Fehler bei der Admin-Authentifizierung' 
    };
  }
}

/**
 * Server Action: Führt Device Transfer mit Magic Code durch
 */
export async function transferDeviceAction(
  code: string, 
  newDeviceId: string
): Promise<DeviceTransferResult> {
  if (!code || !newDeviceId) {
    return { success: false, error: 'Code und Device ID sind erforderlich' };
  }

  return await transferDevice(code, newDeviceId);
}

/**
 * Server Action: Prüft ob aktiver Magic Code existiert
 */
export async function checkActiveMagicCodeAction(deviceId: string): Promise<boolean> {
  if (!deviceId) return false;
  return await hasActiveMagicCode(deviceId);
}

/**
 * Server Action: Holt aktive Magic Codes (Admin)
 */
export async function getActiveMagicCodesAction() {
  try {
    // Prüfe Admin-Berechtigung
    const cookiesStore = await cookies();
    const token = cookiesStore.get('authToken')?.value;
    
    if (!token) {
      return [];
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.isAdmin) {
      return [];
    }

    return await getActiveMagicCodes();
  } catch (error) {
    return [];
  }
}

/**
 * Server Action: Bereinigt abgelaufene Magic Codes (Admin)
 */
export async function cleanupExpiredCodesAction(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    // Prüfe Admin-Berechtigung
    const cookiesStore = await cookies();
    const token = cookiesStore.get('authToken')?.value;
    
    if (!token) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.isAdmin) {
      return { success: false, error: 'Admin-Berechtigung erforderlich' };
    }

    const deletedCount = await cleanupExpiredCodes();
    return { success: true, deletedCount };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Fehler beim Bereinigen' 
    };
  }
} 