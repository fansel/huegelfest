"use server";

import { getGroupColors } from '../services/groupService';

export async function getGroupColorsAction() {
  return await getGroupColors();
} 