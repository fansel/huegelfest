import { NextResponse } from 'next/server';
import { connectDB } from '@/database/config/apiConnector';
import Announcement from '@/database/models/Announcement';
import Group from '@/database/models/Group';
import { Subscriber } from '@/database/models/Subscriber';
import { revalidatePath } from 'next/cache';
import { sendUpdateToAllClients } from '@/server/lib/sse';
import { webPushService } from '@/server/lib/webpush';

export async function GET() {
  try {
    await connectDB();
    
    if (!Announcement) {
      throw new Error('Announcement-Modell nicht initialisiert');
    }
    
    const announcements = await Announcement.find()
      .populate('groupId', 'name color')
      .sort({ createdAt: -1 });
    
    // Transformiere die Ankündigungen, um die Gruppeninformationen korrekt zu setzen
    const transformedAnnouncements = announcements.map(announcement => {
      const doc = announcement.toObject();
      return {
        ...doc,
        group: doc.groupId.name,
        groupColor: doc.groupId.color,
        _id: doc._id.toString(),
        id: doc._id.toString()
      };
    });
    
    return NextResponse.json(transformedAnnouncements);
  } catch (error) {
    console.error('Fehler beim Laden der Ankündigungen:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Laden der Ankündigungen' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('POST /api/announcements - Request Body:', body);
    
    const { content, group, important } = body;
    
    if (!content || !group) {
      console.error('POST /api/announcements - Fehlende Felder:', { content, group });
      return NextResponse.json(
        { error: 'Erforderliche Felder fehlen' },
        { status: 400 }
      );
    }

    await connectDB();

    // Finde die Gruppe
    const groupDoc = await Group.findOne({ name: group });
    if (!groupDoc) {
      console.error('POST /api/announcements - Gruppe nicht gefunden:', group);
      return NextResponse.json(
        { error: `Gruppe "${group}" nicht gefunden` },
        { status: 404 }
      );
    }

    console.log('POST /api/announcements - Gruppe gefunden:', { id: groupDoc._id, name: groupDoc.name });

    // Setze date und time serverseitig
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    // Erstelle neue Ankündigung
    const announcement = await Announcement.create({
      content,
      date,
      time,
      groupId: groupDoc._id,
      important: important || false,
      reactions: {
        thumbsUp: { count: 0, deviceReactions: {} },
        clap: { count: 0, deviceReactions: {} },
        laugh: { count: 0, deviceReactions: {} },
        surprised: { count: 0, deviceReactions: {} },
        heart: { count: 0, deviceReactions: {} }
      },
      createdAt: new Date()
    });

    console.log('POST /api/announcements - Ankündigung erstellt:', { id: announcement._id });

    // Sende Push-Benachrichtigung nur wenn der Service initialisiert ist
    if (webPushService.isInitialized()) {
      try {
        await webPushService.sendNotificationToAll({
          title: 'Neue Ankündigung',
          body: content,
          icon: '/icon-192x192.png',
          badge: '/badge-96x96.png',
          data: {
            url: '/'
          }
        });
      } catch (error) {
        console.error('Fehler beim Senden der Push-Benachrichtigung:', error);
        // Fehler beim Senden der Push-Benachrichtigung sollte die Ankündigung nicht beeinflussen
      }
    }

    revalidatePath('/announcements');
    sendUpdateToAllClients();

    // Hole die vollständige Ankündigung mit Gruppeninformationen
    const populatedAnnouncement = await announcement.populate('groupId', 'name color');
    const doc = populatedAnnouncement.toObject();
    const transformedAnnouncement = {
      ...doc,
      group: doc.groupId.name,
      groupColor: doc.groupId.color,
      _id: doc._id.toString(),
      id: doc._id.toString()
    };
    
    return NextResponse.json(transformedAnnouncement);
  } catch (error) {
    console.error('Fehler beim Erstellen der Ankündigung:', error);
    return NextResponse.json(
      { 
        error: 'Interner Serverfehler',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID fehlt' },
        { status: 400 }
      );
    }

    await connectDB();
    const deletedAnnouncement = await Announcement.findByIdAndDelete(id);
    
    if (!deletedAnnouncement) {
      return NextResponse.json({
        success: false,
        message: `Keine Ankündigung mit ID ${id} gefunden`
      }, { status: 404 });
    }
    
    revalidatePath('/announcements');
    sendUpdateToAllClients();
    return NextResponse.json({
      success: true,
      message: `Ankündigung erfolgreich gelöscht`,
      deletedAnnouncement: {
        id: deletedAnnouncement._id,
        content: deletedAnnouncement.content,
        author: deletedAnnouncement.author,
        date: deletedAnnouncement.date
      }
    });
  } catch (error) {
    console.error('Fehler beim Löschen der Ankündigung:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Interner Serverfehler',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log('PUT /api/announcements - Request Body:', body);
    const { id, reactions } = body;
    
    if (!id) {
      console.error('PUT /api/announcements: ID fehlt in der Anfrage');
      return NextResponse.json(
        { error: 'ID ist erforderlich' },
        { status: 400 }
      );
    }

    if (!reactions) {
      console.error('PUT /api/announcements: Reaktionen fehlen in der Anfrage', { id });
      return NextResponse.json(
        { error: 'Reaktionen sind erforderlich' },
        { status: 400 }
      );
    }

    console.log('PUT /api/announcements: Verbinde mit Datenbank...');
    await connectDB();
    
    // Hole die aktuelle Ankündigung
    const currentAnnouncement = await Announcement.findById(id);
    if (!currentAnnouncement) {
      console.error('PUT /api/announcements: Ankündigung nicht gefunden', { id });
      return NextResponse.json(
        { error: 'Ankündigung nicht gefunden' },
        { status: 404 }
      );
    }

    // Aktualisiere die Reaktionen
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      { $set: { reactions } },
      { new: true }
    ).populate('groupId', 'name color');

    if (!updatedAnnouncement) {
      console.error('PUT /api/announcements: Fehler beim Aktualisieren der Ankündigung', { id });
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren der Ankündigung' },
        { status: 500 }
      );
    }

    // Transformiere die Ankündigung für die Antwort
    const doc = updatedAnnouncement.toObject();
    const transformedAnnouncement = {
      ...doc,
      group: doc.groupId.name,
      groupColor: doc.groupId.color,
      _id: doc._id.toString(),
      id: doc._id.toString()
    };

    revalidatePath('/announcements');
    sendUpdateToAllClients();

    return NextResponse.json(transformedAnnouncement);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Reaktionen:', error);
    return NextResponse.json(
      { 
        error: 'Interner Serverfehler',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
} 