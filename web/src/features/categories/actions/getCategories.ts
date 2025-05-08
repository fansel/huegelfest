"use server";

import { getCategories } from '../services/categoryService';

export async function getCategoriesAction() {
  return await getCategories();
} 