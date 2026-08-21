-- Tell the office when someone asks for a date — via BREVO (brevo_api_key).
-- Key from Vault, pg_net post, swallow every error: a mail problem must never
-- roll back the customer's request.
--
-- HISTORY NOTE. Rewritten in place on 21 Aug 2026 so a fresh replay never
-- installs any provider but Brevo. The installed functions come from
-- 20260821090000_brevo_notifications.sql either way.

create schema if not exists private;

create or replace function private.notify_kabura_booking_email()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
declare
  brevo_key    text;
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
    return new;
  end if;

  select coalesce(
           (select jsonb_agg(jsonb_build_object('email', e))
              from unnest(s.notification_emails) as e),
           jsonb_build_array(jsonb_build_object('email', 'rasatiling@gmail.com'))
         )
    into recipients
    from public.business_settings s
   where s.id = 1;

  recipients := coalesce(recipients,
                  jsonb_build_array(jsonb_build_object('email', 'rasatiling@gmail.com')));

  message_text := concat_ws(E'\n',
    'A customer has asked to book a date on the Kabura Tiling website.',
    '',
    'Reference:  ' || new.reference,
    'Name:       ' || new.name,
    'Phone:      ' || new.phone,
    'Email:      ' || new.email,
    'Suburb:     ' || new.suburb,
    'Date asked: ' || to_char(new.requested_date, 'FMDay DD FMMonth YYYY'),
    'Service:    ' || coalesce(nullif(new.service, ''), 'Not specified'),
    'Job size:   ' || coalesce(nullif(new.approx_size, ''), 'Not specified'),
    '',
    coalesce(nullif(new.message, ''), '(no message)'),
    '',
    'THIS IS NOT A BOOKING. Approve it in the portal to put it in the diary:',
    'https://kaburatiling.com.au/admin/bookings'
  );

  begin
    perform net.http_post(
      url := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object(
        'api-key',      brevo_key,
        'Content-Type', 'application/json',
        'Accept',       'application/json'
      ),
      body := jsonb_build_object(
        'sender',  jsonb_build_object('name', 'Kabura Tiling Website', 'email', 'rasatiling@gmail.com'),
        'to',      recipients,
        'replyTo', jsonb_build_object('email', new.email, 'name', new.name),
        'subject', format('Date request %s — %s — %s',
                          new.reference, new.name,
                          to_char(new.requested_date, 'DD Mon YYYY')),
        'textContent', message_text
      ),
      timeout_milliseconds := 5000
    );
  exception when others then
    raise log 'Kabura booking email failed: %', sqlerrm;
  end;

  return new;
end;
$function$;

drop trigger if exists booking_requests_notify on public.booking_requests;
create trigger booking_requests_notify
  after insert on public.booking_requests
  for each row execute function private.notify_kabura_booking_email();

comment on function private.notify_kabura_booking_email() is
  'Emails the office when a date request arrives, via Brevo. Inert without the brevo_api_key Vault secret; never blocks the insert.';
