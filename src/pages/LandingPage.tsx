import { Link } from 'react-router-dom'
import Button from '../components/Button'
import { DEMO_SONGS } from '../data/mockSongs'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const steps = [
  {
    number: '01',
    title: 'Upload Screenshot',
    description: 'Drop your Apple Music, Spotify, or social media screenshot.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'We Detect Songs',
    description: 'AI reads your screenshot and extracts every track instantly.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Create Spotify Playlist',
    description: 'Review matches, connect Spotify, and your playlist is ready.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.36c-.2.32-.62.42-.94.22-2.58-1.58-5.84-1.94-9.68-1.06-.36.08-.72-.16-.8-.52-.08-.36.16-.72.52-.8 4.24-.96 7.88-.56 10.76 1.14.32.2.42.62.14.92z" />
      </svg>
    ),
  },
]

function MockScreenshot() {
  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#FA2D48] to-[#FC6675] p-4 shadow-2xl shadow-red-500/10">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-white/20" />
        <span className="text-xs font-semibold text-white/90">My Playlist</span>
      </div>
      <div className="space-y-2.5">
        {DEMO_SONGS.map((song, i) => (
          <div key={song.id} className="flex items-center gap-2.5">
            <span className="w-4 text-[10px] text-white/50 text-right">{i + 1}</span>
            <div className="h-8 w-8 rounded bg-white/15 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-white truncate">{song.title}</p>
              <p className="text-[9px] text-white/60 truncate">{song.artist}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockDetectedSongs() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wider">Detected Songs</p>
      <div className="space-y-2">
        {DEMO_SONGS.map((song) => (
          <div key={song.id} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{song.title}</p>
              <p className="text-[10px] text-muted truncate">{song.artist}</p>
            </div>
            <span className="text-[10px] text-spotify shrink-0">{Math.round(song.confidence * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockSpotifyPlaylist() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-12 w-12 rounded-lg bg-spotify/20 flex items-center justify-center">
          <svg className="h-6 w-6 text-spotify" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold">PutMeOn Playlist</p>
          <p className="text-xs text-muted">{DEMO_SONGS.length} songs · PutMeOn</p>
        </div>
      </div>
      <div className="space-y-2">
        {DEMO_SONGS.map((song, i) => (
          <div key={song.id} className="flex items-center gap-2">
            <span className="w-4 text-[10px] text-muted text-right">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{song.title}</p>
              <p className="text-[10px] text-muted truncate">{song.artist}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  useDocumentTitle('')

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-spotify)_0%,_transparent_50%)] opacity-[0.07]" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-spotify/5 rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 sm:pt-32 sm:pb-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotify opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-spotify" />
              </span>
              <span className="text-xs text-muted">Screenshot to playlist in seconds</span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Turn Music Screenshots
              <br />
              <span className="text-spotify">Into Spotify Playlists</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted max-w-xl mx-auto mb-10">
              Upload a screenshot and instantly create a Spotify playlist.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button to="/upload" size="lg">
                Upload Screenshot
              </Button>
              <a
                href="#example"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base rounded-xl bg-card border border-border text-white hover:bg-card-hover transition-all duration-200 font-medium"
              >
                See Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">How It Works</h2>
            <p className="text-muted max-w-lg mx-auto">Three steps. Under 30 seconds. Zero manual typing.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative rounded-2xl border border-border bg-card p-6 hover:border-spotify/30 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-spotify/10 text-spotify group-hover:bg-spotify/20 transition-colors">
                    {step.icon}
                  </div>
                  <span className="text-xs font-mono text-muted">{step.number}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Conversion */}
      <section id="example" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Example Conversion</h2>
            <p className="text-muted">From Apple Music screenshot to Spotify playlist</p>
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-4">
            <div className="w-full max-w-[220px]">
              <p className="text-xs text-muted text-center mb-3 uppercase tracking-wider">Screenshot</p>
              <MockScreenshot />
            </div>
            <div className="flex items-center justify-center py-4 lg:py-0">
              <svg className="h-8 w-8 text-spotify rotate-90 lg:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <div className="w-full max-w-[220px]">
              <p className="text-xs text-muted text-center mb-3 uppercase tracking-wider">Detected</p>
              <MockDetectedSongs />
            </div>
            <div className="flex items-center justify-center py-4 lg:py-0">
              <svg className="h-8 w-8 text-spotify rotate-90 lg:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <div className="w-full max-w-[220px]">
              <p className="text-xs text-muted text-center mb-3 uppercase tracking-wider">Playlist</p>
              <MockSpotifyPlaylist />
            </div>
          </div>
          <div className="text-center mt-12">
            <Button to="/upload" size="lg">
              Try It Now
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Upload a screenshot. Get the playlist.
          </h2>
          <p className="text-muted mb-8 max-w-md mx-auto">
            Stop manually searching for songs one by one. PutMeOn does it for you.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 text-spotify hover:text-spotify-hover font-medium transition-colors"
          >
            Get started free
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  )
}
