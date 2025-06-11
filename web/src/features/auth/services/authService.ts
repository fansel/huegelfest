import { User } from '@/lib/db/models/User';
import { connectDB } from '@/lib/db/connector';

/**
 * Vereinfachter Auth-Service für das vereinheitlichte User-System
 * Alle User (normale User + Admins) verwenden dasselbe Model
 */

/**
 * Validiert User-Credentials (Username/E-Mail + Passwort)
 * @param identifier - Username oder E-Mail-Adresse
 * @param password - Passwort
 * @returns User-Objekt wenn erfolgreich, null wenn nicht
 */
export async function validateCredentials(identifier: string, password: string) {
  try {
    // Verwende getUserIncludingShadow damit sich auch Shadow Users einloggen können
    const user = await getUserIncludingShadow(identifier);
    
    if (!user) {
      return { user: null, error: 'Benutzername oder Passwort stimmen nicht überein' };
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      await user.incrementFailedLoginAttempts();
      return { user: null, error: 'Benutzername oder Passwort stimmen nicht überein' };
    }

    if (user.isLocked()) {
      return { user: null, error: 'Account ist temporär gesperrt' };
    }

    await user.resetFailedLoginAttempts();
    user.lastLogin = new Date();
    await user.save();

    return { user, error: null };
  } catch (error) {
    console.error('Fehler bei der Anmeldung:', error);
    return { user: null, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Registriert einen neuen User
 * @param name - Name des Users
 * @param username - Username (erforderlich)
 * @param password - Passwort
 * @param role - Rolle (user oder admin)
 * @param email - Optionale E-Mail-Adresse
 * @returns Neuer User
 */
export async function registerUser(
  name: string, 
  username: string, 
  password: string, 
  role: 'user' | 'admin' = 'user',
  email?: string
) {
  try {
    await connectDB();
    
    // Prüfen ob Username bereits existiert
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      throw new Error('Dieser Username ist bereits vergeben');
    }
    
    // Prüfen ob E-Mail bereits existiert (falls angegeben)
    if (email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new Error('Ein User mit dieser E-Mail-Adresse existiert bereits');
      }
    }
    
    // Neuen User erstellen
    const user = await User.createUser(name, username, password, role, email);
    return user;
  } catch (error) {
    console.error('Fehler bei der User-Registrierung:', error);
    throw error;
  }
}

/**
 * Lädt User mit allen verknüpften Daten
 * @param userId - ID des Users
 * @returns User mit Registration und Group
 */
export async function getUserWithRelations(userId: string) {
  try {
    await connectDB();
    
    const user = await User.findById(userId)
      .populate('registrationId')
      .populate('groupId')
      .exec();
    
    return user;
  } catch (error) {
    console.error('Fehler beim Laden des Users:', error);
    throw error;
  }
}

interface PopulatedGroup {
  _id: string;
  name: string;
  description: string;
}

interface PopulatedRegistration {
  _id: string;
  name: string;
  days: string[];
  priceOption: string;
}

interface UserWithPopulatedFields {
  _id: any;
  name: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  isShadowUser: boolean;
  groupId: PopulatedGroup | null;
  registrationId: PopulatedRegistration | null;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

/**
 * Lädt alle User (für Admin-Interface) - Shadow Users ausgeschlossen
 * @param role - Optionale Rolle zum Filtern
 * @returns Array aller User (ohne Shadow Users)
 */
export async function getAllUsers(role?: 'user' | 'admin') {
  try {
    await connectDB();
    const filter: any = {};
    if (role) filter.role = role;
    
    const users = await User.find(filter)
      .select('_id name email username role isActive emailVerified isShadowUser groupId registrationId createdAt updatedAt lastLogin')
      .populate('groupId', 'name description')
      .populate('registrationId', 'name days priceOption')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Serialize the users to avoid circular references
    const serializedUsers = users.map(user => {
      const populatedUser = user as unknown as {
        _id: any;
        name: string;
        email: string;
        username: string;
        role: string;
        isActive: boolean;
        emailVerified: boolean;
        isShadowUser: boolean;
        groupId?: { _id: any; name: string; description: string };
        registrationId?: { _id: any; name: string; days: string[]; priceOption: string };
        createdAt: Date;
        updatedAt: Date;
        lastLogin: Date | null;
      };

      return {
        _id: String(populatedUser._id),
        name: populatedUser.name,
        email: populatedUser.email,
        username: populatedUser.username,
        role: populatedUser.role,
        isActive: populatedUser.isActive,
        emailVerified: populatedUser.emailVerified,
        isShadowUser: populatedUser.isShadowUser,
        groupId: populatedUser.groupId ? {
          _id: String(populatedUser.groupId._id),
          name: populatedUser.groupId.name,
          description: populatedUser.groupId.description
        } : null,
        registrationId: populatedUser.registrationId ? {
          _id: String(populatedUser.registrationId._id),
          name: populatedUser.registrationId.name,
          days: populatedUser.registrationId.days,
          priceOption: populatedUser.registrationId.priceOption
        } : null,
        createdAt: populatedUser.createdAt ? populatedUser.createdAt.toISOString() : null,
        updatedAt: populatedUser.updatedAt ? populatedUser.updatedAt.toISOString() : null,
        lastLogin: populatedUser.lastLogin ? populatedUser.lastLogin.toISOString() : null
      };
    });

    return serializedUsers;
  } catch (error) {
    console.error('Fehler beim Laden aller User:', error);
    throw error;
  }
}

/**
 * Ändert die Rolle eines Users (Admin-Funktion)
 * @param userId - ID des Users
 * @param newRole - Neue Rolle
 * @returns Aktualisierter User
 */
export async function changeUserRole(userId: string, newRole: 'user' | 'admin') {
  try {
    await connectDB();
    
    // Fetch the full Mongoose document to use .save()
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User nicht gefunden');
    }
    
    user.role = newRole;
    await user.save();
    
    // Convert the Mongoose document to a plain object before returning
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error('Fehler beim Ändern der User-Rolle:', error);
    throw error;
  }
}

/**
 * Ändert den Shadow-User-Status eines Users (Admin-Funktion)
 * @param userId - ID des Users
 * @param isShadowUser - Neuer Shadow-User-Status
 * @returns Aktualisierter User
 */
export async function changeShadowUserStatus(userId: string, isShadowUser: boolean) {
  try {
    await connectDB();
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User nicht gefunden');
    }
    
    user.isShadowUser = isShadowUser;
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Fehler beim Ändern des Shadow-User-Status:', error);
    throw error;
  }
}

