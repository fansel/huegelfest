import { NextResponse } from 'next/server';
import { getAllTracks } from '@/features/music/actions/getAllTracks';

export async function GET() {
  try {
    const tracks = await getAllTracks();
    // Passe die URLs an, damit sie auf die interne Streaming-API zeigen
    const mappedTracks = tracks.map(track => ({
      ...track,
      url: `/api/music/stream?id=${encodeURIComponent(track._id)}`
    }));
    return NextResponse.json({ tracks: mappedTracks });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    );
  }
} 