import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { CategoryService } from '../categoryService';
import Category from '@/database/models/Category';
import Timeline from '@/database/models/Timeline';

describe('CategoryService', () => {
  beforeEach(async () => {
    // Verbinde mit der Test-Datenbank
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    
    // Lösche alle existierenden Daten
    await Category.deleteMany({});
    await Timeline.deleteMany({});
    
    // Erstelle die "Sonstiges"-Kategorie
    await Category.create({
      value: 'other',
      label: 'Sonstiges',
      icon: 'FaQuestion',
      isDefault: true
    });
  });

  afterEach(async () => {
    // Lösche alle Daten nach dem Test
    await Category.deleteMany({});
    await Timeline.deleteMany({});
    
    // Trenne die Verbindung
    await mongoose.disconnect();
  });

  it('sollte eine Kategorie löschen und Events in die "Sonstiges"-Kategorie verschieben', async () => {
    // Erstelle eine Test-Kategorie
    const testCategory = await Category.create({
      value: 'test',
      label: 'Test',
      icon: 'FaTest'
    });

    // Erstelle eine Timeline mit Events
    const timeline = await Timeline.create({
      days: [{
        title: 'Test Tag',
        description: 'Test Beschreibung',
        date: new Date(),
        events: [
          {
            time: '10:00',
            title: 'Test Event 1',
            description: 'Test Beschreibung 1',
            categoryId: testCategory._id
          },
          {
            time: '11:00',
            title: 'Test Event 2',
            description: 'Test Beschreibung 2',
            categoryId: testCategory._id
          }
        ]
      }]
    });

    // Lösche die Kategorie
    await CategoryService.deleteCategory(testCategory._id.toString());

    // Prüfe, ob die Kategorie gelöscht wurde
    const deletedCategory = await Category.findById(testCategory._id);
    expect(deletedCategory).toBeNull();

    // Finde die "Sonstiges"-Kategorie
    const otherCategory = await Category.findOne({ value: 'other' });
    expect(otherCategory).not.toBeNull();

    // Lade die Timeline neu
    const updatedTimeline = await Timeline.findById(timeline._id);
    expect(updatedTimeline).not.toBeNull();

    // Prüfe, ob alle Events in die "Sonstiges"-Kategorie verschoben wurden
    if (updatedTimeline) {
      for (const day of updatedTimeline.days) {
        for (const event of day.events) {
          expect(event.categoryId.toString()).toBe(otherCategory?._id.toString());
        }
      }
    }
  });

  it('sollte einen Fehler werfen, wenn die Kategorie nicht existiert', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    await expect(CategoryService.deleteCategory(nonExistentId))
      .rejects
      .toThrow('Kategorie nicht gefunden');
  });

  it('sollte einen Fehler werfen, wenn die "Sonstiges"-Kategorie nicht existiert', async () => {
    // Lösche die "Sonstiges"-Kategorie
    await Category.deleteMany({ value: 'other' });

    // Erstelle eine Test-Kategorie
    const testCategory = await Category.create({
      value: 'test',
      label: 'Test',
      icon: 'FaTest'
    });

    await expect(CategoryService.deleteCategory(testCategory._id.toString()))
      .rejects
      .toThrow('Kategorie "Sonstiges" nicht gefunden');
  });
}); 