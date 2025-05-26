import { initServices } from '@/lib/initServices';
import { User } from '@/lib/db/models/User';
import { Group } from '@/lib/db/models/Group';
import type { UserStatus } from '../types/ActivityTypes';

export async function getUserStatus(deviceId: string): Promise<UserStatus> {
  await initServices();
  
  try {
    const user = await User.findByDeviceId(deviceId);
    
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