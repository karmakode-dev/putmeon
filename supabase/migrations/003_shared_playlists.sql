-- Shareable curated playlists (public links)

create table if not exists public.shared_playlists (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,
  name text not null,
  description text,
  songs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists shared_playlists_public_id_idx on public.shared_playlists (public_id);

alter table public.shared_playlists enable row level security;
