import { Transcoding } from './info'

export type FORMATS = 'mp3' | 'opus'
export type STREAMING_PROTOCOLS = 'hls' | 'progressive'

export interface FilterPredicateObject {
  format?: FORMATS
  protocol?: STREAMING_PROTOCOLS
}

/** @internal */
const filterMedia = (media: Transcoding[], predicateObj: FilterPredicateObject): Transcoding[] => {
  return media.filter(m => {
    let match = true
    if (predicateObj.format) match = match && m.format.mime_type.includes(predicateObj.format)
    if (predicateObj.protocol) match = match && m.format.protocol === predicateObj.protocol
    return match
  })
}

export default filterMedia
