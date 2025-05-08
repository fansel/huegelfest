"use server";

import { createCategory } from '../services/categoryService';

export async function createCategoryAction(data: any) {
  return await createCategory(data);
} 