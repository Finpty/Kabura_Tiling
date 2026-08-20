import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import {
  getBookings,
  getExpenses,
  getJobs,
  getPayments,
  getQuotes,
  getBlockMap,
  getSettings,
} from "@/lib/admin/data";
import {
  addDays,
  availabilityFor,
  dateRange,
  eachDay,
  findGaps,
  financialYear,
  longDate,
  shortDate,
  thisMonth,
  thisWeek,
  todayISO,
} from "@/lib/admin/dates";
import {
  ESTIMATE_NOTICE,
  basSummary,
  jobMoney,
  money,
  paymentState,
  taxEstimate,
} from "@/lib/admin/money";
import {
  JOB_STATUS_LABELS_FULL,
  OPEN_QUOTE_STATUSES,
  PAYMENT_STATE_LABELS,
  normaliseQuoteStatus,
} from "@/lib/supabase/portal-types";
import {
  Card,
  Empty,
  EstimateNote,
  PageHeader,
  Pill,
  RowLink,
  Section,
  Stat,
} from "@/components/admin/ui";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * The dashboard.
 *
 * Answers, in order: what is happening today, what is happening this week,
 * where the business stands, and where the money is. Nothing on this page is
 * an input — it is the screen you look at with one hand while holding a
 * trowel, so every figure is a link to the place you would change it.
 *
 * Every number here is derived. Nothing is a stored total that could drift out
 * of step with the jobs and payments underneath it.
 */
