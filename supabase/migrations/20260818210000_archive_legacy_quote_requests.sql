-- Archive the first-pass quote table so the new site schema can own the name.
-- Existing enquiries are preserved verbatim in quote_requests_legacy.
--
-- The anon INSERT policy and the email trigger are removed from the archive so
-- nothing can write to it and it can never fire a notification again. RLS stays
-- enabled with no policies, and anon holds no table grant either, so the archive
-- is reachable only by the service role.
--
-- On a fresh project where the first-pass schema never existed, this is a no-op.

drop trigger if exists trg_kabura_quote_email on public.quote_requests;
drop policy  if exists public_can_submit_quote_requests on public.quote_requests;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'quote_requests'
      and column_name  = 'suburb_postcode'   -- only the first-pass table had this
  ) then
    alter table public.quote_requests rename to quote_requests_legacy;
  end if;
end$$;

comment on table public.quote_requests_legacy is
  'Archived 2026-08-18. First-pass quote intake, replaced by public.quote_requests. RLS enabled with no policies BY DESIGN: readable only by the service role.';
