"use server";

import { getCategories } from '../services/categoryService';

export async function getCategoriesAction() {
  const categories = await getCategories();
  // Plain JS-Objekte mit String-IDs zurückgeben
  return categories.map((cat: any) => ({
    ...cat.toObject?.() ?? cat,
    _id: typeof cat._id === 'string' ? cat._id : (cat._id?.toString?.() ?? ''),
  }));
} 