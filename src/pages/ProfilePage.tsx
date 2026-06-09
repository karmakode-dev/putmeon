import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import ProfilePlaylistCard from '../components/ProfilePlaylistCard'
import NotFoundPage from './NotFoundPage'
import { fetchPublicProfile } from '../services/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatStatCount, isBackendConfigured } from '../config/env'
import { validateUsername } from '../utils/username'
import type { PublicProfile } from '../types'

function profileHandleFromParam(param: string | undefined): string | null {
  if (!param) return null
  const handle = param.startsWith('@') ? param.slice(1) : param
  return handle.trim().toLowerCase() || null
}

export default function ProfilePage() {
  const { username: usernameParam } = useParams<{ username: string }>()
  const username = profileHandleFromParam(usernameParam)
  const isProfileRoute = Boolean(usernameParam?.startsWith('@'))
  const usernameError = username ? validateUsername(username) : 'Invalid username.'

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useDocumentTitle(profile?.displayName ? `${profile.displayName} on PutMeOn` : 'Profile')

  useEffect(() => {
    if (!isProfileRoute) return
    if (!username || usernameError) {
      setLoading(false)
      setError('Profile not found.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchPublicProfile(username)
      .then((data) => {
        if (cancelled) return
        setProfile(data)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Profile not found.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isProfileRoute, username, usernameError])

  if (!isProfileRoute) {
    return <NotFoundPage />
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-muted animate-pulse">Loading profile…</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Alert variant="error" className="mb-6">
          {error ?? 'Profile not found.'}
        </Alert>
        {!isBackendConfigured() && (
          <p className="text-xs text-muted mb-4">
            Demo profile: try <code className="text-white/80">/@playorrrr</code>
          </p>
        )}
        <Button to="/">Go Home</Button>
      </div>
    )
  }

  const initials = profile.displayName.slice(0, 1).toUpperCase()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-border bg-card">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(29,185,84,0.12),transparent_55%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:p-8">
          <div className="shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-28 w-28 rounded-full object-cover ring-2 ring-spotify/30 sm:h-32 sm:w-32"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-spotify/15 text-3xl font-bold text-spotify ring-2 ring-spotify/30 sm:h-32 sm:w-32">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{profile.displayName}</h1>
            <p className="text-muted text-sm mt-1">@{profile.username}</p>
            {profile.bio?.trim() && (
              <p className="text-sm text-white/80 mt-3 max-w-2xl">{profile.bio}</p>
            )}
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <dt className="sr-only">Total playlists</dt>
                <dd>
                  <span className="font-semibold text-white">{formatStatCount(profile.totalPlaylists)}</span>
                  <span className="text-muted ml-1.5">
                    {profile.totalPlaylists === 1 ? 'playlist' : 'playlists'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="sr-only">Total exports</dt>
                <dd>
                  <span className="font-semibold text-white">{formatStatCount(profile.totalExports)}</span>
                  <span className="text-muted ml-1.5">
                    {profile.totalExports === 1 ? 'export' : 'total exports'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Playlists</h2>
        {profile.playlists.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <p className="text-muted text-sm">No public playlists yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {profile.playlists.map((playlist) => (
              <ProfilePlaylistCard key={playlist.publicId} playlist={playlist} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
