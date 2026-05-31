# PutMeOn — Project Context

> Last updated: May 31, 2026  
> Purpose: Onboard a new developer without prior chat history.

---

## Project Overview

**PutMeOn** is a web application that converts music screenshots into Spotify playlists.

Users upload screenshots containing song lists (Apple Music, Spotify, TikTok, Instagram, etc.). The app extracts song titles and artists, matches them against Spotify's catalog, and creates a playlist.

**Core promise:** *Upload a screenshot. Get the playlist.*

**Brand context:** PutMeOn will ship under **[Karmkode.co](https://karmkode.co)** — an existing live site expanding beyond web services into tools like this.

**Current maturity:** **Phase 1 complete and validated locally.** Full E2E works: detect → edit → Spotify OAuth → match → real playlist URL. Supabase backend deployed. **Not yet in production** on Karmkode.co. No git repo initialized. Phases 2–3 (usage limits, Stripe) not started.

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React SPA (Vite)                        │
│  Landing → Upload → Processing → Review → Success           │
└──────────────────────────┬──────────────────────────────────┘
                           │
              apiClient.ts (VITE_USE_MOCK_API=false)
                           │
                           ▼
              Supabase Edge Function `api`
              ├── POST /scan           → OpenAI detect → pending songs
              ├── POST /scan/match     → Spotify search (user token)
              ├── POST /scan/retry     → Re-match one song
              ├── GET  /auth/spotify   → OAuth PKCE start
              ├── GET  /auth/spotify/callback
              ├── GET  /auth/spotify/me
              └── POST /playlist       → POST /me/playlists + /items
                           │
                           ▼
              Supabase Postgres (scans, spotify_sessions, spotify_oauth_states)
```

### User flow (backend mode — production path)

```
Upload → Processing (detect only) → Review Songs (status: pending)
    → User edits list → Connect Spotify → Auto-match → Review Matches
    → Create Spotify Playlist → Success (real open.spotify.com URL)
```

**Why match after connect:** Spotify dev-mode API restrictions (Feb 2026) — catalog search and playlist writes work reliably with the **user's OAuth token**, not before login. Avoids showing 20× Failed before connect.

**State management:** React Context (`AppContext`) + `sessionStorage`. Spotify session ID in `sessionStorage` (`putmeon-spotify-session`), sent as `X-Spotify-Session` header.

**API layer:** `src/services/api.ts` → `mockApi.ts` if `VITE_USE_MOCK_API=true`, else `apiClient.ts`.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM v7 |
| Song detection | OpenAI Vision (`gpt-4o-mini`) via Supabase Edge Function |
| OCR fallback | Tesseract.js (mock mode / no backend) |
| Spotify | OAuth PKCE, Web API search, playlist create |
| Backend | Supabase Edge Functions + Postgres |
| Supabase project | `ezfnycxrvhclxrdbzrxg` |
| Deployment (planned) | Static SPA on Karmkode.co infra (Vercel/Netlify configs in repo) |
| GitHub (planned) | Account `karmakode-dev` — repo not created yet |

---

## Folder Structure

```
PutMeOn/
├── src/
│   ├── pages/
│   │   ├── ProcessingPage.tsx   # Detect-only steps in backend mode
│   │   └── ReviewPage.tsx       # Two-phase: Review Songs → Review Matches
│   ├── services/
│   │   ├── apiClient.ts         # Real backend HTTP client
│   │   ├── spotifySession.ts    # X-Spotify-Session storage
│   │   └── api.ts               # Mock vs backend router
│   └── types/index.ts           # MatchStatus includes 'pending'
├── supabase/
│   ├── functions/api/index.ts
│   ├── functions/_shared/       # cors, openai, spotify, match, supabase
│   ├── migrations/              # scans, spotify_sessions
│   └── BACKEND.md
├── HANDOFF.md
└── PROJECT_CONTEXT.md
```

---

## Match Status Model

| Status | When | UI badge |
|--------|------|----------|
| `pending` | After `/scan`, before Spotify match | **Detected** |
| `matched` | Strong Spotify catalog match | **Matched** |
| `possible` | Partial match | **Possible Match** |
| `failed` | No close match after Spotify search | **Failed** |

Mock mode (`mockApi.ts`) still uses confidence-based matching during processing (no `pending`).

---

## Completed Features

### Phase 1 — Core product ✅
- [x] OpenAI Vision detection (server-side)
- [x] Supabase Edge Function backend
- [x] Spotify OAuth PKCE + session storage
- [x] Spotify catalog matching (post-connect)
- [x] Real playlist creation
- [x] Detect → edit → connect → match → playlist UX
- [x] Spotify Feb 2026 API compatibility (`/me/playlists`, `/items`)
- [x] Scan logging to `scans` table
- [x] Local E2E validated

### Frontend (unchanged from MVP)
- [x] Landing, upload, processing, review, success, legal pages
- [x] Edit/remove/add songs, playlist naming, match filters
- [x] Session persistence, error boundary, CI

---

## Spotify Integration Status

| Item | Status |
|------|--------|
| OAuth PKCE | ✅ Working |
| Match after connect | ✅ Auto + manual Re-match |
| Playlist create | ✅ `POST /me/playlists` + `/playlists/{id}/items` |
| Dev app requirements | Premium owner + User Management for testers |
| Scopes | `playlist-modify-public`, `playlist-modify-private`, `user-read-private` |
| Redirect URI | `https://ezfnycxrvhclxrdbzrxg.supabase.co/functions/v1/api/auth/spotify/callback` |

**Matching logic** (`supabase/functions/_shared/match.ts`):
- Quoted Spotify search queries with fallbacks
- Title + artist similarity; ≥0.75 Matched, ≥0.35 Possible

---

## Environment Variables

### Production frontend (planned)

```env
VITE_USE_MOCK_API=false
VITE_API_URL=https://ezfnycxrvhclxrdbzrxg.supabase.co/functions/v1/api
VITE_APP_URL=https://putmeon.karmkode.co   # or chosen URL
```

Do **not** set `VITE_OPENAI_API_KEY` in production frontend.

### Local backend dev (current)

See `HANDOFF.md` and `.env.example`.

---

## Known Issues & Limitations

| Item | Notes |
|------|-------|
| Not in git | No repo, no GitHub remote, no production CI deploy yet |
| Not on Karmkode.co | Localhost validated only |
| No user accounts | Ephemeral Spotify session; no Supabase Auth yet |
| No usage limits | Phase 2 not built — unlimited scans |
| No payments | Phase 3 not built |
| Spotify dev mode | 5 user cap; Premium required on app owner |
| Files lost on refresh | Mid-processing redirect to `/upload` |

---

## Pending Features

### P0 — Launch on Karmkode.co
- [ ] Git init + push to `karmakode-dev` GitHub
- [ ] Deploy frontend with production env vars
- [ ] Update Supabase `APP_URL` secret for prod
- [ ] Link from karmkode.co main site
- [ ] Production smoke test

### P1 — Phase 2: Free tier
- [ ] 3 scans/day server-side (Supabase)
- [ ] Usage indicator on upload page
- [ ] Paywall when limit exceeded
- [ ] Supabase Auth or device fingerprint for identity

### P1 — Phase 3: Paid credits
- [ ] Stripe Checkout ($3.99 → 25 credits)
- [ ] Webhook Edge Function
- [ ] `users`, `purchases` tables
- [ ] Credit balance in UI

### P2 — Future PRD
- [ ] Apple Music export, TikTok slides, sharing, etc.

---

## Next Development Priorities

1. **Deploy to Karmkode.co** — highest priority; product works locally
2. **GitHub repo** under `karmakode-dev`
3. **Phase 2** — usage limits before public marketing
4. **Phase 3** — Stripe monetization
5. **Brand polish** — landing page, Karmkode cross-linking

---

## Quick Start (New Developer)

```bash
cd PutMeOn
npm install
cp .env.example .env.local
# Configure for backend mode — see HANDOFF.md
npm run dev
```

Backend deploy:

```bash
cd PutMeOn    # important — not parent KK folder
supabase link --project-ref ezfnycxrvhclxrdbzrxg
supabase functions deploy api
```

---

## Key Files to Read First

1. `HANDOFF.md` — current state + what changed
2. `src/pages/ReviewPage.tsx` — two-phase review/match UX
3. `supabase/functions/_shared/spotify.ts` — OAuth + playlist (2026 endpoints)
4. `supabase/functions/_shared/match.ts` — catalog matching
5. `src/services/apiClient.ts` — frontend ↔ backend contract
6. `supabase/BACKEND.md` — secrets + deploy guide

---

## Deployment Notes

- Supabase callback URL stays the same for prod; only `APP_URL` and frontend `VITE_APP_URL` change
- Privacy policy live URL needed for Spotify app: `{YOUR_PROD_URL}/privacy`
- Run all `supabase` CLI commands from `PutMeOn/` directory

---

*Phase 1 shipped locally May 31, 2026. Next milestone: production deploy on Karmkode.co.*
