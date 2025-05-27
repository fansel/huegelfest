import { Registration, IRegistration } from '@/lib/db/models/Registration';
import { User } from '@/lib/db/models/User';
import { Group } from '@/lib/db/models/Group';
import { connectDB } from '@/lib/db/connector';
import { FestivalRegisterData } from '../FestivalRegisterForm';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';

// Hilfsfunktion um neue deviceId zu generieren
function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createRegistration(data: FestivalRegisterData) {
  await connectDB();
  
  try {
    // NEUE LOGIK: Prüfe deviceID-Konflikte und generiere neue deviceID wenn nötig
    let finalDeviceId = data.deviceId;
    
    if (data.deviceId && data.name.trim()) {
      const existingUser = await User.findByDeviceId(data.deviceId);
      
      if (existingUser && existingUser.name.trim() !== data.name.trim()) {
        // DeviceID wird bereits von einem anderen User verwendet!
        // Generiere neue deviceID für diese Anmeldung
        let newDeviceId;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
          newDeviceId = generateDeviceId();
          attempts++;
          const conflict = await User.findByDeviceId(newDeviceId);
          if (!conflict) break;
        } while (attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
          throw new Error('Konnte keine freie Device ID generieren');
        }
        
        finalDeviceId = newDeviceId;
        logger.info(`[Registration] DeviceID-Konflikt erkannt! ${data.deviceId} bereits von ${existingUser.name} verwendet. Neue deviceID generiert: ${finalDeviceId}`);
      }
    }
    
    // Erstelle die Registration mit der finalen deviceID
    const registrationData = {
      ...data,
      deviceId: finalDeviceId
    };
    
    const reg = new Registration(registrationData);
    await reg.save();
    logger.info(`[Registration] Registration erstellt: ${reg._id} mit deviceId: ${finalDeviceId}`);
    
    // Wenn deviceId vorhanden ist, erstelle automatisch einen User
    if (finalDeviceId && data.name.trim()) {
      logger.info(`[Registration] Versuche User-Erstellung für deviceId: ${finalDeviceId}, name: ${data.name}`);
      
      try {
        // Prüfe ob bereits ein User mit dieser deviceId existiert
        const existingUser = await User.findByDeviceId(finalDeviceId);
        
        if (existingUser) {
          logger.info(`[Registration] Bestehender User gefunden: ${existingUser._id}`);
          // Aktualisiere bestehenden User mit neuer Registration
          existingUser.name = data.name;
          existingUser.registrationId = reg._id as mongoose.Types.ObjectId;
          await existingUser.save();
          
          // Automatische Gruppenzuweisung für bestehende User ohne Gruppe
          if (!existingUser.groupId) {
            try {
              const randomGroup = await Group.getRandomAssignableGroup();
              if (randomGroup) {
                await existingUser.assignToGroup(randomGroup._id as mongoose.Types.ObjectId);
                logger.info(`[Registration] Bestehender User ${existingUser._id} automatisch zu Gruppe ${randomGroup.name} zugewiesen`);
              }
            } catch (groupError) {
              logger.warn('[Registration] Fehler bei automatischer Gruppenzuweisung für bestehenden User:', groupError);
            }
          }
          
          logger.info(`[Registration] Bestehender User aktualisiert: ${existingUser._id}`);
        } else {
          logger.info(`[Registration] Kein existierender User gefunden, erstelle neuen User`);
          
          // Erstelle neuen User
          const newUser = await User.create({
            name: data.name,
            deviceId: finalDeviceId,
            registrationId: reg._id,
            isActive: true
          });
          
          logger.info(`[Registration] Neuer User erfolgreich erstellt: ${newUser._id} für Device: ${finalDeviceId}`);
          
          // Automatische Gruppenzuweisung für neue User
          try {
            const randomGroup = await Group.getRandomAssignableGroup();
            if (randomGroup) {
              await newUser.assignToGroup(randomGroup._id as mongoose.Types.ObjectId);
              logger.info(`[Registration] Neuer User ${newUser._id} automatisch zu Gruppe ${randomGroup.name} zugewiesen`);
            } else {
              logger.info(`[Registration] Neuer User ${newUser._id} erstellt - keine verfügbare Gruppe für automatische Zuweisung`);
            }
          } catch (groupError) {
            logger.warn('[Registration] Fehler bei automatischer Gruppenzuweisung für neuen User:', groupError);
          }
        }
      } catch (userError) {
        // User-Erstellung sollte die Registration nicht verhindern
        logger.error('[Registration] Fehler bei User-Erstellung:', userError);
        // Werfe den Fehler nicht weiter, aber logge alle Details
        console.error('[Registration] Detaillierter User-Erstellungsfehler:', {
          error: userError,
          deviceId: finalDeviceId,
          name: data.name,
          registrationId: reg._id
        });
      }
    } else {
      logger.warn(`[Registration] User-Erstellung übersprungen - deviceId: ${finalDeviceId}, name: "${data.name}"`);
    }
    
    return reg;
  } catch (error) {
    logger.error('[Registration] Fehler bei Registration-Erstellung:', error);
    throw error;
  }
}

