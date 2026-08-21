# The Kabura business portal

The private side of the site: `/admin`. Everything in this document was
verified before it was written down — the schema and policy lists are read
back from a database that ran the real migrations, and the behavioural claims
are each one of the 29 checks in `supabase/tests/portal.test.sql`.

## Live status — 20 Aug 2026

Already done against the production Supabase project (`dovgxtnxnscbizcxhncm`):

- **All 17 migrations are applied**, including the portal schema, the
  availability engine and the username column.
- **The first admin exists**: username `Rez`, email `rasatiling@gmail.com`,
  already on the allow-list. The password is the one the owner chose; it is
  stored only as a bcrypt hash, and the hash was verified to match.
- **The engine was exercised on the live database**: a test booking request was
  approved into a job and the public function flipped that day from
  `available` to `limited`; cancelling flipped it back; the test rows were
  removed completely. The one real quote request in the system was untouched.

What remains is deployment-side:

1. Deploy this branch with the environment variables below.
2. Sign in at `/admin/login` — then open `/admin/settings` and set the GST
   rate, estimated tax rate, working days, daily capacity and notification
   addresses.
3. Optional: put a `brevo_api_key` secret in Supabase Vault so quote and
   booking emails send through Brevo (a REST API key, the xkeysib- kind — an
   SMTP key will not work). Without it both triggers log and do nothing — a mail
   problem never blocks a customer's request.
4. To add a second admin: create their user in Supabase Auth, then insert
   their id (and a `username`, if they want one) into `public.admin_users`.

## Deployment environment

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | build + runtime | `https://dovgxtnxnscbizcxhncm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build + runtime | the anon key from Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime, server only | photo uploads, **username sign-in**, and returning a reference to booking customers |

The service-role key is never sent to a browser (`server-only` enforces it at
build time). Without it the portal still works: sign-in falls back to
email-only, and a booking customer gets a confirmation without a reference.

No environment variables were added. The portal runs on the same
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
`SUPABASE_SERVICE_ROLE_KEY` the quote pipeline already uses.

## Tables

Read back from `pg_tables` after applying every migration:

| Table | Holds | Public access |
| --- | --- | --- |
| `admin_users` | the allow-list | none |
| `quote_requests` | enquiries + the portal's commercial fields | INSERT only |
| `quote_request_files` / `quote_request_notes` | uploads, working notes | none |
| `jobs` | the diary: customer, address, dates, money | none |
| `job_assignments` | who is on each job | none |
| `job_notes` | staff notes per job | none |
| `booking_requests` | dates customers asked for | INSERT only |
| `calendar_blocks` | the admin's manual ruling on a day | none |
| `customers` | one record per person, built from real work | none |
| `payments` | money as banked, GST inclusive | none |
| `invoices` | invoice headers (schema ready; UI deferred) | none |
| `expenses` | what went out, with its GST credit | none |
| `business_settings` | one row: rates, working week, capacity | none |
| `projects` / `project_media` / `reviews` | site content (pre-existing) | published/approved rows only |

## Row level security

Every policy, read back from `pg_policies`:

```
admin_users        admins read the allow-list                SELECT  authenticated
booking_requests   anyone may request a date                 INSERT  anon+authenticated
booking_requests   staff read / update / delete …            S/U/D   authenticated
business_settings  staff manage business_settings            ALL     authenticated
calendar_blocks    staff manage calendar_blocks              ALL     authenticated
customers          staff manage customers                    ALL     authenticated
expenses           staff manage expenses                     ALL     authenticated
invoices           staff manage invoices                     ALL     authenticated
job_assignments    staff manage job_assignments              ALL     authenticated
job_notes          staff manage job_notes                    ALL     authenticated
jobs               staff create / read / update / delete     I/S/U/D authenticated
payments           staff manage payments                     ALL     authenticated
quote_requests     anyone may submit an enquiry              INSERT  anon+authenticated
quote_requests     staff read / update / delete enquiries    S/U/D   authenticated
quote_request_*    staff only                                …       authenticated
projects/media/reviews  published or approved rows public    SELECT  anon+authenticated
```

Every "staff" rule is `using (private.is_admin())` — membership of
`admin_users`, checked through a SECURITY DEFINER function in a schema
PostgREST does not expose. Two properties matter more than the list:

- **There is no `anon` rule on any private table.** A visitor is not denied
  those tables; no rule exists that could ever permit them. On top of that,
  base privileges are revoked from `anon` (and from `authenticated`, then
  granted back narrowly), so even a future policy mistake cannot expose a row
  through PostgREST.
- **`booking_requests` accepts INSERT from `anon` and nothing else.** Not
  even `INSERT … RETURNING` works — RETURNING is a read. The test suite
  proves it, and it is why `/api/booking` uses the server-only service client
  to read the reference back.

## Signing in

`/admin/login` accepts **a username or an email**, plus the password. A
username is an alias on the `admin_users` row: the server resolves it to that
row's email through the service-role client *before* authenticating, so which
usernames exist is never observable from a browser, and a name that matches
nothing fails with the same generic message as any wrong password. Supabase
Auth itself still authenticates by email + password, unchanged.

## Password reset — how the pieces fit

The emailed link carries a **one-time credential**, not a session, and
something on the server has to exchange it before the reset page can find a
signed-in user. Both link shapes Supabase can send are handled:

- **Stock template** (`{{ .ConfirmationURL }}`, the dashboard default): the
  link goes to Supabase's hosted verify endpoint, which consumes the token
  itself and redirects back to `/admin/reset-password?code=…`. The middleware
  exchanges that code for a session (`exchangeCodeForSession`), writes the
  cookies onto its redirect, and reloads the page clean. The exchange needs
  the code-verifier cookie stored when the reset was requested, so with this
  template **the link must be opened in the same browser the reset was
  requested from**.
- **Customised template** (below, recommended): the link goes straight to the
  server route `/auth/confirm`, which calls
  `verifyOtp({ type: "recovery", token_hash })` and attaches the session
  cookies to its redirect. No verifier cookie involved — works from any
  browser or device, which is why it is the better template.

Either way, a used, expired or mangled link is bounced to
`/admin/forgot-password?error=link`, which explains and offers the form again.
Credentials stay one-time: the exchange consumes them, and nothing in the app
extends their life. Note that requesting a new link invalidates older ones,
and Supabase rate-limits requests (roughly one per minute) — patience beats
hammering the button.

`/admin/reset-password` renders the form only when a session actually exists;
otherwise it shows "Request a new reset link" instead of a form that can only
fail. After a successful change the visitor lands on `/admin`, signed in.

**Recommended: point the email template at the confirm route.** In the
dashboard under Authentication → Emails → *Reset Password*, use:

```html
<h2>Reset your portal password</h2>
<p>Someone asked to reset the password for the Kabura Tiling business portal.
If this was you, the button below signs you in to choose a new one. The link
works once and expires after an hour.</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/reset-password">
    Set a new password
  </a>
