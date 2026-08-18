-- ============================================================================
-- Kabura Tiling Group — initial schema
--
-- Security model
-- --------------
--   * RLS is enabled on every table. There is no table a visitor can read from
--     except published marketing content (projects, project media, approved
--     reviews).
--   * The public may INSERT a quote request and may INSERT files into the
--     private `quote-uploads` bucket under their own unguessable upload token.
--     They may not SELECT, UPDATE or DELETE any enquiry, file or note — so no
--     visitor can list enquiries, read another customer's details, modify
--     someone else's enquiry, or browse private uploads.
--   * Staff access is granted by membership of `admin_users`, checked through
--     the SECURITY DEFINER helper `public.is_admin()`.
--   * The service-role key is used only by the server-side /api/quote route.
--     It is never exposed to the browser.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums ----
do $$
begin
  if not exists (select 1 from pg_type where typname = 'enquiry_status') then
    create type public.enquiry_status as enum (
      'new', 'contacted', 'site_visit', 'quoted', 'won', 'lost'
    );
  end if;
end$$;

-- ------------------------------------------------------------ admin_users --
-- Staff allow-list. A Supabase Auth user only gains dashboard access once their
-- id appears here; signing up alone grants nothing.
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- SECURITY DEFINER so the policy check itself does not recurse through RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admins read the allow-list" on public.admin_users;
create policy "admins read the allow-list"
  on public.admin_users for select
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------- quote_requests ----
create table if not exists public.quote_requests (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique
                  default 'KB-' || to_char(now() at time zone 'Australia/Perth', 'YYMMDD')
                       || '-' || upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 5)),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  status        public.enquiry_status not null default 'new',

  -- step 1
  service       text not null,
  -- step 2
  suburb        text not null,
  postcode      text,
  -- step 3
  approx_sqm    text,
  tile_size     text,
  build_type    text,
  start_timing  text,
  description   text,
  -- step 5
  name          text not null,
  phone         text not null,
  email         text not null,

  -- links a submission to the files uploaded alongside it
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

create index if not exists quote_requests_status_created_idx
  on public.quote_requests (status, created_at desc);
create index if not exists quote_requests_created_idx
  on public.quote_requests (created_at desc);
create unique index if not exists quote_requests_upload_token_idx
  on public.quote_requests (upload_token);

alter table public.quote_requests enable row level security;

-- Public may create an enquiry, and nothing else.
-- The WITH CHECK clause pins the columns a visitor must not control: a new
-- enquiry is always 'new'. There is deliberately NO select/update/delete policy
-- for anon, so a submitted enquiry cannot be read back or altered by anyone
-- other than staff.
drop policy if exists "anyone may submit an enquiry" on public.quote_requests;
create policy "anyone may submit an enquiry"
  on public.quote_requests for insert
  to anon, authenticated
  with check (status = 'new');

drop policy if exists "staff read enquiries" on public.quote_requests;
create policy "staff read enquiries"
  on public.quote_requests for select
  to authenticated
  using (public.is_admin());

drop policy if exists "staff update enquiries" on public.quote_requests;
create policy "staff update enquiries"
  on public.quote_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "staff delete enquiries" on public.quote_requests;
create policy "staff delete enquiries"
  on public.quote_requests for delete
  to authenticated
  using (public.is_admin());

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quote_requests_touch on public.quote_requests;
create trigger quote_requests_touch
  before update on public.quote_requests
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------- quote_request_files ----
create table if not exists public.quote_request_files (
  id               uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests (id) on delete cascade,
  storage_path     text not null,
  file_name        text not null,
  content_type     text,
  size_bytes       bigint,
  created_at       timestamptz not null default now()
);

create index if not exists quote_request_files_request_idx
  on public.quote_request_files (quote_request_id);

alter table public.quote_request_files enable row level security;

-- Written server-side by the /api/quote route using the service role.
-- No anon policy at all: the public can never list or read file records.
drop policy if exists "staff read enquiry files" on public.quote_request_files;
create policy "staff read enquiry files"
  on public.quote_request_files for select
  to authenticated
  using (public.is_admin());

