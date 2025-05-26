import { Registration, IRegistration } from '@/lib/db/models/Registration';
import { User } from '@/lib/db/models/User';
import { Group } from '@/lib/db/models/Group';
import { connectDB } from '@/lib/db/connector';
import { FestivalRegisterData } from '../FestivalRegisterForm';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';

export async function createRegistration(data: FestivalRegisterData) {
  await connectDB();
  
  try {
    // Erstelle die Registration
    const reg = new Registration(data);
    await reg.save();
    logger.info(`[Registration] Registration erstellt: ${reg._id}`);
    
    // Wenn deviceId vorhanden ist, erstelle automatisch einen User
    if (data.deviceId && data.name.trim()) {
      logger.info(`[Registration] Versuche User-Erstellung für deviceId: ${data.deviceId}, name: ${data.name}`);
      
      try {
        // Prüfe ob bereits ein User mit dieser deviceId existiert
        const existingUser = await User.findByDeviceId(data.deviceId);
        
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
            deviceId: data.deviceId,
            registrationId: reg._id,
            isActive: true
          });
          
          logger.info(`[Registration] Neuer User erfolgreich erstellt: ${newUser._id} für Device: ${data.deviceId}`);
          
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
          deviceId: data.deviceId,
          name: data.name,
          registrationId: reg._id
        });
      }
    } else {
      logger.warn(`[Registration] User-Erstellung übersprungen - deviceId: ${data.deviceId}, name: "${data.name}"`);
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