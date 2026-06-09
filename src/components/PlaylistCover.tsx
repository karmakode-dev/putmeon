const COVER_GRADIENTS = [
  'from-emerald-900/80 via-teal-950 to-black',
  'from-violet-900/80 via-purple-950 to-black',
  'from-rose-900/80 via-red-950 to-black',
  'from-amber-900/80 via-orange-950 to-black',
  'from-sky-900/80 via-blue-950 to-black',
  'from-fuchsia-900/80 via-pink-950 to-black',
] as const

function hashSeed(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

interface PlaylistCoverProps {
  name: string
  className?: string
  showPlayButton?: boolean
  variant?: 'default' | 'profile'
}

export default function PlaylistCover({
  name,
  className = '',
  showPlayButton = false,
  variant = 'default',
}: PlaylistCoverProps) {
  const gradient = COVER_GRADIENTS[hashSeed(name) % COVER_GRADIENTS.length]
  const isProfile = variant === 'profile'

  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-xl bg-card ${className}`}
      aria-hidden="true"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className={`absolute inset-0 ${isProfile ? 'bg-black/40' : 'bg-black/25'}`} />
      {isProfile && (
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(29,185,84,0.1),transparent_70%)]"
          aria-hidden="true"
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center p-3 text-center sm:p-4">
        <p
          className={`line-clamp-3 font-semibold text-white drop-shadow-md ${
            isProfile ? 'text-xs sm:text-sm' : 'text-sm'
          }`}
        >
          {name}
        </p>
      </div>
      {showPlayButton && (
        <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-spotify text-black opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:bottom-3 sm:right-3 sm:h-9 sm:w-9">
          <svg className="ml-0.5 h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}
    </div>
  )
}
