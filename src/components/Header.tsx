import { useState, type MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { dispatchCurateReset, resetCurateDraftToFresh } from '../utils/flowStorage'

function isOnCuratePath(pathname: string) {
  return pathname.replace(/\/$/, '').endsWith('/curate')
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { clearCurateDraft } = useApp()
  const isHome = location.pathname === '/'
  const isOnCurate = isOnCuratePath(location.pathname)

  const anchor = (hash: string) => (isHome ? hash : `/${hash}`)

  const handleCurateClick = (e: MouseEvent) => {
    if (isOnCurate) {
      e.preventDefault()
      dispatchCurateReset()
    }
  }

  const handleUploadClick = () => {
    resetCurateDraftToFresh()
    clearCurateDraft()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-bg/80 backdrop-blur-xl">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-spotify focus:px-4 focus:py-2 focus:text-black focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group" aria-label="PutMeOn home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-spotify/10 group-hover:bg-spotify/20 transition-colors">
            <svg className="h-4 w-4 text-spotify" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.36c-.2.32-.62.42-.94.22-2.58-1.58-5.84-1.94-9.68-1.06-.36.08-.72-.16-.8-.52-.08-.36.16-.72.52-.8 4.24-.96 7.88-.56 10.76 1.14.32.2.42.62.14.92zm1.2-2.68c-.24.4-.76.52-1.16.28-2.96-1.82-7.46-2.34-10.96-1.28-.44.14-.9-.1-1.04-.54-.14-.44.1-.9.54-1.04 3.98-1.2 8.98-.62 12.32 1.44.4.24.52.76.3 1.14zm.1-2.8C14.62 8.62 8.46 8.44 5.2 9.44c-.52.16-1.08-.14-1.24-.66-.16-.52.14-1.08.66-1.24 3.76-1.14 10.48-.92 14.36 1.48.46.28.62.88.34 1.34-.28.46-.88.62-1.34.34z" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">PutMeOn</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-6">
          <a href={anchor('#how-it-works')} className="text-sm text-muted hover:text-white transition-colors">
            How it works
          </a>
          <a href={anchor('#example')} className="text-sm text-muted hover:text-white transition-colors">
            Example
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/curate"
            onClick={handleCurateClick}
            className="hidden sm:inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-white hover:bg-card transition-colors"
          >
            Curate
          </Link>
          <Link
            to="/upload"
            onClick={handleUploadClick}
            className="rounded-lg bg-spotify px-4 py-2 text-sm font-semibold text-black hover:bg-spotify-hover transition-colors"
          >
            Upload
          </Link>
          <button
            type="button"
            className="sm:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-white hover:bg-card transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav aria-label="Mobile navigation" className="sm:hidden border-t border-border bg-bg px-4 py-3 space-y-1">
          <a
            href={anchor('#how-it-works')}
            className="block rounded-lg px-3 py-2 text-sm text-muted hover:text-white hover:bg-card transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            How it works
          </a>
          <a
            href={anchor('#example')}
            className="block rounded-lg px-3 py-2 text-sm text-muted hover:text-white hover:bg-card transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Example
          </a>
          <Link
            to="/curate"
            onClick={(e) => {
              handleCurateClick(e)
              setMenuOpen(false)
            }}
            className="block rounded-lg px-3 py-2 text-sm text-muted hover:text-white hover:bg-card transition-colors"
          >
            Curate Playlist
          </Link>
          <Link
            to="/upload"
            onClick={() => {
              handleUploadClick()
              setMenuOpen(false)
            }}
            className="block rounded-lg px-3 py-2 text-sm text-muted hover:text-white hover:bg-card transition-colors"
          >
            Upload Screenshot
          </Link>
          <Link
            to="/privacy"
            className="block rounded-lg px-3 py-2 text-sm text-muted hover:text-white hover:bg-card transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Privacy Policy
          </Link>
          <Link
            to="/contact"
            className="block rounded-lg px-3 py-2 text-sm text-muted hover:text-white hover:bg-card transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Contact
          </Link>
        </nav>
      )}
    </header>
  )
}
