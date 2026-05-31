# PutMeOn — Developer Handoff

> Resume dev in a fresh Cursor chat. Read this first, then `PROJECT_CONTEXT.md` for depth.  
> Last updated: May 31, 2026

---

## Completed

### Frontend
- **Full user flow** — Landing → Upload → Processing → Review → Success
- **Legal pages** — `/privacy`, `/terms`, `/contact`, 404
- **Dark UI** — Spotify-inspired theme, mobile nav, a11y basics, error boundary
- **Upload flow** — drag/drop, multi-image (20 max, 10MB each), PNG/JPG/WEBP
- **Review UX** — edit/remove songs, add missing songs, playlist name, match filters
- **Session persistence** — songs/review state survives refresh via `sessionStorage`
- **Deploy-ready static app** — Vercel/Netlify configs, CI, ESLint, TypeScript strict

### Backend (live on Supabase)
- **Supabase project linked** — ref `ezfnycxrvhclxrdbzrxg`
- **Migrations applied** — `001_scans.sql`, `002_spotify_sessions.sql`
- **Edge Function `api` deployed** — scan, OAuth, match, playlist
- **Secrets configured** — OpenAI, Spotify, `APP_URL` (Edge Functions → Secrets)
- **OpenAI Vision server-side** — no key in frontend when `VITE_USE_MOCK_API=false`

### Spotify (validated locally E2E)
- **OAuth PKCE** — Connect Spotify → session stored in `spotify_sessions`
- **Catalog matching** — runs **after** user connects (uses their OAuth token)
- **Real playlist creation** — tested working (Feb 2026 API endpoints)
- **~19/20 match rate** observed on real TikTok-style screenshot tests

### Detection
- **OpenAI Vision** — primary via backend `/scan` (also browser fallback in mock mode)
- **Tesseract fallback** — when no OpenAI key in mock mode

---

## Currently Being Worked On

**Nothing in active code.** Phase 1 is **done and validated locally**.

**Product goal:** Ship PutMeOn under **[Karmkode.co](https://karmkode.co)** (parent brand; site already live). PutMeOn is not deployed to production yet.

**Not started:** Phase 2 (3 free scans/day), Phase 3 (Stripe credits), git repo + production deploy.

---

## What Changed (May 31, 2026 session)

| Change | Detail |
|--------|--------|
| **User flow reordered** | Upload → **detect only** → Review & edit → **Connect Spotify** → **match** → create playlist |
| **`pending` match status** | Songs show **Detected** before Spotify connect — not Failed |
| **Matching timing** | `/scan` returns pending songs; `/scan/match` requires `X-Spotify-Session` (after OAuth) |
| **Spotify search fix** | Quoted queries, fallbacks, `market=US`, primary-artist parsing for `ft.` |
| **Spotify Feb 2026 API** | Playlist create uses `POST /me/playlists` + `POST /playlists/{id}/items` (old `/tracks` returned 403) |
| **Dev mode requirements** | App owner needs **Spotify Premium**; test users must be in app **User Management** (max 5) |
| **Supabase CLI** | Always run from `PutMeOn/` folder — not parent `KK/` |
| **Local backend config** | `VITE_USE_MOCK_API=false`, `VITE_API_URL=https://ezfnycxrvhclxrdbzrxg.supabase.co/functions/v1/api` |

---

## Build Next (priority order)

### P0 — Production on Karmkode.co
1. **Init git repo** under GitHub account `karmakode-dev` (not in git yet)
2. **Deploy frontend** — Vercel/Netlify; subdomain e.g. `putmeon.karmkode.co` or path on karmkode.co
3. **Update production env** — `VITE_APP_URL`, Supabase secret `APP_URL`, Spotify redirect unchanged (Supabase callback URL)
4. **Smoke test on prod** — full flow on live URL
5. **Link from Karmkode.co** — nav/landing CTA to PutMeOn

### P1 — Monetization (original Phase 2 & 3)
6. **3 free scans/day** — server-side in Supabase; paywall UI; midnight UTC reset
7. **Stripe** — $3.99 → 25 credits; webhook; `users` + `purchases` tables

### P2 — Polish
8. Landing copy aligned with Karmkode brand
9. Usage indicator on upload page
10. E2E tests, rate limiting on `/scan`

---

## Important Implementation Details

| Topic | Detail |
|-------|--------|
| **User flow (backend)** | Detect → edit → connect → auto-match → create playlist |
| **Detection** | `POST /scan` → OpenAI only; songs returned with `status: 'pending'` |
| **Matching** | `POST /scan/match` with `X-Spotify-Session` header after OAuth |
| **Review page** | `ReviewPage.tsx` — auto-rematch on connect; manual Re-match button |
| **API router** | `src/services/api.ts` → `mockApi.ts` (default) or `apiClient.ts` (backend) |
| **Spotify session** | `src/services/spotifySession.ts` → sessionStorage + header to backend |
| **Backend entry** | `supabase/functions/api/index.ts` + `_shared/` |
| **Processing steps** | Backend mode skips "Matching with Spotify" during processing |
| **State** | `AppContext.tsx` — `useCallback` on setters (do not break) |
| **Processing guard** | Do **not** add `startedRef` to ProcessingPage (breaks StrictMode) |
| **Mock mode** | Still matches during processing using confidence heuristics in `mockSongs.ts` |

**Key paths:** `src/pages/ReviewPage.tsx`, `supabase/functions/_shared/spotify.ts`, `supabase/BACKEND.md`

---

## API Setup (current working config)

### Frontend `.env.local` (backend mode — no OpenAI key needed)

```env
VITE_USE_MOCK_API=false
VITE_API_URL=https://ezfnycxrvhclxrdbzrxg.supabase.co/functions/v1/api
VITE_APP_URL=http://localhost:5173
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_USE_OPENAI_VISION=true
```

### Supabase Edge Function secrets

Set in Dashboard → **Edge Functions → Secrets** (not Settings → API):

- `OPENAI_API_KEY`, `OPENAI_MODEL`, `APP_URL`
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI` = `https://ezfnycxrvhclxrdbzrxg.supabase.co/functions/v1/api/auth/spotify/callback`

### Spotify Developer app

- Redirect URI must match `SPOTIFY_REDIRECT_URI` exactly
- **Premium** on app owner account (Feb 2026 dev mode rule)
- Add test users under **User Management**

### Deploy backend (from `PutMeOn/`)

```powershell
cd PutMeOn
supabase functions deploy api
```

---

## Known Issues

- Contact form is UI-only (no email backend)
- Multiple stale `npm run dev` ports — use latest terminal URL
- `PutMeOn/` not yet a git repo — deploy/CI not wired to GitHub
- Spotify dev mode: max 5 authorized users per app
- Uploaded `File[]` lost on refresh mid-flow → redirects to `/upload`
- OpenAI key in browser only when `VITE_USE_MOCK_API=true` + local key set

---

## Fresh Chat Starter Prompt

```
Read HANDOFF.md and PROJECT_CONTEXT.md in PutMeOn/.
Context: Phase 1 done locally. Next: deploy to karmkode.co under karmakode-dev GitHub account.
Task: [e.g. "Deploy frontend to putmeon.karmkode.co" or "Build Phase 2 usage limits"]
```
