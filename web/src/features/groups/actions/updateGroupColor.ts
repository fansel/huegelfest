"use server";

import { updateGroupColor } from '../services/groupService';

export async function updateGroupColorAction(name: string, color: string) {
  return await updateGroupColor(name, color);
} 