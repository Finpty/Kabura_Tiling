-- Kabura Tiling Group — core intake schema.
-- RLS on every table. The public may INSERT an enquiry and nothing else: there
-- is deliberately no select/update/delete policy for anon anywhere below, so no
-- visitor can list enquiries, read another customer's details or alter one.
-- Staff access is gated on membership of admin_users via a SECURITY DEFINER
-- helper, which avoids the policy recursing through RLS. The helper is created
-- here in `public` and relocated to `private` by a later migration.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'enquiry_status') then
    create type public.enquiry_status as enum (
      'new', 'contacted', 'site_visit', 'quoted', 'won', 'lost'
    );
  end if;
end$$;

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public, pg_catalog
as $$
  select exists (select 1 from public.admin_users a where a.user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admins read the allow-list" on public.admin_users;
create policy "admins read the allow-list" on public.admin_users
  for select to authenticated using (public.is_admin());

create table if not exists public.quote_requests (
  id            uuid primary key default gen_random_uuid(),
  -- md5(random()) rather than pgcrypto's gen_random_bytes: pgcrypto lives in the
  -- extensions schema on Supabase and would need qualifying; this needs no
  -- extension. Uniqueness is enforced by the constraint regardless.
  reference     text not null unique
                  default 'KB-' || to_char(now() at time zone 'Australia/Perth', 'YYMMDD')
                       || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5)),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  status        public.enquiry_status not null default 'new',
  service       text not null,
  suburb        text not null,
  postcode      text,
  approx_sqm    text,
  tile_size     text,
  build_type    text,
  start_timing  text,
  description   text,
  name          text not null,
  phone         text not null,
  email         text not null,
  upload_token  uuid not null default gen_random_uuid(),
  source_path   text,
  constraint quote_requests_name_len        check (char_length(name) between 1 and 120),
  constraint quote_requests_phone_len       check (char_length(phone) between 6 and 40),
  constraint quote_requests_email_len       check (char_length(email) between 3 and 200),
  constraint quote_requests_email_shape     check (position('@' in email) > 1),
  constraint quote_requests_suburb_len      check (char_length(suburb) between 1 and 120),
  constraint quote_requests_service_len     check (char_length(service) between 1 and 60),
  constraint quote_requests_description_len check (description is null or char_length(description) <= 4000)
);

create index if not exists quote_requests_status_created_idx on public.quote_requests (status, created_at desc);
create index if not exists quote_requests_created_idx on public.quote_requests (created_at desc);
create unique index if not exists quote_requests_upload_token_idx on public.quote_requests (upload_token);
alter table public.quote_requests enable row level security;

drop policy if exists "anyone may submit an enquiry" on public.quote_requests;
create policy "anyone may submit an enquiry" on public.quote_requests
  for insert to anon, authenticated with check (status = 'new');

drop policy if exists "staff read enquiries" on public.quote_requests;
create policy "staff read enquiries" on public.quote_requests
  for select to authenticated using (public.is_admin());

drop policy if exists "staff update enquiries" on public.quote_requests;
create policy "staff update enquiries" on public.quote_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "staff delete enquiries" on public.quote_requests;
create policy "staff delete enquiries" on public.quote_requests
  for delete to authenticated using (public.is_admin());

create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quote_requests_touch on public.quote_requests;
create trigger quote_requests_touch before update on public.quote_requests
  for each row execute function public.touch_updated_at();

create table if not exists public.quote_request_files (
  id               uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests (id) on delete cascade,
  storage_path     text not null,
  file_name        text not null,
  content_type     text,
  size_bytes       bigint,
  created_at       timestamptz not null default now()
);
create index if not exists quote_request_files_request_idx on public.quote_request_files (quote_request_id);
alter table public.quote_request_files enable row level security;

drop policy if exists "staff read enquiry files" on public.quote_request_files;
create policy "staff read enquiry files" on public.quote_request_files
  for select to authenticated using (public.is_admin());

drop policy if exists "staff delete enquiry files" on public.quote_request_files;
create policy "staff delete enquiry files" on public.quote_request_files
  for delete to authenticated using (public.is_admin());

create table if not exists public.quote_request_notes (
  id               uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests (id) on delete cascade,
  body             text not null check (char_length(body) between 1 and 4000),
  author_email     text,
  created_at       timestamptz not null default now()
);
create index if not exists quote_request_notes_request_idx on public.quote_request_notes (quote_request_id, created_at desc);
alter table public.quote_request_notes enable row level security;

drop policy if exists "staff read notes" on public.quote_request_notes;
create policy "staff read notes" on public.quote_request_notes
  for select to authenticated using (public.is_admin());

drop policy if exists "staff write notes" on public.quote_request_notes;
create policy "staff write notes" on public.quote_request_notes
  for insert to authenticated with check (public.is_admin());

drop policy if exists "staff delete notes" on public.quote_request_notes;
create policy "staff delete notes" on public.quote_request_notes
  for delete to authenticated using (public.is_admin());
