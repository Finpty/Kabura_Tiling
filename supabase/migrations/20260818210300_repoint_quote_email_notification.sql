-- Re-point the Resend notification at the new quote_requests.
--
-- Same recipient, same Vault secret and same pg_net call as the original — only
-- the column mapping changed, plus the fields the new form actually collects
-- (reference, separate suburb/postcode, approx m2, tile size, build type).
-- Failures are swallowed exactly as before: an email problem must never roll
-- back the enquiry itself.
--
-- NOTE: this is inert until a secret named `resend_api_key` exists in Supabase
-- Vault. Without it the function logs and returns, and no email is sent.

create schema if not exists private;

create or replace function private.notify_kabura_quote_email()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
declare
  resend_key   text;
  request_id   bigint;
  message_text text;
  subject_text text;
begin
  select decrypted_secret into resend_key
  from vault.decrypted_secrets
  where name = 'resend_api_key'
  order by updated_at desc
  limit 1;

  if resend_key is null or btrim(resend_key) = '' then
    raise log 'Kabura quote email skipped: resend_api_key not configured in Vault';
    return new;
  end if;

  subject_text := format(
    'New Kabura quote %s — %s — %s',
    new.reference,
    coalesce(nullif(new.service, ''), 'General enquiry'),
    coalesce(nullif(new.suburb, ''), 'Location not supplied')
  );

  message_text := format(
    'A new quote request was submitted on the Kabura Tiling website.%s%s'
    || 'Reference: %s%s' || 'Name: %s%s' || 'Phone: %s%s' || 'Email: %s%s'
    || 'Suburb: %s%s' || 'Postcode: %s%s' || 'Service: %s%s'
    || 'Approx. square metres: %s%s' || 'Tile size: %s%s'
    || 'New build / renovation: %s%s' || 'Preferred start: %s%s'
    || 'Project description: %s%s' || 'Submitted: %s%s' || 'Status: %s',
    E'\n', E'\n',
    new.reference, E'\n',
    coalesce(new.name, 'Not supplied'), E'\n',
    coalesce(new.phone, 'Not supplied'), E'\n',
    coalesce(new.email, 'Not supplied'), E'\n',
    coalesce(nullif(new.suburb, ''), 'Not supplied'), E'\n',
    coalesce(nullif(new.postcode, ''), 'Not supplied'), E'\n',
    coalesce(nullif(new.service, ''), 'Not supplied'), E'\n',
    coalesce(nullif(new.approx_sqm, ''), 'Not supplied'), E'\n',
    coalesce(nullif(new.tile_size, ''), 'Not supplied'), E'\n',
    coalesce(nullif(new.build_type, ''), 'Not supplied'), E'\n',
    coalesce(nullif(new.start_timing, ''), 'Not supplied'), E'\n',
    coalesce(nullif(new.description, ''), 'Not supplied'), E'\n',
    coalesce(new.created_at::text, now()::text), E'\n',
    coalesce(new.status::text, 'new')
  );

  select net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_key,
      'Content-Type', 'application/json',
      'User-Agent', 'Kabura-Tiling-Supabase/1.0',
      'Idempotency-Key', 'kabura-quote-' || new.id::text
    ),
    body := jsonb_build_object(
      'from', 'Kabura Tiling Website <onboarding@resend.dev>',
      'to', jsonb_build_array('rasatiling@gmail.com'),
      'subject', subject_text,
      'text', message_text
    ),
    timeout_milliseconds := 5000
  ) into request_id;

  raise log 'Kabura quote email queued via pg_net request_id=%', request_id;
  return new;
exception
  when others then
    raise warning 'Kabura quote email notification failed to queue: %', sqlerrm;
    return new;
end;
$function$;

drop trigger if exists trg_kabura_quote_email on public.quote_requests;
create trigger trg_kabura_quote_email
  after insert on public.quote_requests
  for each row execute function private.notify_kabura_quote_email();
