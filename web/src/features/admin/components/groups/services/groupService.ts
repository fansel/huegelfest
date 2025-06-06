"use server";

import { Group } from '@/lib/db/models/Group';
import { User } from '@/lib/db/models/User';
import { connectDB } from '@/lib/db/connector';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';
import type { 
  GroupData, 
  CreateGroupData, 
  UpdateGroupData, 
  GroupMember, 
  GroupWithMembers,
  GroupAssignmentStats 
} from '../types';

/**
 * Holt alle Gruppen
 */
export async function getAllGroups(): Promise<{ success: boolean; data?: GroupData[]; error?: string }> {
  await connectDB();
  
  try {
    const groups = await Group.find({})
      .populate('memberCount')
      .sort({ name: 1 })
      .exec();
    
    const groupData: GroupData[] = groups.map(group => ({
      id: (group._id as mongoose.Types.ObjectId).toString(),
      name: group.name,
      color: group.color,
      isAssignable: group.isAssignable,
      maxMembers: group.maxMembers,
      description: group.description,
      memberCount: group.memberCount || 0,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString()
    }));
    
    return { success: true, data: groupData };
  } catch (error) {
    logger.error('[GroupService] Fehler bei getAllGroups:', error);
    return { success: false, error: 'Fehler beim Laden der Gruppen' };
  }
}

/**
 * Erstellt eine neue Gruppe
 */
export async function createGroup(data: CreateGroupData): Promise<{ success: boolean; data?: GroupData; error?: string }> {
  await connectDB();
  
  try {
    // Prüfe ob Name bereits existiert
    const existingGroup = await Group.findOne({ name: data.name });
    if (existingGroup) {
      return { success: false, error: 'Gruppenname bereits vergeben' };
    }
    
    const group = new Group(data);
    await group.save();
    
    const groupData: GroupData = {
      id: String(group._id),
      name: group.name,
      color: group.color,
      isAssignable: group.isAssignable,
      maxMembers: group.maxMembers,
      description: group.description,
      memberCount: 0,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString()
    };
    
    logger.info(`[GroupService] Gruppe erstellt: ${group.name}`);
    return { success: true, data: groupData };
  } catch (error) {
    logger.error('[GroupService] Fehler bei createGroup:', error);
    return { success: false, error: 'Fehler beim Erstellen der Gruppe' };
  }
}

/**
 * Aktualisiert eine Gruppe
 */
export async function updateGroup(
  groupId: string, 
  data: UpdateGroupData
): Promise<{ success: boolean; data?: GroupData; error?: string }> {
  await connectDB();
  
  try {
    // Prüfe bei Namensänderung auf Duplikate
    if (data.name) {
      const existingGroup = await Group.findOne({ 
        name: data.name, 
        _id: { $ne: new mongoose.Types.ObjectId(groupId) }
      });
      if (existingGroup) {
        return { success: false, error: 'Gruppenname bereits vergeben' };
      }
    }
    
    const group = await Group.findByIdAndUpdate(
      groupId,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('memberCount');
    
    if (!group) {
      return { success: false, error: 'Gruppe nicht gefunden' };
    }
    
    const groupData: GroupData = {
      id: String(group._id),
      name: group.name,
      color: group.color,
      isAssignable: group.isAssignable,
      maxMembers: group.maxMembers,
      description: group.description,
      memberCount: group.memberCount || 0,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString()
    };
    
    logger.info(`[GroupService] Gruppe aktualisiert: ${group.name}`);
    return { success: true, data: groupData };
  } catch (error) {
    logger.error('[GroupService] Fehler bei updateGroup:', error);
    return { success: false, error: 'Fehler beim Aktualisieren der Gruppe' };
  }
}

/**
 * Löscht eine Gruppe (entfernt alle Mitglieder)
 */
export async function deleteGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return { success: false, error: 'Gruppe nicht gefunden' };
    }
    
    // Entferne alle Benutzer aus der Gruppe
    await User.updateMany(
      { groupId: new mongoose.Types.ObjectId(groupId) },
      { $unset: { groupId: 1 } }
    );
    
    // Lösche die Gruppe
    await Group.findByIdAndDelete(groupId);
    
    logger.info(`[GroupService] Gruppe gelöscht: ${group.name}`);
    return { success: true };
  } catch (error) {
    logger.error('[GroupService] Fehler bei deleteGroup:', error);
    return { success: false, error: 'Fehler beim Löschen der Gruppe' };
  }
}

/**
 * Holt Mitglieder einer Gruppe
 */
export async function getGroupMembers(groupId: string): Promise<{ success: boolean; data?: GroupMember[]; error?: string }> {
  await connectDB();
  
  try {
    const users = await User.find({ 
      groupId: new mongoose.Types.ObjectId(groupId),
      isActive: true 
    })
    .populate('registrationId')
    .sort({ name: 1 })
    .exec();
    
    const members: GroupMember[] = users.map(user => ({
      userId: String(user._id),
      name: user.name,
      isRegistered: !!user.registrationId,
      registrationDate: user.registrationId ? user.createdAt.toISOString() : undefined,
      joinedGroupAt: user.updatedAt.toISOString()
    }));
    
    return { success: true, data: members };
  } catch (error) {
    logger.error('[GroupService] Fehler bei getGroupMembers:', error);
    return { success: false, error: 'Fehler beim Laden der Gruppenmitglieder' };
  }
}

