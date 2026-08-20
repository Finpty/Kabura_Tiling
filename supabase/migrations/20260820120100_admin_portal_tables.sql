-- Admin portal — tables, indexes and row level security.
--
-- ── The security model, in one paragraph ────────────────────────────────────
-- Every table below is staff-only. RLS is enabled, every policy is gated on
-- private.is_admin(), and there is deliberately no policy of any kind for the
-- `anon` role anywhere in this file: a visitor is not "denied" these tables, a
-- visitor has no rule that could ever permit them. Base privileges are revoked
-- from anon as a second, independent lock, so even a future policy mistake
-- cannot expose a row through PostgREST. The one exception is
-- booking_requests, where the public may INSERT its own request and can never
-- read anything back — the same shape the quote form already uses.
--
-- Public availability continues to come from one SECURITY DEFINER function
-- that aggregates before it returns. No customer name, address, job value or
-- note is reachable by anyone who is not signed in and on the allow-list.
--
-- ── Nothing is destroyed ────────────────────────────────────────────────────
-- Every statement is `if not exists` / `add column if not exists`. Existing
-- rows in quote_requests and jobs stay exactly as they are; the new columns are
-- nullable with sane defaults.

/* ========================================================================== *
 * 1. Customers — one record per person, built up from quotes and jobs.
 * ========================================================================== */

create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  name        text not null,
  phone       text,
  email       text,
  suburb      text,
  address     text,
  notes       text,
  constraint customers_name_len    check (char_length(name) between 1 and 160),
  constraint customers_phone_len   check (phone is null or char_length(phone) <= 40),
  constraint customers_email_len   check (email is null or char_length(email) <= 200),
  constraint customers_notes_len   check (notes is null or char_length(notes) <= 8000)
);

-- Lookup by the three things an admin actually types into a search box.
create index if not exists customers_name_idx   on public.customers (lower(name));
create index if not exists customers_phone_idx  on public.customers (phone);
create index if not exists customers_email_idx  on public.customers (lower(email));
create index if not exists customers_suburb_idx on public.customers (lower(suburb));

alter table public.customers enable row level security;
drop trigger if exists customers_touch on public.customers;
create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

/* ========================================================================== *
 * 2. Quote requests — commercial fields on top of the existing intake row.
 * ========================================================================== */

alter table public.quote_requests
  add column if not exists customer_id         uuid references public.customers (id) on delete set null,
  add column if not exists estimated_price     numeric(12, 2),
  add column if not exists quoted_price        numeric(12, 2),
  add column if not exists price_includes_gst  boolean not null default true,
  add column if not exists material_allowance  numeric(12, 2),
  add column if not exists labour_allowance    numeric(12, 2),
  add column if not exists internal_notes      text,
  add column if not exists site_visit_on       date,
  add column if not exists quote_sent_on       date,
  add column if not exists decided_on          date,
  -- Set when the quote became a job. The quote itself is never deleted: the
  -- original words the customer wrote are the record of what was agreed.
  add column if not exists converted_job_id    uuid;

create index if not exists quote_requests_customer_idx on public.quote_requests (customer_id);

/* ========================================================================== *
 * 3. Jobs — the diary row, extended into a full job record.
 * ========================================================================== */

alter table public.jobs
  add column if not exists customer_id        uuid references public.customers (id) on delete set null,
  add column if not exists customer_phone     text,
  add column if not exists customer_email     text,
  add column if not exists postcode           text,
  add column if not exists actual_finish_on   date,
  add column if not exists description        text,
  -- Money is stored GST-exclusive. Every derived figure in the app builds up
  -- from this one number, so there is never an argument about which way a
  -- stored total was meant to be read.
  add column if not exists value_ex_gst       numeric(12, 2),
  add column if not exists gst_amount         numeric(12, 2),
  add column if not exists deposit_required   numeric(12, 2),
  add column if not exists materials_cost     numeric(12, 2),
  add column if not exists labour_cost        numeric(12, 2),
  add column if not exists other_costs        numeric(12, 2),
  add column if not exists invoice_reference  text,
  add column if not exists booking_request_id uuid;

create index if not exists jobs_customer_idx on public.jobs (customer_id);
create index if not exists jobs_actual_finish_idx on public.jobs (actual_finish_on);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'jobs_actual_finish_sane') then
    alter table public.jobs add constraint jobs_actual_finish_sane
      check (actual_finish_on is null or actual_finish_on >= starts_on);
  end if;
