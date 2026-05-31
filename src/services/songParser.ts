import type { DetectedSong } from '../types'
import type { OcrLine } from './ocr'

const SKIP_PATTERNS = [
  /^part\s+\d+$/i,
  /^@\w+/,
  /tiktok/i,
  /instagram/i,
  /^spotify$/i,
  /playlist/i,
  /^\d+\s*(songs?|tracks?)$/i,
  /^explicit$/i,
  /^download(ed)?$/i,
  /^premium$/i,
  /^your\s+library$/i,
]

const HEADER_WORDS = /\b(elite|songs?|crack|part|mix|playlist|vibe|hours?|fine|shyt)\b/i
const GARBAGE_CHARS = /[{}\[\]|\\<>@#^~`"]/
const REQUIRES_SPACED_DASH = /\s[-–—]\s/

function normalizeLine(line: string): string {
  return line
    .replace(/[|]/g, 'I')
    .replace(/\s+/g, ' ')
    .replace(/^[•●▪▫]\s*/, '')
    .replace(/^\d+[\.\)\:\-\s]+/, '')
    .trim()
}

function isLikelyHeader(text: string): boolean {
  const upper = text.toUpperCase()
  if (upper === text && text.length > 22 && !REQUIRES_SPACED_DASH.test(text)) return true
  if (text.length > 55 && !REQUIRES_SPACED_DASH.test(text)) return true
  if (HEADER_WORDS.test(text) && !REQUIRES_SPACED_DASH.test(text)) return true
  return SKIP_PATTERNS.some((p) => p.test(text))
}

function isNoiseLine(text: string): boolean {
  const t = text.trim()
  if (t.length <= 1) return true
  if (/^e$/i.test(t)) return true
  if (/^[♫♪▶]+$/.test(t)) return true
  if (/^[\W\d]+$/.test(t)) return true
  return SKIP_PATTERNS.some((p) => p.test(t))
}

function nameQuality(name: string): number {
  if (!name || name.length < 2) return 0

  let score = 1

  if (GARBAGE_CHARS.test(name)) score -= 0.5
  if (/\d{2,}/.test(name)) score -= 0.25
  if ((name.match(/\d/g)?.length ?? 0) / name.length > 0.2) score -= 0.3

  const letters = name.match(/[a-zA-Z]/g)?.length ?? 0
  if (letters / name.length < 0.5) score -= 0.4

  if (/[a-z][A-Z][a-z]/.test(name.replace(/\s/g, ''))) score -= 0.2

  const allowed = name.match(/[a-zA-Z0-9\s&'.,"$+():!?-]/g)?.length ?? 0
  score *= allowed / name.length

  return Math.max(0, Math.min(1, score))
}

function cleanName(name: string): string {
  return name
    .replace(/\*+/g, '')
    .replace(/[|\\{}[\]<>]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\W_]+|[\W_]+$/g, '')
    .trim()
}

function parseArtistTitle(rawLine: string): { artist: string; title: string } | null {
  const line = normalizeLine(rawLine)

  const numbered = line.match(/^\d+[\.\)\:\-]\s*(.+?)\s[-–—]\s+(.+)$/)
  if (numbered) {
    return { artist: numbered[1].trim(), title: numbered[2].trim() }
  }

  if (!REQUIRES_SPACED_DASH.test(line)) return null

  const dash = line.match(/^(.+?)\s[-–—]\s+(.+)$/)
  if (dash) {
    return { artist: dash[1].trim(), title: dash[2].trim() }
  }

  return null
}

function songKey(artist: string, title: string): string {
  return `${artist.toLowerCase()}|${title.toLowerCase()}`
}

function scoreSong(artist: string, title: string, ocrConfidence: number): number {
  const artistQ = nameQuality(artist)
  const titleQ = nameQuality(title)

  if (artistQ < 0.45 || titleQ < 0.45) return 0

  return ocrConfidence * 0.3 + ((artistQ + titleQ) / 2) * 0.7
}

function pushSong(
  songs: DetectedSong[],
  seen: Set<string>,
  title: string,
  artist: string,
  ocrConfidence: number
) {
  const cleanTitle = cleanName(title)
  const cleanArtist = cleanName(artist)

  if (cleanTitle.length < 2 || cleanArtist.length < 2) return
  if (cleanTitle.length > 100 || cleanArtist.length > 80) return
  if (/\w\.\w/.test(cleanTitle) && cleanTitle.length < 8) return

  const confidence = scoreSong(cleanArtist, cleanTitle, ocrConfidence)
  if (confidence < 0.42) return

  const key = songKey(cleanArtist, cleanTitle)
  if (seen.has(key)) return
  seen.add(key)

  songs.push({
    id: String(songs.length + 1),
    artist: cleanArtist,
    title: cleanTitle,
    confidence: Math.round(confidence * 100) / 100,
  })
}

/** TikTok / Apple Music: "Artist - Song Title" on one line */
function parseDashFormat(lines: OcrLine[]): DetectedSong[] {
  const songs: DetectedSong[] = []
  const seen = new Set<string>()

  for (const { text: rawLine, confidence: ocrConfidence } of lines) {
    const line = normalizeLine(rawLine)
    if (line.length < 5 || isLikelyHeader(line) || isNoiseLine(line)) continue

    const parsed = parseArtistTitle(line)
    if (!parsed) continue

    if (parsed.artist.length < 3 || parsed.title.length < 3) continue
    if (parsed.artist.length < 5 && !parsed.artist.includes(' ')) continue

    pushSong(songs, seen, parsed.title, parsed.artist, ocrConfidence)
  }

  return songs
}

/** Spotify / Apple Music UI: title on one line, artist on the next */
function parseStackedFormat(lines: OcrLine[]): DetectedSong[] {
  const songs: DetectedSong[] = []
  const seen = new Set<string>()

  const filtered = lines
    .map((line) => ({ ...line, text: normalizeLine(line.text) }))
    .filter((line) => line.text.length >= 2 && !isNoiseLine(line.text) && !isLikelyHeader(line.text))

  for (let i = 0; i < filtered.length; i++) {
    const current = filtered[i]

    const dashed = parseArtistTitle(current.text)
    if (dashed) {
      pushSong(songs, seen, dashed.title, dashed.artist, current.confidence)
      continue
    }

    if (i + 1 >= filtered.length) continue

    const next = filtered[i + 1]
    if (REQUIRES_SPACED_DASH.test(next.text)) continue

    const title = current.text
    const artist = next.text
    const avgConf = (current.confidence + next.confidence) / 2

    const before = songs.length
    pushSong(songs, seen, title, artist, avgConf)
    if (songs.length > before) i++
  }

  return songs
}

export function parseSongsFromOcrLines(lines: OcrLine[]): DetectedSong[] {
  const dashSongs = parseDashFormat(lines)
  const stackedSongs = parseStackedFormat(lines)

  const songs = stackedSongs.length >= dashSongs.length ? stackedSongs : dashSongs

  return songs.sort((a, b) => b.confidence - a.confidence)
}

export function parseSongsFromOcrText(text: string): DetectedSong[] {
  return parseSongsFromOcrLines(
    text
      .split(/\r?\n/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text, confidence: 0.5 }))
  )
}
