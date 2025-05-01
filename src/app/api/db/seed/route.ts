import { NextResponse } from 'next/server';
import { seedDatabase, checkDatabaseStatus } from '@/database/seeds';

export async function POST() {
    // Nur im Development-Modus erlauben
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { error: 'Seeding nur im Development-Modus erlaubt' },
            { status: 403 }
        );
    }

    try {
        const { needsSeeding, emptyCollections } = await checkDatabaseStatus();

        if (!needsSeeding) {
            return NextResponse.json({
                message: 'Keine leeren Collections gefunden',
                emptyCollections: []
            });
        }

        await seedDatabase();

        return NextResponse.json({
            message: 'Seeding erfolgreich',
            seededCollections: emptyCollections
        });
    } catch (error) {
        console.error('[Seeding] Fehler:', error);
        return NextResponse.json(
            { error: 'Fehler beim Seeding' },
            { status: 500 }
        );
    }
} 