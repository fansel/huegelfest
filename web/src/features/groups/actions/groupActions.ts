"use server";

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
    return await createGroup(data);
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
    return await updateGroup(groupId, data);
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
    return await deleteGroup(groupId);
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
export async function assignUserToGroupAction(deviceId: string, groupId: string) {
  try {
    return await assignUserToGroup(deviceId, groupId);
  } catch (error) {
    console.error('[GroupActions] Fehler bei assignUserToGroup:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Entfernt einen Benutzer aus seiner Gruppe
 */
export async function removeUserFromGroupAction(deviceId: string) {
  try {
    return await removeUserFromGroup(deviceId);
  } catch (error) {
    console.error('[GroupActions] Fehler bei removeUserFromGroup:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Weist einen Benutzer automatisch einer zufälligen Gruppe zu
 */
export async function assignUserToRandomGroupAction(deviceId: string) {
  try {
    return await assignUserToRandomGroup(deviceId);
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
    return await assignAllUnassignedUsers();
  } catch (error) {
    console.error('[GroupActions] Fehler bei assignAllUnassignedUsers:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
} 