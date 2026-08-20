-- Admins may sign in with a short username as well as their email.
--
-- The username lives on the allow-list row, not in auth: Supabase Auth still
-- authenticates by email + password exactly as before, and the sign-in action
-- simply resolves "Rez" to the right email first — server-side, through the
-- service role, so nothing about the mapping is readable from a browser.

alter table public.admin_users
  add column if not exists username text;

-- Unique case-insensitively: two admins called "rez" and "Rez" would be one
-- login prompt with two right answers.
create unique index if not exists admin_users_username_idx
  on public.admin_users (lower(username))
  where username is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'admin_users_username_shape') then
    alter table public.admin_users add constraint admin_users_username_shape
      check (username is null or username ~ '^[A-Za-z0-9._-]{2,40}$');
  end if;
end$$;

comment on column public.admin_users.username is
  'Optional sign-in alias. Resolved to the row''s email server-side; never used as a credential by itself.';
