import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Alert from '../components/Alert'
import SongRow from '../components/SongRow'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { parsePastedSongList } from '../services/pasteListParser'
import { env, isBackendConfigured } from '../config/env'
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
    setSongs,
    setPlaylistName,
    setPlaylistDescription,
    setEntrySource,
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

  const handleContinue = () => {
    if (songs.length === 0) {
      setError('Add at least one song before continuing.')
      return
    }
    if (!playlistName.trim()) {
      setError('Enter a playlist name.')
      return
    }
    setEntrySource('curate')
    navigate('/review')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Curate Playlist</h1>
        <p className="text-muted text-sm">
          Build a playlist without screenshots — paste a list or add songs one by one.
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

        {songs.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-medium">{songs.length} songs</p>
              <button
                type="button"
                onClick={() => setSongs([])}
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

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" className="flex-1" onClick={handleContinue} disabled={songs.length === 0}>
            Continue to Spotify
          </Button>
          <Button variant="secondary" size="lg" to="/upload">
            Upload instead
          </Button>
        </div>

        {isBackendConfigured() && (
          <p className="text-xs text-muted text-center">
            Next: connect Spotify to match songs and create your playlist.
          </p>
        )}
      </div>
    </div>
  )
}
