import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { env } from '../config/env'

export default function SuccessPage() {
  useDocumentTitle('Playlist Created')
  const navigate = useNavigate()
  const { playlistResult, entrySource, reset } = useApp()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!playlistResult) navigate('/upload', { replace: true })
  }, [playlistResult, navigate])

  if (!playlistResult) return null

  const handleCreateAnother = () => {
    reset()
    navigate(entrySource === 'curate' ? '/curate' : '/upload')
  }

  const handleCopyShare = async () => {
    if (!playlistResult.shareUrl) return
    try {
      await navigator.clipboard.writeText(playlistResult.shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select not implemented
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24 text-center">
      <div className="animate-slide-up">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-spotify/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-spotify">
            <svg className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Playlist Created</h1>
        <p className="text-muted mb-2">{playlistResult.name}</p>
        <p className="text-sm text-muted mb-10">
          {playlistResult.trackCount} songs added to your Spotify library
        </p>

        <div className="rounded-2xl border border-border bg-card p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-spotify/20">
              <svg className="h-8 w-8 text-spotify" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.36c-.2.32-.62.42-.94.22-2.58-1.58-5.84-1.94-9.68-1.06-.36.08-.72-.16-.8-.52-.08-.36.16-.72.52-.8 4.24-.96 7.88-.56 10.76 1.14.32.2.42.62.14.92z" />
              </svg>
            </div>
            <div className="text-left min-w-0">
              <p className="font-semibold truncate">{playlistResult.name}</p>
              <p className="text-sm text-muted">{playlistResult.trackCount} tracks</p>
            </div>
          </div>
        </div>

        {playlistResult.shareUrl && (
          <div className="rounded-2xl border border-spotify/30 bg-spotify/5 p-4 mb-8 text-left">
            <p className="text-sm font-medium mb-2">Shareable link</p>
            <p className="text-xs text-muted mb-3">
              Anyone with this link can view the song list and export it to their own Spotify.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                readOnly
                value={playlistResult.shareUrl}
                aria-label="Shareable playlist link"
                className="flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-xs text-muted truncate"
              />
              <Button variant="secondary" size="sm" onClick={handleCopyShare}>
                {copied ? 'Copied!' : 'Copy link'}
              </Button>
            </div>
            <a
              href={playlistResult.shareUrl}
              className="inline-block mt-3 text-xs text-spotify hover:text-spotify-hover"
            >
              Open shared page
            </a>
          </div>
        )}

        {!playlistResult.shareUrl && !env.useMockApi && (
          <Alert variant="info" className="mb-8 text-left text-sm">
            Share link could not be saved. Your Spotify playlist was still created.
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={() => window.open(playlistResult.url, '_blank', 'noopener,noreferrer')}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
            Open in Spotify
          </Button>
          <Button variant="secondary" size="lg" onClick={handleCreateAnother}>
            Create Another Playlist
          </Button>
        </div>
        {env.useMockApi && (
          <p className="text-xs text-muted mt-6">
            Demo mode — Spotify link is a placeholder until live API is configured.
          </p>
        )}
      </div>
    </div>
  )
}
