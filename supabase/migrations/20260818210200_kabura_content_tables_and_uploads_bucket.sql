-- Portfolio and review content, plus the private uploads bucket.

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
create index if not exists projects_published_idx on public.projects (published, sort_order);
alter table public.projects enable row level security;

drop policy if exists "published projects are public" on public.projects;
create policy "published projects are public" on public.projects
  for select to anon, authenticated using (published = true);

drop policy if exists "staff manage projects" on public.projects;
create policy "staff manage projects" on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.project_media (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  url        text not null,
  caption    text,
  alt        text,
  sort_order integer not null default 0
);
create index if not exists project_media_project_idx on public.project_media (project_id, sort_order);
alter table public.project_media enable row level security;

drop policy if exists "media of published projects is public" on public.project_media;
create policy "media of published projects is public" on public.project_media
  for select to anon, authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_media.project_id and p.published = true
  ));

drop policy if exists "staff manage project media" on public.project_media;
create policy "staff manage project media" on public.project_media
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

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
create policy "approved reviews are public" on public.reviews
  for select to anon, authenticated using (approved = true);

drop policy if exists "staff manage reviews" on public.reviews;
create policy "staff manage reviews" on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Private bucket: public = false means no object is readable by URL. Staff read
-- uploads through short-lived signed URLs minted server-side.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('quote-uploads', 'quote-uploads', false, 10485760,
        array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- A visitor may only ever ADD an object, and only beneath a folder named by the
-- random upload token their own submission generated. No select, update or
-- delete for anon — so private uploads can never be listed or browsed, not even
-- by the person who uploaded them.
drop policy if exists "public may upload to their own quote folder" on storage.objects;
create policy "public may upload to their own quote folder" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'quote-uploads'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] ~
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

drop policy if exists "staff read quote uploads" on storage.objects;
create policy "staff read quote uploads" on storage.objects
  for select to authenticated using (bucket_id = 'quote-uploads' and public.is_admin());

drop policy if exists "staff delete quote uploads" on storage.objects;
create policy "staff delete quote uploads" on storage.objects
  for delete to authenticated using (bucket_id = 'quote-uploads' and public.is_admin());
