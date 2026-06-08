import {
  errorResponse,
  getRoutePath,
  getSpotifySessionId,
  handleCors,
  jsonResponse,
} from '../_shared/cors.ts'
import { detectSongsFromImages, filesToImages, type DetectedSong } from '../_shared/openai.ts'
import { countMatched, matchSong, matchSongs, type MatchedSong } from '../_shared/match.ts'
import { logScan, getServiceClient, getAuthUserId } from '../_shared/supabase.ts'
import {
  createUserPlaylist,
  exchangeAuthCode,
  fetchSpotifyProfile,
  generateCodeChallenge,
  generateCodeVerifier,
  getSession,
  getSpotifyRedirectUri,
  getUserAccessToken,
} from '../_shared/spotify.ts'

const SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
  'user-read-email',
].join(' ')
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

function getAppUrl(): string {
  return Deno.env.get('APP_URL') ?? 'http://localhost:5173'
}

function generatePublicId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

function toPendingSongs(songs: DetectedSong[]): MatchedSong[] {
  return songs.map((s) => ({ ...s, status: 'pending' as const }))
}

async function getMatchToken(req: Request): Promise<string | null> {
  const sessionId = getSpotifySessionId(req)
  if (sessionId) {
    const { token } = await getUserAccessToken(sessionId)
    return token
  }
  return null
}

async function handleScan(req: Request): Promise<Response> {
  const formData = await req.formData()
  const images = await filesToImages(formData)
  const songsDetected = await detectSongsFromImages(images, OPENAI_MODEL)
  const songsMatched = toPendingSongs(songsDetected)

  await logScan(images.length, songsDetected.length, 0)

  return jsonResponse({ songsDetected, songsMatched }, req)
}

async function handleScanDetect(req: Request): Promise<Response> {
  const formData = await req.formData()
  const images = await filesToImages(formData)
  const songs = await detectSongsFromImages(images, OPENAI_MODEL)
  return jsonResponse({ songs }, req)
}

async function handleScanMatch(req: Request): Promise<Response> {
  const { songs } = await req.json()
  if (!Array.isArray(songs)) return errorResponse('Invalid songs payload.', req)

  const userToken = await getMatchToken(req)
  if (!userToken) {
    return errorResponse('Connect Spotify before matching songs.', req, 401)
  }

  try {
    const matched = await matchSongs(songs, userToken)
    return jsonResponse({ songs: matched }, req)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Spotify matching failed.'
    return errorResponse(message, req, 502)
  }
}

async function handleScanRetry(req: Request): Promise<Response> {
  const { song } = await req.json()
  if (!song?.title || !song?.artist) return errorResponse('Invalid song payload.', req)

  const userToken = await getMatchToken(req)
  if (!userToken) {
    return errorResponse('Connect Spotify before matching songs.', req, 401)
  }

  try {
    const matched = await matchSong(song, userToken)
    return jsonResponse({ song: matched }, req)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Spotify matching failed.'
    return errorResponse(message, req, 502)
  }
}

