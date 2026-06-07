import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SongRow from '../components/SongRow'
import Button from '../components/Button'
import Alert from '../components/Alert'
import SpotifyConnectButton from '../components/SpotifyConnectButton'
import SharePlaylistPanel from '../components/SharePlaylistPanel'
import { useApp } from '../context/AppContext'
import { createSpotifyPlaylist, matchSongsWithSpotify } from '../services/api'
import { saveSpotifySessionFromCallback, verifySpotifySession, clearSpotifySessionId } from '../services/apiClient'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { env, isBackendConfigured, isOpenAiConfigured } from '../config/env'

export default function ReviewPage() {
  const navigate = useNavigate()
  const {
    songs,
    spotifyConnected,
    spotifyUsername,
    playlistName,
    playlistDescription,
    entrySource,
    reviewMode,
    shareUrl,
    curatorName,
    sharedPublicId,
    setShareUrl,
    updateSong,
    removeSong,
    addSong,
    reorderSong,
    setSpotifyConnected,
    setPlaylistResult,
    setPlaylistName,
    setSongs,
  } = useApp()

  const pendingCount = songs.filter((s) => s.status === 'pending').length
  const awaitingMatch = isBackendConfigured() && pendingCount > 0
  const hasMatched = songs.some((s) => s.status !== 'pending')

  useDocumentTitle(awaitingMatch ? 'Review Songs' : 'Review Matches')

  const [creating, setCreating] = useState(false)
  const [matching, setMatching] = useState(false)
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
  const [filter, setFilter] = useState<'all' | 'matched' | 'possible' | 'failed'>('all')
  const [newTitle, setNewTitle] = useState('')
  const [newArtist, setNewArtist] = useState('')

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

  const handleReconnectSpotify = () => {
    clearSpotifySessionId()
    setSpotifyConnected(false, undefined)
    lastAutoRematchKey.current = ''
    setSongs(songs.map((s) => ({ ...s, status: 'pending' as const, spotifyTrackId: undefined, spotifyTitle: undefined, spotifyArtist: undefined })))
  }

  useEffect(() => {
    if (reviewMode === 'shared' && sharedPublicId) {
      navigate(`/p/${sharedPublicId}`, { replace: true })
    }
  }, [reviewMode, sharedPublicId, navigate])

  useEffect(() => {
    if (reviewMode === 'shared') return
    if (songs.length === 0) {
      if (reviewMode === 'curate') navigate('/curate', { replace: true })
      else navigate('/upload', { replace: true })
    }
  }, [songs, navigate, reviewMode])

  useEffect(() => {
    if (!isBackendConfigured()) return

    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('spotify_session')
    const username = params.get('spotify_username')

    if (params.get('spotify_error')) {
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    if (sessionId) {
      saveSpotifySessionFromCallback(sessionId)
      setSpotifyConnected(true, username ? decodeURIComponent(username) : undefined)
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    if (!spotifyConnected) {
      verifySpotifySession().then((result) => {
        if (result.connected) setSpotifyConnected(true, result.username)
      })
    }
  }, [setSpotifyConnected, spotifyConnected])

  useEffect(() => {
    if (!awaitingMatch || !spotifyConnected) return

    const key = songs.map((s) => `${s.id}:${s.title}:${s.artist}`).join('|')
    if (lastAutoRematchKey.current === key) return
    lastAutoRematchKey.current = key

    runRematch()
  }, [awaitingMatch, spotifyConnected, songs, runRematch])

  const matchedCount = songs.filter((s) => s.status === 'matched').length
  const possibleCount = songs.filter((s) => s.status === 'possible').length
  const failedCount = songs.filter((s) => s.status === 'failed').length
  const playableCount = matchedCount + possibleCount

  const filteredSongs =
    filter === 'all' ? songs : songs.filter((s) => s.status === filter)

  const handleCreatePlaylist = async () => {
    if (!spotifyConnected || awaitingMatch) return
    setCreating(true)
    setError(null)
    try {
      const result = await createSpotifyPlaylist(songs, playlistName, playlistDescription)
      setPlaylistResult(shareUrl ? { ...result, shareUrl } : result)
      navigate('/success', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create playlist. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  if (reviewMode === 'shared') {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-muted animate-pulse">Loading playlist…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 animate-slide-up">
        <>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {awaitingMatch ? 'Review Songs' : 'Review Matches'}
          </h1>
          <p className="text-muted text-sm">
            {awaitingMatch
              ? entrySource === 'curate'
                ? `${songs.length} songs in your list — edit if needed, then connect Spotify`
                : `${songs.length} songs detected — edit if needed, then connect Spotify`
              : `${playableCount} / ${songs.length} songs matched on Spotify`}
          </p>
          {playlistDescription.trim() && (
            <p className="text-sm text-muted/80 mt-2 max-w-xl">{playlistDescription}</p>
          )}
        </>
      </div>

      {env.useMockApi && (
        <Alert variant="info" className="mb-6">
          {isOpenAiConfigured()
            ? 'Songs detected with OpenAI Vision. Review any low-confidence rows, then connect Spotify (demo) to create your playlist.'
            : 'Using free OCR fallback. Add your OpenAI key to .env.local for much better results on TikTok and Spotify screenshots.'}
        </Alert>
      )}

      {awaitingMatch && !spotifyConnected && (
        <Alert variant="info" className="mb-6">
          Step 1: Fix any wrong titles or artists below. Step 2: Connect Spotify to match your list.
        </Alert>
      )}

      {matching && (
        <Alert variant="info" className="mb-6">
          Matching songs with Spotify…
        </Alert>
      )}

      {hasMatched && playableCount > 0 && (
        <Alert variant="info" className="mb-6">
          {playableCount} / {songs.length} songs ready for your playlist. Create it when you&apos;re happy with the list.
        </Alert>
      )}

      {awaitingMatch ? (
        <div className="rounded-xl border border-border bg-card p-4 mb-8 animate-slide-up">
          <p className="text-2xl font-bold">{songs.length}</p>
          <p className="text-xs text-muted mt-1">Songs detected</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-8 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <button
            type="button"
            aria-pressed={filter === 'matched'}
            onClick={() => setFilter(filter === 'matched' ? 'all' : 'matched')}
            className={`rounded-xl border p-4 text-left transition-colors ${
              filter === 'matched' ? 'border-spotify/50 bg-spotify/5' : 'border-border bg-card hover:border-border/80'
            }`}
          >
            <p className="text-2xl font-bold text-spotify">{matchedCount}</p>
            <p className="text-xs text-muted mt-1">Matched</p>
          </button>
          <button
            type="button"
            aria-pressed={filter === 'possible'}
            onClick={() => setFilter(filter === 'possible' ? 'all' : 'possible')}
            className={`rounded-xl border p-4 text-left transition-colors ${
              filter === 'possible' ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-border bg-card hover:border-border/80'
            }`}
          >
            <p className="text-2xl font-bold text-yellow-400">{possibleCount}</p>
            <p className="text-xs text-muted mt-1">Possible</p>
          </button>
          <button
            type="button"
            aria-pressed={filter === 'failed'}
            onClick={() => setFilter(filter === 'failed' ? 'all' : 'failed')}
            className={`rounded-xl border p-4 text-left transition-colors ${
              filter === 'failed' ? 'border-red-500/50 bg-red-500/5' : 'border-border bg-card hover:border-border/80'
            }`}
          >
            <p className="text-2xl font-bold text-red-400">{failedCount}</p>
            <p className="text-xs text-muted mt-1">Failed</p>
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="hidden sm:grid grid-cols-[2rem_2.5rem_1fr_auto_auto] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted uppercase tracking-wider">
          <span>#</span>
          <span aria-hidden="true" />
          <span>Song</span>
          <span>Status</span>
          <span className="w-24" aria-hidden="true" />
        </div>
        <div className="divide-y divide-border max-h-[50vh] overflow-y-auto" role="list" aria-label="Song list">
          {filteredSongs.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              index={songs.indexOf(song)}
              onRemove={removeSong}
              onUpdate={updateSong}
              onReorder={reviewMode !== 'scan' ? reorderSong : undefined}
              canMoveUp={reviewMode !== 'scan' && songs.indexOf(song) > 0}
              canMoveDown={reviewMode !== 'scan' && songs.indexOf(song) < songs.length - 1}
            />
          ))}
          {filteredSongs.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted">No songs in this category</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 mb-8">
        <p className="text-sm font-medium mb-3">Add a missing song</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            aria-label="New song title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Song title"
            className="flex-1 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-spotify/50"
          />
          <input
            aria-label="New song artist"
            value={newArtist}
            onChange={(e) => setNewArtist(e.target.value)}
            placeholder="Artist"
            className="flex-1 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-spotify/50"
          />
          <Button
            variant="secondary"
            onClick={() => {
              if (!newTitle.trim() || !newArtist.trim()) return
              addSong(newTitle.trim(), newArtist.trim())
              setNewTitle('')
              setNewArtist('')
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
        {(reviewMode === 'curate' || shareUrl) && (
          <SharePlaylistPanel
            songs={songs}
            playlistName={playlistName}
            playlistDescription={playlistDescription}
            curatorName={curatorName ?? ''}
            shareUrl={shareUrl}
            onShareUrl={setShareUrl}
            compact
          />
        )}

        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Export to Spotify</p>

        <div>
          <label htmlFor="playlist-name" className="block text-sm font-medium mb-2">
            Playlist name
          </label>
          <input
            id="playlist-name"
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            maxLength={100}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-spotify/50 focus:border-spotify/50"
            placeholder="PutMeOn Playlist"
          />
        </div>

        <SpotifyConnectButton
          connected={spotifyConnected}
          username={spotifyUsername}
          onConnect={(username) => setSpotifyConnected(true, username)}
          onError={setError}
        />

        {spotifyConnected && awaitingMatch && !matching && (
          <Button variant="secondary" className="w-full" onClick={runRematch}>
            Match songs with Spotify
          </Button>
        )}

        {spotifyConnected && hasMatched && (
          <Button variant="secondary" className="w-full" onClick={runRematch} disabled={matching}>
            Re-match songs
          </Button>
        )}

        {spotifyConnected && (
          <button
            type="button"
            onClick={handleReconnectSpotify}
            className="w-full text-xs text-muted hover:text-white transition-colors"
          >
            Disconnect Spotify
          </button>
        )}

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
          Create Spotify Playlist
        </Button>
        {awaitingMatch && !spotifyConnected && (
          <p className="text-xs text-muted text-center">Connect Spotify to match your song list</p>
        )}
        {awaitingMatch && spotifyConnected && (
          <p className="text-xs text-muted text-center">Matching in progress — create playlist once matches appear</p>
        )}
        </div>
      </div>
    </div>
  )
}
