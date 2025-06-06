import { initServices } from '@/lib/initServices';
import { User } from '@/lib/db/models/User';
import { Group } from '@/lib/db/models/Group';
import { verifySession } from '@/features/auth/actions/userAuth';
import type { UserStatus } from '../types/ActivityTypes';

/**
 * Lädt den Status des aktuell eingeloggten Benutzers
 * SICHERHEIT: userId wird aus der Session extrahiert, nicht vom Client gesendet
 */
export async function getUserStatus(): Promise<UserStatus> {
  await initServices();
  
  try {
    // Session validieren und userId extrahieren
    const sessionData = await verifySession();
    if (!sessionData) {
      return {
        isRegistered: false
      };
    }

    const user = await User.findById(sessionData.userId);
    
    if (!user) {
      return {
        isRegistered: false
      };
    }
    
    let groupInfo = null;
    if (user.groupId) {
      groupInfo = await Group.findById(user.groupId);
    }
    
    return {
      isRegistered: true,
      name: user.name,
      groupId: user.groupId?.toString(),
      groupName: groupInfo?.name,
      groupColor: groupInfo?.color
    };
  } catch (error) {
    console.error('[ActivitiesService] Fehler beim Laden des User-Status:', error);
    return {
      isRegistered: false
    };
  }
} 