import { NextResponse } from 'next/server';
import { connectDB } from '@/database/config/apiConnector';
import { Category } from '@/database/models/Category';
import { logger } from '@/server/lib/logger';

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ name: 1 });
    return NextResponse.json(categories);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Kategorien:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Kategorien' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    // Validiere nur die wirklich erforderlichen Felder
    if (!data.name || !data.icon) {
      return NextResponse.json(
        { error: 'Name und Icon sind erforderlich' },
        { status: 400 },
      );
    }

    // Validiere das Icon-Format
    if (!data.icon.startsWith('Fa')) {
      return NextResponse.json(
        { error: 'Icon muss mit "Fa" beginnen' },
        { status: 400 },
      );
    }

    // Generiere die optionalen Felder
    const categoryData = {
      name: data.name,
      label: data.name, // Verwende den Namen auch als Label
      value: data.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      icon: data.icon,
      color: '#FF9900', // Standardfarbe
      description: data.name, // Verwende den Namen als Beschreibung
      isDefault: false
    };

    const category = new Category(categoryData);
    await category.save();

    return NextResponse.json(category);
  } catch (error) {
    logger.error('Fehler beim Erstellen der Kategorie:', error);
    
    // Prüfe auf Duplikat-Fehler
    if (error.message.includes('existiert bereits')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Kategorie' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Validiere den value-Wert, falls er geändert wird
    if (updateData.value) {
      const valueRegex = /^[a-z0-9-]+$/;
      if (!valueRegex.test(updateData.value)) {
        return NextResponse.json(
          { error: 'Der Wert darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten' },
          { status: 400 }
        );
      }
    }
    
    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!category) {
      return NextResponse.json(
        { error: 'Kategorie nicht gefunden' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(category);
  } catch (error) {
    logger.error('Fehler beim Aktualisieren der Kategorie:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Kategorie' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID ist erforderlich' },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return NextResponse.json(
        { error: 'Kategorie nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Kategorie erfolgreich gelöscht' });
  } catch (error) {
    logger.error('Fehler beim Löschen der Kategorie:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Kategorie' },
      { status: 500 }
    );
  }
} 