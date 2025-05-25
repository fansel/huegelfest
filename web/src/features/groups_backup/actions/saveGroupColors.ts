"use server";

import { saveGroupColors } from '../services/groupService';
import type { GroupColors } from '../services/groupService';

export async function saveGroupColorsAction(groupColors: GroupColors) {
  return await saveGroupColors(groupColors);
} 