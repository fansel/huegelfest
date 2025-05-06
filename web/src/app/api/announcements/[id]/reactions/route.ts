import { NextRequest, NextResponse } from 'next/server';
import { ReactionService } from '@/server/services/ReactionService';
import { logger } from '@/server/lib/logger';
import { sseService } from '@/server/lib/sse';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { type, deviceId } = await request.json();
    const { id: announcementId } = await context.params;

    if (!type || !deviceId) {
      return NextResponse.json(
        { error: 'Type und deviceId sind erforderlich' },
        { status: 400 }
      );
    }

    const reactionService = ReactionService.getInstance();
    await reactionService.addReaction(announcementId, type, deviceId);
    
    // Sende SSE-Update
    sseService.sendUpdateToAllClients();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Fehler beim Hinzufügen der Reaktion:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { type, deviceId } = await request.json();
    const { id: announcementId } = await context.params;

    if (!type || !deviceId) {
      return NextResponse.json(
        { error: 'Type und deviceId sind erforderlich' },
        { status: 400 }
      );
    }

    const reactionService = ReactionService.getInstance();
    await reactionService.removeReaction(announcementId, type, deviceId);
    
    // Sende SSE-Update
    sseService.sendUpdateToAllClients();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Fehler beim Entfernen der Reaktion:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
} 