end$$;

/* ========================================================================== *
 * 4. Job assignments — who is on it.
 * ========================================================================== */

create table if not exists public.job_assignments (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  job_id      uuid not null references public.jobs (id) on delete cascade,
  worker_name text not null,
  role        text,
  constraint job_assignments_worker_len check (char_length(worker_name) between 1 and 120),
  constraint job_assignments_role_len   check (role is null or char_length(role) <= 80)
);
create index if not exists job_assignments_job_idx on public.job_assignments (job_id);
alter table public.job_assignments enable row level security;

/* ========================================================================== *
 * 5. Job notes — private, staff-only working notes.
 * ========================================================================== */

create table if not exists public.job_notes (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  job_id       uuid not null references public.jobs (id) on delete cascade,
  body         text not null,
  author_email text,
  constraint job_notes_body_len check (char_length(body) between 1 and 8000)
);
create index if not exists job_notes_job_idx on public.job_notes (job_id, created_at desc);
alter table public.job_notes enable row level security;

/* ========================================================================== *
 * 6. Booking requests — a customer asking for a date. Never a booking.
 * ========================================================================== */

create table if not exists public.booking_requests (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  reference        text not null unique
                     default 'KB-BR-' || to_char(now() at time zone 'Australia/Perth', 'YYMMDD')
                          || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5)),
  status           public.booking_status not null default 'new',
  name             text not null,
  phone            text not null,
  email            text not null,
  suburb           text not null,
  service          text,
  approx_size      text,
  requested_date   date not null,
  message          text,
  -- Set when the customer already submitted a quote enquiry.
  quote_reference  text,
  quote_request_id uuid references public.quote_requests (id) on delete set null,
  customer_id      uuid references public.customers (id) on delete set null,
  job_id           uuid references public.jobs (id) on delete set null,
  -- Filled in when the admin offers a different date instead.
  offered_date     date,
  admin_notes      text,
  source_path      text,
  constraint booking_requests_name_len    check (char_length(name) between 1 and 120),
  constraint booking_requests_phone_len   check (char_length(phone) between 6 and 40),
  constraint booking_requests_email_len   check (char_length(email) between 3 and 200),
  constraint booking_requests_email_shape check (position('@' in email) > 1),
  constraint booking_requests_suburb_len  check (char_length(suburb) between 1 and 120),
  constraint booking_requests_message_len check (message is null or char_length(message) <= 4000),
  constraint booking_requests_date_sane   check (
    requested_date between date '2020-01-01' and date '2100-01-01'
  )
);
create index if not exists booking_requests_status_idx on public.booking_requests (status, created_at desc);
create index if not exists booking_requests_date_idx   on public.booking_requests (requested_date);
alter table public.booking_requests enable row level security;
drop trigger if exists booking_requests_touch on public.booking_requests;
create trigger booking_requests_touch before update on public.booking_requests
  for each row execute function public.touch_updated_at();

/* ========================================================================== *
 * 7. Calendar blocks — the admin's manual word on a day.
 * ========================================================================== */

create table if not exists public.calendar_blocks (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  day         date not null,
  kind        public.calendar_override not null,
  note        text,
  created_by  uuid references auth.users (id) on delete set null,
  constraint calendar_blocks_note_len check (note is null or char_length(note) <= 500)
);
-- One ruling per day. Setting a day twice replaces the previous ruling rather
-- than stacking two contradictory ones.
create unique index if not exists calendar_blocks_day_idx on public.calendar_blocks (day);
alter table public.calendar_blocks enable row level security;
drop trigger if exists calendar_blocks_touch on public.calendar_blocks;
create trigger calendar_blocks_touch before update on public.calendar_blocks
  for each row execute function public.touch_updated_at();

/* ========================================================================== *
 * 8. Invoices and payments.
 * ========================================================================== */

