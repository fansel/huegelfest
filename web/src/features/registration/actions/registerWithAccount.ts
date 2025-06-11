"use server";

import { registerUser } from '@/features/auth/services/authService';
import { loginUser } from '@/features/auth/actions/userAuth';
import { Registration } from '@/lib/db/models/Registration';
import { User } from '@/lib/db/models/User';
import { connectDB } from '@/lib/db/connector';
import { logger } from '@/lib/logger';
import { broadcast } from '@/lib/websocket/broadcast';
import type { FestivalRegisterData } from '../components/steps/types';
import mongoose from 'mongoose';

export interface RegisterWithAccountResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Kombinierte Aktion: Account-Erstellung + Festival-Registrierung + Auto-Login
 * 
 * Flow:
 * 1. Prüfe ob Username bereits existiert
 * 2. Erstelle User-Account mit gehashtem Passwort
 * 3. Logge User automatisch ein (Session)
 * 4. Erstelle Festival-Registration
 * 5. Verknüpfe Registration mit User
 * 
 * @param registrationData - Festival-Daten (OHNE Passwort!)
 * @param password - Passwort für Account-Erstellung (wird nur temporär verwendet)
 */
export async function registerWithAccount(
  registrationData: FestivalRegisterData & { username: string },
  password: string
): Promise<RegisterWithAccountResult> {
  
  if (!registrationData.username || !password) {
    return {
      success: false,
      error: 'Username und Passwort sind erforderlich'
    };
  }

  if (!registrationData.name.trim()) {
    return {
      success: false,
      error: 'Name ist erforderlich'
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: 'Passwort muss mindestens 8 Zeichen lang sein'
    };
  }

  await connectDB();

  const lowerCaseUsername = registrationData.username.toLowerCase();

  try {
    logger.info(`[RegisterWithAccount] Starte kombinierte Registrierung für: ${registrationData.name} (@${lowerCaseUsername})`);

    // 1. User-Account erstellen
    let user;
    try {
      user = await registerUser(
        registrationData.name,
        lowerCaseUsername,
        password,
        'user',
        registrationData.email || undefined
      );
      logger.info(`[RegisterWithAccount] User-Account erstellt: ${user._id}`);
    } catch (error) {
      // Prüfe ob Username bereits existiert
      if (error instanceof Error && error.message.includes('bereits vergeben')) {
        return {
          success: false,
          error: 'Dieser Username ist bereits vergeben. Bitte wähle einen anderen.'
        };
      }
      if (error instanceof Error && error.message.includes('E-Mail-Adresse existiert bereits')) {
        return {
          success: false,
          error: 'Ein Account mit dieser E-Mail-Adresse existiert bereits.'
        };
      }
      throw error; // Andere Fehler weiterwerfen
    }

    // 2. User automatisch einloggen
    const loginResult = await loginUser(lowerCaseUsername, password);
    if (!loginResult.success) {
      logger.error(`[RegisterWithAccount] Auto-Login fehlgeschlagen für @${lowerCaseUsername}`);
      return {
        success: false,
        error: 'Account erstellt, aber Login fehlgeschlagen. Bitte versuche dich anzumelden.'
      };
    }

    // 3. Festival-Registration erstellen (OHNE Passwort und Username!)
    const registrationDataClean = {
      name: registrationData.name,
      days: registrationData.days,
      isMedic: registrationData.isMedic,
      travelType: registrationData.travelType,
      equipment: registrationData.equipment,
      concerns: registrationData.concerns,
      wantsToOfferWorkshop: registrationData.wantsToOfferWorkshop,
      sleepingPreference: registrationData.sleepingPreference,
      lineupContribution: registrationData.lineupContribution,
      canStaySober: registrationData.canStaySober,
      wantsAwareness: registrationData.wantsAwareness,
      programContribution: registrationData.programContribution,
      hasConcreteIdea: registrationData.hasConcreteIdea,
      wantsKitchenHelp: registrationData.wantsKitchenHelp,
      allergies: registrationData.allergies,
      allowsPhotos: registrationData.allowsPhotos,
      wantsLineupContribution: registrationData.wantsLineupContribution,
      contactType: registrationData.contactType,
      contactInfo: registrationData.contactInfo,
    };

    const registration = new Registration(registrationDataClean);
    await registration.save();
    logger.info(`[RegisterWithAccount] Festival-Registration erstellt: ${registration._id}`);

    // 4. Registration mit User verknüpfen
    user.registrationId = registration._id as mongoose.Types.ObjectId;
    await user.save();
    logger.info(`[RegisterWithAccount] User ${user._id} mit Registration ${registration._id} verknüpft`);

    // 5. WebSocket-Broadcast
    await broadcast('registration-created', {
      registrationId: registration._id?.toString(),
      userName: registrationData.name,
      userId: (user._id as mongoose.Types.ObjectId).toString()
    });

    logger.info(`[RegisterWithAccount] Kombinierte Registrierung erfolgreich abgeschlossen für ${registrationData.name} (@${lowerCaseUsername})`);

    return {
      success: true,
      user: {
        id: loginResult.user?.id || (user._id as mongoose.Types.ObjectId).toString(),
        name: loginResult.user?.name || user.name,
        email: loginResult.user?.email || user.email || ''
      }
    };

  } catch (error) {
    logger.error('[RegisterWithAccount] Fehler bei kombinierter Registrierung:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten'
    };
  }
} 