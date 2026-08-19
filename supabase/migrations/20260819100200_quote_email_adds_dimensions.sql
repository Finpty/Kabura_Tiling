-- Quote notification email: add the room dimensions and the requested date.
--
-- Same recipient, same Vault secret, same pg_net call and the same
-- swallow-every-error contract as before — an email problem must never roll
-- back the enquiry. Only the body changed: width, length/height and the date
-- the customer asked for now appear alongside the fields already sent.
--
-- The line assembly moved from one long interleaved format() to concat_ws, so
-- adding the next field is one line rather than a re-count of placeholders.
--
-- Still inert until a secret named `resend_api_key` exists in Supabase Vault.

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
  size_text    text;
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

  -- "3.2 m × 2.4 m" when both were given, otherwise whichever one was.
  size_text := case
    when new.width_m is not null and new.length_m is not null
      then format('%s m × %s m', trim(to_char(new.width_m, 'FM9990.99')),
                                 trim(to_char(new.length_m, 'FM9990.99')))
    when new.width_m is not null
      then format('Width %s m', trim(to_char(new.width_m, 'FM9990.99')))
    when new.length_m is not null
      then format('Length / height %s m', trim(to_char(new.length_m, 'FM9990.99')))
    else 'Not supplied'
  end;

  message_text := concat_ws(E'\n',
    'A new quote request was submitted on the Kabura Tiling website.',
    '',
    'Reference: '                || new.reference,
    'Name: '                     || coalesce(new.name, 'Not supplied'),
    'Phone: '                    || coalesce(new.phone, 'Not supplied'),
    'Email: '                    || coalesce(new.email, 'Not supplied'),
    'Suburb: '                   || coalesce(nullif(new.suburb, ''), 'Not supplied'),
    'Postcode: '                 || coalesce(nullif(new.postcode, ''), 'Not supplied'),
    'Service: '                  || coalesce(nullif(new.service, ''), 'Not supplied'),
    'Measurements: '             || size_text,
    'Approx. square metres: '    || coalesce(nullif(new.approx_sqm, ''), 'Not supplied'),
    'Tile size: '                || coalesce(nullif(new.tile_size, ''), 'Not supplied'),
    'New build / renovation: '   || coalesce(nullif(new.build_type, ''), 'Not supplied'),
    'Preferred start: '          || coalesce(nullif(new.start_timing, ''), 'Not supplied'),
    'Requested start date: '     || coalesce(
                                      to_char(new.preferred_start_date, 'FMDay DD Mon YYYY'),
                                      'Not supplied'
                                    ),
    '',
    'Project description:',
    coalesce(nullif(new.description, ''), 'Not supplied'),
    '',
    'Submitted: '                || coalesce(new.created_at::text, now()::text),
    'Status: '                   || coalesce(new.status::text, 'new'),
    '',
    'The requested date is what the customer asked for, not a confirmed booking.'
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
