'use server';

import { verifySession } from '@/features/auth/actions/userAuth';
import { connectDB } from '@/lib/db/connector';
import { User } from '@/lib/db/models/User';
import { logger } from '@/lib/logger';

export async function unlinkUserRegistrationAction(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Prüfe Admin-Berechtigung
    const sessionData = await verifySession();
    if (!sessionData || sessionData.role !== 'admin') {
      return { success: false, error: 'Admin-Berechtigung erforderlich' };
    }

    if (!userId) {
      return { success: false, error: 'User-ID ist erforderlich' };
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User nicht gefunden' };
    }

    if (!user.registrationId) {
      return { success: false, error: 'User hat keine verknüpfte Anmeldung' };
    }

    const registrationId = user.registrationId;
    
    // Entferne die Verknüpfung (Registration bleibt bestehen, aber nicht mehr verknüpft)
    user.registrationId = undefined;
    await user.save();

    logger.info(`[UnlinkRegistration] Verknüpfung zwischen User ${user.name} (${userId}) und Registration ${registrationId} aufgehoben`);
    
    return { success: true };
  } catch (error) {
    logger.error('[UnlinkRegistration] Fehler beim Aufheben der Verknüpfung:', error);
    return { success: false, error: 'Fehler beim Aufheben der Verknüpfung' };
  }
}

/**
 * Hebt die Verknüpfung zwischen Registration und User auf (anhand Registration-ID)
 */
export async function unlinkRegistrationFromUserAction(registrationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Prüfe Admin-Berechtigung
    const sessionData = await verifySession();
    if (!sessionData || sessionData.role !== 'admin') {
      return { success: false, error: 'Admin-Berechtigung erforderlich' };
    }

    if (!registrationId) {
      return { success: false, error: 'Registration-ID ist erforderlich' };
    }

    await connectDB();

    // Finde User die mit dieser Registration verknüpft sind
    const linkedUsers = await User.find({ registrationId: registrationId });
    
    if (linkedUsers.length === 0) {
      return { success: false, error: 'Keine User mit dieser Anmeldung verknüpft' };
    }

    // Entferne Verknüpfungen von allen gefundenen Usern
    for (const user of linkedUsers) {
      user.registrationId = undefined;
      await user.save();
      logger.info(`[UnlinkRegistration] Verknüpfung für User ${user.name} (${user._id}) mit Registration ${registrationId} aufgehoben`);
    }

    return { success: true };
  } catch (error) {
    logger.error('[UnlinkRegistration] Fehler beim Aufheben der Verknüpfung:', error);
    return { success: false, error: 'Fehler beim Aufheben der Verknüpfung' };
  }
} 