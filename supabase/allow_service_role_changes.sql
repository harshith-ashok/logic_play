-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- The admin users API (api/admin/users.ts) changes roles with the service-role
-- key, where auth.uid() is null, so the original guard rejected it. The API
-- verifies the caller is core_team before every write, so the service role is
-- allowed through; direct client (authenticated) updates are still checked.

create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.role is distinct from old.role then
    if coalesce(
         nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
         nullif(current_setting('request.jwt.claim.role', true), '')
       ) is distinct from 'service_role'
       and not exists (select 1 from public.profiles where id = auth.uid() and role = 'core_team') then
      raise exception 'Only core_team members can change roles.';
    end if;
  end if;
  return new;
end;
$$;

-- Sanity check after running: this should show 'service_role' in the function.
-- select pg_get_functiondef('public.prevent_self_role_escalation'::regproc);
