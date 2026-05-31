import { env } from '../config/env'
import type { DetectedSong, MatchedSong, PlaylistResult, ScanResult } from '../types'

type ApiModule = typeof import('./mockApi') | typeof import('./apiClient')

let apiPromise: Promise<ApiModule> | null = null

function loadApi(): Promise<ApiModule> {
  if (!apiPromise) {
    apiPromise = (env.useMockApi ? import('./mockApi') : import('./apiClient')) as Promise<ApiModule>
  }
  return apiPromise
}

export async function processScan(files: File[]): Promise<ScanResult> {
  const api = await loadApi()
  return api.processScan(files)
}

export async function retrySongMatch(song: MatchedSong): Promise<MatchedSong> {
  const api = await loadApi()
  return api.retrySongMatch(song)
}

export async function connectSpotify(): Promise<{ connected: boolean; username: string }> {
  const api = await loadApi()
  return api.connectSpotify()
}

export async function matchSongsWithSpotify(songs: DetectedSong[]): Promise<MatchedSong[]> {
  const api = await loadApi()
  return api.matchSongsWithSpotify(songs)
}

export async function createSpotifyPlaylist(
  songs: MatchedSong[],
  name?: string
): Promise<PlaylistResult> {
  const api = await loadApi()
  return api.createSpotifyPlaylist(songs, name)
}

// Re-export types used by callers if needed
export type { DetectedSong, MatchedSong, PlaylistResult, ScanResult }
