-- Tell the office when someone asks for a date.
--
-- Same mechanism as the quote notification that already works: read the
-- provider key from Supabase Vault, post through pg_net, and swallow every
-- error. An email problem must never roll back the customer's request — the
-- row is the thing that matters, the email is a convenience.
--
-- Inert until a secret named `resend_api_key` exists in Vault. The existing
-- quote notification uses the same secret, so once one works, both do.
--
-- NOTE ON THE PROVIDER: the working integration in this project is Resend, not
-- Brevo. Switching is a change to the URL, the auth header and the JSON body
-- in this one function plus the quote one — nothing else in the app knows or
-- cares which provider sends the mail.

create schema if not exists private;

create or replace function private.notify_kabura_booking_email()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
declare
  resend_key   text;
  recipients   text[];
  message_text text;
begin
  select decrypted_secret into resend_key
  from vault.decrypted_secrets
  where name = 'resend_api_key'
  order by updated_at desc
  limit 1;

  if resend_key is null or btrim(resend_key) = '' then
    raise log 'Kabura booking email skipped: resend_api_key not configured in Vault';
    return new;
  end if;

  select coalesce(nullif(notification_emails, '{}'), array['hello@kaburatiling.com.au'])
    into recipients
    from public.business_settings
   where id = 1;

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
      url     := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || resend_key,
        'Content-Type',  'application/json'
      ),
      body    := jsonb_build_object(
        'from',    'Kabura Website <onboarding@resend.dev>',
        'to',      to_jsonb(recipients),
        'subject', format('Date request %s — %s — %s',
                          new.reference, new.name,
                          to_char(new.requested_date, 'DD Mon YYYY')),
        'text',    message_text
      )
    );
  exception when others then
    -- Never let a mail failure undo the request.
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
  'Emails the office when a date request arrives. Inert without a Vault secret; never blocks the insert.';
