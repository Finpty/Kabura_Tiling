-- Quote notification email: add the room dimensions and the requested date.
-- Brevo (vault secret: brevo_api_key), same swallow-every-error contract.
--
-- HISTORY NOTE. Rewritten in place on 21 Aug 2026 so a fresh replay of this
-- folder never installs any provider but Brevo. Already-applied environments
-- are unaffected; the installed functions come from
-- 20260821090000_brevo_notifications.sql either way.

create schema if not exists private;

create or replace function private.notify_kabura_quote_email()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
declare
  brevo_key    text;
  request_id   bigint;
  message_text text;
  size_text    text;
begin
  select decrypted_secret into brevo_key
  from vault.decrypted_secrets
  where name = 'brevo_api_key'
  order by updated_at desc
  limit 1;

  if brevo_key is null or btrim(brevo_key) = '' then
    raise log 'Kabura quote email skipped: brevo_api_key not configured in Vault';
    return new;
  end if;

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
    'Reference: '              || new.reference,
    'Name: '                   || coalesce(new.name, 'Not supplied'),
    'Phone: '                  || coalesce(new.phone, 'Not supplied'),
    'Email: '                  || coalesce(new.email, 'Not supplied'),
    'Suburb: '                 || coalesce(nullif(new.suburb, ''), 'Not supplied'),
    'Postcode: '               || coalesce(nullif(new.postcode, ''), 'Not supplied'),
    'Service: '                || coalesce(nullif(new.service, ''), 'Not supplied'),
    'Measurements: '           || size_text,
    'Approx. square metres: '  || coalesce(nullif(new.approx_sqm, ''), 'Not supplied'),
    'Tile size: '              || coalesce(nullif(new.tile_size, ''), 'Not supplied'),
    'New build / renovation: ' || coalesce(nullif(new.build_type, ''), 'Not supplied'),
    'Preferred timing: '       || coalesce(nullif(new.start_timing, ''), 'Not supplied'),
    'Requested start date: '   || coalesce(
                                    to_char(new.preferred_start_date, 'FMDay DD Mon YYYY'),
                                    'Not supplied'),
    '',
    'Project description:',
    coalesce(nullif(new.description, ''), 'Not supplied'),
    '',
    'Open it in the portal:',
    'https://kaburatiling.com.au/admin/quotes',
    '',
    'The requested date is what the customer asked for, not a confirmed booking.'
  );

  select net.http_post(
    url := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object(
      'api-key',      brevo_key,
      'Content-Type', 'application/json',
      'Accept',       'application/json'
    ),
    body := jsonb_build_object(
      'sender',  jsonb_build_object('name', 'Kabura Tiling Website', 'email', 'rasatiling@gmail.com'),
      'to',      jsonb_build_array(jsonb_build_object('email', 'rasatiling@gmail.com')),
      'replyTo', jsonb_build_object('email', new.email, 'name', new.name),
      'subject', format('New Kabura quote %s — %s — %s',
                        new.reference,
                        coalesce(nullif(new.service, ''), 'General enquiry'),
                        coalesce(nullif(new.suburb, ''), 'Location not supplied')),
      'textContent', message_text
    ),
    timeout_milliseconds := 5000
  ) into request_id;

  raise log 'Kabura quote email queued via Brevo, pg_net request_id=%', request_id;
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
