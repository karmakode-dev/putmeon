-- PMO Export Tracking V1: playlist exports + export_count

alter table public.shared_playlists
  add column if not exists export_count integer not null default 0;

create table if not exists public.playlist_exports (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.shared_playlists (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  spotify_user_id text,
  exporter_key text not null,
  platform text not null default 'spotify',
  exported_at timestamptz not null default now(),
  constraint playlist_exports_exporter_key_length check (char_length(exporter_key) <= 128),
  constraint playlist_exports_platform_length check (char_length(platform) <= 32),
  unique (playlist_id, exporter_key)
);

create index if not exists playlist_exports_playlist_id_idx
  on public.playlist_exports (playlist_id);

create index if not exists playlist_exports_user_id_idx
  on public.playlist_exports (user_id)
  where user_id is not null;

-- Record a unique export and bump export_count atomically.
create or replace function public.record_playlist_export(
  p_public_id text,
  p_user_id uuid,
  p_spotify_user_id text,
  p_platform text default 'spotify'
)
returns table (export_count integer, recorded boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_playlist_id uuid;
  v_exporter_key text;
  v_inserted_id uuid;
  v_count integer;
begin
  if p_public_id is null or char_length(trim(p_public_id)) = 0 then
    return;
  end if;

  select sp.id, sp.export_count
  into v_playlist_id, v_count
  from public.shared_playlists sp
  where sp.public_id = p_public_id;

  if v_playlist_id is null then
    return;
  end if;

  if p_user_id is not null then
    v_exporter_key := p_user_id::text;
  elsif p_spotify_user_id is not null and char_length(trim(p_spotify_user_id)) > 0 then
    v_exporter_key := 'spotify:' || trim(p_spotify_user_id);
  else
    return query select v_count, false;
    return;
  end if;

  insert into public.playlist_exports (
    playlist_id,
    user_id,
    spotify_user_id,
    exporter_key,
    platform
  )
  values (
    v_playlist_id,
    p_user_id,
    nullif(trim(p_spotify_user_id), ''),
    v_exporter_key,
    coalesce(nullif(trim(p_platform), ''), 'spotify')
  )
  on conflict (playlist_id, exporter_key) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    select sp.export_count into v_count
    from public.shared_playlists sp
    where sp.id = v_playlist_id;

    return query select v_count, false;
    return;
  end if;

  update public.shared_playlists
  set export_count = export_count + 1
  where id = v_playlist_id
  returning shared_playlists.export_count into v_count;

  return query select v_count, true;
end;
$$;

grant execute on function public.record_playlist_export(text, uuid, text, text) to service_role;

alter table public.playlist_exports enable row level security;