</p>
<p>If you didn&rsquo;t ask for this, ignore this email — nothing will change.</p>
```

Site URL must be `https://kaburatiling.com.au`, and
`https://kaburatiling.com.au/admin/reset-password` stays in the Redirect URLs
allowlist.

## Authentication

Supabase Auth, three layers, outermost first:

1. **Middleware** (`src/middleware.ts`, matcher `/admin/:path*`): no session →
   redirect to `/admin/login` (with the destination carried in `?next=`, which
   the sign-in action only honours for in-app `/admin` paths). It also refreshes
   the session cookie, so a long day on site does not end in a surprise logout.
   It checks only that a session exists — deliberately.
2. **`getAdminSession()`** on every page and every server action: validates
   the JWT with `getUser()` (not the cookie), then requires a row in
   `admin_users`. Signing up is not being let in; a signed-in stranger is
   signed straight back out.
3. **RLS**, the layer that actually holds: every query runs as the signed-in
   user on the anon key, so Postgres re-checks `private.is_admin()` on every
   row. Delete the two layers above and an unauthorised visitor still gets
   empty result sets. The service-role key appears in exactly two server-only
   files and never in portal reads.

Passwords are Supabase's — hashed by them, never stored, logged or seen here.
Reset is the standard email flow (`/admin/forgot-password` →
`/admin/reset-password`); the request form answers identically whether or not
the address exists, so it cannot be used to enumerate staff.

## How public availability is derived — and why dates release themselves

There is **no table of reserved dates**. A day's status is computed from the
jobs every time anyone asks, by `public.service_availability()` (SECURITY
DEFINER — the only bridge `anon` has to the diary), and by the same rules in
`src/lib/admin/dates.ts` for the admin's own screens:

