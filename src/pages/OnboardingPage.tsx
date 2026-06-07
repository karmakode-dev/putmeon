import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { normalizeUsername, validateUsername } from '../utils/username'

export default function OnboardingPage() {
  useDocumentTitle('Choose Username')
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, isAuthenticated, needsUsername, setUsername } = useAuth()
  const [username, setUsernameInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const returnPath = (location.state as { from?: string } | null)?.from ?? '/curate'

  if (!loading && !isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (!loading && isAuthenticated && !needsUsername) {
    return <Navigate to={returnPath} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateUsername(username)
    if (validation) {
      setError(validation)
      return
    }

    setSubmitting(true)
    setError(null)
    const result = await setUsername(normalizeUsername(username))
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    navigate(returnPath, { replace: true })
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 animate-slide-up">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Choose your username</h1>
        <p className="text-sm text-muted mb-6">
          Required for sharing playlists. Lowercase letters, numbers, underscores, and periods — 3–20 characters.
        </p>

        {user && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg px-4 py-3 mb-6">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-spotify/20 flex items-center justify-center text-sm font-semibold text-spotify">
                {user.email.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted">Signed in with Google</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              Username
            </label>
            <div className="flex items-center rounded-xl border border-border bg-bg focus-within:ring-2 focus-within:ring-spotify/50 overflow-hidden">
              <span className="pl-4 text-sm text-muted">@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                autoComplete="username"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={20}
                placeholder="yourname"
                className="flex-1 bg-transparent px-2 py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={!username.trim()}>
            Continue
          </Button>
        </form>
      </div>
    </div>
  )
}