export async function getRegistrations() {
  const docs = await Registration.find().sort({ createdAt: -1 }).lean().exec();
  return docs.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  }));
}

export async function updateRegistrationStatus(id: string, updates: { paid?: boolean; checkedIn?: boolean }) {
  const doc = await Registration.findByIdAndUpdate(id, updates, { new: true }).lean().exec();
  if (!doc) return null;
  return {
    ...doc,
    _id: doc._id.toString(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  };
}

export async function deleteRegistration(id: string): Promise<boolean> {
  const res = await Registration.findByIdAndDelete(id);
  return !!res;
}

export async function updateRegistration(id: string, updates: Partial<IRegistration>): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!id) {
    return { success: false, error: 'ID ist erforderlich' };
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
 * Lädt Registration-Daten für einen User basierend auf deviceId
 * Wird verwendet um nach Device Transfer die bestehende Registration zu laden
 */
export async function getRegistrationByDeviceId(deviceId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!deviceId) {
    return { success: false, error: 'Device ID ist erforderlich' };
  }
  
  await connectDB();
  
  try {
    // Finde User mit Registration
    let user = await User.findOne({ deviceId, isActive: true })
      .populate('registrationId')
      .lean()
      .exec();
    
    if (!user || !user.registrationId) {
      // NEUE LOGIK: Suche auch nach Registration ohne User-Verknüpfung
      // Das kann passieren wenn Registration existiert aber User fehlt
      const orphanRegistration = await Registration.findOne({ deviceId }).lean().exec();
      
      if (orphanRegistration) {
        logger.info(`[Registration] Orphan Registration gefunden für ${deviceId}, erstelle User`);
        
        try {
          // Erstelle User für bestehende Registration
          const newUser = await User.create({
            name: orphanRegistration.name,
            deviceId: deviceId,
            registrationId: orphanRegistration._id,
            isActive: true
          });
          
          // Automatische Gruppenzuweisung
          try {
            const randomGroup = await Group.getRandomAssignableGroup();
            if (randomGroup) {
              await newUser.assignToGroup(randomGroup._id as mongoose.Types.ObjectId);
              logger.info(`[Registration] User ${newUser._id} automatisch zu Gruppe ${randomGroup.name} zugewiesen`);
            }
          } catch (groupError) {
            logger.warn('[Registration] Fehler bei automatischer Gruppenzuweisung:', groupError);
          }
          
          // Lade den neu erstellten User mit populated Registration
          user = await User.findById(newUser._id)
            .populate('registrationId')
            .lean()
            .exec();
            
          logger.info(`[Registration] User für bestehende Registration erstellt: ${newUser._id}`);
        } catch (userError) {
          logger.error('[Registration] Fehler beim Erstellen des Users für bestehende Registration:', userError);
          return { success: false, error: 'Fehler beim Erstellen des Benutzers' };
        }
      } else {
        return { success: false, error: 'Keine Registration gefunden' };
      }
    }
    
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
      deviceId: deviceId,
      // Neue Felder
      canStaySober: registration.canStaySober || false,
      wantsAwareness: registration.wantsAwareness || false,
      programContribution: registration.programContribution || '',
      hasConcreteIdea: registration.hasConcreteIdea || false,
      wantsKitchenHelp: registration.wantsKitchenHelp || false,
      allergies: registration.allergies || '',
      allowsPhotos: registration.allowsPhotos !== undefined ? registration.allowsPhotos : true,
    };
    
    logger.info(`[Registration] Bestehende Registration für ${deviceId} geladen:`, {
      name: registrationData.name,
      days: registrationData.days,
    });
    
    // Debug: Logge alle Details der geladenen Registration
    console.log('[RegistrationService] Raw registration from DB:', registration);
    console.log('[RegistrationService] Converted registrationData:', registrationData);
    
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