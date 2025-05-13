import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connector';
import Music from '@/lib/db/models/Music';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID ist erforderlich' }), { status: 400 });
  }

  await connectDB();
  const music = await Music.findById(id);
  if (!music || !music.audioData) {
    return new Response(JSON.stringify({ error: 'Track nicht gefunden' }), { status: 404 });
  }

  return new Response(music.audioData, {
    headers: {
      'Content-Type': music.mimeType || 'audio/mpeg',
      'Content-Length': music.audioData.length.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000'
    }
  });
} 