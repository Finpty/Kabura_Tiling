-- Quote and booking notifications, via BREVO. This replaces the earlier
-- provider outright: after this migration no notification function reads any
-- secret but the Vault entry `brevo_api_key` (a REST API key — the xkeysib-
-- kind, not an SMTP key).
--
-- Shape: each notification is a callable function taking the row, and the
-- trigger is a thin wrapper that passes NEW. That is what makes the send
-- testable against production without inserting anything, and re-runnable
-- for a row whose email was missed:
--
--   select private.send_kabura_quote_email(q)
--     from public.quote_requests q where q.reference = 'KB-…';
--
-- Sender and recipients are data, not code: the sender is
-- business_settings.email (the verified Brevo sender) and the recipients are
-- business_settings.notification_emails, each falling back to
-- rasatiling@gmail.com. Changing either in /admin/settings changes the mail
-- with no deployment.
--
-- A mail problem must never cost a lead: every failure path logs and returns.

create schema if not exists private;

/* ------------------------------ quotes ----------------------------------- */

create or replace function private.send_kabura_quote_email(q public.quote_requests)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
declare
  brevo_key    text;
  sender_email text;
  recipients   jsonb;
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
    return;
  end if;

  select coalesce(nullif(btrim(s.email), ''), 'rasatiling@gmail.com'),
         coalesce(
           (select jsonb_agg(jsonb_build_object('email', e))
              from unnest(s.notification_emails) as e),
           jsonb_build_array(jsonb_build_object('email', 'rasatiling@gmail.com'))
         )
    into sender_email, recipients
    from public.business_settings s
   where s.id = 1;

  sender_email := coalesce(sender_email, 'rasatiling@gmail.com');
  recipients   := coalesce(recipients,
                    jsonb_build_array(jsonb_build_object('email', 'rasatiling@gmail.com')));

  size_text := case
    when q.width_m is not null and q.length_m is not null
      then format('%s m × %s m', trim(to_char(q.width_m, 'FM9990.99')),
                                 trim(to_char(q.length_m, 'FM9990.99')))
    when q.width_m is not null
      then format('Width %s m', trim(to_char(q.width_m, 'FM9990.99')))
    when q.length_m is not null
      then format('Length / height %s m', trim(to_char(q.length_m, 'FM9990.99')))
    else 'Not supplied'
  end;

  message_text := concat_ws(E'\n',
    'A new quote request was submitted on the Kabura Tiling website.',
    '',
    'Reference: '              || q.reference,
    'Name: '                   || coalesce(q.name, 'Not supplied'),
    'Phone: '                  || coalesce(q.phone, 'Not supplied'),
    'Email: '                  || coalesce(q.email, 'Not supplied'),
    'Suburb: '                 || coalesce(nullif(q.suburb, ''), 'Not supplied'),
    'Postcode: '               || coalesce(nullif(q.postcode, ''), 'Not supplied'),
    'Service: '                || coalesce(nullif(q.service, ''), 'Not supplied'),
    'Measurements: '           || size_text,
    'Approx. square metres: '  || coalesce(nullif(q.approx_sqm, ''), 'Not supplied'),
    'Tile size: '              || coalesce(nullif(q.tile_size, ''), 'Not supplied'),
    'New build / renovation: ' || coalesce(nullif(q.build_type, ''), 'Not supplied'),
    'Preferred timing: '       || coalesce(nullif(q.start_timing, ''), 'Not supplied'),
    'Requested start date: '   || coalesce(
                                    to_char(q.preferred_start_date, 'FMDay DD Mon YYYY'),
                                    'Not supplied'),
    '',
    'Project description:',
    coalesce(nullif(q.description, ''), 'Not supplied'),
    '',
    'Open it in the portal:',
    'https://kaburatiling.com.au/admin/quotes',
    '',
    'Submitted: ' || coalesce(q.created_at::text, now()::text),
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
      'sender',  jsonb_build_object('name', 'Kabura Tiling Website', 'email', sender_email),
      'to',      recipients,
      'replyTo', jsonb_build_object('email', q.email, 'name', q.name),
      'subject', format('New Kabura quote %s — %s — %s',
                        q.reference,
                        coalesce(nullif(q.service, ''), 'General enquiry'),
                        coalesce(nullif(q.suburb, ''), 'Location not supplied')),
      'textContent', message_text
    ),
    timeout_milliseconds := 5000
  ) into request_id;

  raise log 'Kabura quote email queued via Brevo, pg_net request_id=%', request_id;
