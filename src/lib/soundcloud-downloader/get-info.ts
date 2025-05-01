import axios from 'axios';

interface SoundCloudTrack {
  title: string;
  user?: {
    username: string;
    permalink_url: string;
    avatar_url: string;
  };
  artwork_url: string;
  description: string;
  embed_html: string;
}

export async function getInfo(url: string, clientID: string): Promise<SoundCloudTrack> {
  if (!url || !clientID) {
    throw new Error('URL und ClientID sind erforderlich');
  }

  try {
    const response = await axios.get(`https://api.soundcloud.com/resolve?url=${url}&client_id=${clientID}`);
    const trackId = response.data.id;
    const trackResponse = await axios.get(`https://api.soundcloud.com/tracks/${trackId}?client_id=${clientID}`);
    return trackResponse.data;
  } catch (error) {
    throw new Error('Fehler beim Abrufen der Track-Informationen');
  }
} 