-- Row level security verification.
--
--   supabase db execute --file supabase/verify-rls.sql
--   (or paste into the SQL editor)
--
-- Asserts that a member of the public can submit an enquiry and do nothing
-- else. Inserts one clearly-labelled row and removes it again.

create temp table _rls_check(step text, result text) on commit drop;
grant all on _rls_check to anon, authenticated;

do $$
declare v int; t text;
begin
  set local role anon;

  begin
    insert into public.quote_requests (service, suburb, postcode, description, name, phone, email)
    values ('bathroom','Baldivis','6171','RLS VERIFICATION ROW. Safe to delete.','RLS Test','0400000000','rls-test@example.com');
    t := 'ALLOWED   <- correct, the public must be able to submit';
  exception when others then t := 'BLOCKED   <- WRONG';
  end;
  insert into _rls_check values ('anon INSERT enquiry', t);

  select count(*) into v from public.quote_requests;
  insert into _rls_check values ('anon SELECT enquiries', v || ' rows   <- expect 0');

  begin
    execute 'select 1 from public.quote_requests_legacy limit 1';
    t := 'READABLE   <- WRONG';
  exception when others then t := 'DENIED at privilege level   <- correct';
  end;
  insert into _rls_check values ('anon SELECT legacy archive', t);

  update public.quote_requests set status = 'won' where true;
  get diagnostics v = row_count;
  insert into _rls_check values ('anon UPDATE enquiries', v || ' rows changed   <- expect 0');

  begin
    delete from public.quote_requests where true;
    get diagnostics v = row_count;
    t := v || ' rows deleted   <- expect 0';
  exception when others then t := 'DENIED   <- correct';
  end;
  insert into _rls_check values ('anon DELETE enquiries', t);

  select count(*) into v from public.projects;
  insert into _rls_check values ('anon SELECT projects', v || ' rows   <- expect 0 until one is published');

  select count(*) into v from public.reviews;
  insert into _rls_check values ('anon SELECT reviews', v || ' rows   <- expect 0 until one is approved');

  set local role authenticated;
  select count(*) into v from public.quote_requests;
  insert into _rls_check values ('signed-in non-admin SELECT enquiries', v || ' rows   <- expect 0');

  reset role;
end $$;

select * from _rls_check;

delete from public.quote_requests
where email = 'rls-test@example.com'
  and description = 'RLS VERIFICATION ROW. Safe to delete.';
