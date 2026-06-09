import type { ReactNode } from 'react'
import { formatStatCount } from '../config/env'
import type { PublicProfile } from '../types'

interface ProfileSidebarProps {
  profile: PublicProfile
  className?: string
}

function formatMemberSince(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-bg text-spotify">
        {icon}
      </div>
      <p className="text-2xl font-bold leading-none text-white lg:text-3xl">{value}</p>
      <p className="mt-1.5 text-xs text-muted">{label}</p>
    </div>
  )
}

export default function ProfileSidebar({ profile, className = '' }: ProfileSidebarProps) {
  const memberSince = formatMemberSince(profile.memberSince)

  return (
    <aside className={`min-w-0 space-y-4 lg:sticky lg:top-20 lg:w-[320px] lg:self-start ${className}`}>
      <div className="flex min-h-[220px] flex-col rounded-2xl border border-border bg-card p-5 lg:min-h-[260px] lg:p-6">
        <h2 className="mb-5 text-base font-semibold">Overview</h2>
        <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-6 content-start">
          <StatItem
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            }
            label="People Put On"
            value={formatStatCount(profile.totalExports)}
          />
          <StatItem
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-8z" />
              </svg>
            }
            label="Playlists"
            value={formatStatCount(profile.totalPlaylists)}
          />
        </dl>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 lg:p-6">
        <h2 className="mb-3 text-base font-semibold">About {profile.displayName}</h2>
        {profile.bio?.trim() ? (
          <p className="text-sm leading-relaxed text-muted">{profile.bio}</p>
        ) : (
          <p className="text-sm text-muted">No bio yet.</p>
        )}
        {memberSince && (
          <p className="mt-3 text-xs text-muted/80">Member since {memberSince}</p>
        )}
      </div>
    </aside>
  )
}
