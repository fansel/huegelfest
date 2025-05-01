import { CollectionName } from '../types';
import { defaultGroups, defaultUsers, defaultTimeline, defaultCategories } from './data';
import { connectToDatabase } from '../config';

const seedData = {
    groups: defaultGroups,
    users: defaultUsers,
    timeline: defaultTimeline,
    categories: defaultCategories
};

/**
 * Prüft ob eine Collection leer ist
 */
export async function isCollectionEmpty(collectionName: CollectionName): Promise<boolean> {
    const { db } = await connectToDatabase();
    const count = await db.collection(collectionName).countDocuments();
    return count === 0;
}

/**
 * Prüft den Status aller Collections
 */
export async function checkDatabaseStatus(): Promise<{
    needsSeeding: boolean;
    emptyCollections: CollectionName[];
}> {
    const collections: CollectionName[] = ['groups', 'users', 'timeline', 'categories'];
    const emptyCollections: CollectionName[] = [];

    for (const collection of collections) {
        if (await isCollectionEmpty(collection)) {
            emptyCollections.push(collection);
        }
    }

    return {
        needsSeeding: emptyCollections.length > 0,
        emptyCollections
    };
}

/**
 * Seeded eine einzelne Collection
 */
export async function seedCollection(collectionName: CollectionName): Promise<void> {
    const { db } = await connectToDatabase();
    
    if (await isCollectionEmpty(collectionName)) {
        const data = seedData[collectionName];
        if (data) {
            await db.collection(collectionName).insertMany(data);
            console.log(`[Seeding] ${collectionName} erfolgreich geseedet`);
        }
    } else {
        console.log(`[Seeding] ${collectionName} übersprungen - nicht leer`);
    }
}

/**
 * Seeded alle leeren Collections
 */
export async function seedDatabase(): Promise<void> {
    const { needsSeeding, emptyCollections } = await checkDatabaseStatus();

    if (!needsSeeding) {
        console.log('[Seeding] Keine leeren Collections gefunden');
        return;
    }

    console.log('[Seeding] Starte Seeding für:', emptyCollections.join(', '));

    for (const collection of emptyCollections) {
        await seedCollection(collection);
    }

    console.log('[Seeding] Abgeschlossen');
} 