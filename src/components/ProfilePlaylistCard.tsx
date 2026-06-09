import { Link } from 'react-router-dom'
import PlaylistCover from './PlaylistCover'
import { formatStatCount } from '../config/env'
import type { PublicProfilePlaylist } from '../types'

interface ProfilePlaylistCardProps {
  playlist: PublicProfilePlaylist
}

export default function ProfilePlaylistCard({ playlist }: ProfilePlaylistCardProps) {
  const songLabel = playlist.songCount === 1 ? 'song' : 'songs'

  return (
    <Link
      to={`/p/${playlist.publicId}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-spotify/20 hover:bg-card-hover"
    >
      <PlaylistCover name={playlist.name} variant="profile" className="rounded-none border-0" showPlayButton />
      <div className="flex flex-col gap-1 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-white transition-colors group-hover:text-spotify">
          {playlist.name}
        </h3>
        {playlist.description?.trim() && (
          <p className="line-clamp-2 text-xs leading-snug text-muted">{playlist.description}</p>
        )}
        <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted">
          <span className="inline-flex min-w-0 items-center gap-1">
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-8z" />
            </svg>
            {playlist.songCount} {songLabel}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-spotify/90">
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            {formatStatCount(playlist.exportCount)} put on
          </span>
        </div>
      </div>
    </Link>
  )
}
