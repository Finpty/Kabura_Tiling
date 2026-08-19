-- Job calendar — private schedule, public availability.
--
-- PRIVACY IS THE WHOLE DESIGN HERE.
--
-- public.jobs holds customer names, addresses and job notes. It is staff-only:
-- RLS is on, every policy requires private.is_admin(), and there is deliberately
-- no policy of any kind for `anon`. Base privileges are revoked from anon and
-- authenticated as well, so the table is unreachable through PostgREST for
-- anyone who is not on the admin allow-list — RLS is the guarantee, the revoke
-- is the second lock on the same door.
--
-- The public site never reads this table. It calls
-- public.service_availability(), which is SECURITY DEFINER and returns exactly
-- two things per day: the date, and one of 'available' / 'limited' / 'booked'.
-- No name, no address, no job type, no note, not even a count — a visitor
-- cannot learn who is booked, where, or how many jobs are on. That function is
-- the entire public surface of the calendar.

/* --------------------------------- status --------------------------------- */

do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum (
      'tentative', 'confirmed', 'in_progress', 'completed', 'cancelled'
    );
  end if;
end$$;

/* ---------------------------------- table --------------------------------- */

create table if not exists public.jobs (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  customer_name  text not null,
  suburb         text not null,
  address        text,
  starts_on      date not null,
  ends_on        date not null,
  start_time     time,
  end_time       time,
  job_type       text,
  notes          text,
  status         public.job_status not null default 'tentative',
  -- Set when a job grew out of an enquiry. Clearing the enquiry must not delete
  -- the job that is already in the diary, hence `set null` rather than cascade.
  quote_request_id uuid references public.quote_requests (id) on delete set null,
  created_by     uuid references auth.users (id) on delete set null,
  constraint jobs_customer_len  check (char_length(customer_name) between 1 and 160),
  constraint jobs_suburb_len    check (char_length(suburb) between 1 and 120),
  constraint jobs_address_len   check (address is null or char_length(address) <= 300),
  constraint jobs_job_type_len  check (job_type is null or char_length(job_type) <= 120),
  constraint jobs_notes_len     check (notes is null or char_length(notes) <= 4000),
  constraint jobs_date_order    check (ends_on >= starts_on),
  constraint jobs_time_order    check (
    start_time is null or end_time is null or ends_on > starts_on or end_time > start_time
  )
);

create index if not exists jobs_span_idx    on public.jobs (starts_on, ends_on);
create index if not exists jobs_status_idx  on public.jobs (status, starts_on);
create index if not exists jobs_quote_idx   on public.jobs (quote_request_id);

alter table public.jobs enable row level security;

drop trigger if exists jobs_touch on public.jobs;
create trigger jobs_touch before update on public.jobs
  for each row execute function public.touch_updated_at();

/* ------------------------------- staff only ------------------------------- */

drop policy if exists "staff read jobs" on public.jobs;
create policy "staff read jobs" on public.jobs
  for select to authenticated using (private.is_admin());

drop policy if exists "staff create jobs" on public.jobs;
create policy "staff create jobs" on public.jobs
  for insert to authenticated with check (private.is_admin());

drop policy if exists "staff update jobs" on public.jobs;
create policy "staff update jobs" on public.jobs
  for update to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "staff delete jobs" on public.jobs;
create policy "staff delete jobs" on public.jobs
  for delete to authenticated using (private.is_admin());

-- Second lock: even before RLS is consulted, neither role holds a privilege on
-- the table. `authenticated` reaches it through the SECURITY DEFINER admin path
-- only; a signed-in non-admin gets nothing.
revoke all on table public.jobs from anon;
revoke all on table public.jobs from authenticated;
grant select, insert, update, delete on table public.jobs to authenticated;

/* --------------------------- public availability -------------------------- */

/**
 * What the public calendar is allowed to know.
 *
 * Returns one row per day in the requested window with a coarse load label and
 * nothing else. SECURITY DEFINER because the caller (anon) has no access to
 * public.jobs and must never be given any; the function is the only bridge and
 * it aggregates before it returns.
 *
 * Cancelled jobs do not occupy a day. The window is clamped server-side so the
 * function cannot be used to sweep the diary or to hammer the database.
 *
 * DAILY CAPACITY is the number of jobs that can run at once. Change the
 * constant below and the public calendar follows on the next request.
 */
create or replace function public.service_availability(
  from_date date default current_date,
  to_date   date default (current_date + 120)
)
returns table (day date, status text)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  daily_capacity constant int := 2;
  window_start   date;
  window_end     date;
begin
  -- Clamp: never further back than a month, never more than a year ahead, and
  -- never a span longer than 400 days regardless of what was asked for.
  window_start := greatest(coalesce(from_date, current_date), current_date - 31);
  window_end   := least(coalesce(to_date, window_start + 120), current_date + 365);
  if window_end < window_start then
    window_end := window_start;
  end if;
  window_end := least(window_end, window_start + 400);

  return query
  with days as (
    select d::date as day
    from generate_series(window_start, window_end, interval '1 day') as d
  ),
  load as (
    select
      days.day,
      count(j.id) as running
    from days
    left join public.jobs j
      on j.status <> 'cancelled'
     and days.day between j.starts_on and j.ends_on
    group by days.day
  )
  select
    load.day,
    case
      when load.running = 0 then 'available'
      when load.running < daily_capacity then 'limited'
      else 'booked'
    end as status
  from load
  order by load.day;
end;
$$;

revoke all on function public.service_availability(date, date) from public;
grant execute on function public.service_availability(date, date) to anon, authenticated;

comment on function public.service_availability(date, date) is
  'Public day-level availability. Returns only a date and available/limited/booked — never customer or job detail.';
