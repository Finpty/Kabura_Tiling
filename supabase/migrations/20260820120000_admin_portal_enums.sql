-- Admin portal — enumerated types.
--
-- Separate from the tables that use them on purpose. `alter type ... add value`
-- cannot be followed by a use of that value inside the same transaction, and
-- each migration file runs in one, so the values land here and are used next.
--
-- NOTHING IS REMOVED. Existing rows keep their existing status: the legacy
-- values stay in the enum and stay valid, and the app maps them onto the new
-- vocabulary for display. Dropping an enum value would fail against live data
-- anyway, which is exactly the protection wanted.

/* ---------------------------- quote lifecycle ----------------------------- */
-- Existing: new, contacted, site_visit, quoted, won, lost.
-- 'quoted' / 'won' / 'lost' are retained as legacy synonyms of quote_sent /
-- accepted / declined so historical rows read correctly.
alter type public.enquiry_status add value if not exists 'quote_preparing';
alter type public.enquiry_status add value if not exists 'quote_sent';
alter type public.enquiry_status add value if not exists 'accepted';
alter type public.enquiry_status add value if not exists 'declined';
alter type public.enquiry_status add value if not exists 'expired';
alter type public.enquiry_status add value if not exists 'converted';

/* ------------------------------ job lifecycle ----------------------------- */
-- Existing: tentative, confirmed, in_progress, completed, cancelled.
alter type public.job_status add value if not exists 'booked';
alter type public.job_status add value if not exists 'on_hold';

/* ------------------------------ new vocabularies -------------------------- */

do $$
begin
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type public.booking_status as enum (
      'new', 'reviewing', 'approved', 'declined', 'alternative_offered', 'converted'
    );
  end if;

  -- A manual entry the admin makes on a day, overriding what the jobs imply.
  if not exists (select 1 from pg_type where typname = 'calendar_override') then
    create type public.calendar_override as enum (
      'open',              -- force available even if jobs suggest otherwise
      'limited',           -- some capacity, by hand
      'fully_booked',      -- no capacity, by hand
      'blocked',           -- not working
      'holiday',
      'personal',
      'emergency'          -- available at short notice, shown as available
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_kind') then
    create type public.payment_kind as enum (
      'deposit', 'progress', 'final', 'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type public.invoice_status as enum (
      'draft', 'sent', 'part_paid', 'paid', 'overdue', 'void'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'expense_category') then
    create type public.expense_category as enum (
      'materials', 'adhesive', 'tiles', 'waterproofing', 'fuel', 'tools',
      'vehicle', 'subcontractors', 'advertising', 'insurance', 'phone',
      'software', 'other'
    );
  end if;
end$$;