create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  job_id         uuid references public.jobs (id) on delete set null,
  customer_id    uuid references public.customers (id) on delete set null,
  number         text not null unique,
  status         public.invoice_status not null default 'draft',
  issued_on      date,
  due_on         date,
  total_ex_gst   numeric(12, 2) not null default 0,
  gst_amount     numeric(12, 2) not null default 0,
  notes          text,
  constraint invoices_number_len check (char_length(number) between 1 and 60)
);
create index if not exists invoices_job_idx    on public.invoices (job_id);
create index if not exists invoices_status_idx on public.invoices (status, due_on);
alter table public.invoices enable row level security;
drop trigger if exists invoices_touch on public.invoices;
create trigger invoices_touch before update on public.invoices
  for each row execute function public.touch_updated_at();

create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  job_id         uuid references public.jobs (id) on delete cascade,
  invoice_id     uuid references public.invoices (id) on delete set null,
  kind           public.payment_kind not null default 'progress',
  -- Payments are recorded as banked, GST inclusive: that is what the bank
  -- statement shows. The split is derived at report time from the rate in
  -- business_settings, so changing the rate never rewrites history.
  amount_inc_gst numeric(12, 2) not null,
  received_on    date not null default current_date,
  method         text,
  reference      text,
  notes          text,
  constraint payments_amount_positive check (amount_inc_gst > 0),
  constraint payments_method_len      check (method is null or char_length(method) <= 60),
  constraint payments_reference_len   check (reference is null or char_length(reference) <= 120)
);
create index if not exists payments_job_idx      on public.payments (job_id);
create index if not exists payments_received_idx on public.payments (received_on desc);
alter table public.payments enable row level security;

/* ========================================================================== *
 * 9. Expenses — what went out, and the GST paid on it.
 * ========================================================================== */

create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  spent_on      date not null default current_date,
  supplier      text,
  category      public.expense_category not null default 'other',
  description   text,
  -- As it appears on the receipt, plus a flag for how to read it. The GST
  -- component is stored rather than always derived, because a receipt
  -- sometimes states a GST figure that is not exactly one eleventh — mixed
  -- GST-free items, rounding — and the receipt is the evidence, not the
  -- formula.
  amount        numeric(12, 2) not null,
  gst_included  boolean not null default true,
  gst_amount    numeric(12, 2),
  receipt_path  text,
  job_id        uuid references public.jobs (id) on delete set null,
  notes         text,
  created_by    uuid references auth.users (id) on delete set null,
  constraint expenses_amount_positive check (amount > 0),
  constraint expenses_supplier_len    check (supplier is null or char_length(supplier) <= 160),
  constraint expenses_notes_len       check (notes is null or char_length(notes) <= 4000)
);
create index if not exists expenses_spent_idx    on public.expenses (spent_on desc);
create index if not exists expenses_job_idx      on public.expenses (job_id);
create index if not exists expenses_category_idx on public.expenses (category, spent_on desc);
alter table public.expenses enable row level security;
drop trigger if exists expenses_touch on public.expenses;
create trigger expenses_touch before update on public.expenses
  for each row execute function public.touch_updated_at();

/* ========================================================================== *
 * 10. Business settings — one row.
 *
 * Tax rates live here rather than in code because they are the accountant's to
 * set, not the developer's, and because a rate that changes must not require a
 * deployment. Nothing in the app hard-codes 10% or any income tax rate; every
 * calculation reads these values.
 * ========================================================================== */

create table if not exists public.business_settings (
  id                     smallint primary key default 1,
  updated_at             timestamptz not null default now(),
  business_name          text not null default 'Kabura Tiling Group Pty Ltd',
  abn                    text,
  phone                  text,
  email                  text,
  gst_registered         boolean not null default true,
  -- 0.10 = 10%. Stored as a fraction so the maths never has to guess.
  gst_rate               numeric(6, 4) not null default 0.1000,
  -- A management estimate only. See the labels in the app.
  income_tax_rate        numeric(6, 4) not null default 0.2500,
  -- 7 = the Australian financial year, starting 1 July.
  financial_year_start_month smallint not null default 7,
  prices_include_gst     boolean not null default true,
  default_deposit_pct    numeric(6, 4) not null default 0.2000,
  -- 1 = Monday … 7 = Sunday.
  working_days           smallint[] not null default '{1,2,3,4,5}',
  working_hours_start    time not null default '07:00',
  working_hours_end      time not null default '16:00',
  -- How many jobs can run on one day before the public calendar says "booked".
  daily_capacity         smallint not null default 2,
  notification_emails    text[] not null default '{}',
  constraint business_settings_single_row check (id = 1),
  constraint business_settings_gst_rate   check (gst_rate >= 0 and gst_rate < 1),
  constraint business_settings_tax_rate   check (income_tax_rate >= 0 and income_tax_rate < 1),
  constraint business_settings_deposit    check (default_deposit_pct >= 0 and default_deposit_pct <= 1),
  constraint business_settings_fy_month   check (financial_year_start_month between 1 and 12),
  constraint business_settings_capacity   check (daily_capacity between 1 and 20)
);

