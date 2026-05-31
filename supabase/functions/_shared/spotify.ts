import { getServiceClient } from './supabase.ts'

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API = 'https://api.spotify.com/v1'

let appToken: { token: string; expiresAt: number } | null = null

function getSpotifyCredentials() {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials are not configured on the server.')
  }
  return { clientId, clientSecret }
}

export function getSpotifyRedirectUri(): string {
  return Deno.env.get('SPOTIFY_REDIRECT_URI') ?? ''
}

export async function getAppAccessToken(): Promise<string> {
  if (appToken && Date.now() < appToken.expiresAt - 60_000) {
    return appToken.token
  }

  const { clientId, clientSecret } = getSpotifyCredentials()
  const basic = btoa(`${clientId}:${clientSecret}`)
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error('Failed to obtain Spotify app token.')
  }

  const data = await response.json()
  appToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return appToken.token
}

export interface SpotifySession {
  id: string
  spotify_user_id: string
  display_name: string | null
  access_token: string
  refresh_token: string
  token_expires_at: string
}

export async function getSession(sessionId: string): Promise<SpotifySession | null> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('spotify_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()
  if (error || !data) return null
  return data as SpotifySession
}

export async function refreshSessionToken(session: SpotifySession): Promise<SpotifySession> {
  if (new Date(session.token_expires_at).getTime() > Date.now() + 60_000) {
    return session
  }

  const { clientId, clientSecret } = getSpotifyCredentials()
  const basic = btoa(`${clientId}:${clientSecret}`)
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: session.refresh_token,
    }),
  })

  if (!response.ok) throw new Error('Spotify session expired. Please reconnect.')

  const data = await response.json()
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()
  const supabase = getServiceClient()
  const { data: updated, error } = await supabase
    .from('spotify_sessions')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? session.refresh_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id)
    .select('*')
    .single()

  if (error || !updated) throw new Error('Failed to refresh Spotify session.')
  return updated as SpotifySession
}

export async function getUserAccessToken(sessionId: string): Promise<{ token: string; session: SpotifySession }> {
  const session = await getSession(sessionId)
  if (!session) throw new Error('Spotify not connected. Please connect your account.')
  const refreshed = await refreshSessionToken(session)
  return { token: refreshed.access_token, session: refreshed }
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
}

function cleanSearchTerm(value: string): string {
  return value.replace(/"/g, '').replace(/\s+/g, ' ').trim()
}

/** Use primary artist only — "Jhene Aiko ft. Mila J" → "Jhene Aiko" */
export function primaryArtist(artist: string): string {
  return artist.split(/\s+(?:ft\.?|feat\.?|featuring|,)\s+/i)[0]?.trim() ?? artist
}

async function runSpotifySearch(q: string, accessToken: string): Promise<SpotifyTrack[]> {
  const url = `${SPOTIFY_API}/search?${new URLSearchParams({
    q,
    type: 'track',
    limit: '10',
    market: 'US',
  })}`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const body = await response.text()
    console.error('Spotify search failed:', response.status, body)
    let message = `Spotify search failed (${response.status})`
    try {
      const parsed = JSON.parse(body)
      message = parsed.error?.message ?? message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  const data = await response.json()
  return (data.tracks?.items ?? []) as SpotifyTrack[]
}

export async function searchTrack(
  title: string,
  artist: string,
  accessToken: string
): Promise<SpotifyTrack[]> {
  const cleanTitle = cleanSearchTerm(title)
  const cleanArtist = cleanSearchTerm(primaryArtist(artist))

  const queries = [
    `track:"${cleanTitle}" artist:"${cleanArtist}"`,
    `track:"${cleanTitle}" ${cleanArtist}`,
    `${cleanTitle} ${cleanArtist}`,
    `${cleanTitle} artist:${cleanArtist}`,
  ]

  let lastError: Error | null = null
  for (const q of queries) {
    try {
      const tracks = await runSpotifySearch(q, accessToken)
      if (tracks.length > 0) return tracks
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      // Auth/quota errors won't improve with a different query — stop early
      if (lastError.message.toLowerCase().includes('premium')) throw lastError
      if (lastError.message.includes('403')) throw lastError
    }
  }

  if (lastError) throw lastError
  return []
}

export async function createUserPlaylist(
  accessToken: string,
  _userId: string,
  name: string,
  trackIds: string[]
): Promise<{ id: string; name: string; url: string; trackCount: number }> {
  // Feb 2026: POST /users/{id}/playlists removed — use POST /me/playlists
  const createRes = await fetch(`${SPOTIFY_API}/me/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, public: true, description: 'Created with PutMeOn' }),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(parseSpotifyError('Failed to create playlist', err))
  }

  const playlist = await createRes.json()
  const uris = trackIds.map((id) => `spotify:track:${id}`)

  // Feb 2026: POST /playlists/{id}/tracks removed — use POST /playlists/{id}/items
  const batchSize = 100
  for (let i = 0; i < uris.length; i += batchSize) {
    const batch = uris.slice(i, i + batchSize)
    const addRes = await fetch(`${SPOTIFY_API}/playlists/${playlist.id}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: batch }),
    })
    if (!addRes.ok) {
      const err = await addRes.text()
      throw new Error(parseSpotifyError('Failed to add tracks to playlist', err))
    }
  }

  return {
    id: playlist.id,
    name: playlist.name,
    url: playlist.external_urls?.spotify ?? `https://open.spotify.com/playlist/${playlist.id}`,
    trackCount: uris.length,
  }
}

function parseSpotifyError(prefix: string, raw: string): string {
  try {
    const parsed = JSON.parse(raw)
    const message = parsed.error?.message ?? parsed.message
    if (message) return `${prefix}: ${message}`
  } catch {
    // ignore
  }
  return `${prefix}: ${raw}`
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function exchangeAuthCode(code: string, codeVerifier: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const { clientId } = getSpotifyCredentials()
  const redirectUri = getSpotifyRedirectUri()
  if (!redirectUri) throw new Error('SPOTIFY_REDIRECT_URI is not configured.')

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Spotify token exchange failed: ${err}`)
  }

  return response.json()
}

export async function fetchSpotifyProfile(accessToken: string): Promise<{ id: string; display_name: string | null }> {
  const response = await fetch(`${SPOTIFY_API}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error('Failed to fetch Spotify profile.')
  const profile = await response.json()
  return { id: profile.id, display_name: profile.display_name ?? profile.id }
}
