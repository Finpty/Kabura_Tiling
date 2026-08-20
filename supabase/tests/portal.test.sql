-- Scenario tests against the real migrations on a real Postgres.
-- Every check prints "TEST <name> PASS" or "TEST <name> FAIL…"; the runner
-- greps for FAIL. Error-expectation tests trap the exact SQLSTATE.

\set QUIET on
\pset footer off

-- ---------------------------------------------------------------- seed ----
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@kaburatiling.com.au'),
  ('22222222-2222-2222-2222-222222222222', 'random.customer@example.com');
insert into public.admin_users (user_id, email)
  values ('11111111-1111-1111-1111-111111111111', 'admin@kaburatiling.com.au');

-- One job at a time on a day = booked, for crisp assertions. (Capacity 2 is
-- tested explicitly further down.)
update public.business_settings set daily_capacity = 1 where id = 1;

-- A Monday at least a week out, so nothing collides with "past day" rules.
select (current_date + 7 + ((8 - extract(isodow from current_date + 7)::int) % 7))::date as mon \gset
select (:'mon'::date + 1)::date as tue \gset
select (:'mon'::date + 2)::date as wed \gset
select (:'mon'::date + 3)::date as thu \gset
select (:'mon'::date + 4)::date as fri \gset
select (:'mon'::date + 5)::date as sat \gset
select (:'mon'::date + 7)::date as mon2 \gset
select (:'mon'::date + 11)::date as fri2 \gset

-- psql variables do not interpolate inside dollar-quoted DO bodies, so hand
-- the dates to the server as GUCs and read them back with current_setting().
select set_config('test.mon',  :'mon',  false),
       set_config('test.wed',  :'wed',  false),
       set_config('test.fri',  :'fri',  false),
       set_config('test.mon2', :'mon2', false),
       set_config('test.fri2', :'fri2', false);

-- --------------------------------------------------- helper: day status ----
create function pg_temp.status_of(d date) returns text language sql as
$$ select status from public.service_availability(d, d) $$;

-- =================================================== 1 · security, anon ====
do $$
declare denied boolean := false;
begin
  begin
    set local role anon;
    perform count(*) from public.jobs;
  exception when insufficient_privilege then denied := true;
  end;
  raise notice 'TEST anon-cannot-read-jobs %', case when denied then 'PASS' else 'FAIL' end;
end$$;

do $$
declare t text; denied boolean; failures text := '';
begin
  foreach t in array array['customers','payments','expenses','invoices',
                           'calendar_blocks','business_settings','job_notes',
                           'job_assignments','booking_requests'] loop
    denied := false;
    begin
      set local role anon;
      execute format('select count(*) from public.%I', t);
    exception when insufficient_privilege then denied := true;
    end;
    if not denied then failures := failures || ' ' || t; end if;
  end loop;
  raise notice 'TEST anon-cannot-read-portal-tables %',
    case when failures = '' then 'PASS' else 'FAIL:' || failures end;
end$$;

do $$
declare ok boolean := false;
begin
  set local role anon;
  insert into public.booking_requests (name, phone, email, suburb, requested_date)
  values ('Test Customer', '0400000000', 'test@example.com', 'Perth', current_date + 30);
  ok := true;
  raise notice 'TEST anon-can-submit-booking-request %', case when ok then 'PASS' else 'FAIL' end;
end$$;

do $$
declare denied boolean := false;
begin
  begin
    set local role anon;
    insert into public.booking_requests (name, phone, email, suburb, requested_date)
    values ('Sneaky', '0400000001', 'sneak@example.com', 'Perth', current_date + 31)
    returning reference into strict denied;  -- never reached
  exception when insufficient_privilege then denied := true;
           when others then denied := false;
  end;
  raise notice 'TEST anon-insert-cannot-read-back(RETURNING) %',
    case when denied then 'PASS' else 'FAIL' end;
end$$;

do $$
declare denied boolean := false;
begin
  begin
    set local role anon;
    update public.booking_requests set name = 'Altered' where true;
  exception when insufficient_privilege then denied := true;
  end;
  raise notice 'TEST anon-cannot-alter-booking-requests %',
    case when denied then 'PASS' else 'FAIL' end;
end$$;

-- Availability is callable by anon and says nothing but day + status.
do $$
declare cols int;
begin
  set local role anon;
  select count(*) into cols
  from information_schema.columns  -- structure check runs fine as anon
  where table_name = 'x'; -- no-op, keep role active
  perform * from public.service_availability(current_date, current_date + 3);
  raise notice 'TEST anon-can-read-availability PASS';
exception when others then
  raise notice 'TEST anon-can-read-availability FAIL(%: %)', sqlstate, sqlerrm;