async function handleSpotifyAuthStart(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const returnUrl = url.searchParams.get('return_url') ?? `${getAppUrl()}/review`
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
  const redirectUri = getSpotifyRedirectUri()

  if (!clientId || !redirectUri) {
    return errorResponse('Spotify OAuth is not configured.', req, 500)
  }

  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const stateId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const supabase = getServiceClient()
  const { error } = await supabase.from('spotify_oauth_states').insert({
    id: stateId,
    code_verifier: codeVerifier,
    return_url: returnUrl,
    expires_at: expiresAt,
  })
  if (error) return errorResponse('Failed to start Spotify auth.', req, 500)

  const authUrl = new URL('https://accounts.spotify.com/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('code_challenge_method', 'S256')
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('state', stateId)

  return Response.redirect(authUrl.toString(), 302)
}

async function handleSpotifyCallback(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const stateId = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error')

  if (oauthError) {
    return Response.redirect(`${getAppUrl()}/review?spotify_error=${encodeURIComponent(oauthError)}`, 302)
  }
  if (!code || !stateId) {
    return Response.redirect(`${getAppUrl()}/review?spotify_error=missing_code`, 302)
  }

  const supabase = getServiceClient()
  const { data: stateRow, error: stateError } = await supabase
    .from('spotify_oauth_states')
    .select('*')
    .eq('id', stateId)
    .maybeSingle()

  await supabase.from('spotify_oauth_states').delete().eq('id', stateId)

  if (stateError || !stateRow) {
    return Response.redirect(`${getAppUrl()}/review?spotify_error=invalid_state`, 302)
  }

  if (new Date(stateRow.expires_at).getTime() < Date.now()) {
    return Response.redirect(`${stateRow.return_url}?spotify_error=expired`, 302)
  }

  try {
    const tokens = await exchangeAuthCode(code, stateRow.code_verifier)
    const profile = await fetchSpotifyProfile(tokens.access_token)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const { data: session, error: sessionError } = await supabase
      .from('spotify_sessions')
      .insert({
        spotify_user_id: profile.id,
        display_name: profile.display_name,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
      })
      .select('id, display_name')
      .single()

    if (sessionError || !session) {
      return Response.redirect(`${stateRow.return_url}?spotify_error=session_failed`, 302)
    }

    const username = encodeURIComponent(session.display_name ?? profile.id)
    const redirectTo = new URL(stateRow.return_url)
    redirectTo.searchParams.set('spotify_session', session.id)
    redirectTo.searchParams.set('spotify_username', username)
    return Response.redirect(redirectTo.toString(), 302)
  } catch (err) {
    const message = encodeURIComponent(err instanceof Error ? err.message : 'auth_failed')
    return Response.redirect(`${stateRow.return_url}?spotify_error=${message}`, 302)
  }
}

async function handleSpotifyMe(req: Request): Promise<Response> {
  const sessionId = getSpotifySessionId(req)
  if (!sessionId) return errorResponse('No Spotify session.', req, 401)

  const session = await getSession(sessionId)
  if (!session) return errorResponse('Spotify session not found.', req, 401)

  return jsonResponse(
    {
      connected: true,
      username: session.display_name ?? session.spotify_user_id,
      sessionId: session.id,
    },
    req
  )
}

async function handleSaveSharedPlaylist(req: Request): Promise<Response> {
  const userId = await getAuthUserId(req)
  if (!userId) return errorResponse('Sign in to share a playlist.', req, 401)

  const body = await req.json()
  const name = (body.name as string | undefined)?.trim()
  const description = (body.description as string | undefined)?.trim() || null
  const curatorName = (body.curatorName as string | undefined)?.trim() || null
  const songs = body.songs

  if (!name || !Array.isArray(songs) || songs.length === 0) {
    return errorResponse('Invalid playlist payload.', req)
  }

  const supabase = getServiceClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle()

  if (profileError || !profile?.username) {
    return errorResponse('Choose a username before sharing playlists.', req, 403)
  }

  const publicId = generatePublicId()
  const { error } = await supabase.from('shared_playlists').insert({
    public_id: publicId,
    name,
    description,
    curator_name: curatorName,
    songs,
    owner_id: userId,
  })

  if (error) {
    console.error('save playlist error:', error)
    return errorResponse('Failed to save playlist.', req, 500)
  }

  const shareUrl = `${getAppUrl()}/p/${publicId}`
  return jsonResponse({ publicId, shareUrl }, req)
}

async function handleGetSharedPlaylist(req: Request, publicId: string): Promise<Response> {
  if (!publicId || publicId.length > 32) {
    return errorResponse('Invalid playlist id.', req, 400)
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('shared_playlists')
    .select('public_id, name, description, curator_name, songs, export_count')
    .eq('public_id', publicId)
    .maybeSingle()

  if (error || !data) return errorResponse('Playlist not found.', req, 404)

  return jsonResponse(
    {
      publicId: data.public_id,
      name: data.name,
      description: data.description,
      curatorName: data.curator_name ?? null,
      songs: data.songs,
      exportCount: data.export_count ?? 0,
    },
    req
  )
}

async function recordPlaylistExport(
  publicId: string,
  pmoUserId: string | null,
  spotifyUserId: string,
  platform = 'spotify'
): Promise<{ exportCount: number; recorded: boolean } | null> {
  const supabase = getServiceClient()
  const { data, error } = await supabase.rpc('record_playlist_export', {
    p_public_id: publicId,
    p_user_id: pmoUserId,
    p_spotify_user_id: spotifyUserId,
    p_platform: platform,
  })

  if (error) {
    console.error('record_playlist_export error:', error)
    return null
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null

  return {
    exportCount: row.new_export_count as number,
    recorded: row.was_recorded as boolean,
  }
}

async function handleCreatePlaylist(req: Request): Promise<Response> {
  const sessionId = getSpotifySessionId(req)
  if (!sessionId) return errorResponse('Connect Spotify before creating a playlist.', req, 401)

  const body = await req.json()
  const songs = body.songs as MatchedSong[] | undefined
  const name = (body.name as string | undefined)?.trim() || 'PutMeOn Playlist'
  const publicId = (body.publicId as string | undefined)?.trim() || null
  const platform = (body.platform as string | undefined)?.trim() || 'spotify'

  if (!Array.isArray(songs) || songs.length === 0) {
    return errorResponse('No songs provided.', req)
  }

  const trackIds = songs
    .filter((s) => (s.status === 'matched' || s.status === 'possible') && s.spotifyTrackId)
    .map((s) => s.spotifyTrackId!)

  if (trackIds.length === 0) {
    return errorResponse('No matched tracks to add to the playlist.', req)
  }

  const { token, session } = await getUserAccessToken(sessionId)
  const result = await createUserPlaylist(token, session.spotify_user_id, name, trackIds)

  let exportTracking: { exportCount: number; recorded: boolean } | null = null
  if (publicId) {
    const pmoUserId = await getAuthUserId(req)
    exportTracking = await recordPlaylistExport(publicId, pmoUserId, session.spotify_user_id, platform)
  }

  return jsonResponse(
    exportTracking ? { ...result, exportCount: exportTracking.exportCount, exportRecorded: exportTracking.recorded } : result,
    req
  )
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  const path = getRoutePath(req)

  try {
    if (path === '/scan' && req.method === 'POST') return await handleScan(req)
    if (path === '/scan/detect' && req.method === 'POST') return await handleScanDetect(req)
    if (path === '/scan/match' && req.method === 'POST') return await handleScanMatch(req)
    if (path === '/scan/retry' && req.method === 'POST') return await handleScanRetry(req)
    if (path === '/auth/spotify' && req.method === 'GET') return await handleSpotifyAuthStart(req)
    if (path === '/auth/spotify/callback' && req.method === 'GET') return await handleSpotifyCallback(req)
    if (path === '/auth/spotify/me' && req.method === 'GET') return await handleSpotifyMe(req)
    if (path === '/playlist' && req.method === 'POST') return await handleCreatePlaylist(req)
    if (path === '/playlists' && req.method === 'POST') return await handleSaveSharedPlaylist(req)
    if (path.startsWith('/playlists/') && req.method === 'GET') {
      const publicId = path.slice('/playlists/'.length)
      return await handleGetSharedPlaylist(req, publicId)
    }

    return errorResponse(`Not found: ${path}`, req, 404)
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return errorResponse(message, req, 500)
  }
})
