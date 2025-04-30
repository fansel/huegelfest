import { connectDB } from '@/db/config/connector';
import Category from '@/db/models/Category';
import { defaultCategories } from '@/db/init/defaultCategories';

export async function initializeDefaultCategories() {
  try {
    // Stelle sicher, dass die Verbindung hergestellt ist
    await connectDB();
    
    const existingCategories = await Category.find();
    if (existingCategories.length === 0) {
      await Category.insertMany(defaultCategories);
    }
  } catch (error) {
    // Fehlerbehandlung ohne Debug-Ausgabe
  }
} 