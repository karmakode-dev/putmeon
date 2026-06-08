import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SongRow from './SongRow'
import Button from './Button'
import Alert from './Alert'
import SpotifyConnectButton from './SpotifyConnectButton'
import { useApp } from '../context/AppContext'
import { createSpotifyPlaylist, matchSongsWithSpotify } from '../services/api'
import { saveSpotifySessionFromCallback, verifySpotifySession } from '../services/apiClient'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatSharedPlaylistMeta, isBackendConfigured } from '../config/env'

interface SharedPlaylistViewProps {
  publicId: string
  initialExportCount?: number
}

export default function SharedPlaylistView({ publicId, initialExportCount = 0 }: SharedPlaylistViewProps) {
  const navigate = useNavigate()
  const {
    songs,
    spotifyConnected,
    spotifyUsername,
    playlistName,
    playlistDescription,
    curatorName,
    shareUrl,
    setSpotifyConnected,
    setPlaylistResult,
    setSongs,
  } = useApp()

  const spotifyReturnUrl = `${window.location.origin}/p/${publicId}`

  useDocumentTitle(playlistName || 'Shared Playlist')

  const pendingCount = songs.filter((s) => s.status === 'pending').length
  const awaitingMatch = isBackendConfigured() && pendingCount > 0
  const playableCount = songs.filter((s) => s.status === 'matched' || s.status === 'possible').length

  const [creating, setCreating] = useState(false)
  const [matching, setMatching] = useState(false)
  const [exportCount, setExportCount] = useState(initialExportCount)
  const lastAutoRematchKey = useRef('')
  const [error, setError] = useState<string | null>(() => {
    if (!isBackendConfigured()) return null
    const spotifyError = new URLSearchParams(window.location.search).get('spotify_error')
    if (!spotifyError) return null
    const decoded = decodeURIComponent(spotifyError)
    if (decoded.includes('User Management')) return decoded
    if (decoded.toLowerCase().includes('failed to fetch spotify profile')) {
      return `${decoded} If you are testing in Spotify dev mode, add your Spotify email under User Management in the Spotify Developer Dashboard.`
    }
    return decoded
  })

  useEffect(() => {
    setExportCount(initialExportCount)
  }, [initialExportCount, publicId])

  const runRematch = useCallback(async () => {
    if (songs.length === 0) return
    setMatching(true)
    setError(null)
    try {
      const matched = await matchSongsWithSpotify(songs)
      setSongs(matched)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Spotify matching failed.')
    } finally {
      setMatching(false)
    }
  }, [songs, setSongs])

  useEffect(() => {
    if (!isBackendConfigured()) return

    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('spotify_session')
    const username = params.get('spotify_username')

    if (params.get('spotify_error')) {
      window.history.replaceState({}, '', spotifyReturnUrl)
      return
    }

    if (sessionId) {
      saveSpotifySessionFromCallback(sessionId)
      setSpotifyConnected(true, username ? decodeURIComponent(username) : undefined)
      window.history.replaceState({}, '', spotifyReturnUrl)
      return
    }

    if (!spotifyConnected) {
      verifySpotifySession().then((result) => {
        if (result.connected) setSpotifyConnected(true, result.username)
      })
    }
  }, [setSpotifyConnected, spotifyConnected, spotifyReturnUrl])

  useEffect(() => {
    if (!awaitingMatch || !spotifyConnected) return

    const key = songs.map((s) => `${s.id}:${s.title}:${s.artist}`).join('|')
    if (lastAutoRematchKey.current === key) return
    lastAutoRematchKey.current = key

    runRematch()
  }, [awaitingMatch, spotifyConnected, songs, runRematch])

  const handleCreatePlaylist = async () => {
    if (!spotifyConnected || awaitingMatch) return
    setCreating(true)
    setError(null)
    try {
      const result = await createSpotifyPlaylist(songs, playlistName, playlistDescription, publicId)
      if (result.exportCount != null) setExportCount(result.exportCount)
      setPlaylistResult(shareUrl ? { ...result, shareUrl } : result)
      navigate('/success', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create playlist. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{playlistName}</h1>
        {curatorName && (
          <p className="text-sm text-spotify font-medium mb-2">Curated by {curatorName} on PMO</p>
        )}
        {playlistDescription.trim() && (
          <p className="text-sm text-muted max-w-xl">{playlistDescription}</p>
        )}
        <p className="text-muted text-sm mt-2">{formatSharedPlaylistMeta(songs.length, exportCount)}</p>
      </div>

      {!spotifyConnected && (
        <Alert variant="info" className="mb-6">
          Connect Spotify to match these songs and add them to your library.
        </Alert>
      )}

      {matching && (
        <Alert variant="info" className="mb-6">
          Matching songs with Spotify…
        </Alert>
      )}

      <div
        className="rounded-2xl border border-border bg-card overflow-hidden mb-8 animate-slide-up"
        style={{ animationDelay: '100ms' }}
      >
        <div className="hidden sm:grid grid-cols-[2rem_2.5rem_1fr] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted uppercase tracking-wider">
          <span>#</span>
          <span aria-hidden="true" />
          <span>Song</span>
        </div>
        <div className="divide-y divide-border max-h-[50vh] overflow-y-auto" role="list" aria-label="Song list">
          {songs.map((song, index) => (
            <SongRow key={song.id} song={song} index={index} readOnly />
          ))}
        </div>
      </div>

      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Export to Spotify</p>

          <SpotifyConnectButton
            connected={spotifyConnected}
            username={spotifyUsername}
            returnUrl={spotifyReturnUrl}
            onConnect={(username) => setSpotifyConnected(true, username)}
            onError={setError}
          />

          {error && <Alert variant="error">{error}</Alert>}

          <Button
            size="lg"
            className="w-full"
            disabled={!spotifyConnected || awaitingMatch || playableCount === 0 || !playlistName.trim()}
            loading={creating}
            onClick={handleCreatePlaylist}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
            Export to Spotify
          </Button>
          {awaitingMatch && spotifyConnected && (
            <p className="text-xs text-muted text-center">Matching in progress — export once matches are ready</p>
          )}
        </div>
      </div>
    </div>
  )
}
