"use server";

import { verifyAdminSession } from '@/features/auth/actions/userAuth';
import {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  assignUserToGroup,
  removeUserFromGroup,
  assignUserToRandomGroup,
  getGroupStats,
  assignAllUnassignedUsers
} from '../services/groupService';
import { broadcast } from '@/lib/websocket/broadcast';
import type { CreateGroupData, UpdateGroupData } from '../types';

/**
 * Server Action: Holt alle Gruppen
 */
export async function getAllGroupsAction() {
  try {
    return await getAllGroups();
  } catch (error) {
    console.error('[GroupActions] Fehler bei getAllGroups:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Erstellt eine neue Gruppe
 */
export async function createGroupAction(data: CreateGroupData) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) throw new Error('Nicht autorisiert');
    const result = await createGroup(data);
    if (result.success && result.data) {
      await broadcast('group-created', { 
        groupId: result.data.id, 
        name: result.data.name 
      });
    }
    return result;
  } catch (error) {
    console.error('[GroupActions] Fehler bei createGroup:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Aktualisiert eine Gruppe
 */
export async function updateGroupAction(groupId: string, data: UpdateGroupData) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) throw new Error('Nicht autorisiert');
    const result = await updateGroup(groupId, data);
    if (result.success && result.data) {
      await broadcast('group-updated', { 
        groupId: result.data.id, 
        name: result.data.name 
      });
    }
    return result;
  } catch (error) {
    console.error('[GroupActions] Fehler bei updateGroup:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Löscht eine Gruppe
 */
export async function deleteGroupAction(groupId: string) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) throw new Error('Nicht autorisiert');
    const result = await deleteGroup(groupId);
    if (result.success) {
      await broadcast('group-deleted', { groupId });
    }
    return result;
  } catch (error) {
    console.error('[GroupActions] Fehler bei deleteGroup:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Holt Mitglieder einer Gruppe
 */
export async function getGroupMembersAction(groupId: string) {
  try {
    return await getGroupMembers(groupId);
  } catch (error) {
    console.error('[GroupActions] Fehler bei getGroupMembers:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Weist einen Benutzer einer Gruppe zu
 */
export async function assignUserToGroupAction(userId: string, groupId: string) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) throw new Error('Nicht autorisiert');
    const result = await assignUserToGroup(userId, groupId);
    if (result.success) {
      await broadcast('user-assigned', { userId, groupId });
    }
    return result;
  } catch (error) {
    console.error('[GroupActions] Fehler bei assignUserToGroup:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Entfernt einen Benutzer aus seiner Gruppe
 */
export async function removeUserFromGroupAction(userId: string) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) throw new Error('Nicht autorisiert');
    const result = await removeUserFromGroup(userId);
    if (result.success) {
      await broadcast('user-removed', { userId });
    }
    return result;
  } catch (error) {
    console.error('[GroupActions] Fehler bei removeUserFromGroup:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Weist einen Benutzer automatisch einer zufälligen Gruppe zu
 */
export async function assignUserToRandomGroupAction(userId: string) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) throw new Error('Nicht autorisiert');
    const result = await assignUserToRandomGroup(userId);
    if (result.success && result.groupName) {
      await broadcast('user-assigned', { userId, groupName: result.groupName });
    }
    return result;
  } catch (error) {
    console.error('[GroupActions] Fehler bei assignUserToRandomGroup:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Holt Statistiken für das Gruppen-System
 */
export async function getGroupStatsAction() {
  try {
    return await getGroupStats();
  } catch (error) {
    console.error('[GroupActions] Fehler bei getGroupStats:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Weist alle unzugewiesenen User automatisch Gruppen zu
 */
export async function assignAllUnassignedUsersAction() {
  try {
    const admin = await verifyAdminSession();
    if (!admin) throw new Error('Nicht autorisiert');
    const result = await assignAllUnassignedUsers();
    if (result.success) {
      await broadcast('groups-updated', { massAssignment: true, assignedCount: result.assignedCount });
    }
    return result;
  } catch (error) {
    console.error('[GroupActions] Fehler bei assignAllUnassignedUsers:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
} 