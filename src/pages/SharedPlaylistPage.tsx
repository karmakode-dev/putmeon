import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { fetchSharedPlaylist } from '../services/api'
import { env, isBackendConfigured } from '../config/env'
import type { MatchedSong } from '../types'

export default function SharedPlaylistPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const navigate = useNavigate()
  const { setSongs, setPlaylistName, setPlaylistDescription, setEntrySource } = useApp()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useDocumentTitle('Shared Playlist')

  useEffect(() => {
    if (!publicId) {
      setError('Invalid playlist link.')
      setLoading(false)
      return
    }

    let cancelled = false

    fetchSharedPlaylist(publicId)
      .then((playlist) => {
        if (cancelled) return
        const songs = (playlist.songs as MatchedSong[]).map((s, i) => ({
          ...s,
          id: s.id || `shared-${i}`,
          status: s.status ?? (env.useMockApi ? 'matched' : 'pending'),
          confidence: s.confidence ?? 1,
        }))
        setSongs(songs)
        setPlaylistName(playlist.name)
        setPlaylistDescription(playlist.description ?? '')
        setEntrySource('curate')
        navigate('/review', { replace: true })
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not load this playlist.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [publicId, navigate, setSongs, setPlaylistName, setPlaylistDescription, setEntrySource])

  if (loading && !error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-muted animate-pulse">Loading playlist…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <Alert variant="error" className="mb-6">
        {error ?? 'Playlist not found.'}
      </Alert>
      {!isBackendConfigured() && (
        <p className="text-xs text-muted mb-4">Shared links require the live API (not demo mode).</p>
      )}
      <Button to="/">Go Home</Button>
    </div>
  )
}
