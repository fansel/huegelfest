"use server";

import { getGroupColors, getGroupsArray, createGroup, deleteGroup, updateGroup } from '../services/groupService';

export async function getGroupColorsAction() {
  return await getGroupColors();
}

export async function getGroupsArrayAction() {
  return await getGroupsArray();
}

export async function createGroupAction(name: string, color: string) {
  return await createGroup(name, color);
}

export async function deleteGroupAction(id: string) {
  return await deleteGroup(id);
}

export async function updateGroupAction(id: string, data: { name?: string; color?: string }) {
  return await updateGroup(id, data);
} 