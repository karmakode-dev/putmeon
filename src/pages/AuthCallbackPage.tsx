import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import { useAuth } from '../context/AuthContext'
import { getSupabase } from '../lib/supabaseClient'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { AUTH_RETURN_KEY } from '../types/auth'
import { isUsernameComplete } from '../utils/username'

export default function AuthCallbackPage() {
  useDocumentTitle('Signing in')
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function finish() {
      const supabase = getSupabase()
      if (!supabase) {
        navigate('/', { replace: true })
        return
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        if (!cancelled) setError(sessionError.message)
        return
      }

      if (!session?.user) {
        if (!cancelled) setError('Sign-in could not be completed.')
        return
      }

      await refreshProfile()
      if (cancelled) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .maybeSingle()

      const returnPath = sessionStorage.getItem(AUTH_RETURN_KEY) ?? '/curate'
      sessionStorage.removeItem(AUTH_RETURN_KEY)

      if (!isUsernameComplete(profile?.username)) {
        navigate('/onboarding', { replace: true, state: { from: returnPath } })
        return
      }

      navigate(returnPath, { replace: true })
    }

    finish()
  }, [navigate, refreshProfile])

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <Alert variant="error" className="mb-6">{error}</Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-muted animate-pulse">Finishing sign-in…</p>
    </div>
  )
}
