-- Public availability, version 2: derived from the diary, overridden by hand.
--
-- ── Why this is derived and not stored ──────────────────────────────────────
-- There is no "available days" table to keep in step, because a second copy of
-- the truth is a second thing to get wrong. Availability is computed from the
-- jobs themselves every time it is asked for, so:
--
--   • shorten a job from Friday to Wednesday  → Thursday and Friday are free
--   • cancel a job                            → its whole span is free
--   • move a job from 10–14 to 15–19 Sept     → 10–14 free, 15–19 taken
--
-- happen on their own, the instant the job row changes. Nothing has to
-- remember to release anything, because nothing was ever reserved.
--
-- A job's occupancy runs from starts_on to whichever of actual_finish_on or
-- ends_on is set — so recording that a job actually finished early releases the
-- remaining days, and recording that it ran over takes the extra ones.
--
-- ── What the public is allowed to know ──────────────────────────────────────
-- One row per day: the date, and one word. Never a name, an address, a job
-- type, a value, or even how many jobs are on. SECURITY DEFINER because the
-- caller is `anon`, who has no access to public.jobs and must never be given
-- any; this function is the only bridge and it aggregates before it returns.

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
  window_start date;
  window_end   date;
  capacity     int;
  work_days    smallint[];
begin
  -- Capacity and the working week are the admin's to set, not the code's.
  select coalesce(s.daily_capacity, 2), coalesce(s.working_days, '{1,2,3,4,5}')
    into capacity, work_days
    from public.business_settings s
   where s.id = 1;

  capacity  := coalesce(capacity, 2);
  work_days := coalesce(work_days, '{1,2,3,4,5}');

  -- Clamp: never further back than a month, never more than a year ahead, and
  -- never a span longer than 400 days regardless of what was asked for. A
  -- public endpoint should not be usable to sweep the diary or to hammer the
  -- database.
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
     -- The end of a job is what it actually was, when that is known.
     and days.day between j.starts_on and coalesce(j.actual_finish_on, j.ends_on)
    group by days.day
  ),
  ruled as (
    select
      load.day,
      load.running,
      b.kind as override
    from load
    left join public.calendar_blocks b on b.day = load.day
  )
  select
    ruled.day,
    case
      -- 1. A day that has already gone cannot be requested.
      when ruled.day < current_date then 'unavailable'

      -- 2. The admin's own ruling, where they have made one. "Open" and
      --    "emergency" deliberately win over a full diary: the admin knows
      --    something the schedule does not.
      when ruled.override in ('open', 'emergency')   then 'available'
      when ruled.override = 'limited'                then 'limited'
      when ruled.override = 'fully_booked'           then 'booked'
      when ruled.override in ('blocked', 'holiday', 'personal')
                                                     then 'unavailable'

      -- 3. Outside the working week, unless opened above.
      when not (extract(isodow from ruled.day)::smallint = any (work_days))
                                                     then 'unavailable'

      -- 4. Otherwise, what the diary implies.
      when ruled.running = 0        then 'available'
      when ruled.running < capacity then 'limited'
      else 'booked'
    end as status
  from ruled
  order by ruled.day;
end;
$$;

revoke all on function public.service_availability(date, date) from public;
grant execute on function public.service_availability(date, date) to anon, authenticated;

comment on function public.service_availability(date, date) is
  'Public day-level availability. Derived live from jobs, overridden by calendar_blocks. Returns only a date and available/limited/booked/unavailable — never customer or job detail.';
