import { env } from '../config/env'
import type { DetectedSong, MatchedSong, PlaylistResult, ScanResult, SharedPlaylist } from '../types'

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

export async function connectSpotify(returnUrl?: string): Promise<{ connected: boolean; username: string }> {
  const api = await loadApi()
  return api.connectSpotify(returnUrl)
}

export async function matchSongsWithSpotify(songs: DetectedSong[]): Promise<MatchedSong[]> {
  const api = await loadApi()
  return api.matchSongsWithSpotify(songs)
}

export async function createSpotifyPlaylist(
  songs: MatchedSong[],
  name?: string,
  description?: string
): Promise<PlaylistResult> {
  const api = await loadApi()
  return api.createSpotifyPlaylist(songs, name, description)
}

export async function saveSharedPlaylist(
  name: string,
  songs: MatchedSong[],
  description?: string,
  curatorName?: string
): Promise<{ publicId: string; shareUrl: string }> {
  const api = await loadApi()
  return api.saveSharedPlaylist(name, songs, description, curatorName)
}

export async function fetchSharedPlaylist(publicId: string): Promise<SharedPlaylist> {
  const api = await loadApi()
  return api.fetchSharedPlaylist(publicId)
}

export type { DetectedSong, MatchedSong, PlaylistResult, ScanResult, SharedPlaylist }
