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
}

export default function PlaylistCover({ name, className = '' }: PlaylistCoverProps) {
  const gradient = COVER_GRADIENTS[hashSeed(name) % COVER_GRADIENTS.length]

  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-card ${className}`}
      aria-hidden="true"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 flex items-end p-4">
        <p className="text-sm font-semibold text-white line-clamp-2 drop-shadow-sm">{name}</p>
      </div>
    </div>
  )
}
