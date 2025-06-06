import { Registration, IRegistration } from '@/lib/db/models/Registration';
import { User } from '@/lib/db/models/User';
import { Group } from '@/lib/db/models/Group';
import { connectDB } from '@/lib/db/connector';
import type { FestivalRegisterData } from '../components/steps/types';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';
import { verifySession } from '@/features/auth/actions/userAuth';
import { registerUser } from '@/features/auth/services/authService';

/**
 * Modernisierter Registration Service - verwendet das neue Auth-System
 */

/**
 * Erstellt eine neue Registration für die Nachmeldung (ohne Auth-Check)
 */
export async function createLateRegistration(data: FestivalRegisterData & { username: string, password: string }) {
  await connectDB();
  
  try {
    logger.info(`[LateRegistration] Starte Nachmeldung für ${data.name}`);

    // 1. Erstelle einen neuen User Account
    const user = await registerUser(
      data.name,
      data.username,
      data.password,
      'user',
      data.email || undefined
    );
    logger.info(`[LateRegistration] User-Account erstellt: ${user._id}`);

    // 2. Erstelle die Registration
    const registrationData = {
      name: data.name,
      days: data.days,
      isMedic: data.isMedic,
      travelType: data.travelType,
      equipment: data.equipment,
      concerns: data.concerns,
      wantsToOfferWorkshop: data.wantsToOfferWorkshop,
      sleepingPreference: data.sleepingPreference,
      lineupContribution: data.lineupContribution,
      canStaySober: data.canStaySober,
      wantsAwareness: data.wantsAwareness,
      programContribution: data.programContribution,
      hasConcreteIdea: data.hasConcreteIdea,
      wantsKitchenHelp: data.wantsKitchenHelp,
      allergies: data.allergies,
      allowsPhotos: data.allowsPhotos,
      wantsLineupContribution: data.wantsLineupContribution,
      contactType: data.contactType,
      contactInfo: data.contactInfo,
    };

    const registration = new Registration(registrationData);
    await registration.save();
    logger.info(`[LateRegistration] Registration erstellt: ${registration._id}`);

    // 3. Verknüpfe Registration mit User
    user.registrationId = registration._id as mongoose.Types.ObjectId;
    await user.save();
    logger.info(`[LateRegistration] User ${user._id} mit Registration ${registration._id} verknüpft`);

    return registration;
  } catch (error) {
    logger.error('[LateRegistration] Fehler bei Nachmeldung:', error);
    throw error;
  }
}

export async function createRegistration(data: FestivalRegisterData) {
  await connectDB();
  
  try {
    // Prüfe ob User authentifiziert ist
    const sessionData = await verifySession();
    if (!sessionData) {
      throw new Error('Benutzer muss angemeldet sein um sich zu registrieren');
    }
    
    logger.info(`[Registration] Starte Registrierung für User ${sessionData.userId} (${sessionData.email})`);
    
    // Prüfe ob User bereits eine Registration hat
    const existingUser = await User.findById(sessionData.userId);
    if (!existingUser) {
      throw new Error('Benutzer nicht gefunden');
    }
    
    if (existingUser.registrationId) {
      throw new Error('Benutzer ist bereits registriert');
    }
    
    const registrationData = {
      ...data,
    };
    
    const reg = new Registration(registrationData);
    await reg.save();
    logger.info(`[Registration] Registration erstellt: ${reg._id} für User: ${sessionData.userId}`);
    
    // Verknüpfe Registration mit User
    existingUser.registrationId = reg._id as mongoose.Types.ObjectId;
    // Aktualisiere Name falls geändert
    if (data.name.trim()) {
      existingUser.name = data.name;
    }
    await existingUser.save();
    
    // Automatische Gruppenzuweisung falls noch keine Gruppe
    if (!existingUser.groupId) {
      try {
        const randomGroup = await Group.getRandomAssignableGroup();
        if (randomGroup) {
          await existingUser.assignToGroup(randomGroup._id as mongoose.Types.ObjectId);
          logger.info(`[Registration] User ${existingUser._id} automatisch zu Gruppe ${randomGroup.name} zugewiesen`);
        }
      } catch (groupError) {
        logger.warn('[Registration] Fehler bei automatischer Gruppenzuweisung:', groupError);
      }
    }
    
    logger.info(`[Registration] User ${sessionData.userId} erfolgreich mit Registration ${reg._id} verknüpft`);
    
    return reg;
  } catch (error) {
    logger.error('[Registration] Fehler bei Registration-Erstellung:', error);
    throw error;
  }
}

export async function getRegistrations() {
  // Prüfe Admin-Berechtigung
  const sessionData = await verifySession();
  if (!sessionData || sessionData.role !== 'admin') {
    throw new Error('Admin-Berechtigung erforderlich');
  }
  
  const docs = await Registration.find().sort({ createdAt: -1 }).lean().exec();
  return docs.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  }));
}

