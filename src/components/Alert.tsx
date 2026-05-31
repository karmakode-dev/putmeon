interface AlertProps {
  variant?: 'error' | 'info' | 'success'
  title?: string
  children: React.ReactNode
  className?: string
}

const variants = {
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-border bg-card text-muted',
  success: 'border-spotify/30 bg-spotify/10 text-spotify',
}

export default function Alert({ variant = 'info', title, children, className = '' }: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm ${variants[variant]} ${className}`}
    >
      {title && <p className="font-medium mb-1">{title}</p>}
      <div>{children}</div>
    </div>
  )
}
