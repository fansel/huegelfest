"use server";

import { saveWorkingGroupColors } from '../services/workingGroupService';
import type { WorkingGroupColors } from '../services/workingGroupService';

export async function saveWorkingGroupColorsAction(workingGroupColors: WorkingGroupColors) {
  return await saveWorkingGroupColors(workingGroupColors);
} 