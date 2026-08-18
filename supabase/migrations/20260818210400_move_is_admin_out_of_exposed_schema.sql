-- The staff check lived in `public`, which PostgREST exposes — so a
-- SECURITY DEFINER function was reachable at /rest/v1/rpc/is_admin by anyone.
-- It leaked nothing (no arguments, returns only whether the caller themselves is
-- staff), but an exposed SECURITY DEFINER function is a needless surface, and
-- Supabase's own security advisor flags it.
--
-- Moved to `private`, which PostgREST does not expose. Policies still resolve it
-- because `authenticated` keeps EXECUTE; there is simply no HTTP route to it.
-- `anon` never needed it: no policy for anon calls it.

create schema if not exists private;

create or replace function private.is_admin()
returns boolean language sql stable security definer
set search_path = public, pg_catalog
as $$
  select exists (select 1 from public.admin_users a where a.user_id = auth.uid());
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

drop policy if exists "admins read the allow-list" on public.admin_users;
create policy "admins read the allow-list" on public.admin_users
  for select to authenticated using (private.is_admin());

drop policy if exists "staff read enquiries" on public.quote_requests;
create policy "staff read enquiries" on public.quote_requests
  for select to authenticated using (private.is_admin());

drop policy if exists "staff update enquiries" on public.quote_requests;
create policy "staff update enquiries" on public.quote_requests
  for update to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "staff delete enquiries" on public.quote_requests;
create policy "staff delete enquiries" on public.quote_requests
  for delete to authenticated using (private.is_admin());

drop policy if exists "staff read enquiry files" on public.quote_request_files;
create policy "staff read enquiry files" on public.quote_request_files
  for select to authenticated using (private.is_admin());

drop policy if exists "staff delete enquiry files" on public.quote_request_files;
create policy "staff delete enquiry files" on public.quote_request_files
  for delete to authenticated using (private.is_admin());

drop policy if exists "staff read notes" on public.quote_request_notes;
create policy "staff read notes" on public.quote_request_notes
  for select to authenticated using (private.is_admin());

drop policy if exists "staff write notes" on public.quote_request_notes;
create policy "staff write notes" on public.quote_request_notes
  for insert to authenticated with check (private.is_admin());

drop policy if exists "staff delete notes" on public.quote_request_notes;
create policy "staff delete notes" on public.quote_request_notes
  for delete to authenticated using (private.is_admin());

drop policy if exists "staff manage projects" on public.projects;
create policy "staff manage projects" on public.projects
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "staff manage project media" on public.project_media;
create policy "staff manage project media" on public.project_media
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "staff manage reviews" on public.reviews;
create policy "staff manage reviews" on public.reviews
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "staff read quote uploads" on storage.objects;
create policy "staff read quote uploads" on storage.objects
  for select to authenticated using (bucket_id = 'quote-uploads' and private.is_admin());

drop policy if exists "staff delete quote uploads" on storage.objects;
create policy "staff delete quote uploads" on storage.objects
  for delete to authenticated using (bucket_id = 'quote-uploads' and private.is_admin());

drop function if exists public.is_admin();