export async function updateRegistrationStatus(id: string, updates: { paid?: boolean; checkedIn?: boolean }) {
  // Prüfe Admin-Berechtigung
  const sessionData = await verifySession();
  if (!sessionData || sessionData.role !== 'admin') {
    throw new Error('Admin-Berechtigung erforderlich');
  }
  
  const doc = await Registration.findByIdAndUpdate(id, updates, { new: true }).lean().exec();
  if (!doc) return null;
  return {
    ...doc,
    _id: doc._id.toString(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  };
}

export async function deleteRegistration(id: string): Promise<boolean> {
  // Prüfe Admin-Berechtigung
  const sessionData = await verifySession();
  if (!sessionData || sessionData.role !== 'admin') {
    throw new Error('Admin-Berechtigung erforderlich');
  }
  
  const res = await Registration.findByIdAndDelete(id);
  return !!res;
}

export async function updateRegistration(id: string, updates: Partial<IRegistration>): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!id) {
    return { success: false, error: 'ID ist erforderlich' };
  }
  
  // Prüfe Admin-Berechtigung
  const sessionData = await verifySession();
  if (!sessionData || sessionData.role !== 'admin') {
    return { success: false, error: 'Admin-Berechtigung erforderlich' };
  }
  
  await connectDB();
  
  try {
    const registration = await Registration.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    ).lean().exec();
    
    if (!registration) {
      return { success: false, error: 'Anmeldung nicht gefunden' };
    }
    
    const result = {
      ...registration,
      _id: registration._id.toString(),
      createdAt: registration.createdAt instanceof Date ? registration.createdAt.toISOString() : registration.createdAt,
    };
    
    logger.info(`[Registration] Anmeldung ${id} aktualisiert`);
    return { success: true, data: result };
  } catch (error) {
    logger.error('[Registration] Fehler bei updateRegistration:', error);
    return { success: false, error: 'Fehler beim Aktualisieren der Anmeldung' };
  }
} 

/**
 * Lädt Registration-Daten für den aktuell eingeloggten User
 */
export async function getCurrentUserRegistration(): Promise<{ success: boolean; data?: any; error?: string }> {
  const sessionData = await verifySession();
  if (!sessionData) {
    return { success: false, error: 'Nicht angemeldet' };
  }
  
  await connectDB();
  
  try {
    // Lade User mit Registration
    const user = await User.findById(sessionData.userId)
      .populate('registrationId')
      .lean()
      .exec();
    
    if (!user || !user.registrationId) {
      return { success: false, error: 'Keine Registration gefunden' };
    }
    
    // TypeScript Fix: Cast to any da populate() das Objekt zurückgibt
    const registration = user.registrationId as any;
    
    // Konvertiere zu FestivalRegisterData Format
    const registrationData = {
      name: registration.name || '',
      days: registration.days || [],
      isMedic: registration.isMedic || false,
      travelType: registration.travelType || 'auto',
      equipment: registration.equipment || '',
      concerns: registration.concerns || '',
      wantsToOfferWorkshop: registration.wantsToOfferWorkshop || '',
      sleepingPreference: registration.sleepingPreference || 'bed',
      lineupContribution: registration.lineupContribution || '',
      // Neue Felder
      canStaySober: registration.canStaySober || false,
      wantsAwareness: registration.wantsAwareness || false,
      programContribution: registration.programContribution || '',
      hasConcreteIdea: registration.hasConcreteIdea || false,
      wantsKitchenHelp: registration.wantsKitchenHelp || false,
      allergies: registration.allergies || '',
      allowsPhotos: registration.allowsPhotos !== undefined ? registration.allowsPhotos : true,
      contactType: registration.contactType || 'none',
      contactInfo: registration.contactInfo || '',
    };
    
    logger.info(`[Registration] Registration für User ${sessionData.userId} geladen`);
    
    // Serialisiere die vollständige Registration korrekt
    const serializedRegistration = {
      _id: registration._id?.toString(),
      name: registration.name,
      days: registration.days,
      isMedic: registration.isMedic,
      travelType: registration.travelType,
      equipment: registration.equipment,
      concerns: registration.concerns,
      wantsToOfferWorkshop: registration.wantsToOfferWorkshop,
      sleepingPreference: registration.sleepingPreference,
      lineupContribution: registration.lineupContribution,
      paid: registration.paid,
      checkedIn: registration.checkedIn,
      // Neue Felder
      canStaySober: registration.canStaySober,
      wantsAwareness: registration.wantsAwareness,
      programContribution: registration.programContribution,
      hasConcreteIdea: registration.hasConcreteIdea,
      wantsKitchenHelp: registration.wantsKitchenHelp,
      allergies: registration.allergies,
      allowsPhotos: registration.allowsPhotos,
      // Serialisiere Dates korrekt
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
    
    return { 
      success: true, 
      data: {
        ...serializedRegistration,
        // Zusätzlich: FestivalRegisterData für FormFeed
        formData: registrationData
      }
    };
  } catch (error) {
    logger.error('[Registration] Fehler beim Laden der Registration:', error);
    return { success: false, error: 'Fehler beim Laden der Registration' };
  }
} 

/**
 * Prüfung ob der aktuelle User bereits registriert ist
 */
export async function checkCurrentUserRegistrationStatus(): Promise<{ 
  isRegistered: boolean; 
  name?: string; 
  error?: string 
}> {
  const sessionData = await verifySession();
  if (!sessionData) {
    return { isRegistered: false, error: 'Nicht angemeldet' };
  }
  
  await connectDB();
  
  try {
    // Suche User und prüfe ob Registration verknüpft ist
    const user = await User.findById(sessionData.userId)
      .select('name registrationId') // Nur diese Felder laden
      .lean()
      .exec();
    
    if (!user) {
      return { isRegistered: false, error: 'Benutzer nicht gefunden' };
    }
    
    // User gefunden - prüfe ob Registration verknüpft
    if (user.registrationId) {
      return { 
        isRegistered: true, 
        name: user.name 
      };
    }
    
    return { isRegistered: false };
  } catch (error) {
    logger.error('[Registration] Fehler bei checkCurrentUserRegistrationStatus:', error);
    return { isRegistered: false, error: 'Fehler beim Prüfen des Status' };
  }
} 