"use server";

import { createCategory } from '../services/categoryService';

export async function createCategoryAction(data: any) {
  const cat = await createCategory(data);
  // Plain JS-Objekt zurückgeben
  return cat?.toObject ? cat.toObject() : cat;
} 