/**
 * Weist einen Benutzer einer Gruppe zu
 */
export async function assignUserToGroup(
  userId: string, 
  groupId: string
): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }
    
    const group = await Group.findById(groupId);
    if (!group) {
      return { success: false, error: 'Gruppe nicht gefunden' };
    }
    
    // Prüfe maximale Mitgliederzahl
    if (group.maxMembers) {
      const currentMemberCount = await User.countDocuments({ 
        groupId: new mongoose.Types.ObjectId(groupId) 
      });
      if (currentMemberCount >= group.maxMembers) {
        return { success: false, error: 'Gruppe ist voll' };
      }
    }
    
    await user.assignToGroup(new mongoose.Types.ObjectId(String(group._id)));
    
    logger.info(`[GroupService] Benutzer ${user.name} zu Gruppe ${group.name} zugewiesen`);
    return { success: true };
  } catch (error) {
    logger.error('[GroupService] Fehler bei assignUserToGroup:', error);
    return { success: false, error: 'Fehler bei der Gruppenzuweisung' };
  }
}

/**
 * Entfernt einen Benutzer aus seiner Gruppe
 */
export async function removeUserFromGroup(userId: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }
    
    user.groupId = undefined;
    await user.save();
    
    logger.info(`[GroupService] Benutzer ${user.name} aus Gruppe entfernt`);
    return { success: true };
  } catch (error) {
    logger.error('[GroupService] Fehler bei removeUserFromGroup:', error);
    return { success: false, error: 'Fehler beim Entfernen aus der Gruppe' };
  }
}

/**
 * Weist einen Benutzer automatisch einer zufälligen Gruppe zu
 */
export async function assignUserToRandomGroup(userId: string): Promise<{ success: boolean; groupName?: string; error?: string }> {
  await connectDB();
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }
    
    const randomGroup = await Group.getRandomAssignableGroup();
    if (!randomGroup) {
      logger.warn(`[GroupService] Keine verfügbare Gruppe für automatische Zuweisung gefunden`);
      return { success: true }; // Kein Fehler, nur keine Gruppe verfügbar
    }
    
    await user.assignToGroup(new mongoose.Types.ObjectId(String(randomGroup._id)));
    
    logger.info(`[GroupService] Benutzer ${user.name} automatisch zu Gruppe ${randomGroup.name} zugewiesen`);
    return { success: true, groupName: randomGroup.name };
  } catch (error) {
    logger.error('[GroupService] Fehler bei assignUserToRandomGroup:', error);
    return { success: false, error: 'Fehler bei der automatischen Gruppenzuweisung' };
  }
}

/**
 * Holt Statistiken für das Gruppen-System
 */
export async function getGroupStats(): Promise<{ success: boolean; data?: GroupAssignmentStats; error?: string }> {
  await connectDB();
  
  try {
    const [totalUsers, usersWithGroups, assignableGroups, nonAssignableGroups] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, groupId: { $exists: true } }),
      Group.countDocuments({ isAssignable: true }),
      Group.countDocuments({ isAssignable: false })
    ]);
    
    const stats: GroupAssignmentStats = {
      totalUsers,
      usersWithGroups,
      usersWithoutGroups: totalUsers - usersWithGroups,
      assignableGroups,
      nonAssignableGroups
    };
    
    return { success: true, data: stats };
  } catch (error) {
    logger.error('[GroupService] Fehler bei getGroupStats:', error);
    return { success: false, error: 'Fehler beim Laden der Statistiken' };
  }
}

/**
 * Weist alle unzugewiesenen User automatisch Gruppen zu
 */
export async function assignAllUnassignedUsers(): Promise<{ success: boolean; assignedCount?: number; error?: string }> {
  await connectDB();
  
  try {
    // Finde alle User ohne Gruppe UND nicht Shadow-User
    const unassignedUsers = await User.find({ 
      isActive: true, 
      groupId: { $exists: false },
      isShadowUser: { $ne: true }
    });
    
    if (unassignedUsers.length === 0) {
      return { success: true, assignedCount: 0 };
    }
    
    let assignedCount = 0;
    
    // Für jeden User versuche eine zufällige Gruppenzuweisung
    for (const user of unassignedUsers) {
      try {
        const randomGroup = await Group.getRandomAssignableGroup();
        if (randomGroup) {
          await user.assignToGroup(randomGroup._id as mongoose.Types.ObjectId);
          assignedCount++;
          logger.info(`[GroupService] User ${user.name} automatisch zu Gruppe ${randomGroup.name} zugewiesen`);
        } else {
          logger.warn(`[GroupService] Keine verfügbare Gruppe für User ${user.name}`);
        }
      } catch (userError) {
        logger.error(`[GroupService] Fehler bei Zuweisung für User ${user.name}:`, userError);
        // Fortsetzung mit nächstem User
      }
    }
    
    logger.info(`[GroupService] ${assignedCount} von ${unassignedUsers.length} Usern automatisch zugewiesen`);
    return { success: true, assignedCount };
  } catch (error) {
    logger.error('[GroupService] Fehler bei assignAllUnassignedUsers:', error);
    return { success: false, error: 'Fehler bei der automatischen Gruppenzuweisung' };
  }
} 