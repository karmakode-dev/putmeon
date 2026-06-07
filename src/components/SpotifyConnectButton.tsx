import { useState } from 'react'
import Button from './Button'
import { connectSpotify } from '../services/api'

interface SpotifyConnectButtonProps {
  connected: boolean
  username: string | null
  returnUrl?: string
  onConnect: (username: string) => void
  onError?: (message: string) => void
}

export default function SpotifyConnectButton({
  connected,
  username,
  returnUrl,
  onConnect,
  onError,
}: SpotifyConnectButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      const result = await connectSpotify(returnUrl)
      if (result.connected) onConnect(result.username)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to connect Spotify')
    } finally {
      setLoading(false)
    }
  }

  if (connected) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-spotify/30 bg-spotify/5 px-4 py-3" role="status">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-spotify">
          <svg className="h-4 w-4 text-black" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.36c-.2.32-.62.42-.94.22-2.58-1.58-5.84-1.94-9.68-1.06-.36.08-.72-.16-.8-.52-.08-.36.16-.72.52-.8 4.24-.96 7.88-.56 10.76 1.14.32.2.42.62.14.92z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-spotify">Connected to Spotify</p>
          <p className="text-xs text-muted">@{username}</p>
        </div>
        <svg className="ml-auto h-5 w-5 text-spotify" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }

  return (
    <Button variant="secondary" size="lg" loading={loading} onClick={handleConnect} className="w-full">
      <svg className="h-5 w-5 text-spotify" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.36c-.2.32-.62.42-.94.22-2.58-1.58-5.84-1.94-9.68-1.06-.36.08-.72-.16-.8-.52-.08-.36.16-.72.52-.8 4.24-.96 7.88-.56 10.76 1.14.32.2.42.62.14.92z" />
      </svg>
      Connect Spotify
    </Button>
  )
}