insert into public.business_settings (id) values (1) on conflict (id) do nothing;

alter table public.business_settings enable row level security;
drop trigger if exists business_settings_touch on public.business_settings;
create trigger business_settings_touch before update on public.business_settings
  for each row execute function public.touch_updated_at();

/* ========================================================================== *
 * 11. Row level security.
 *
 * One shape, applied to every table: staff may do everything, and no `anon`
 * policy exists at all. `for all` covers select/insert/update/delete in a
 * single rule, with `using` gating the rows that may be read or changed and
 * `with check` gating what may be written.
 * ========================================================================== */

do $$
declare
  t text;
begin
  foreach t in array array[
    'customers', 'job_assignments', 'job_notes', 'calendar_blocks',
    'invoices', 'payments', 'expenses', 'business_settings'
  ]
  loop
    execute format('drop policy if exists "staff manage %1$s" on public.%1$I', t);
    execute format(
      'create policy "staff manage %1$s" on public.%1$I for all to authenticated
         using (private.is_admin()) with check (private.is_admin())', t);

    -- Second lock, independent of RLS: the anon role holds no privilege on
    -- these tables at all, so a policy mistake cannot expose them.
    execute format('revoke all on table public.%1$I from anon', t);
    execute format('revoke all on table public.%1$I from authenticated', t);
    execute format(
      'grant select, insert, update, delete on table public.%1$I to authenticated', t);
  end loop;
end$$;

/* -------------------------- booking requests: RLS ------------------------- */
-- The one table the public touches, and only to write. There is no select,
-- update or delete policy for anon, so a request cannot be read back, listed,
-- or altered once submitted — the same shape the quote form already uses.

drop policy if exists "anyone may request a date" on public.booking_requests;
create policy "anyone may request a date" on public.booking_requests
  for insert to anon, authenticated with check (true);

drop policy if exists "staff read booking requests" on public.booking_requests;
create policy "staff read booking requests" on public.booking_requests
  for select to authenticated using (private.is_admin());

drop policy if exists "staff update booking requests" on public.booking_requests;
create policy "staff update booking requests" on public.booking_requests
  for update to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "staff delete booking requests" on public.booking_requests;
create policy "staff delete booking requests" on public.booking_requests
  for delete to authenticated using (private.is_admin());

revoke all on table public.booking_requests from anon;
revoke all on table public.booking_requests from authenticated;
grant insert on table public.booking_requests to anon;
grant select, insert, update, delete on table public.booking_requests to authenticated;

/* ---------------------------- foreign keys added -------------------------- */
-- Added after both tables exist, so the file can be applied in one pass.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quote_requests_converted_job_fk') then
    alter table public.quote_requests
      add constraint quote_requests_converted_job_fk
      foreign key (converted_job_id) references public.jobs (id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'jobs_booking_request_fk') then
    alter table public.jobs
      add constraint jobs_booking_request_fk
      foreign key (booking_request_id) references public.booking_requests (id) on delete set null;
  end if;
end$$;

/* -------------------------------- comments -------------------------------- */
comment on table public.customers is
  'Private. Contact details, gathered from quotes and jobs. Never publicly readable.';
comment on table public.booking_requests is
  'A customer asking for a date. Never a booking — the admin approves it, and only then are dates reserved.';
comment on table public.calendar_blocks is
  'Manual availability rulings. Take priority over what the jobs imply.';
comment on table public.business_settings is
  'Single row. GST and income tax rates live here so the accountant can set them without a deployment.';
comment on column public.jobs.value_ex_gst is
  'Job value EXCLUDING GST. Every derived figure builds from this, so a stored total is never ambiguous.';
comment on column public.payments.amount_inc_gst is
  'Amount banked, GST inclusive — what the bank statement shows.';