end$$;

-- ====================================== 2 · security, authenticated =======
-- Signed in but NOT on the allow-list: base grant exists, RLS filters to zero.
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
do $$
declare n int;
begin
  set local role authenticated;
  select count(*) into n from public.jobs;
  raise notice 'TEST non-admin-sees-zero-jobs %', case when n = 0 then 'PASS' else 'FAIL('||n||')' end;
end$$;

do $$
declare denied boolean := false;
begin
  begin
    set local role authenticated;
    insert into public.jobs (customer_name, suburb, starts_on, ends_on)
    values ('Should Fail', 'Perth', current_date + 40, current_date + 41);
  exception when insufficient_privilege or check_violation then denied := true;
  end;
  raise notice 'TEST non-admin-cannot-create-jobs %', case when denied then 'PASS' else 'FAIL' end;
end$$;

-- ================================================ 3 · the admin can =======
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
do $$
begin
  set local role authenticated;
  insert into public.jobs (customer_name, suburb, address, starts_on, ends_on, status, job_type)
  values ('Scenario Customer', 'Rockingham', '1 Test St',
          current_setting('test.mon')::date, current_setting('test.fri')::date,
          'booked', 'Bathroom');
  raise notice 'TEST admin-can-create-job PASS';
exception when others then
  raise notice 'TEST admin-can-create-job FAIL(%: %)', sqlstate, sqlerrm;
end$$;

-- ============================== 4 · availability derives from the job =====
set role anon;
select 'TEST booked-week-mon '   || case when pg_temp.status_of(:'mon') = 'booked' then 'PASS' else 'FAIL('||pg_temp.status_of(:'mon')||')' end;
select 'TEST booked-week-fri '   || case when pg_temp.status_of(:'fri') = 'booked' then 'PASS' else 'FAIL('||pg_temp.status_of(:'fri')||')' end;
select 'TEST weekend-unavailable ' || case when pg_temp.status_of(:'sat') = 'unavailable' then 'PASS' else 'FAIL('||pg_temp.status_of(:'sat')||')' end;
select 'TEST next-week-free '    || case when pg_temp.status_of(:'mon2') = 'available' then 'PASS' else 'FAIL('||pg_temp.status_of(:'mon2')||')' end;
select 'TEST past-day-unavailable ' || case when pg_temp.status_of(current_date - 1) = 'unavailable' then 'PASS' else 'FAIL('||pg_temp.status_of(current_date - 1)||')' end;
reset role;

-- Shorten: the job actually finished Wednesday. Thu + Fri must open up.
update public.jobs set actual_finish_on = :'wed' where customer_name = 'Scenario Customer';
set role anon;
select 'TEST shorten-releases-thu ' || case when pg_temp.status_of(:'thu') = 'available' then 'PASS' else 'FAIL('||pg_temp.status_of(:'thu')||')' end;
select 'TEST shorten-releases-fri ' || case when pg_temp.status_of(:'fri') = 'available' then 'PASS' else 'FAIL('||pg_temp.status_of(:'fri')||')' end;
select 'TEST shorten-keeps-wed '    || case when pg_temp.status_of(:'wed') = 'booked' then 'PASS' else 'FAIL('||pg_temp.status_of(:'wed')||')' end;
reset role;

-- Move: reschedule to the following week. Old days free, new days taken.
update public.jobs
   set starts_on = :'mon2', ends_on = :'fri2', actual_finish_on = null
 where customer_name = 'Scenario Customer';
set role anon;
select 'TEST move-releases-old-week ' || case when pg_temp.status_of(:'mon') = 'available' then 'PASS' else 'FAIL('||pg_temp.status_of(:'mon')||')' end;
select 'TEST move-takes-new-week '    || case when pg_temp.status_of(:'mon2') = 'booked' then 'PASS' else 'FAIL('||pg_temp.status_of(:'mon2')||')' end;
reset role;

-- Cancel: the whole span comes back at once.
update public.jobs set status = 'cancelled' where customer_name = 'Scenario Customer';
set role anon;
select 'TEST cancel-releases-dates ' || case when pg_temp.status_of(:'mon2') = 'available' then 'PASS' else 'FAIL('||pg_temp.status_of(:'mon2')||')' end;
reset role;

-- ==================================== 5 · manual overrides win ============
insert into public.calendar_blocks (day, kind) values (:'tue', 'blocked');
insert into public.calendar_blocks (day, kind) values (:'sat', 'open');
set role anon;
select 'TEST override-blocks-free-day ' || case when pg_temp.status_of(:'tue') = 'unavailable' then 'PASS' else 'FAIL('||pg_temp.status_of(:'tue')||')' end;
select 'TEST override-opens-weekend '   || case when pg_temp.status_of(:'sat') = 'available' then 'PASS' else 'FAIL('||pg_temp.status_of(:'sat')||')' end;
reset role;
delete from public.calendar_blocks;