/**
 * Deaktiviert einen User (Admin-Funktion)
 * @param userId - ID des Users
 * @returns Deaktivierter User
 */
export async function deactivateUser(userId: string) {
  try {
    await connectDB();
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User nicht gefunden');
    }
    
    user.isActive = false;
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Fehler beim Deaktivieren des Users:', error);
    throw error;
  }
}

/**
 * Lädt einen User mit Shadow Users (für spezielle Admin-Zwecke)
 * @param identifier - Username oder E-Mail
 * @returns User oder null
 */
export async function getUserIncludingShadow(identifier: string) {
  try {
    await connectDB();
    
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ],
      isActive: true
      // Hier KEINE Einschränkung für Shadow Users
    })
    .populate('registrationId')
    .populate('groupId')
    .exec();
    
    return user;
  } catch (error) {
    console.error('Fehler beim Laden von User (inkl. Shadow):', error);
    throw error;
  }
}

/**
 * Prüft ob ein User ein Shadow User ist
 * @param userId - User ID
 * @returns Boolean
 */
export async function isShadowUser(userId: string) {
  try {
    await connectDB();
    
    const user = await User.findById(userId).select('isShadowUser').exec();
    return user?.isShadowUser || false;
  } catch (error) {
    console.error('Fehler beim Prüfen Shadow User Status:', error);
    return false;
  }
}

/**
 * Lädt alle Shadow Users (für Admin-Interface)
 * @returns Array aller Shadow Users
 */
export async function getAllShadowUsers() {
  try {
    await connectDB();
    
    const shadowUsers = await User.find({ 
      isActive: true, 
      isShadowUser: true // Nur Shadow Users
    })
      .populate('registrationId')
      .populate('groupId')
      .sort({ createdAt: -1 })
      .exec();
    
    return shadowUsers;
  } catch (error) {
    console.error('Fehler beim Laden der Shadow Users:', error);
    throw error;
  }
}

/**
 * Lädt alle Shadow Users für das Archiv (unabhängig von isActive)
 * @returns Array aller Shadow Users
 */
export async function getAllShadowUsersForArchive() {
  try {
    await connectDB();
    const shadowUsers = await User.find({ isShadowUser: true })
      .populate('registrationId')
      .populate('groupId')
      .sort({ createdAt: -1 })
      .exec();
    return shadowUsers;
  } catch (error) {
    console.error('Fehler beim Laden der Shadow Users für das Archiv:', error);
    throw error;
  }
}

/**
 * Holt einen User anhand seiner ID - auch Shadow Users
 */
export async function getUserById(userId: string) {
  try {
    await connectDB();
    const user = await User.findById(userId).lean().exec();
    return user;
  } catch (error) {
    console.error(`[AuthService] Fehler beim Laden des Users mit ID ${userId}:`, error);
    throw error;
  }
} 