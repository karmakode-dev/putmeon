import type { DetectedSong } from './openai.ts'
import { primaryArtist, searchTrack, type SpotifyTrack } from './spotify.ts'

export type MatchStatus = 'pending' | 'matched' | 'possible' | 'failed'

export interface MatchedSong extends DetectedSong {
  status: MatchStatus
  spotifyTitle?: string
  spotifyArtist?: string
  spotifyTrackId?: string
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.9

  const aWords = new Set(na.split(' '))
  const bWords = nb.split(' ')
  let overlap = 0
  for (const w of bWords) {
    if (aWords.has(w)) overlap++
  }
  return overlap / Math.max(aWords.size, bWords.length)
}

function scoreTrack(title: string, artist: string, track: SpotifyTrack): number {
  const titleScore = similarity(title, track.name)
  const trackArtists = track.artists.map((a) => a.name).join(' ')
  const artistScore = Math.max(
    similarity(artist, trackArtists),
    similarity(primaryArtist(artist), trackArtists)
  )
  return titleScore * 0.55 + artistScore * 0.45
}

function classifyMatch(bestScore: number, hasResults: boolean): MatchStatus {
  if (!hasResults || bestScore < 0.35) return 'failed'
  if (bestScore >= 0.75) return 'matched'
  return 'possible'
}

export async function matchSong(
  song: DetectedSong,
  accessToken: string
): Promise<MatchedSong> {
  try {
    const tracks = await searchTrack(song.title, song.artist, accessToken)
    if (tracks.length === 0) {
      return { ...song, status: 'failed' }
    }

    let best = tracks[0]
    let bestScore = scoreTrack(song.title, song.artist, best)
    for (const track of tracks.slice(1)) {
      const score = scoreTrack(song.title, song.artist, track)
      if (score > bestScore) {
        best = track
        bestScore = score
      }
    }

    const status = classifyMatch(bestScore, true)
    return {
      ...song,
      status,
      spotifyTitle: best.name,
      spotifyArtist: best.artists.map((a) => a.name).join(', '),
      spotifyTrackId: status === 'failed' ? undefined : best.id,
    }
  } catch (err) {
    throw err
  }
}

export async function matchSongs(
  songs: DetectedSong[],
  accessToken: string
): Promise<MatchedSong[]> {
  const results: MatchedSong[] = []
  let apiError: Error | null = null

  for (const song of songs) {
    try {
      results.push(await matchSong(song, accessToken))
    } catch (err) {
      apiError = err instanceof Error ? err : new Error(String(err))
      results.push({ ...song, status: 'failed' })
    }
  }

  if (apiError && results.every((s) => s.status === 'failed')) {
    throw apiError
  }

  return results
}

export function countMatched(songs: MatchedSong[]): number {
  return songs.filter((s) => s.status === 'matched' || s.status === 'possible').length
}
