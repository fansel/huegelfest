"use server";

import { getGroupColors, getGroupsArray } from '../services/groupService';

export async function getGroupColorsAction() {
  return await getGroupColors();
}

export async function getGroupsArrayAction() {
  return await getGroupsArray();
} 