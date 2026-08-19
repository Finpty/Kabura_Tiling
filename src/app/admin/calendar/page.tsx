import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { JobCalendar } from "@/components/admin/JobCalendar";
import { getAdminSession } from "@/lib/admin-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import type { JobRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/**
 * The private job diary.
 *
 * Behind the same session check as the rest of /admin, and `robots` is already
 * `noindex` for the whole segment. The rows read here contain customer names and
 * addresses; nothing on this route is rendered anywhere the public can reach,
 * and the query itself only succeeds because RLS recognises the signed-in user
 * as staff.
 */
export default async function AdminCalendarPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const supabase = await createServerSupabase();

  // A generous window either side of today: enough to page through the diary
  // without refetching, bounded so the payload cannot grow without limit.
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  const to = new Date();
  to.setFullYear(to.getFullYear() + 2);

  const { data, error } = await supabase!
    .from("jobs")
    .select("*")
    .gte("ends_on", from.toISOString().slice(0, 10))
    .lte("starts_on", to.toISOString().slice(0, 10))
    .order("starts_on", { ascending: true })
    .limit(2000);

  const jobs = (data ?? []) as JobRow[];

  return (
    <AdminShell email={session.email}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-[-0.03em] text-bone md:text-4xl">
            Job calendar
          </h1>
          <p className="mt-2 text-sm text-stone">
            {jobs.length} job{jobs.length === 1 ? "" : "s"} · private to this
            dashboard
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-8 text-sm text-bronze-light">
          Couldn&rsquo;t load the calendar. Check that the{" "}
          <code>job_calendar</code> migration has been applied and that your
          user id is in <code>admin_users</code>.
        </p>
      ) : null}

      <div className="mt-10">
        <JobCalendar jobs={jobs} />
      </div>

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-stone">
        Customers never see anything on this page. The public availability
        calendar reads a separate database function that returns only a date and
        whether it is available, limited or booked — no name, no address, no job
        detail, not even a count.
      </p>
    </AdminShell>
  );
}
