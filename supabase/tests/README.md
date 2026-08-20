# Portal test suite

Runs the real migrations against a scratch PostgreSQL 16 and then proves the
properties the portal depends on — 29 checks, each printing `TEST <name> PASS`.

What it covers:

- **RLS**: `anon` cannot read jobs, customers, payments, expenses, invoices,
  calendar blocks, settings, notes or booking requests; a signed-in non-admin
  sees zero rows and cannot write; an allow-listed admin can.
- **Booking privacy**: `anon` may submit a booking request, and may not read it
  back — `INSERT … RETURNING` is refused, which is why `/api/booking` uses the
  server-only service client for the reference.
- **The availability engine**, through the same `service_availability()` the
  public site calls, as `anon`: booked spans read booked; **shortening a job
  releases the unused days; moving it releases the old span and takes the new;
  cancelling releases everything**; manual overrides beat the diary both ways;
  capacity produces `limited`; weekends and past days are unavailable; and
  **approving a booking request reserves its date**.
- **Quote → job conversion** leaves the quote intact and pointed at its job.
- **Legacy enum values** (`quoted`/`won`/`lost`) still write after the additions.
- Availability output carries a date and a status and nothing else.

## Running it

```sh
initdb -D /tmp/kbpg/data -U kabura --auth=trust        # any scratch PG 16+
pg_ctl  -D /tmp/kbpg/data -o "-k /tmp/kbpg -p 54329 -c listen_addresses=''" start
psql -h /tmp/kbpg -p 54329 -U kabura -d postgres -c "create database kabura_test"
psql -h /tmp/kbpg -p 54329 -U kabura -d kabura_test -f supabase/tests/harness.sql
for f in supabase/migrations/2*.sql; do
  psql -h /tmp/kbpg -p 54329 -U kabura -d kabura_test -v ON_ERROR_STOP=1 -f "$f"
done
psql -h /tmp/kbpg -p 54329 -U kabura -d kabura_test -f supabase/tests/portal.test.sql 2>&1 | grep TEST
```

Every line must end `PASS`. `harness.sql` recreates the parts of a Supabase
project the migrations touch — the three API roles, `auth.uid()` driven by a
session GUC, and stubs for `vault`, `net` and `storage` — so the suite needs no
Supabase account and no network.