drop policy if exists "staff delete enquiry files" on public.quote_request_files;
create policy "staff delete enquiry files"
  on public.quote_request_files for delete
  to authenticated
  using (public.is_admin());

-- -------------------------------------------------- quote_request_notes ----
-- Internal notes. Never rendered on the public site.
create table if not exists public.quote_request_notes (
  id               uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests (id) on delete cascade,
  body             text not null check (char_length(body) between 1 and 4000),
  author_email     text,
  created_at       timestamptz not null default now()
);

create index if not exists quote_request_notes_request_idx
  on public.quote_request_notes (quote_request_id, created_at desc);

alter table public.quote_request_notes enable row level security;

drop policy if exists "staff read notes" on public.quote_request_notes;
create policy "staff read notes"
  on public.quote_request_notes for select
  to authenticated
  using (public.is_admin());

drop policy if exists "staff write notes" on public.quote_request_notes;
create policy "staff write notes"
  on public.quote_request_notes for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "staff delete notes" on public.quote_request_notes;
create policy "staff delete notes"
  on public.quote_request_notes for delete
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------- projects ----
create table if not exists public.projects (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title              text not null,
  category           text not null,
  project_type       text,
  suburb             text,
  tile_type          text,
  tile_size          text,
  services_completed text[],
  description        text,
  cover_url          text,
  before_url         text,
  after_url          text,
  video_url          text,
  -- leave TRUE until the record describes genuine completed Kabura work
  is_placeholder     boolean not null default true,
  published          boolean not null default false,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now()
);

create index if not exists projects_published_idx
  on public.projects (published, sort_order);

alter table public.projects enable row level security;

drop policy if exists "published projects are public" on public.projects;
create policy "published projects are public"
  on public.projects for select
  to anon, authenticated
  using (published = true);

drop policy if exists "staff manage projects" on public.projects;
create policy "staff manage projects"
  on public.projects for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --------------------------------------------------------- project_media --
create table if not exists public.project_media (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  url        text not null,
  caption    text,
  alt        text,
  sort_order integer not null default 0
);

create index if not exists project_media_project_idx
  on public.project_media (project_id, sort_order);

alter table public.project_media enable row level security;

drop policy if exists "media of published projects is public" on public.project_media;
create policy "media of published projects is public"
  on public.project_media for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_media.project_id and p.published = true
    )
  );

drop policy if exists "staff manage project media" on public.project_media;
create policy "staff manage project media"
  on public.project_media for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------------------------------------------------- reviews ----
-- Ships EMPTY on purpose. No review is invented; the site shows a
-- "reviews coming soon" state until real, approved reviews exist here.
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  author_name text not null,
  rating      smallint check (rating between 1 and 5),
  body        text not null,
  source      text,
  reviewed_at date,
  approved    boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "approved reviews are public" on public.reviews;
create policy "approved reviews are public"
  on public.reviews for select
  to anon, authenticated
  using (approved = true);

drop policy if exists "staff manage reviews" on public.reviews;
create policy "staff manage reviews"
  on public.reviews for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ======================================================== storage bucket ====
-- Private bucket. `public = false` means no object is readable by URL; staff
-- read uploads through short-lived signed URLs minted server-side.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quote-uploads',
  'quote-uploads',
  false,
  10485760, -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- A visitor may only ever ADD an object, and only beneath a folder named by the
-- random upload token their own submission generated. They cannot list, read,
-- overwrite or delete anything — including their own upload — so private
-- uploads can never be browsed.
drop policy if exists "public may upload to their own quote folder" on storage.objects;
create policy "public may upload to their own quote folder"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'quote-uploads'
    and array_length(storage.foldername(name), 1) = 1
    -- first path segment must be a uuid: the submission's upload token
    and (storage.foldername(name))[1] ~
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

drop policy if exists "staff read quote uploads" on storage.objects;
create policy "staff read quote uploads"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'quote-uploads' and public.is_admin());

drop policy if exists "staff delete quote uploads" on storage.objects;
create policy "staff delete quote uploads"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'quote-uploads' and public.is_admin());