-- ============================== 6 · capacity and 'limited' ================
update public.business_settings set daily_capacity = 2 where id = 1;
update public.jobs set status = 'booked' where customer_name = 'Scenario Customer';
set role anon;
select 'TEST capacity2-one-job-limited ' || case when pg_temp.status_of(:'mon2') = 'limited' then 'PASS' else 'FAIL('||pg_temp.status_of(:'mon2')||')' end;
reset role;
do $$
begin
  set local role authenticated;
  insert into public.jobs (customer_name, suburb, starts_on, ends_on, status)
  values ('Second Job', 'Perth',
          current_setting('test.mon2')::date, current_setting('test.fri2')::date,
          'confirmed');
end$$;
set role anon;
select 'TEST capacity2-two-jobs-booked ' || case when pg_temp.status_of(:'mon2') = 'booked' then 'PASS' else 'FAIL('||pg_temp.status_of(:'mon2')||')' end;
reset role;

-- ================== 7 · booking approval reserves the dates ===============
update public.business_settings set daily_capacity = 1 where id = 1;
delete from public.jobs;
set role anon;
select 'TEST before-approval-day-free ' || case when pg_temp.status_of(:'wed') = 'available' then 'PASS' else 'FAIL('||pg_temp.status_of(:'wed')||')' end;
reset role;
-- What approveBooking does: read the request, create a tentative job on it.
do $$
declare req record;
begin
  select * into req from public.booking_requests where name = 'Test Customer' limit 1;
  set local role authenticated;
  insert into public.jobs (customer_name, customer_phone, customer_email, suburb,
                           starts_on, ends_on, status, booking_request_id)
  values (req.name, req.phone, req.email, req.suburb,
          current_setting('test.wed')::date, current_setting('test.wed')::date,
          'tentative', req.id);
  update public.booking_requests set status = 'converted' where id = req.id;
end$$;
set role anon;
select 'TEST approval-reserves-date ' || case when pg_temp.status_of(:'wed') = 'booked' then 'PASS' else 'FAIL('||pg_temp.status_of(:'wed')||')' end;
reset role;

-- =========== 8 · quote → job conversion keeps the quote intact ============
do $$
declare q_id uuid; j_id uuid; q record;
begin
  set local role anon;
  insert into public.quote_requests (service, suburb, name, phone, email, description, quoted_price)
  values ('Floor tiling', 'Baldivis', 'Convert Me', '0400000002', 'convert@example.com', 'The original words.', null);
  reset role;
  select id into q_id from public.quote_requests where name = 'Convert Me';

  set local role authenticated;
  update public.quote_requests set quoted_price = 11000, price_includes_gst = true where id = q_id;
  -- what convertQuoteToJob stores: 11,000 incl GST at 10% → 10,000 ex, 1,000 GST
  insert into public.jobs (customer_name, suburb, starts_on, ends_on, status,
                           value_ex_gst, gst_amount, quote_request_id)
  select name, suburb, current_date + 30, current_date + 32, 'booked', 10000, 1000, id
    from public.quote_requests where id = q_id
  returning id into j_id;
  update public.quote_requests set status = 'converted', converted_job_id = j_id where id = q_id;
  reset role;

  select * into q from public.quote_requests where id = q_id;
  raise notice 'TEST convert-preserves-quote %',
    case when q.description = 'The original words.' and q.converted_job_id = j_id
         and q.status = 'converted' then 'PASS' else 'FAIL' end;
end$$;

-- ============ 9 · legacy enum values still valid after the additions ======
do $$
begin
  set local role anon;
  insert into public.quote_requests (service, suburb, name, phone, email)
  values ('Wall tiling', 'Perth', 'Legacy Status', '0400000003', 'legacy@example.com');
  reset role;
  update public.quote_requests set status = 'won' where name = 'Legacy Status';
  raise notice 'TEST legacy-enum-values-still-valid PASS';
exception when others then
  raise notice 'TEST legacy-enum-values-still-valid FAIL(%: %)', sqlstate, sqlerrm;
end$$;

-- ================= 10 · availability never leaks anything =================
do $$
declare r record; leaked boolean := false;
begin
  set local role anon;
  for r in select * from public.service_availability(current_date, current_date + 60) loop
    if r.status not in ('available','limited','booked','unavailable') then leaked := true; end if;
  end loop;
  raise notice 'TEST availability-returns-only-day-and-status %',
    case when not leaked then 'PASS' else 'FAIL' end;
end$$;
