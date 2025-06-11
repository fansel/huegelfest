'use server';

import { verifySession } from '@/features/auth/actions/userAuth';
import { connectDB } from '@/lib/db/connector';
import { User } from '@/lib/db/models/User';
import { Registration } from '@/lib/db/models/Registration';
import { logger } from '@/lib/logger';
import { broadcast } from '@/lib/websocket/broadcast';

export async function deleteRegistrationCompletelyAction(registrationId: string): Promise<{ success: boolean; error?: string }> {
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

    // Lade Registration um Name für Logging zu bekommen
    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return { success: false, error: 'Anmeldung nicht gefunden' };
    }

    const registrationName = (registration as any).name;

    // Finde alle User die mit dieser Registration verknüpft sind
    const linkedUsers = await User.find({ registrationId: registrationId });
    
    // Entferne Verknüpfungen
    for (const user of linkedUsers) {
      user.registrationId = undefined;
      await user.save();
      logger.info(`[DeleteRegistrationCompletely] Verknüpfung für User ${user.name} (${user._id}) aufgehoben`);
    }

    // Lösche die Registration
    await Registration.findByIdAndDelete(registrationId);

    logger.info(`[DeleteRegistrationCompletely] Registration ${registrationName} (${registrationId}) komplett gelöscht durch Admin ${sessionData.email}`);
    
    // WebSocket-Broadcast für Real-time Updates
    await broadcast('registration-deleted', {
      registrationId,
      registrationName,
      deletedBy: sessionData.email
    });

    return { success: true };
  } catch (error) {
    logger.error('[DeleteRegistrationCompletely] Fehler beim Löschen der Registration:', error);
    return { success: false, error: 'Fehler beim Löschen der Anmeldung' };
  }
} 