export default async function AdminDashboard() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const today = todayISO();
  const week = thisWeek(today);
  const month = thisMonth(today);
  const fy = financialYear(today, await getSettings());

  const [settings, jobs, quotes, bookings, blocks, monthPayments, fyPayments, fyExpenses] =
    await Promise.all([
      getSettings(),
      getJobs(addDays(today, -60), addDays(today, 120)),
      getQuotes(200),
      getBookings(50),
      getBlockMap(today, addDays(today, 60)),
      getPayments(month.from, month.to),
      getPayments(fy.from, fy.to),
      getExpenses(fy.from, fy.to),
    ]);

  /* ------------------------------- today -------------------------------- */
  const live = jobs.filter((job) => job.status !== "cancelled");
  const todayJobs = live.filter(
    (job) => job.starts_on <= today && today <= (job.actual_finish_on ?? job.ends_on),
  );
  const startingSoon = live
    .filter((job) => job.starts_on > today && job.starts_on <= addDays(today, 7))
    .slice(0, 6);

  const openQuotes = quotes.filter((quote) =>
    OPEN_QUOTE_STATUSES.includes(normaliseQuoteStatus(quote.status)),
  );
  const newBookings = bookings.filter(
    (booking) => booking.status === "new" || booking.status === "reviewing",
  );

  /* ------------------------------ this week ------------------------------ */
  const weekJobs = live.filter(
    (job) => job.starts_on <= week.to && (job.actual_finish_on ?? job.ends_on) >= week.from,
  );
  const confirmedThisWeek = weekJobs.filter(
    (job) => job.status === "confirmed" || job.status === "in_progress",
  );
  const tentativeThisWeek = weekJobs.filter(
    (job) => job.status === "tentative" || job.status === "booked",
  );
  const freeDaysThisWeek = eachDay(week.from, week.to).filter(
    (day) =>
      availabilityFor(day, { jobs: live, blocks, settings, today }) === "available",
  ).length;

  const weekRevenueExGst = weekJobs.reduce(
    (sum, job) => sum + (job.value_ex_gst ?? 0),
    0,
  );

  /* --------------------------- business summary -------------------------- */
  const accepted = quotes.filter((quote) => {
    const status = normaliseQuoteStatus(quote.status);
    return status === "accepted" || status === "converted";
  });
  const jobsInProgress = live.filter((job) => job.status === "in_progress");
  const jobsCompleted = live.filter((job) => job.status === "completed");

  const outstanding = live
    .map((job) => ({ job, m: jobMoney(job, job.payments, settings) }))
    .filter(({ m }) => m.outstanding > 0 && m.revenueIncGst > 0);
  const outstandingTotal = outstanding.reduce((sum, { m }) => sum + m.outstanding, 0);
  const receivedThisMonth = monthPayments.reduce(
    (sum, payment) => sum + Number(payment.amount_inc_gst),
    0,
  );

  /* --------------------------- financial summary ------------------------- */
  const bas = basSummary(fyPayments, fyExpenses, settings);
  const tax = taxEstimate(bas.salesExGst, bas.expensesExGst, settings);

  const gaps = findGaps({ jobs: live, blocks, settings, from: today, days: 45 }).slice(0, 4);

  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Section title="Not connected">
          <Empty>
            Supabase is not configured, so there is nothing to show. Add the
            environment variables and run the migrations in{" "}
            <code>supabase/migrations</code>.
          </Empty>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Today"
        subtitle={longDate(today)}
        action={
          <Link
            href="/admin/jobs/new"
            className="rounded-full bg-bronze px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.14em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink"
          >
            Add job
          </Link>
        }
      />

      {/* ------------------------------ today ------------------------------ */}
      <Section
        title={`On today — ${todayJobs.length} job${todayJobs.length === 1 ? "" : "s"}`}
      >
        {todayJobs.length === 0 ? (
          <Empty>Nothing scheduled for today.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {todayJobs.map((job) => (
              <RowLink key={job.id} href={`/admin/jobs/${job.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-bone">
                      {job.customer_name}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-sand/70">
                      {job.address ? `${job.address}, ` : ""}
                      {job.suburb}
                    </p>
                    <p className="mt-1.5 text-xs text-stone">
                      {job.job_type ?? "Tiling"}
                      {job.start_time ? ` · from ${job.start_time.slice(0, 5)}` : ""}
                    </p>
                  </div>
                  <Pill
                    tone={job.status === "in_progress" ? "live" : "neutral"}
                  >
                    {JOB_STATUS_LABELS_FULL[job.status]}
                  </Pill>
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </Section>

      {/* ------------------------- needs a response ------------------------ */}
      <Section title="Waiting on you">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/quotes">
            <Stat
              label="Quotes open"
              value={String(openQuotes.length)}
              hint="Not yet won or lost"
              tone={openQuotes.length > 0 ? "warn" : "muted"}
            />
          </Link>
          <Link href="/admin/bookings">
            <Stat
              label="Date requests"
              value={String(newBookings.length)}
              hint="Awaiting approval"
              tone={newBookings.length > 0 ? "warn" : "muted"}
            />
          </Link>
          <Stat
            label="Owed to you"
            value={money(outstandingTotal)}
            hint={`${outstanding.length} job${outstanding.length === 1 ? "" : "s"} · incl GST`}
            tone={outstandingTotal > 0 ? "warn" : "muted"}
          />
          <Stat
            label="Banked this month"
            value={money(receivedThisMonth)}
            hint="Payments received, incl GST"
            tone="good"
          />
        </div>

        {outstanding.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {outstanding.slice(0, 4).map(({ job, m }) => (
              <RowLink key={job.id} href={`/admin/jobs/${job.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-bone">
                      {job.customer_name}
                    </span>
                    <span className="text-xs text-stone">
                      {dateRange(job.starts_on, job.actual_finish_on ?? job.ends_on)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm text-bone tabular-nums">
                      {money(m.outstanding)}
                    </span>
                    <span className="text-[0.65rem] text-stone">
                      {PAYMENT_STATE_LABELS[paymentState(m, job)]}
                    </span>
                  </span>
                </div>
              </RowLink>
            ))}
          </div>
        ) : null}
      </Section>

      {/* ---------------------------- this week ---------------------------- */}
      <Section title={`This week — ${shortDate(week.from)} to ${shortDate(week.to)}`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Confirmed" value={String(confirmedThisWeek.length)} />
          <Stat
            label="Tentative"
            value={String(tentativeThisWeek.length)}
            tone={tentativeThisWeek.length > 0 ? "warn" : "muted"}
          />
          <Stat
            label="Days free"
            value={String(freeDaysThisWeek)}
            hint="Open to customers"
            tone={freeDaysThisWeek > 0 ? "good" : "muted"}
          />
          <Stat
            label="Booked value"
            value={money(weekRevenueExGst)}
            hint="Excl GST"
          />
        </div>

        {startingSoon.length > 0 ? (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {startingSoon.map((job) => (
              <RowLink key={job.id} href={`/admin/jobs/${job.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-bone">
                      {job.customer_name} · {job.suburb}
                    </span>
                    <span className="text-xs text-stone">
                      Starts {longDate(job.starts_on)}
                    </span>
                  </span>
                  <Pill tone="neutral">
                    {JOB_STATUS_LABELS_FULL[job.status]}
                  </Pill>
                </div>
              </RowLink>
            ))}
          </div>
        ) : null}
      </Section>

      {/* ------------------------------ gaps ------------------------------- */}
      {gaps.length > 0 ? (
        <Section
          title="Openings in the next six weeks"
          action={
            <Link href="/admin/calendar" className="text-xs text-bronze-light">
              Calendar →
            </Link>
          }
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {gaps.map((gap) => (
              <Card key={gap.from}>
                <p className="font-display text-lg text-bone">{gap.label}</p>
                <p className="mt-1 text-xs text-stone">
                  {dateRange(gap.from, gap.to)}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ------------------------ business summary ------------------------- */}
      <Section title="Business">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Quotes received" value={String(quotes.length)} />
          <Stat label="Quotes accepted" value={String(accepted.length)} tone="good" />
          <Stat label="Jobs in progress" value={String(jobsInProgress.length)} />
          <Stat label="Jobs completed" value={String(jobsCompleted.length)} />
        </div>
      </Section>

      {/* ------------------------ financial summary ------------------------ */}
      <Section
        title={`Money — ${fy.label} to date`}
        action={
          <Link href="/admin/finance" className="text-xs text-bronze-light">
            Full finance →
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label="Received (incl GST)"
            value={money(bas.salesIncGst)}
            hint="Payments banked this financial year"
          />
          <Stat
            label="GST collected"
            value={money(bas.gstOnSales)}
            hint="Held for the ATO — not income"
            tone="warn"
          />
          <Stat
            label="Income (excl GST)"
            value={money(bas.salesExGst)}
            hint="The part that is actually revenue"
            tone="good"
          />
          <Stat
            label="Expenses (excl GST)"
            value={money(bas.expensesExGst)}
            hint="Recorded business expenses"
          />
          <Stat
            label="Estimated profit"
            value={money(tax.taxableProfit)}
            hint="Income less expenses, before tax"
            tone={tax.taxableProfit >= 0 ? "good" : "warn"}
          />
          <Stat
            label="Estimated tax set-aside"
            value={money(tax.provision)}
            hint={`At ${(tax.rate * 100).toFixed(1)}% — estimate only`}
            tone="muted"
          />
        </div>
        <EstimateNote>
          {ESTIMATE_NOTICE} GST collected is money held on behalf of the ATO and
          is never counted as income or profit.
        </EstimateNote>
      </Section>
    </>
  );
}
