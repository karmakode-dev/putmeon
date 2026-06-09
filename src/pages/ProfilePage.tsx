import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import ProfilePlaylistCard from '../components/ProfilePlaylistCard'
import ProfileSidebar from '../components/ProfileSidebar'
import NotFoundPage from './NotFoundPage'
import { fetchPublicProfile } from '../services/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { isBackendConfigured } from '../config/env'
import { validateUsername } from '../utils/username'
import type { PublicProfile } from '../types'

const PLAYLIST_PREVIEW_COUNT = 4

type ProfileTab = 'playlists' | 'about'

function profileHandleFromParam(param: string | undefined): string | null {
  if (!param) return null
  const handle = param.startsWith('@') ? param.slice(1) : param
  return handle.trim().toLowerCase() || null
}

function formatMemberSince(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function ProfilePage() {
  const { username: usernameParam } = useParams<{ username: string }>()
  const username = profileHandleFromParam(usernameParam)
  const isProfileRoute = Boolean(usernameParam?.startsWith('@'))
  const usernameError = username ? validateUsername(username) : 'Invalid username.'

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ProfileTab>('playlists')
  const [showAllPlaylists, setShowAllPlaylists] = useState(false)

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

  const visiblePlaylists = useMemo(() => {
    if (!profile) return []
    if (showAllPlaylists || profile.playlists.length <= PLAYLIST_PREVIEW_COUNT) {
      return profile.playlists
    }
    return profile.playlists.slice(0, PLAYLIST_PREVIEW_COUNT)
  }, [profile, showAllPlaylists])

  if (!isProfileRoute) {
    return <NotFoundPage />
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
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
  const memberSince = formatMemberSince(profile.memberSince)
  const hasMorePlaylists = profile.playlists.length > PLAYLIST_PREVIEW_COUNT

  return (
    <div className="mx-auto max-w-[1400px] overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <header className="order-1 min-w-0 lg:col-start-1 lg:row-start-1 lg:min-h-[220px]">
          <div className="relative flex h-full min-h-[160px] items-center gap-5 sm:gap-6 lg:min-h-[220px] lg:gap-8">
            <div
              className="pointer-events-none absolute -left-4 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(29,185,84,0.18),transparent_70%)] lg:-left-8 lg:h-64 lg:w-64"
              aria-hidden="true"
            />
            <div className="relative shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-white/10 sm:h-28 sm:w-28 lg:h-[140px] lg:w-[140px]"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-spotify/15 text-2xl font-bold text-spotify ring-2 ring-white/10 sm:h-28 sm:w-28 sm:text-3xl lg:h-[140px] lg:w-[140px] lg:text-5xl">
                  {initials}
                </div>
              )}
            </div>

            <div className="relative min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight leading-none sm:text-4xl lg:text-5xl">
                {profile.displayName}
              </h1>
              <p className="mt-1 text-base text-muted sm:mt-1.5 sm:text-xl lg:mt-2 lg:text-2xl">
                @{profile.username}
              </p>
              {profile.bio?.trim() && (
                <p className="mt-2 max-w-2xl line-clamp-2 text-sm leading-snug text-white/80 sm:mt-2.5 sm:text-base lg:mt-3">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </header>

        <ProfileSidebar profile={profile} className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2" />

        <div className="order-3 min-w-0 lg:col-start-1 lg:row-start-2">
          <div className="mb-5 border-b border-border">
            <nav className="flex gap-6" aria-label="Profile sections">
              {(['playlists', 'about'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`-mb-px border-b-2 pb-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-spotify text-white'
                      : 'border-transparent text-muted hover:text-white'
                  }`}
                  aria-current={activeTab === tab ? 'page' : undefined}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'playlists' && (
            <section>
              {profile.playlists.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
                  <p className="text-muted text-sm">No public playlists yet.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {visiblePlaylists.map((playlist) => (
                      <ProfilePlaylistCard key={playlist.publicId} playlist={playlist} />
                    ))}
                  </div>
                  {hasMorePlaylists && !showAllPlaylists && (
                    <div className="mt-8 text-center">
                      <button
                        type="button"
                        onClick={() => setShowAllPlaylists(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-white/20 hover:text-white"
                      >
                        View all playlists
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeTab === 'about' && (
            <section className="max-w-2xl rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-3 text-lg font-semibold">About {profile.displayName}</h2>
              {profile.bio?.trim() ? (
                <p className="text-sm leading-relaxed text-muted">{profile.bio}</p>
              ) : (
                <p className="text-sm text-muted">No bio yet.</p>
              )}
              {memberSince && (
                <p className="mt-4 text-xs text-muted/80">Member since {memberSince}</p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
