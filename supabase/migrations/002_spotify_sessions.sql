-- Spotify OAuth sessions and PKCE state (server-side token storage)

create table if not exists public.spotify_oauth_states (
  id uuid primary key default gen_random_uuid(),
  code_verifier text not null,
  return_url text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.spotify_sessions (
  id uuid primary key default gen_random_uuid(),
  spotify_user_id text not null,
  display_name text,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spotify_oauth_states_expires_at_idx
  on public.spotify_oauth_states (expires_at);

create index if not exists spotify_sessions_spotify_user_id_idx
  on public.spotify_sessions (spotify_user_id);

alter table public.spotify_oauth_states enable row level security;
alter table public.spotify_sessions enable row level security;

-- Edge Functions use service role; no public access
create policy "Deny public spotify_oauth_states"
  on public.spotify_oauth_states for all
  to anon, authenticated
  using (false);

create policy "Deny public spotify_sessions"
  on public.spotify_sessions for all
  to anon, authenticated
  using (false);
