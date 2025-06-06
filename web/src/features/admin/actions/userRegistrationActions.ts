'use server';

import { verifySession } from '@/features/auth/actions/userAuth';
import { connectDB } from '@/lib/db/connector';
import { User } from '@/lib/db/models/User';
import { Registration } from '@/lib/db/models/Registration';
import { logger } from '@/lib/logger';

export interface UserRegistrationResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Lädt die Anmeldungsdaten für einen spezifischen User
 * Nur für Admins verfügbar
 */
export async function getUserRegistrationByUserIdAction(
  userId: string
): Promise<UserRegistrationResult> {
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

    // Finde User und lade seine Registration
    const user = await User.findById(userId)
      .populate('registrationId')
      .lean()
      .exec();

    if (!user) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }

    if (!user.registrationId) {
      return { success: false, error: 'Keine Anmeldung für diesen Benutzer gefunden' };
    }

    // TypeScript Fix: Cast registration da populate() das Objekt zurückgibt
    const registration = user.registrationId as any;

    // Serialisiere Registration korrekt für Client
    const serializedRegistration = {
      _id: registration._id?.toString(),
      name: registration.name,
      days: registration.days,
      contactType: registration.contactType,
      contactInfo: registration.contactInfo,
      travelType: registration.travelType,
      sleepingPreference: registration.sleepingPreference,
      isMedic: registration.isMedic,
      canStaySober: registration.canStaySober,
      wantsAwareness: registration.wantsAwareness,
      wantsKitchenHelp: registration.wantsKitchenHelp,
      allowsPhotos: registration.allowsPhotos,
      paid: registration.paid,
      checkedIn: registration.checkedIn,
      programContribution: registration.programContribution,
      equipment: registration.equipment,
      wantsToOfferWorkshop: registration.wantsToOfferWorkshop,
      lineupContribution: registration.lineupContribution,
      allergies: registration.allergies,
      concerns: registration.concerns,
      createdAt: registration.createdAt ? 
        (registration.createdAt instanceof Date ? 
          registration.createdAt.toISOString() : 
          registration.createdAt) : 
        null,
      updatedAt: registration.updatedAt ? 
        (registration.updatedAt instanceof Date ? 
          registration.updatedAt.toISOString() : 
          registration.updatedAt) : 
        null,
    };

    logger.info(`[UserRegistrationActions] Registration für User ${userId} geladen`);

    return { 
      success: true, 
      data: serializedRegistration
    };

  } catch (error) {
    logger.error('[UserRegistrationActions] Fehler beim Laden der User-Registration:', error);
    return { 
      success: false, 
      error: 'Fehler beim Laden der Anmeldung' 
    };
  }
} 