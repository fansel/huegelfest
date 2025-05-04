import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/database/config/apiConnector';
import Announcement from '@/database/models/Announcement';
import Group from '@/database/models/Group';
import { revalidatePath } from 'next/cache';
import { webPushService } from '@/server/lib/webpush';
import { sseService } from '@/server/lib/sse';
import { logger } from '@/server/lib/logger';

export const runtime = 'nodejs';

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
    logger.error('Fehler beim Laden der Ankündigungen:', { error });
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Laden der Ankündigungen' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  logger.info('[API/Announcements] Neue Ankündigungsanfrage');
  
  try {
    // WebPush Service initialisieren
    webPushService.initialize();
    
    const body = await request.json();
    const { title, message } = body;

    if (!title || !message) {
      logger.warn('[API/Announcements] Fehlende Pflichtfelder', { 
        hasTitle: !!title,
        hasMessage: !!message
      });
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      );
    }

    await webPushService.sendNotificationToAll({
      title,
      body: message,
      icon: '/icon-192x192.png',
      badge: '/badge-96x96.png',
      data: {
        type: 'announcement',
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({ 
      status: 'success',
      message: 'Ankündigung erfolgreich gesendet'
    });
  } catch (error) {
    logger.error('[API/Announcements] Fehler beim Senden der Ankündigung:', {
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Interner Server-Fehler',
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
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

    if (id === 'all') {
      // Lösche alle Ankündigungen
      await Announcement.deleteMany({});
      logger.info('Alle Ankündigungen wurden gelöscht');
      revalidatePath('/');
      sseService.sendUpdateToAllClients();
      return NextResponse.json({
        success: true,
        message: 'Alle Ankündigungen wurden erfolgreich gelöscht'
      });
    }

    // Lösche einzelne Ankündigung
    const deletedAnnouncement = await Announcement.findByIdAndDelete(id);
    
    if (!deletedAnnouncement) {
      return NextResponse.json({
        success: false,
        message: `Keine Ankündigung mit ID ${id} gefunden`
      }, { status: 404 });
    }
    
    revalidatePath('/announcements');
    sseService.sendUpdateToAllClients();
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
    logger.error('Fehler beim Löschen der Ankündigung:', { error });
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
    const { id, reactions, deviceId } = body;
    
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

    if (!deviceId) {
      console.error('PUT /api/announcements: deviceId fehlt in der Anfrage');
      return NextResponse.json(
        { error: 'deviceId ist erforderlich' },
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

    // Validiere die Reaktionen
    const validReactionTypes = ['thumbsUp', 'clap', 'laugh', 'surprised', 'heart'];
    const validatedReactions = {};

    // Behalte die bestehenden Reaktionen bei
    const currentReactions = currentAnnouncement.reactions || {};

    for (const type of validReactionTypes) {
      // Initialisiere mit den bestehenden Reaktionen
      validatedReactions[type] = {
        count: currentReactions[type]?.count || 0,
        deviceReactions: { ...currentReactions[type]?.deviceReactions || {} }
      };

      // Wenn es eine neue Reaktion für diesen Typ gibt
      if (reactions[type]) {
        const newReaction = reactions[type];
        
        // Validiere die Struktur
        if (typeof newReaction.count === 'number' && typeof newReaction.deviceReactions === 'object') {
          // Prüfe, ob die deviceId in den neuen Reaktionen ist
          const hasDeviceReaction = newReaction.deviceReactions[deviceId];
          
          // Wenn ja, aktualisiere nur die Reaktion für diese deviceId
          if (hasDeviceReaction) {
            validatedReactions[type].deviceReactions[deviceId] = {
              type: type,
              announcementId: id
            };
          } else {
            // Wenn nicht, entferne die Reaktion dieser deviceId
            delete validatedReactions[type].deviceReactions[deviceId];
          }
          
          // Aktualisiere den Count basierend auf den deviceReactions
          validatedReactions[type].count = Object.keys(validatedReactions[type].deviceReactions).length;
        }
      }
    }

    // Aktualisiere nur die Reaktionen
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      { $set: { reactions: validatedReactions } },
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
    sseService.sendUpdateToAllClients();

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