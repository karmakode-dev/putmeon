import { matchSongsToSpotify } from '../data/mockSongs'
import { detectSongsFromImages } from './songDetection'
import type { DetectedSong, MatchedSong, PlaylistResult, ScanResult } from '../types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function detectSongsFromImagesForScan(files: File[]): Promise<DetectedSong[]> {
  const { songs } = await detectSongsFromImages(files)
  return songs
}

export async function matchSongsWithSpotify(songs: DetectedSong[]): Promise<MatchedSong[]> {
  await delay(800)
  return matchSongsToSpotify(songs)
}

export async function processScan(files: File[]): Promise<ScanResult> {
  const songsDetected = await detectSongsFromImagesForScan(files)
  const songsMatched = await matchSongsWithSpotify(songsDetected)
  return { songsDetected, songsMatched }
}

export async function retrySongMatch(song: MatchedSong): Promise<MatchedSong> {
  await delay(800)
  return {
    ...song,
    status: 'matched',
    spotifyTitle: song.title,
    spotifyArtist: song.artist,
    spotifyTrackId: `mock-track-${song.id}-retry`,
  }
}

export async function connectSpotify(): Promise<{ connected: boolean; username: string }> {
  await delay(1500)
  return { connected: true, username: 'musiclover' }
}

export async function createSpotifyPlaylist(
  songs: MatchedSong[],
  name = 'PutMeOn Playlist'
): Promise<PlaylistResult> {
  await delay(2000)
  const matchedTracks = songs.filter((s) => s.status === 'matched' || s.status === 'possible')
  return {
    id: `mock-playlist-${Date.now()}`,
    name,
    url: 'https://open.spotify.com/playlist/mock123',
    trackCount: matchedTracks.length,
  }
}
