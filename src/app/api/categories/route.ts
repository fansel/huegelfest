import { NextResponse } from 'next/server';
import { connectDB } from '@/database/config/connector';
import Category from '@/database/models/Category';
import { CategoryService } from '@/services/categoryService';

export async function GET() {
  try {

    await connectDB();
    const categories = await Category.find({}).sort({ label: 1 });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Fehler beim Abrufen der Kategorien:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Laden der Kategorien' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/categories - Starte Erstellung einer neuen Kategorie');
    console.log('POST /api/categories - Request Headers:', Object.fromEntries(request.headers.entries()));
    
    await connectDB();
    console.log('POST /api/categories - Datenbankverbindung hergestellt');
    
    const data = await request.json();
    console.log('POST /api/categories - Empfangene Daten:', JSON.stringify(data, null, 2));

    // Validiere erforderliche Felder
    if (!data.value || !data.label || !data.icon) {
      console.log('POST /api/categories - Fehlende Pflichtfelder:', { 
        value: !!data.value, 
        label: !!data.label, 
        icon: !!data.icon 
      });
      return NextResponse.json(
        { error: 'Alle Felder (value, label, icon) sind erforderlich' },
        { status: 400 }
      );
    }

    // Validiere den value-Wert
    const valueRegex = /^[a-z0-9-]+$/;
    if (!valueRegex.test(data.value)) {
      console.log('POST /api/categories - Ungültiger value-Wert:', data.value);
      return NextResponse.json(
        { error: 'Der Wert darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten' },
        { status: 400 }
      );
    }

    console.log('POST /api/categories - Versuche Kategorie zu erstellen mit Daten:', JSON.stringify(data, null, 2));
    const category = await Category.create(data);
    console.log('POST /api/categories - Kategorie erfolgreich erstellt:', JSON.stringify(category, null, 2));
    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Fehler beim Erstellen der Kategorie:', error);
    console.error('Fehler Details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      errors: error.errors
    });
    
    // Spezifische Fehlermeldungen basierend auf dem Fehlertyp
    if (error.code === 11000) {
      const requestData = await request.json();
      console.log('POST /api/categories - Duplikat gefunden für value:', requestData.value);
      return NextResponse.json(
        { error: 'Eine Kategorie mit diesem Wert existiert bereits' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Erstellen der Kategorie' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('PUT /api/categories - Starte Aktualisierung einer Kategorie');
    await connectDB();
    const data = await request.json();
    const { id, ...updateData } = data;
    console.log('PUT /api/categories - Empfangene Daten:', { id, updateData });
    
    if (!id) {
      console.log('PUT /api/categories - Keine ID angegeben');
      return NextResponse.json(
        { error: 'ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Validiere den value-Wert, falls er geändert wird
    if (updateData.value) {
      const valueRegex = /^[a-z0-9-]+$/;
      if (!valueRegex.test(updateData.value)) {
        console.log('PUT /api/categories - Ungültiger value-Wert:', updateData.value);
        return NextResponse.json(
          { error: 'Der Wert darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten' },
          { status: 400 }
        );
      }
    }
    
    console.log('PUT /api/categories - Versuche Kategorie zu aktualisieren');
    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!category) {
      console.log('PUT /api/categories - Kategorie nicht gefunden:', id);
      return NextResponse.json(
        { error: 'Kategorie nicht gefunden' },
        { status: 404 }
      );
    }
    
    console.log('PUT /api/categories - Kategorie erfolgreich aktualisiert:', category);
    return NextResponse.json(category);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Kategorie:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Aktualisieren der Kategorie' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('DELETE /api/categories - Starte Löschen einer Kategorie');
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('DELETE /api/categories - Parameter:', { id });
    
    if (!id) {
      console.log('DELETE /api/categories - Keine ID angegeben');
      return NextResponse.json(
        { error: 'ID ist erforderlich' },
        { status: 400 }
      );
    }

    const result = await CategoryService.deleteCategory(id);
    console.log('DELETE /api/categories - Kategorie erfolgreich gelöscht');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Fehler beim Löschen der Kategorie:', error);
    return NextResponse.json(
      { error: error.message || 'Interner Serverfehler beim Löschen der Kategorie' },
      { status: 500 }
    );
  }
} 