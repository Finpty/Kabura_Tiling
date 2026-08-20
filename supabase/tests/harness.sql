-- Supabase-shaped test harness for a stock Postgres 16.
-- Recreates exactly the parts of a Supabase project the migrations touch:
-- the three API roles, auth.uid() driven by a session GUC, and stubs for
-- vault, net and storage. Default privileges mirror Supabase's, where every
-- table created in public is granted to anon/authenticated/service_role and
-- RLS + explicit revokes are what actually gate access.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;

-- auth: the users table and the uid() the policies call.
create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);
create or replace function auth.uid() returns uuid
language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

-- vault: empty secrets, so the email triggers take their "not configured" path.
create schema vault;
create table vault.decrypted_secrets (
  name text, decrypted_secret text, updated_at timestamptz default now()
);

-- net: swallow the HTTP call the email functions would make.
create schema net;
create or replace function net.http_post(url text, headers jsonb, body jsonb)
returns bigint language sql as $$ select 1::bigint $$;

-- storage: the two tables and one helper the uploads migration touches.
create schema storage;
create table storage.buckets (
  id text primary key, name text, public boolean,
  file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text, name text, owner uuid
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[]
language sql immutable as
$$ select (string_to_array(name, '/'))[1 : array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to anon, authenticated, service_role;
grant all on storage.objects, storage.buckets to anon, authenticated, service_role;
