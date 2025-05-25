"use server";

import { updateWorkingGroupColor } from '../services/workingGroupService';

export async function updateWorkingGroupColorAction(name: string, color: string) {
  return await updateWorkingGroupColor(name, color);
} 