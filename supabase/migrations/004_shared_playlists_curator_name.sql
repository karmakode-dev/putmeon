-- Optional curator attribution on shared playlists

alter table public.shared_playlists
  add column if not exists curator_name text;
