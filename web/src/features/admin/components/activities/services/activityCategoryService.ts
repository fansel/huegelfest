import { ActivityCategory } from '@/lib/db/models/ActivityCategory';
import { broadcast } from '@/lib/websocket/broadcast';
import type { CreateActivityCategoryData, UpdateActivityCategoryData } from '../types';

export async function getAllActivityCategories() {
  const categories = await ActivityCategory.find().sort({ isDefault: -1, name: 1 }).lean();
  return categories.map(cat => ({
    ...cat,
    _id: cat._id.toString(),
  }));
}

export async function getActivityCategoryById(id: string) {
  const category = await ActivityCategory.findById(id).lean();
  if (!category) {
    throw new Error('Aktivitäts-Kategorie nicht gefunden');
  }
  return {
    ...category,
    _id: category._id.toString(),
  };
}

export async function createActivityCategory(data: CreateActivityCategoryData) {
  if (!data.name || !data.icon) {
    throw new Error('Name und Icon sind erforderlich');
  }

  const categoryData = {
    name: data.name,
    icon: data.icon,
    color: data.color || '#ff9900',
    isDefault: false,
  };

  const category = new ActivityCategory(categoryData);
  await category.save();

  const plain = category.toObject ? category.toObject() : category;
  await broadcast('ACTIVITY_CATEGORY_CREATED', { 
    type: 'ACTIVITY_CATEGORY_CREATED',
    data: {
      ...plain,
      _id: typeof plain._id === 'string' ? plain._id : (plain._id?.toString?.() ?? ''),
    },
    timestamp: new Date().toISOString()
  });

  return {
    ...plain,
    _id: typeof plain._id === 'string' ? plain._id : (plain._id?.toString?.() ?? ''),
  };
}

export async function updateActivityCategory(id: string, data: UpdateActivityCategoryData) {
  const category = await ActivityCategory.findById(id);
  if (!category) {
    throw new Error('Aktivitäts-Kategorie nicht gefunden');
  }

  if (category.isDefault) {
    throw new Error('Standard-Kategorien können nicht bearbeitet werden');
  }

  if (data.name !== undefined) category.name = data.name;
  if (data.icon !== undefined) category.icon = data.icon;
  if (data.color !== undefined) category.color = data.color;

  await category.save();

  const plain = category.toObject ? category.toObject() : category;
  await broadcast('ACTIVITY_CATEGORY_UPDATED', { 
    type: 'ACTIVITY_CATEGORY_UPDATED',
    data: {
      ...plain,
      _id: typeof plain._id === 'string' ? plain._id : (plain._id?.toString?.() ?? ''),
    },
    timestamp: new Date().toISOString()
  });

  return {
    ...plain,
    _id: typeof plain._id === 'string' ? plain._id : (plain._id?.toString?.() ?? ''),
  };
}

export async function deleteActivityCategory(id: string) {
  const category = await ActivityCategory.findById(id);
  if (!category) {
    throw new Error('Aktivitäts-Kategorie nicht gefunden');
  }

  if (category.isDefault) {
    throw new Error('Standard-Kategorien können nicht gelöscht werden');
  }

  // Prüfen ob noch Templates oder Activities mit dieser Kategorie existieren
  const { ActivityTemplate } = await import('@/lib/db/models/ActivityTemplate');
  const { Activity } = await import('@/lib/db/models/Activity');

  const templatesCount = await ActivityTemplate.countDocuments({ categoryId: id });
  const activitiesCount = await Activity.countDocuments({ categoryId: id });

  if (templatesCount > 0 || activitiesCount > 0) {
    throw new Error('Kategorie kann nicht gelöscht werden, da noch Templates oder Aktivitäten damit verknüpft sind');
  }

  await category.deleteOne();
  await broadcast('ACTIVITY_CATEGORY_DELETED', { 
    type: 'ACTIVITY_CATEGORY_DELETED',
    data: { categoryId: id },
    timestamp: new Date().toISOString()
  });

  return { success: true };
} 