import { useState } from 'react'
import Button from './Button'
import Alert from './Alert'
import { saveSharedPlaylist } from '../services/api'
import { isBackendConfigured, env } from '../config/env'
import type { MatchedSong } from '../types'

interface SharePlaylistPanelProps {
  songs: MatchedSong[]
  playlistName: string
  playlistDescription?: string
  shareUrl?: string | null
  onShareUrl?: (url: string) => void
  compact?: boolean
}

export default function SharePlaylistPanel({
  songs,
  playlistName,
  playlistDescription = '',
  shareUrl: externalShareUrl,
  onShareUrl,
  compact = false,
}: SharePlaylistPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localShareUrl, setLocalShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const shareUrl = externalShareUrl ?? localShareUrl

  const handleShare = async () => {
    if (!playlistName.trim()) {
      setError('Enter a playlist name first.')
      return
    }
    if (songs.length === 0) {
      setError('Add at least one song.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await saveSharedPlaylist(playlistName.trim(), songs, playlistDescription)
      setLocalShareUrl(result.shareUrl)
      onShareUrl?.(result.shareUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create share link.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy — select the link and copy manually.')
    }
  }

  const canShare = env.useMockApi || isBackendConfigured()

  return (
    <div
      className={`rounded-2xl border border-spotify/25 bg-spotify/5 p-4 ${compact ? '' : 'space-y-3'}`}
    >
      <div>
        <p className="text-sm font-semibold text-white">Put them on</p>
        <p className="text-xs text-muted mt-1">
          Share your list as a link. Friends can view it and export to their own Spotify — no screenshot needed.
        </p>
      </div>

      {!shareUrl ? (
        <Button
          size={compact ? 'md' : 'lg'}
          className="w-full"
          loading={loading}
          disabled={songs.length === 0 || !canShare}
          onClick={handleShare}
        >
          Put them on — get share link
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-spotify font-medium">Your list is live</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={shareUrl}
              aria-label="Shareable playlist link"
              className="flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-xs truncate"
            />
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy link'}
            </Button>
          </div>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-spotify hover:text-spotify-hover"
          >
            Open shared page →
          </a>
        </div>
      )}

      {!canShare && (
        <p className="text-xs text-muted">Share links require the live API (disable mock mode in .env.local).</p>
      )}

      {error && <Alert variant="error">{error}</Alert>}
    </div>
  )
}
