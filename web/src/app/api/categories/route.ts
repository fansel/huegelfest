import { NextResponse } from 'next/server';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/server/actions/database';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Fehler beim Laden der Kategorien:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const category = await createCategory(data);
    return NextResponse.json({ category });
  } catch (error) {
    console.error('Fehler beim Erstellen der Kategorie:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { _id } = data;
    
    if (!_id) {
      return NextResponse.json({ error: 'Keine Kategorie-ID angegeben' }, { status: 400 });
    }
    
    const category = await updateCategory(_id, data);
    return NextResponse.json({ category });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Kategorie:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Keine Kategorie-ID angegeben' }, { status: 400 });
    }
    
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Kategorie:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 