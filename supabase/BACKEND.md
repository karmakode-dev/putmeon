# Supabase Backend Setup

PutMeOn uses a single Supabase Edge Function (`api`) for OpenAI Vision, Spotify OAuth, track matching, and playlist creation.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Spotify Developer app ([developer.spotify.com](https://developer.spotify.com/dashboard))
- OpenAI API key

## 1. Create Supabase project

```bash
cd PutMeOn
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

## 2. Run migrations

```bash
supabase db push
```

This creates `scans`, `spotify_sessions`, and `spotify_oauth_states` tables.

## 3. Set Edge Function secrets

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set OPENAI_MODEL=gpt-4o-mini
supabase secrets set SPOTIFY_CLIENT_ID=your_client_id
supabase secrets set SPOTIFY_CLIENT_SECRET=your_client_secret
supabase secrets set SPOTIFY_REDIRECT_URI=https://YOUR_PROJECT.supabase.co/functions/v1/api/auth/spotify/callback
supabase secrets set APP_URL=https://putmeon.karmakode.co
```

For local dev only, use `APP_URL=http://localhost:5173`.

## 4. Spotify Developer App

In your Spotify app settings:

- **Redirect URI:** `https://ezfnycxrvhclxrdbzrxg.supabase.co/functions/v1/api/auth/spotify/callback` (Supabase — not your frontend domain)
- **Website:** `https://putmeon.karmakode.co`
- **Privacy Policy URL:** `https://putmeon.karmakode.co/privacy`
- **Scopes used:** `playlist-modify-public`, `playlist-modify-private`, `user-read-private`, `user-read-email`

## 5. Deploy Edge Function

```bash
supabase functions deploy api
```

## 6. Configure frontend

In `.env.local`:

```env
VITE_USE_MOCK_API=false
VITE_API_URL=https://YOUR_PROJECT.supabase.co/functions/v1/api
VITE_APP_URL=http://localhost:5173
VITE_SPOTIFY_CLIENT_ID=your_client_id
```

Do **not** set `VITE_OPENAI_API_KEY` when using the backend.

## Local development

```bash
# Terminal 1 — Supabase local stack
supabase start
supabase functions serve api --env-file supabase/.env.local

# Terminal 2 — Frontend
npm run dev
```

Create `supabase/.env.local` (gitignored) with the same secrets as above. For local functions:

```env
SPOTIFY_REDIRECT_URI=http://127.0.0.1:54321/functions/v1/api/auth/spotify/callback
APP_URL=http://localhost:5173
```

Frontend `.env.local`:

```env
VITE_USE_MOCK_API=false
VITE_API_URL=http://127.0.0.1:54321/functions/v1/api
```

## API routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/scan` | Detect songs (OpenAI) + match (Spotify catalog) |
| POST | `/scan/detect` | Detect only |
| POST | `/scan/match` | Match songs to Spotify |
| POST | `/scan/retry` | Re-match one song |
| GET | `/auth/spotify` | Start OAuth (redirect) |
| GET | `/auth/spotify/callback` | OAuth callback |
| GET | `/auth/spotify/me` | Verify session (`X-Spotify-Session` header) |
| POST | `/playlist` | Create playlist (`X-Spotify-Session` header) |

## Match statuses

- **Matched** — high title + artist similarity to top Spotify result
- **Possible** — partial match
- **Failed** — no close catalog match
