import { Link } from 'react-router-dom'
import BrandCredit from './BrandCredit'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-spotify/10">
              <svg className="h-3.5 w-3.5 text-spotify" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.36c-.2.32-.62.42-.94.22-2.58-1.58-5.84-1.94-9.68-1.06-.36.08-.72-.16-.8-.52-.08-.36.16-.72.52-.8 4.24-.96 7.88-.56 10.76 1.14.32.2.42.62.14.92z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-muted">PutMeOn</span>
          </div>
          <nav aria-label="Legal and contact links" className="flex gap-8">
            <Link to="/privacy" className="text-sm text-muted hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-muted hover:text-white transition-colors">
              Terms
            </Link>
            <Link to="/contact" className="text-sm text-muted hover:text-white transition-colors">
              Contact
            </Link>
          </nav>
          <p className="text-xs text-muted/60">© 2026 PutMeOn. All rights reserved.</p>
        </div>
        <div className="mt-8 text-center">
          <BrandCredit />
        </div>
      </div>
    </footer>
  )
}
