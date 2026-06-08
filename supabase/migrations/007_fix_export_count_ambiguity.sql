-- Fix ambiguous export_count reference in record_playlist_export (RETURNS TABLE vs column)

create or replace function public.record_playlist_export(
  p_public_id text,
  p_user_id uuid,
  p_spotify_user_id text,
  p_platform text default 'spotify'
)
returns table (new_export_count integer, was_recorded boolean)
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

  update public.shared_playlists sp
  set export_count = sp.export_count + 1
  where sp.id = v_playlist_id
  returning sp.export_count into v_count;

  return query select v_count, true;
end;
$$;

grant execute on function public.record_playlist_export(text, uuid, text, text) to service_role;
