import type { MatchStatus } from '../types'

const config: Record<MatchStatus, { label: string; className: string }> = {
  pending: {
    label: 'Detected',
    className: 'bg-white/5 text-muted border-border',
  },
  matched: {
    label: 'Matched',
    className: 'bg-spotify/15 text-spotify border-spotify/20',
  },
  possible: {
    label: 'Possible Match',
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/15 text-red-400 border-red-500/20',
  },
}

export default function StatusBadge({ status }: { status: MatchStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
