-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- Powers the /leaderboard page. Returns only the public-facing fields of
-- member and core-team profiles, and only to signed-in members / core team.
-- SECURITY DEFINER lets it read profiles past row-level security, which is
-- why the column list and the caller check below are deliberate.

create or replace function public.get_leaderboard_profiles()
returns table (
  id uuid,
  username text,
  first_name text,
  last_name text,
  role text,
  github_username text,
  leetcode_username text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.username, p.first_name, p.last_name, p.role::text,
         p.github_username, p.leetcode_username
  from public.profiles p
  where p.role::text in ('member', 'core_team')
    and exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role::text in ('member', 'core_team')
    );
$$;

revoke all on function public.get_leaderboard_profiles() from public, anon;
grant execute on function public.get_leaderboard_profiles() to authenticated;

-- Make PostgREST pick the new function up immediately.
notify pgrst, 'reload schema';
