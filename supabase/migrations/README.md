# Migrations

These are the migrations as applied to the live Supabase project
(`dovgxtnxnscbizcxhncm`, ap-southeast-2), in order. Re-running them is safe —
every statement is `if not exists` / `or replace` / `drop … if exists`.

| Migration | What it does |
| --- | --- |
| `..._archive_legacy_quote_requests.sql` | Renames the first-pass `quote_requests` to `quote_requests_legacy`, preserving the enquiries captured before the cutover, and detaches its policy and email trigger so nothing writes to the archive |
| `..._kabura_site_schema_core.sql` | `enquiry_status` enum, `admin_users`, `quote_requests`, `quote_request_files`, `quote_request_notes`, and their RLS policies |
| `..._kabura_content_tables_and_uploads_bucket.sql` | `projects`, `project_media`, `reviews`, and the private `quote-uploads` bucket with its storage policies |
| `..._repoint_quote_email_notification.sql` | Re-points the Resend notification at the new schema so lead emails keep working |
| `..._move_is_admin_out_of_exposed_schema.sql` | Moves the staff check from `public` (which PostgREST exposes over HTTP) to `private`, and re-points every policy at it |
| `..._quote_dimensions_and_preferred_date.sql` | Adds `width_m`, `length_m` and `preferred_start_date` to `quote_requests`. All nullable with no default, so rows written before it stay valid |
| `..._job_calendar.sql` | `job_status` enum, the staff-only `jobs` table with its RLS policies and revoked base privileges, and `public.service_availability()` — the aggregate-only function the public calendar reads |
| `..._quote_email_adds_dimensions.sql` | Re-points the Resend notification so the measurements and the requested date appear in the lead email |

## Applying to a fresh project

Run them in filename order, either with `supabase db push` after linking, or by
pasting each into the SQL editor. On a project that has never had the first-pass
schema, the archive migration is a harmless no-op.

## Verifying

`supabase/verify-rls.sql` re-runs the security checks: it asserts that `anon`
can insert an enquiry and can do nothing else — no select, update or delete, no
access to the archive, no sight of unpublished projects or unapproved reviews —
and that a signed-in user who is not in `admin_users` sees nothing either.

The job calendar adds one more thing worth checking by hand after applying it:

```sql
-- As anon (or from an incognito browser hitting /rest/v1/jobs):
select * from public.jobs;              -- expect: zero rows, always
select * from public.service_availability(current_date, current_date + 30);
-- expect: one row per day, columns (day, status) and nothing else
```
