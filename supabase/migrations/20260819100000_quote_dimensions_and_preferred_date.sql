-- Quote requests: optional room dimensions and a requested start date.
--
-- Every column added here is nullable with no default, so rows written before
-- this migration stay valid and the existing anon INSERT policy still applies
-- unchanged. Nothing existing is altered or dropped.
--
--   width_m / length_m    the two measurements the customer may enter. Stored
--                         numerically so they can be reported on later, unlike
--                         approx_sqm which stays text because customers write
--                         things like "about 18" into it and always could.
--   preferred_start_date  the date the customer ASKED for. It is a request,
--                         not a booking — nothing in the schema treats it as
--                         confirmed, and the admin calendar is the only place
--                         a real job is ever created.

alter table public.quote_requests
  add column if not exists width_m              numeric(8, 2),
  add column if not exists length_m             numeric(8, 2),
  add column if not exists preferred_start_date date;

-- Sanity bounds only. A tiler's room is not 4000 m wide; anything outside this
-- is a typo or a probe, and the app validates the same range before it gets here.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'quote_requests_width_range'
  ) then
    alter table public.quote_requests
      add constraint quote_requests_width_range
      check (width_m is null or (width_m > 0 and width_m <= 1000));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'quote_requests_length_range'
  ) then
    alter table public.quote_requests
      add constraint quote_requests_length_range
      check (length_m is null or (length_m > 0 and length_m <= 1000));
  end if;

  -- Guards against garbage dates without pinning a business rule: the calendar
  -- decides what is actually offerable, this only rejects nonsense.
  if not exists (
    select 1 from pg_constraint where conname = 'quote_requests_preferred_date_sane'
  ) then
    alter table public.quote_requests
      add constraint quote_requests_preferred_date_sane
      check (
        preferred_start_date is null
        or preferred_start_date between date '2020-01-01' and date '2100-01-01'
      );
  end if;
end$$;

comment on column public.quote_requests.width_m is
  'Optional customer-entered width in metres.';
comment on column public.quote_requests.length_m is
  'Optional customer-entered length or wall height in metres.';
comment on column public.quote_requests.preferred_start_date is
  'Date the customer requested. A request only — never a confirmed booking.';
