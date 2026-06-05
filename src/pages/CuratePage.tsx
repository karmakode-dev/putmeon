import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Alert from '../components/Alert'
import SongRow from '../components/SongRow'
import SharePlaylistPanel from '../components/SharePlaylistPanel'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { parsePastedSongList } from '../services/pasteListParser'
import { env } from '../config/env'
import type { MatchedSong } from '../types'

function toMatchedSongs(parsed: { title: string; artist: string }[]): MatchedSong[] {
  const isMock = env.useMockApi
  return parsed.map((song, i) => {
    const id = `curate-${Date.now()}-${i}`
    return {
      id,
      title: song.title,
      artist: song.artist,
      confidence: 1,
      status: isMock ? ('matched' as const) : ('pending' as const),
      spotifyTitle: isMock ? song.title : undefined,
      spotifyArtist: isMock ? song.artist : undefined,
      spotifyTrackId: isMock ? `mock-track-${id}` : undefined,
    }
  })
}

export default function CuratePage() {
  useDocumentTitle('Curate Playlist')
  const navigate = useNavigate()
  const {
    songs,
    playlistName,
    playlistDescription,
    shareUrl,
    setSongs,
    setPlaylistName,
    setPlaylistDescription,
    setEntrySource,
    setShareUrl,
    addSong,
    removeSong,
    updateSong,
    reorderSong,
  } = useApp()

  const [pasteText, setPasteText] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newArtist, setNewArtist] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleParsePaste = () => {
    setError(null)
    const parsed = parsePastedSongList(pasteText)
    if (parsed.length === 0) {
      setError('No songs found. Use one song per line (e.g. Song - Artist).')
      return
    }
    setSongs(toMatchedSongs(parsed))
    setPasteText('')
  }

  const handleExportSpotify = () => {
    if (songs.length === 0) {
      setError('Add at least one song before exporting.')
      return
    }
    if (!playlistName.trim()) {
      setError('Enter a playlist name.')
      return
    }
    setError(null)
    setEntrySource('curate')
    navigate('/review')
  }

  const hasList = songs.length > 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Curate Playlist</h1>
        <p className="text-muted text-sm">
          Build your list, share it with PutMeOn, or export to a streaming app.
        </p>
      </div>

      <div className="space-y-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <div>
            <label htmlFor="curate-name" className="block text-sm font-medium mb-2">
              Playlist name
            </label>
            <input
              id="curate-name"
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              maxLength={100}
              placeholder="My Playlist"
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-spotify/50"
            />
          </div>
          <div>
            <label htmlFor="curate-desc" className="block text-sm font-medium mb-2">
              Description <span className="text-muted font-normal">(optional)</span>
            </label>
            <textarea
              id="curate-desc"
              value={playlistDescription}
              onChange={(e) => setPlaylistDescription(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="A short note about this playlist"
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-spotify/50"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium mb-2">Already have a list? Paste it here and put them on.</p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={6}
            placeholder={'Persian Rugs - PARTYNEXTDOOR\nPractice by Drake\nSkin - Rihanna\nBroken Clocks - SZA'}
            className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-spotify/50"
          />
          <p className="text-xs text-muted mt-2">
            One song per line. Supports Song - Artist, Song by Artist, Artist, Song, and more. No AI — parsed on your device.
          </p>
          <Button variant="secondary" className="mt-3" onClick={handleParsePaste} disabled={!pasteText.trim()}>
            Parse list
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium mb-3">Add a song</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              aria-label="Song title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Song title"
              className="flex-1 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-spotify/50"
            />
            <input
              aria-label="Artist (optional)"
              value={newArtist}
              onChange={(e) => setNewArtist(e.target.value)}
              placeholder="Artist (optional)"
              className="flex-1 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-spotify/50"
            />
            <Button
              variant="secondary"
              onClick={() => {
                if (!newTitle.trim()) return
                addSong(newTitle.trim(), newArtist.trim() || undefined)
                setNewTitle('')
                setNewArtist('')
              }}
            >
              Add
            </Button>
          </div>
        </div>

        {hasList && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-medium">{songs.length} songs</p>
              <button
                type="button"
                onClick={() => {
                  setSongs([])
                  setShareUrl(null)
                }}
                className="text-xs text-muted hover:text-white transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="divide-y divide-border max-h-[40vh] overflow-y-auto" role="list">
              {songs.map((song, index) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={index}
                  onRemove={removeSong}
                  onUpdate={updateSong}
                  onReorder={reorderSong}
                  canMoveUp={index > 0}
                  canMoveDown={index < songs.length - 1}
                  showStatus={false}
                />
              ))}
            </div>
          </div>
        )}

        {hasList && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Next steps</p>

            <SharePlaylistPanel
              songs={songs}
              playlistName={playlistName}
              playlistDescription={playlistDescription}
              shareUrl={shareUrl}
              onShareUrl={setShareUrl}
            />

            <div className="border-t border-border pt-4 space-y-3">
              <div>
                <p className="text-sm font-semibold">Export to streaming</p>
                <p className="text-xs text-muted mt-1">
                  Match songs and create a playlist in your library. More platforms coming soon.
                </p>
              </div>
              <Button size="lg" className="w-full" onClick={handleExportSpotify}>
                <svg className="h-5 w-5 text-spotify" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.36c-.2.32-.62.42-.94.22-2.58-1.58-5.84-1.94-9.68-1.06-.36.08-.72-.16-.8-.52-.08-.36.16-.72.52-.8 4.24-.96 7.88-.56 10.76 1.14.32.2.42.62.14.92z" />
                </svg>
                Export to Spotify
              </Button>
              <p className="text-xs text-muted text-center text-white/40">Apple Music · YouTube Music — soon</p>
            </div>
          </div>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        <Button variant="secondary" size="lg" className="w-full" to="/upload">
          Upload screenshot instead
        </Button>
      </div>
    </div>
  )
}
