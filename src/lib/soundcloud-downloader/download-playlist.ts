import { AxiosInstance } from 'axios'
import { download } from './download'
import { getSetInfo } from './info'

export async function downloadPlaylist(url: string, clientID: string, axiosInstance: any) {
  if (!url || !clientID) {
    throw new Error('URL und ClientID sind erforderlich')
  }

  const info = await getSetInfo(url, clientID, axiosInstance)

  const trackNames: string[] = []
  const result = await Promise.all(info.tracks.map(track => {
    if (!track.permalink_url) {
      throw new Error('Track URL ist nicht verfügbar')
    }
    if (!track.title) {
      throw new Error('Track Titel ist nicht verfügbar')
    }
    const p = download(track.permalink_url, clientID, axiosInstance)
    trackNames.push(track.title)
    return p
  }))

  return { trackNames, result }
}
