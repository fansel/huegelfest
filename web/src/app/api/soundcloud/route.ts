import { NextResponse } from 'next/server';

async function resolveShortUrl(url: string): Promise<string> {
  try {
    console.log('Resolving short URL:', url);
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow'
    });
    return response.url;
  } catch (error) {
    console.error('Fehler beim Auflösen der kurzen URL:', error);
    throw error;
  }
}

async function getTrackInfo(url: string): Promise<any> {
  try {
    console.log('Getting track info for:', url);
    
    // Löse verkürzte URL auf, wenn es eine ist
    if (url.includes('on.soundcloud.com')) {
      url = await resolveShortUrl(url);
      console.log('Resolved URL:', url);
    }
    
    // Hole die oEmbed-Informationen von SoundCloud
    const response = await fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SoundCloud oEmbed Error:', errorText);
      throw new Error(`Fehler beim Abrufen der Track-Informationen: ${errorText}`);
    }

    const data = await response.json();
    console.log('Track info received:', data);

    // Gebe die Original-Daten zurück
    return data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Track-Informationen:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'Keine URL angegeben' }, { status: 400 });
    }

    console.log('Processing URL:', url);
    const trackInfo = await getTrackInfo(url);
    return NextResponse.json(trackInfo);
  } catch (error) {
    console.error('Fehler in der SoundCloud API:', error);
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
} 