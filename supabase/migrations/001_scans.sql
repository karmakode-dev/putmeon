-- PutMeOn scans table
-- Tracks scan sessions for analytics and debugging

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  images_uploaded integer not null default 0,
  songs_detected integer not null default 0,
  songs_matched integer not null default 0
);

alter table public.scans enable row level security;

-- Allow anonymous inserts for MVP (tighten before production)
create policy "Allow anonymous insert"
  on public.scans for insert
  to anon
  with check (true);

create policy "Allow service role read"
  on public.scans for select
  to service_role
  using (true);
