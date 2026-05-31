import { useState } from 'react'
import type { MatchedSong } from '../types'
import StatusBadge from './StatusBadge'
import Button from './Button'
import { retrySongMatch } from '../services/api'

interface SongRowProps {
  song: MatchedSong
  index: number
  onRemove: (id: string) => void
  onUpdate: (id: string, song: MatchedSong) => void
}

export default function SongRow({ song, index, onRemove, onUpdate }: SongRowProps) {
  const [retrying, setRetrying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(song.title)
  const [editArtist, setEditArtist] = useState(song.artist)

  const displayTitle = song.spotifyTitle ?? song.title
  const displayArtist = song.spotifyArtist ?? song.artist

  const handleRetry = async () => {
    setRetrying(true)
    try {
      const updated = await retrySongMatch(song)
      onUpdate(song.id, updated)
    } finally {
      setRetrying(false)
    }
  }

  const handleSaveEdit = () => {
    const title = editTitle.trim()
    const artist = editArtist.trim()
    if (!title || !artist) return

    const stillPending = song.status === 'pending'
    onUpdate(song.id, {
      ...song,
      title,
      artist,
      confidence: 1,
      status: stillPending ? 'pending' : 'matched',
      spotifyTitle: stillPending ? undefined : title,
      spotifyArtist: stillPending ? undefined : artist,
      spotifyTrackId: stillPending ? undefined : song.spotifyTrackId,
    })
    setEditing(false)
  }

  const startEdit = () => {
    setEditTitle(song.title)
    setEditArtist(song.artist)
    setEditing(true)
  }

  if (editing) {
    return (
      <div className="px-4 py-3 bg-white/[0.03] border-l-2 border-spotify" role="listitem">
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <input
            aria-label="Song title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Song title"
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spotify/50"
          />
          <input
            aria-label="Artist name"
            value={editArtist}
            onChange={(e) => setEditArtist(e.target.value)}
            placeholder="Artist"
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spotify/50"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSaveEdit}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors" role="listitem">
      <span className="w-6 text-xs text-muted text-right shrink-0">{index + 1}</span>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card border border-border" aria-hidden="true">
        <svg className="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayTitle}</p>
        <p className="text-xs text-muted truncate">{displayArtist}</p>
        {song.status !== 'matched' && song.status !== 'pending' && (
          <p className="text-xs text-muted/60 truncate mt-0.5">
            OCR: {song.title} — {song.artist}
          </p>
        )}
      </div>
      <StatusBadge status={song.status} />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={startEdit} aria-label={`Edit ${displayTitle}`}>
          Edit
        </Button>
        {(song.status === 'failed' || song.status === 'possible') && (
          <Button variant="ghost" size="sm" loading={retrying} onClick={handleRetry}>
            Retry
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onRemove(song.id)} aria-label={`Remove ${displayTitle}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