exception
  when others then
    raise warning 'Kabura quote email failed to queue: %', sqlerrm;
end;
$function$;

create or replace function private.notify_kabura_quote_email()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
begin
  begin
    perform private.send_kabura_quote_email(new);
  exception when others then
    raise warning 'Kabura quote email trigger swallowed: %', sqlerrm;
  end;
  return new;
end;
$function$;

drop trigger if exists trg_kabura_quote_email on public.quote_requests;
create trigger trg_kabura_quote_email
  after insert on public.quote_requests
  for each row execute function private.notify_kabura_quote_email();

/* ----------------------------- bookings ---------------------------------- */

create or replace function private.send_kabura_booking_email(b public.booking_requests)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
declare
  brevo_key    text;
  sender_email text;
  recipients   jsonb;
  request_id   bigint;
  message_text text;
begin
  select decrypted_secret into brevo_key
  from vault.decrypted_secrets
  where name = 'brevo_api_key'
  order by updated_at desc
  limit 1;

  if brevo_key is null or btrim(brevo_key) = '' then
    raise log 'Kabura booking email skipped: brevo_api_key not configured in Vault';
    return;
  end if;

  select coalesce(nullif(btrim(s.email), ''), 'rasatiling@gmail.com'),
         coalesce(
           (select jsonb_agg(jsonb_build_object('email', e))
              from unnest(s.notification_emails) as e),
           jsonb_build_array(jsonb_build_object('email', 'rasatiling@gmail.com'))
         )
    into sender_email, recipients
    from public.business_settings s
   where s.id = 1;

  sender_email := coalesce(sender_email, 'rasatiling@gmail.com');
  recipients   := coalesce(recipients,
                    jsonb_build_array(jsonb_build_object('email', 'rasatiling@gmail.com')));

  message_text := concat_ws(E'\n',
    'A customer has asked to book a date on the Kabura Tiling website.',
    '',
    'Reference:  ' || b.reference,
    'Name:       ' || b.name,
    'Phone:      ' || b.phone,
    'Email:      ' || b.email,
    'Suburb:     ' || b.suburb,
    'Date asked: ' || to_char(b.requested_date, 'FMDay DD FMMonth YYYY'),
    'Service:    ' || coalesce(nullif(b.service, ''), 'Not specified'),
    'Job size:   ' || coalesce(nullif(b.approx_size, ''), 'Not specified'),
    'Quote ref:  ' || coalesce(nullif(b.quote_reference, ''), 'None given'),
    '',
    coalesce(nullif(b.message, ''), '(no message)'),
    '',
    'THIS IS NOT A BOOKING. Approve it in the portal to put it in the diary:',
    'https://kaburatiling.com.au/admin/bookings'
  );

  select net.http_post(
    url := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object(
      'api-key',      brevo_key,
      'Content-Type', 'application/json',
      'Accept',       'application/json'
    ),
    body := jsonb_build_object(
      'sender',  jsonb_build_object('name', 'Kabura Tiling Website', 'email', sender_email),
      'to',      recipients,
      'replyTo', jsonb_build_object('email', b.email, 'name', b.name),
      'subject', format('Date request %s — %s — %s',
                        b.reference, b.name,
                        to_char(b.requested_date, 'DD Mon YYYY')),
      'textContent', message_text
    ),
    timeout_milliseconds := 5000
  ) into request_id;

  raise log 'Kabura booking email queued via Brevo, pg_net request_id=%', request_id;
exception
  when others then
    raise warning 'Kabura booking email failed to queue: %', sqlerrm;
end;
$function$;

create or replace function private.notify_kabura_booking_email()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
begin
  begin
    perform private.send_kabura_booking_email(new);
  exception when others then
    raise warning 'Kabura booking email trigger swallowed: %', sqlerrm;
  end;
  return new;
end;
$function$;

drop trigger if exists booking_requests_notify on public.booking_requests;
create trigger booking_requests_notify
  after insert on public.booking_requests
  for each row execute function private.notify_kabura_booking_email();

comment on function private.send_kabura_quote_email(public.quote_requests) is
  'Emails the office about one quote request, via Brevo (vault: brevo_api_key). Callable directly to re-send a missed notification.';
comment on function private.send_kabura_booking_email(public.booking_requests) is
  'Emails the office about one booking request, via Brevo (vault: brevo_api_key). Callable directly.';
