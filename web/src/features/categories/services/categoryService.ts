import { connectDB } from '@/lib/db/connector';
import { Category } from '@/lib/db/models/Category';
import { logger } from '@/lib/logger';
import { ensureDefaultCategories } from '@/lib/db/initDefaults';
import { broadcast } from '@/lib/websocket/broadcast';
import { Event } from '@/lib/db/models/Event';
import { Types } from 'mongoose';

export async function getCategories() {
  await connectDB();
  await ensureDefaultCategories();
  return await Category.find().sort({ name: 1 });
}

export async function createCategory(data: any) {
  if (!data.name || !data.icon) {
    throw new Error('Name und Icon sind erforderlich');
  }
  const categoryData = {
    name: data.name,
    label: data.name,
    value: data.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    icon: data.icon,
    color: '#FF9900',
    description: data.name,
    isDefault: false
  };
  const category = new Category(categoryData);
  await category.save();
  const plain = category.toObject ? category.toObject() : category;
  await broadcast('category-created', { categoryId: plain._id });
  return {
    ...plain,
    _id: typeof plain._id === 'string' ? plain._id : (plain._id?.toString?.() ?? ''),
  };
}

export async function updateCategory(id: string, updateData: any) {
  if (!id) {
    throw new Error('ID ist erforderlich');
  }
  if (updateData.value) {
    const valueRegex = /^[a-z0-9-]+$/;
    if (!valueRegex.test(updateData.value)) {
      throw new Error('Der Wert darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten');
    }
  }
  const category = await Category.findByIdAndUpdate(id, updateData, { new: true });
  if (!category) {
    throw new Error('Kategorie nicht gefunden');
  }
  const plain = category.toObject ? category.toObject() : category;
  await broadcast('category-updated', { categoryId: plain._id });
  return {
    ...plain,
    _id: typeof plain._id === 'string' ? plain._id : (plain._id?.toString?.() ?? ''),
  };
}

export async function deleteCategory(id: string) {
  if (!id) {
    throw new Error('ID ist erforderlich');
  }
  const otherCategory = await Category.findOne({ value: 'other' });
  if (!otherCategory) {
    throw new Error('Kategorie "Sonstiges" (other) nicht gefunden. Cascade-Abbruch.');
  }
  await Event.updateMany(
    { categoryId: new Types.ObjectId(id) },
    { $set: { categoryId: otherCategory._id } }
  );
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new Error('Kategorie nicht gefunden');
  }
  await broadcast('category-deleted', { categoryId: id });
  return { message: 'Kategorie erfolgreich gelöscht' };
} 