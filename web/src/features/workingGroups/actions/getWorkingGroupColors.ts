"use server";

import { getWorkingGroupColors, getWorkingGroupsArray, createWorkingGroup, deleteWorkingGroup, updateWorkingGroup } from '../services/workingGroupService';

export async function getWorkingGroupColorsAction() {
  return await getWorkingGroupColors();
}

export async function getWorkingGroupsArrayAction() {
  return await getWorkingGroupsArray();
}

export async function createWorkingGroupAction(name: string, color: string) {
  return await createWorkingGroup(name, color);
}

export async function deleteWorkingGroupAction(id: string) {
  return await deleteWorkingGroup(id);
}

export async function updateWorkingGroupAction(id: string, data: { name?: string; color?: string }) {
  return await updateWorkingGroup(id, data);
} 