import { AxiosInstance } from 'axios'
import sckey from 'soundcloud-key-fetch'

import getInfo, { getSetInfo, Transcoding, getTrackInfoByID, TrackInfo, User } from './info'
import filterMedia, { FilterPredicateObject } from './filter-media'
import { download, fromMediaObj } from './download'
import m3u8stream from 'm3u8stream'

import isValidURL, { convertFirebaseURL, isFirebaseURL, isPersonalizedTrackURL, isPlaylistURL, stripMobilePrefix } from './url'

import STREAMING_PROTOCOLS, { _PROTOCOLS } from './protocols'
import FORMATS, { _FORMATS } from './formats'
import { search, related, SoundcloudResource, SearchOptions } from './search'
import { downloadPlaylist } from './download-playlist'
import axios from 'axios'

import * as path from 'path'
import * as fs from 'fs'
import { PaginatedQuery } from './util'
import { GetLikesOptions, getLikes, Like } from './likes'
import { getUser } from './user'

export type SoundCloudFormat = 'mp3' | 'opus'
export type StreamingProtocol = 'hls' | 'progressive'

export class SoundCloud {
  private readonly STREAMING_PROTOCOLS: StreamingProtocol[] = ['hls', 'progressive']
  private readonly FORMATS: SoundCloudFormat[] = ['mp3', 'opus']
  private clientID: string = ''
  private axiosInstance: AxiosInstance

  constructor() {
    this.axiosInstance = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
      }
    })
  }

  async initialize(): Promise<void> {
    try {
      this.clientID = await sckey()
    } catch (error) {
      console.error('Fehler beim Initialisieren des SoundCloud Clients:', error)
      throw error
    }
  }

  private async downloadFormat(url: string, format: SoundCloudFormat): Promise<m3u8stream.Stream> {
    if (!this.clientID) {
      throw new Error('SoundCloud Client nicht initialisiert')
    }

    const info = await getInfo(url, this.clientID, this.axiosInstance)
    if (!info.media) {
      throw new Error('Keine Mediendaten gefunden')
    }

    const filtered = filterMedia(info.media.transcodings, { format })
    if (filtered.length === 0) {
      throw new Error(`Konnte keine Medien mit dem Format ${format} finden`)
    }

    return fromMediaObj(filtered[0], this.clientID, this.axiosInstance)
  }

  async downloadTrack(url: string, format: SoundCloudFormat = 'mp3'): Promise<m3u8stream.Stream> {
    if (!this.FORMATS.includes(format)) {
      throw new Error(`Ungültiges Format: ${format}`)
    }

    return this.downloadFormat(url, format)
  }

  async downloadPlaylist(url: string, format: SoundCloudFormat = 'mp3'): Promise<[m3u8stream.Stream[], string[]]> {
    if (!this.FORMATS.includes(format)) {
      throw new Error(`Ungültiges Format: ${format}`)
    }

    const info = await getSetInfo(url, this.clientID, this.axiosInstance)
    const trackNames: string[] = []
    const downloadPromises: Promise<m3u8stream.Stream>[] = []

    for (const track of info.tracks) {
      if (track.title && track.permalink_url) {
        trackNames.push(track.title)
        downloadPromises.push(this.downloadTrack(track.permalink_url, format))
      }
    }

    const result = await Promise.all(downloadPromises)
    return [result, trackNames]
  }

  async savePlaylist(playlistUrl: string, outputDir: string, format: SoundCloudFormat = 'mp3'): Promise<void> {
    const [streams, names] = await this.downloadPlaylist(playlistUrl, format)

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    for (let i = 0; i < streams.length; i++) {
      const stream = streams[i]
      const name = names[i]
      const filePath = path.join(outputDir, `${name}.${format}`)

      await new Promise<void>((resolve, reject) => {
        const fileStream = fs.createWriteStream(filePath)
        stream.pipe(fileStream)
        stream.on('end', () => resolve())
        stream.on('error', (err) => reject(err))
      })
    }
  }
}

export default SoundCloud
