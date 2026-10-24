-- Events + photo albums, editable in-page by core_team. Run once in the
-- Supabase SQL Editor. Re-runnable.
--
--   * Anyone can read published events, their participants, albums and photos.
--   * Only profiles.role = 'core_team' can create / edit / delete anything,
--     including uploads to the public `club-media` storage bucket.
--   * An album may be linked to an event (its title is then the event's name).

-- =====================================================================
-- Admin check (own function so this file stands alone)
-- =====================================================================
create or replace function public.club_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text = 'core_team'
  );
$$;
revoke all on function public.club_is_admin() from public, anon;
grant execute on function public.club_is_admin() to anon, authenticated;

-- =====================================================================
-- Tables
-- =====================================================================
create table if not exists public.club_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 2 and 120),
  tag text check (tag is null or char_length(tag) <= 40),
  summary text check (summary is null or char_length(summary) <= 300),
  details text check (details is null or char_length(details) <= 10000),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text check (location is null or char_length(location) <= 160),
  rsvp_link text check (rsvp_link is null or rsvp_link ~* '^https?://'),
  cover_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.club_events(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  note text check (note is null or char_length(note) <= 100),   -- e.g. "Speaker", "1st place"
  created_at timestamptz not null default now()
);
create index if not exists event_participants_event_idx on public.event_participants (event_id);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.club_events(id) on delete set null,
  title text not null check (char_length(title) between 2 and 120),
  album_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  url text not null,
  path text,                                   -- storage object path, for cleanup
  caption text check (caption is null or char_length(caption) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists album_photos_album_idx on public.album_photos (album_id, created_at);

create or replace function public.club_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists club_events_touch on public.club_events;
create trigger club_events_touch before update on public.club_events
  for each row execute function public.club_touch();

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.club_events enable row level security;
alter table public.event_participants enable row level security;
alter table public.albums enable row level security;
alter table public.album_photos enable row level security;

drop policy if exists events_read on public.club_events;
create policy events_read on public.club_events for select
  using (published or public.club_is_admin());
drop policy if exists events_write on public.club_events;
create policy events_write on public.club_events for all
  using (public.club_is_admin()) with check (public.club_is_admin());

drop policy if exists participants_read on public.event_participants;
create policy participants_read on public.event_participants for select
  using (exists (select 1 from public.club_events e
                 where e.id = event_id and (e.published or public.club_is_admin())));
drop policy if exists participants_write on public.event_participants;
create policy participants_write on public.event_participants for all
  using (public.club_is_admin()) with check (public.club_is_admin());

drop policy if exists albums_read on public.albums;
create policy albums_read on public.albums for select using (true);
drop policy if exists albums_write on public.albums;
create policy albums_write on public.albums for all
  using (public.club_is_admin()) with check (public.club_is_admin());

drop policy if exists photos_read on public.album_photos;
create policy photos_read on public.album_photos for select using (true);
drop policy if exists photos_write on public.album_photos;
create policy photos_write on public.album_photos for all
  using (public.club_is_admin()) with check (public.club_is_admin());

-- =====================================================================
-- Storage: public bucket for covers and album photos
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('club-media', 'club-media', true, 8388608,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = true, file_size_limit = 8388608,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

drop policy if exists club_media_read on storage.objects;
create policy club_media_read on storage.objects for select
  using (bucket_id = 'club-media');
drop policy if exists club_media_insert on storage.objects;
create policy club_media_insert on storage.objects for insert
  with check (bucket_id = 'club-media' and public.club_is_admin());
drop policy if exists club_media_update on storage.objects;
create policy club_media_update on storage.objects for update
  using (bucket_id = 'club-media' and public.club_is_admin());
drop policy if exists club_media_delete on storage.objects;
create policy club_media_delete on storage.objects for delete
  using (bucket_id = 'club-media' and public.club_is_admin());
