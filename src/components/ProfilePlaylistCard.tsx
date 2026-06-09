import { Link } from 'react-router-dom'
import PlaylistCover from './PlaylistCover'
import { formatStatCount } from '../config/env'
import type { PublicProfilePlaylist } from '../types'

interface ProfilePlaylistCardProps {
  playlist: PublicProfilePlaylist
}

export default function ProfilePlaylistCard({ playlist }: ProfilePlaylistCardProps) {
  return (
    <Link
      to={`/p/${playlist.publicId}`}
      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-colors hover:border-border/80 hover:bg-card-hover"
    >
      <PlaylistCover name={playlist.name} className="rounded-none border-0" />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-white truncate group-hover:text-spotify transition-colors">
          {playlist.name}
        </h3>
        {playlist.description?.trim() && (
          <p className="mt-1 text-sm text-muted line-clamp-2">{playlist.description}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2 text-xs text-muted">
          <span>{playlist.songCount} songs</span>
          {playlist.exportCount > 0 && (
            <span className="text-spotify/90">
              {formatStatCount(playlist.exportCount)} {playlist.exportCount === 1 ? 'export' : 'exports'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
