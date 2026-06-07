-- PMO Accounts V1: profiles + playlist ownership

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (
    username is null or (char_length(username) >= 3 and char_length(username) <= 20)
  )
);

create index if not exists profiles_username_idx on public.profiles (username);

alter table public.shared_playlists
  add column if not exists owner_id uuid references auth.users (id) on delete set null;

create index if not exists shared_playlists_owner_id_idx on public.shared_playlists (owner_id);

-- Auto-create profile row when a user signs up via Google
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Reserved / invalid usernames (mirrors app validation)
create or replace function public.is_valid_username(candidate text)
returns boolean
language plpgsql
immutable
as $$
declare
  reserved text[] := array[
    'putmeon', 'pmo', 'admin', 'support', 'staff', 'official', 'team'
  ];
begin
  if candidate is null then
    return false;
  end if;
  if char_length(candidate) < 3 or char_length(candidate) > 20 then
    return false;
  end if;
  if candidate ~ '[A-Z\s]' then
    return false;
  end if;
  if candidate !~ '^[a-z0-9_.]+$' then
    return false;
  end if;
  if candidate ~ '^\.' or candidate ~ '\.$' then
    return false;
  end if;
  if candidate = any (reserved) then
    return false;
  end if;
  return true;
end;
$$;

create or replace function public.set_profile_username(new_username text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(trim(new_username));
  result public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_valid_username(normalized) then
    raise exception 'Invalid username';
  end if;
  update public.profiles
  set username = normalized, updated_at = now()
  where id = auth.uid() and username is null
  returning * into result;
  if result.id is null then
    raise exception 'Username already set or profile not found';
  end if;
  return result;
end;
$$;

grant execute on function public.set_profile_username(text) to authenticated;

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
