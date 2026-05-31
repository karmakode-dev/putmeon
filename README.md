# PutMeOn

Turn music screenshots into Spotify playlists instantly.

Upload Apple Music, Spotify, TikTok, or Instagram screenshots — PutMeOn detects the songs, matches them on Spotify, and creates a playlist for you.

## Quick Start

```bash
cd PutMeOn
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint |

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

## OpenAI Vision (recommended)

Song detection uses **OpenAI Vision** when configured. Without a key, it falls back to free Tesseract OCR.

1. Get an API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create `.env.local` in the project root (this file is gitignored):

```env
VITE_OPENAI_API_KEY=sk-your-key-here
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_USE_OPENAI_VISION=true
```

3. Restart the dev server (`Ctrl+C`, then `npm run dev`)

**Cost:** ~$0.01–0.03 per screenshot with `gpt-4o-mini`. Your $5 credit = hundreds of scans.

**Security:** The key is exposed in the browser during local dev. Before public launch, move OpenAI calls to a backend (Supabase Edge Function).

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_OPENAI_API_KEY` | — | OpenAI API key (required for AI detection) |
| `VITE_OPENAI_MODEL` | `gpt-4o-mini` | Vision model (`gpt-4o` for max accuracy) |
| `VITE_USE_OPENAI_VISION` | `true` | Set `false` to force Tesseract only |
| `VITE_USE_MOCK_API` | `true` | Mock Spotify (set `false` for live API) |
| `VITE_API_URL` | — | Backend API base URL |
| `VITE_APP_URL` | `https://putmeon.app` | Public app URL (SEO, sitemap) |
| `VITE_SPOTIFY_CLIENT_ID` | — | Spotify OAuth client ID |
| `VITE_CONTACT_EMAIL` | `hello@putmeon.app` | Contact page email |

## Demo Mode

By default the app runs in **demo mode** with mock song detection and Spotify integration. This lets you test the full UI flow without API keys.

To connect a real backend, set:

```env
VITE_USE_MOCK_API=false
VITE_API_URL=https://your-api.example.com
```

### Expected API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/scan` | Upload images, returns detected + matched songs |
| `POST` | `/scan/retry` | Retry matching a single song |
| `GET` | `/auth/spotify` | Initiate Spotify OAuth redirect |
| `POST` | `/playlist` | Create playlist from matched songs |

## Deployment

### Vercel

```bash
npm run build
```

Deploy the `PutMeOn` folder. `vercel.json` includes SPA rewrites.

### Netlify

`netlify.toml` is preconfigured. Build command: `npm run build`, publish: `dist`.

### Other Static Hosts

Ensure all routes fallback to `index.html` (see `public/_redirects`).

## Database (Supabase)

Run the migration in `supabase/migrations/` to create the `scans` table:

```sql
-- See supabase/migrations/001_scans.sql
```

## Spotify Setup

1. Create an app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Add redirect URI: `https://your-api.example.com/auth/spotify/callback`
3. Required scopes: `playlist-modify-public`, `playlist-modify-private`
4. Add your Privacy Policy URL (required for Spotify review): `https://your-domain.com/privacy`

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS v4
- **Backend (planned):** Supabase Edge Functions
- **APIs:** Spotify Web API, OpenAI Vision

## License

Private — all rights reserved.
