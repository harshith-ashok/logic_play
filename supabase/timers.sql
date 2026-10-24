-- Shared countdown timers (/timer/:slug). Everyone sees the same clock; core_team
-- creates, pauses and resets it. Run once in the Supabase SQL Editor. Re-runnable.
--
--   * Public (anon) can read timers and call server_now() (clients use it to
--     cancel out a wrong device clock).
--   * Only profiles.role = 'core_team' can insert/update/delete.
--   * Changes are pushed to open pages via Supabase Realtime.
--
-- running: ends_at is the absolute end time.
-- paused:  paused_remaining_ms holds what was left; ends_at is ignored.

create table if not exists public.timers (
  slug text primary key
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  title text not null default '' check (char_length(title) <= 100),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  paused_remaining_ms bigint check (paused_remaining_ms is null or paused_remaining_ms >= 0),
  updated_at timestamptz not null default now()
);

create or replace function public.timer_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists timers_touch on public.timers;
create trigger timers_touch before update on public.timers
  for each row execute function public.timer_touch();

create or replace function public.timer_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text = 'core_team'
  );
$$;

create or replace function public.server_now() returns timestamptz
language sql stable as $$ select now(); $$;

alter table public.timers enable row level security;

drop policy if exists timers_read on public.timers;
create policy timers_read on public.timers for select using (true);

drop policy if exists timers_write on public.timers;
create policy timers_write on public.timers for all
  using (public.timer_is_admin()) with check (public.timer_is_admin());

revoke all on function public.timer_is_admin() from public, anon;
grant execute on function public.timer_is_admin() to authenticated;
grant execute on function public.server_now() to anon, authenticated;

-- Realtime: broadcast row changes to subscribed pages.
do $$ begin
  alter publication supabase_realtime add table public.timers;
exception when duplicate_object then null;
end $$;
