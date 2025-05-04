import { connectDB } from '@/database/config/connector';

export class CategoryService {
  static async deleteCategory(categoryId: string) {
    const { Category } = await import('@/database/models/Category');
    const { Timeline } = await import('@/database/models/Timeline');
    
    await connectDB();
    
    // Finde die zu löschende Kategorie
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error('Kategorie nicht gefunden');
    }

    // Finde die "Sonstiges"-Kategorie
    const otherCategory = await Category.findOne({ value: 'other' });
    if (!otherCategory) {
      throw new Error('Kategorie "Sonstiges" nicht gefunden');
    }

    // Finde alle betroffenen Timelines
    const timelines = await Timeline.find({ 'days.events.categoryId': categoryId });
    
    // Aktualisiere jede Timeline
    for (const timeline of timelines) {
      let hasChanges = false;
      
      for (const day of timeline.days) {
        for (const event of day.events) {
          if (event.categoryId.toString() === categoryId) {
            event.categoryId = otherCategory._id;
            hasChanges = true;
          }
        }
      }
      
      if (hasChanges) {
        await timeline.save();
      }
    }

    // Lösche die Kategorie
    await category.deleteOne();

    return { success: true };
  }
} 