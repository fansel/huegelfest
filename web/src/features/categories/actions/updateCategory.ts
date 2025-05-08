"use server";

import { updateCategory } from '../services/categoryService';

export async function updateCategoryAction(id: string, updateData: any) {
  return await updateCategory(id, updateData);
} 