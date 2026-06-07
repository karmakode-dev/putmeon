import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GoogleSignInButton from './GoogleSignInButton'

export default function UserMenu() {
  const { user, loading, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  if (loading) return null

  if (!user) {
    return <GoogleSignInButton size="sm" className="hidden sm:inline-flex" />
  }

  const label = user.username ? `@${user.username}` : user.email.split('@')[0]

  return (
    <div className="relative hidden sm:block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 hover:bg-card transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-spotify/20 flex items-center justify-center text-xs font-semibold text-spotify">
            {label.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium max-w-[8rem] truncate">{label}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card py-1 shadow-lg z-50"
        >
          {!user.username && (
            <Link
              to="/onboarding"
              role="menuitem"
              className="block px-4 py-2 text-sm text-spotify hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              Choose username
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-4 py-2 text-sm text-muted hover:text-white hover:bg-white/5"
            onClick={() => {
              setOpen(false)
              void signOut()
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
