import type { DetectedSong, MatchedSong, PlaylistResult, ScanResult, SharedPlaylist } from '../types'
import { env, sharedPlaylistUrl } from '../config/env'
import { getAccessToken } from '../lib/supabaseClient'
import { clearSpotifySessionId, getSpotifySessionId, setSpotifySessionId } from './spotifySession'

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function authHeaders(): Record<string, string> {
  const sessionId = getSpotifySessionId()
  return sessionId ? { 'X-Spotify-Session': sessionId } : {}
}

async function buildHeaders(options: RequestInit = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...authHeaders(),
    ...(options.headers as Record<string, string> | undefined),
  }
  const token = await getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!env.apiUrl) {
    throw new ApiError('API URL is not configured. Set VITE_API_URL in your environment.')
  }

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: await buildHeaders(options),
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = body.error ?? body.message ?? message
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status)
  }

  return response.json() as Promise<T>
}

export async function detectSongsFromImages(files: File[]): Promise<DetectedSong[]> {
  const formData = new FormData()
  files.forEach((file, i) => formData.append('images', file, file.name || `image-${i}.jpg`))

  const result = await request<{ songs: DetectedSong[] }>('/scan/detect', {
    method: 'POST',
    body: formData,
  })
  return result.songs
}

export async function matchSongsWithSpotify(songs: DetectedSong[]): Promise<MatchedSong[]> {
  const result = await request<{ songs: MatchedSong[] }>('/scan/match', {
    method: 'POST',
    body: JSON.stringify({ songs }),
  })
  return result.songs
}

export async function processScan(files: File[]): Promise<ScanResult> {
  const formData = new FormData()
  files.forEach((file, i) => formData.append('images', file, file.name || `image-${i}.jpg`))

  return request<ScanResult>('/scan', { method: 'POST', body: formData })
}

export async function retrySongMatch(song: MatchedSong): Promise<MatchedSong> {
  const result = await request<{ song: MatchedSong }>('/scan/retry', {
    method: 'POST',
    body: JSON.stringify({ song }),
  })
  return result.song
}

export async function connectSpotify(returnUrl?: string): Promise<{ connected: boolean; username: string }> {
  const redirect = returnUrl ?? `${window.location.origin}/review`
  window.location.href = `${env.apiUrl}/auth/spotify?return_url=${encodeURIComponent(redirect)}`
  return { connected: false, username: '' }
}

export async function verifySpotifySession(): Promise<{ connected: boolean; username: string }> {
  const sessionId = getSpotifySessionId()
  if (!sessionId) return { connected: false, username: '' }

  try {
    const result = await request<{ connected: boolean; username: string }>('/auth/spotify/me')
    if (!result.connected) {
      clearSpotifySessionId()
      return { connected: false, username: '' }
    }
    return result
  } catch {
    clearSpotifySessionId()
    return { connected: false, username: '' }
  }
}

export function saveSpotifySessionFromCallback(sessionId: string): void {
  setSpotifySessionId(sessionId)
}

export async function createSpotifyPlaylist(
  songs: MatchedSong[],
  name = 'PutMeOn Playlist',
  description?: string
): Promise<PlaylistResult> {
  if (!getSpotifySessionId()) {
    throw new ApiError('Connect Spotify before creating a playlist.')
  }
  const result = await request<PlaylistResult>('/playlist', {
    method: 'POST',
    body: JSON.stringify({ songs, name }),
  })

  try {
    const share = await saveSharedPlaylist(name, songs, description)
    return { ...result, shareId: share.publicId, shareUrl: share.shareUrl }
  } catch {
    return result
  }
}

export async function saveSharedPlaylist(
  name: string,
  songs: MatchedSong[],
  description?: string,
  curatorName?: string
): Promise<{ publicId: string; shareUrl: string }> {
  const result = await request<{ publicId: string; shareUrl: string }>('/playlists', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description: description?.trim() || null,
      curatorName: curatorName?.trim() || null,
      songs,
    }),
  })
  return { publicId: result.publicId, shareUrl: sharedPlaylistUrl(result.publicId) }
}

export async function fetchSharedPlaylist(publicId: string): Promise<SharedPlaylist> {
  return request<SharedPlaylist>(`/playlists/${encodeURIComponent(publicId)}`)
}

export { clearSpotifySessionId, getSpotifySessionId }
