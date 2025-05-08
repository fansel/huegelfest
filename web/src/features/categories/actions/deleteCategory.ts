"use server";

import { deleteCategory } from '../services/categoryService';

export async function deleteCategoryAction(id: string) {
  return await deleteCategory(id);
} 