import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getJobs, getSettings } from "@/lib/admin/data";
import { addDays, dateRange, todayISO } from "@/lib/admin/dates";
import { jobMoney, money, paymentState } from "@/lib/admin/money";
import {
  JOB_STATUS_LABELS_FULL,
  PAYMENT_STATE_LABELS,
  PORTAL_JOB_STATUSES,
} from "@/lib/supabase/portal-types";
import { Empty, PageHeader, Pill, RowLink, Section } from "@/components/admin/ui";

export const metadata = { title: "Jobs", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { q = "", status = "" } = await searchParams;
  const today = todayISO();

  const [jobs, settings] = await Promise.all([
    // A generous window either side of today: past work still needs invoicing
    // and future work still needs scheduling.
    getJobs(addDays(today, -365), addDays(today, 365)),
    getSettings(),
  ]);

  const term = q.trim().toLowerCase();
  const filtered = jobs
    .filter((job) => {
      if (status && job.status !== status) return false;
      if (!term) return true;
      return [job.customer_name, job.suburb, job.address, job.job_type, job.invoice_reference]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    })
    .sort((a, b) => (a.starts_on < b.starts_on ? 1 : -1));

  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle={`${jobs.length} in the last and next twelve months`}
        action={
          <Link
            href="/admin/jobs/new"
            className="rounded-full bg-bronze px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.14em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink"
          >
            Add job
          </Link>
        }
      />

      <Section title="Find">
        <form className="flex flex-col gap-3 sm:flex-row" action="/admin/jobs">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Customer, suburb, address or invoice"
            className="min-w-0 flex-1 rounded-lg border border-stone/25 bg-charcoal px-4 py-3 text-sm text-bone placeholder:text-stone focus:border-bronze-light focus:outline-none"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-stone/25 bg-charcoal px-4 py-3 text-sm text-bone focus:border-bronze-light focus:outline-none"
          >
            <option value="">All statuses</option>
            {PORTAL_JOB_STATUSES.map((value) => (
              <option key={value} value={value}>
                {JOB_STATUS_LABELS_FULL[value]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg border border-stone/30 px-5 py-3 text-[0.7rem] font-semibold tracking-[0.14em] text-sand uppercase transition-colors hover:border-bronze-light hover:text-bronze-light"
          >
            Search
          </button>
        </form>
      </Section>

      <Section title={`${filtered.length} shown`}>
        {filtered.length === 0 ? (
          <Empty>No jobs match that.</Empty>
        ) : (
          <div className="grid gap-2">
            {filtered.map((job) => {
              const m = jobMoney(job, job.payments, settings);
              const state = paymentState(m, job);
              return (
                <RowLink key={job.id} href={`/admin/jobs/${job.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-bone">
                        {job.customer_name}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-sand/70">
                        {job.job_type ?? "Tiling"} · {job.suburb}
                      </p>
                      <p className="mt-1 text-xs text-stone">
                        {dateRange(job.starts_on, job.actual_finish_on ?? job.ends_on)}
                        {job.actual_finish_on ? " · finished" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Pill
                        tone={
                          job.status === "in_progress"
                            ? "live"
                            : job.status === "cancelled"
                              ? "cold"
                              : "neutral"
                        }
                      >
                        {JOB_STATUS_LABELS_FULL[job.status]}
                      </Pill>
                      {m.revenueExGst > 0 ? (
                        <span className="text-xs text-stone tabular-nums">
                          {money(m.revenueExGst)} ex GST ·{" "}
                          {PAYMENT_STATE_LABELS[state]}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </RowLink>
              );
            })}
          </div>
        )}
      </Section>
    </>
  );
}