1. a day already gone → `unavailable`
2. the admin's manual ruling in `calendar_blocks`, if any — `open` and
   `emergency` beat a full diary, `blocked`/`holiday`/`personal` beat an empty
   one
3. outside the configured working week → `unavailable`
4. otherwise count jobs whose span covers the day — a span runs from
   `starts_on` to **`actual_finish_on` when set, else `ends_on`**, and
   cancelled jobs count nothing: `0 → available`, `< capacity → limited`,
   `else → booked`

Step 4's coalesce is the whole "automatic available-date system": record that
a Mon–Fri job actually finished Wednesday and Thursday–Friday are open to
customers on the next request; cancel a job and its whole span opens; move it
and the old span opens as the new one closes. Nothing releases dates because
nothing ever reserved them. The function returns one row per day — a date and
one of four words — clamped to a ≤400-day window. No name, address, count or
note can reach the public through it.

A customer choosing an open day creates a **booking request**, not a booking.
Only admin approval (`/admin/bookings`) creates the tentative job that takes
the date off the calendar — which is what makes double-booking structurally
impossible rather than merely unlikely.

## Quote → job

`convertQuoteToJob` copies the customer, contact details, suburb, service,
description and allowances onto a new `booked` job; finds or creates the
`customers` record by email; stores the price **excluding GST** whichever way
it was entered; then marks the quote `converted` and points it at the job.
The quote row is never deleted or edited down — it is the record of what the
customer actually asked for, and the trail runs both ways
(`quote_requests.converted_job_id` ↔ `jobs.quote_request_id`).

## GST, income and profit

All in `src/lib/admin/money.ts`, all reading rates from `business_settings` —
nothing hard-codes 10% or any income-tax figure.

- GST-inclusive: `gst = total × rate ÷ (1 + rate)` — $11,000 at 10% holds
  $1,000 GST and $10,000 income. GST-exclusive: `subtotal × rate` added on.
- **GST collected is never income and never profit.** It is money held for
  the ATO; every screen that shows it says so.
- Job profit = revenue **excl** GST − materials − labour − other − recorded
  job expenses; margin = profit ÷ revenue excl GST. Rankings, per-service
  totals and averages build on this.
- BAS estimate is cash-basis: 1A from payments as banked, 1B from expenses
  (a receipt's stated GST beats the formula — mixed GST-free dockets do not
  divide by eleven), net = 1A − 1B. Quarterly and financial-year periods, CSV
  export at `/admin/finance/export`.
- Tax provision = max(0, profit) × the configured estimate rate. Every
  tax-shaped figure on every screen carries: *"Estimate only — confirm with
  your accountant or bookkeeper."* These are management numbers, not
  lodgeable ones.

## What was tested

`supabase/tests/` runs the real migrations on a scratch PostgreSQL 16 with a
Supabase-shaped harness (the three API roles, `auth.uid()`, vault/net/storage
stubs) — 29 checks, all passing, including: anon locked out of every private
table; anon can submit but never read back a booking request; a signed-in
non-admin sees zero rows and cannot write; **shortening, moving and
cancelling a job release exactly the right days; approving a booking reserves
its date**; overrides beat the diary both ways; capacity produces `limited`;
quote conversion preserves the quote; legacy enum values still write.

On the built app: typecheck, lint and `next build` clean (47 routes); all
nine `/admin` routes 307 to login without a session while login and reset
stay reachable; `/api/booking` rejects malformed and past-dated submissions;
`/book` renders at 390/834/1440 with no overflow and no console errors.

**Not testable in this environment:** a live login round-trip and the email
triggers need a real Supabase project (none is configured here), and Safari
is not installable in the build container. Both are five-minute checks on the
owner's machine once the migrations are applied.

## Deliberately deferred

- **Invoices UI** — the table, statuses and FKs exist; the screens do not.
  Payments + the job's invoice reference cover the current workflow, and a
  full invoicing surface would duplicate whatever accounting software the
  business settles on. Say the word and it goes on top of the existing schema.
- **Drag-to-reschedule** on the calendar. The brief said "if safe": a
  touch-drag across a month grid mis-drops entire jobs too easily on a phone
  — the tool this portal is most used on — so rescheduling is two date fields
  and an "actually finished" field instead, which release days just the same.
- **Brevo.** The working email integration in this project is **Resend** (via
  Supabase Vault + pg_net), and the booking notification extends it.
  Switching providers is a URL, a header and a JSON body in two SQL
  functions; nothing else knows which provider sends the mail.
