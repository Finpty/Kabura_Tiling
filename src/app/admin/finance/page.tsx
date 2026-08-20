import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getExpenses, getJobs, getPayments, getSettings } from "@/lib/admin/data";
import {
  addDays,
  basQuarter,
  financialYear,
  thisMonth,
  thisWeek,
  todayISO,
  type Period,
} from "@/lib/admin/dates";
import {
  ESTIMATE_NOTICE,
  basSummary,
  jobMoney,
  money,
  moneyExact,
  percent,
  taxEstimate,
} from "@/lib/admin/money";
import {
  Card,
  Empty,
  EstimateNote,
  PageHeader,
  Section,
  Stat,
} from "@/components/admin/ui";

export const metadata = { title: "Finance", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Where the money is.
 *
 * ── The one thing this page refuses to do ───────────────────────────────────
 * It never adds GST collected to income, and it never calls it profit. GST is
 * money held for the ATO. Every block below says which side of GST it is on,
 * because a trade business that reads its GST as earnings finds out at BAS
 * time, and by then it has been spent.
 *
 * Sales are counted from payments actually banked rather than invoices issued
 * — cash basis, which is what most small trade businesses report on.
 */
export default async function FinancePage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const settings = await getSettings();
  const today = todayISO();
  const fy = financialYear(today, settings);
  const quarter = basQuarter(today);
  const week = thisWeek(today);
  const month = thisMonth(today);

  const periods: Period[] = [
    { ...week, label: "This week" },
    { ...month, label: "This month" },
    { ...quarter, label: `Quarter · ${quarter.label}` },
    { ...fy, label: fy.label },
  ];

  const [payments, expenses, jobs] = await Promise.all([
    getPayments(fy.from, fy.to),
    getExpenses(fy.from, fy.to),
    getJobs(addDays(today, -400), addDays(today, 200)),
  ]);

  const within = (from: string, to: string) => ({
    payments: payments.filter((p) => p.received_on >= from && p.received_on <= to),
    expenses: expenses.filter((e) => e.spent_on >= from && e.spent_on <= to),
  });

  const fyBas = basSummary(payments, expenses, settings);
  const fyTax = taxEstimate(fyBas.salesExGst, fyBas.expensesExGst, settings);
  const quarterSet = within(quarter.from, quarter.to);
  const quarterBas = basSummary(quarterSet.payments, quarterSet.expenses, settings);

  const live = jobs.filter((job) => job.status !== "cancelled");
  const owed = live
    .map((job) => ({ job, m: jobMoney(job, job.payments, settings) }))
    .filter(({ m }) => m.outstanding > 0 && m.revenueIncGst > 0);
  const owedTotal = owed.reduce((sum, { m }) => sum + m.outstanding, 0);

  const upcoming = live
    .filter((job) => job.starts_on > today && (job.value_ex_gst ?? 0) > 0)
    .reduce((sum, job) => sum + (job.value_ex_gst ?? 0), 0);

  // Ranked by what each finished job actually made, not by what it invoiced.
  const completed = live
    .filter((job) => job.status === "completed" && (job.value_ex_gst ?? 0) > 0)
    .map((job) => ({ job, m: jobMoney(job, job.payments, settings) }))
    .sort((a, b) => b.m.grossProfit - a.m.grossProfit);

  const byService = new Map<string, { revenue: number; profit: number; count: number }>();
  for (const { job, m } of completed) {
    const key = job.job_type ?? "Other";
    const entry = byService.get(key) ?? { revenue: 0, profit: 0, count: 0 };
    entry.revenue += m.revenueExGst;
    entry.profit += m.grossProfit;
    entry.count += 1;
    byService.set(key, entry);
  }
  const services = [...byService.entries()].sort((a, b) => b[1].profit - a[1].profit);

  const averageJob =
    completed.length > 0
      ? completed.reduce((sum, { m }) => sum + m.revenueExGst, 0) / completed.length
      : 0;

  return (
    <>
      <PageHeader
        title="Finance"
        subtitle={`${fy.label} · GST ${settings.gst_registered ? `${(settings.gst_rate * 100).toFixed(1)}%` : "not registered"}`}
      />

      <Section title="By period — received, incl GST">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {periods.map((period) => {
            const set = within(period.from, period.to);
            const bas = basSummary(set.payments, set.expenses, settings);
            return (
              <Stat
                key={period.label}
                label={period.label}
                value={money(bas.salesIncGst)}
                hint={`${money(bas.salesExGst)} excl GST`}
              />
            );
          })}
        </div>
      </Section>

      <Section title={`${fy.label} to date`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Total sales (incl GST)" value={money(fyBas.salesIncGst)} />
          <Stat
            label="GST collected"
            value={money(fyBas.gstOnSales)}
            hint="Held for the ATO — not income"
            tone="warn"
          />
          <Stat
            label="Sales excluding GST"
            value={money(fyBas.salesExGst)}
            hint="The part that is revenue"
            tone="good"
          />
          <Stat label="Expenses (excl GST)" value={money(fyBas.expensesExGst)} />
          <Stat
            label="Estimated profit"
            value={money(fyTax.taxableProfit)}
            tone={fyTax.taxableProfit >= 0 ? "good" : "warn"}
          />
          <Stat
            label="Estimated tax set-aside"
            value={money(fyTax.provision)}
            hint={`At ${(fyTax.rate * 100).toFixed(1)}%`}
            tone="muted"
          />
        </div>
        <EstimateNote>
          {ESTIMATE_NOTICE} Actual taxable income and tax depend on deductions,
          entity eligibility and accountant adjustments — this is a management
          estimate, not a tax return.
        </EstimateNote>
      </Section>

      <Section title={`Estimated BAS · ${quarter.label}`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Sales (incl GST)" value={money(quarterBas.salesIncGst)} hint="G1" />
          <Stat label="GST on sales" value={money(quarterBas.gstOnSales)} hint="1A" tone="warn" />
          <Stat
            label="GST credits"
            value={money(quarterBas.gstOnPurchases)}
            hint="1B — GST paid on expenses"
            tone="good"
          />
          <Stat
            label={quarterBas.netGst >= 0 ? "Estimated GST payable" : "Estimated refund"}
            value={money(Math.abs(quarterBas.netGst))}
            hint="1A less 1B"
            tone={quarterBas.netGst >= 0 ? "warn" : "good"}
          />
        </div>
        <EstimateNote>
          {ESTIMATE_NOTICE} Calculated on a cash basis from payments banked and
          expenses recorded in this portal.
        </EstimateNote>

        {/* The file to email the bookkeeper: summary plus every line under it. */}
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/admin/finance/export?period=quarter"
            className="rounded-full border border-stone/30 px-5 py-2.5 text-[0.68rem] font-semibold tracking-[0.14em] text-sand uppercase transition-colors hover:border-bronze-light hover:text-bronze-light"
          >
            Download quarter CSV
          </a>
          <a
            href="/admin/finance/export?period=fy"
            className="rounded-full border border-stone/30 px-5 py-2.5 text-[0.68rem] font-semibold tracking-[0.14em] text-sand uppercase transition-colors hover:border-bronze-light hover:text-bronze-light"
          >
            Download financial-year CSV
          </a>
        </div>
      </Section>

      <Section title="Owed to you">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Outstanding"
            value={money(owedTotal)}
            hint={`${owed.length} job${owed.length === 1 ? "" : "s"}, incl GST`}
            tone={owedTotal > 0 ? "warn" : "good"}
          />
          <Stat
            label="Booked ahead"
            value={money(upcoming)}
            hint="Future jobs, excl GST"
          />
          <Stat
            label="Average completed job"
            value={money(averageJob)}
            hint="Excl GST"
          />
        </div>
      </Section>

      <Section title="Most profitable completed jobs">
        {completed.length === 0 ? (
          <Empty>No completed jobs with a value recorded yet.</Empty>
        ) : (
          <ul className="grid gap-2">
            {completed.slice(0, 8).map(({ job, m }) => (
              <li
                key={job.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-stone/15 bg-charcoal/30 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-bone">
                    {job.customer_name} · {job.suburb}
                  </span>
                  <span className="text-xs text-stone">
                    {job.job_type ?? "Tiling"} · {money(m.revenueExGst)} excl GST
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm text-bone tabular-nums">
                    {moneyExact(m.grossProfit)}
                  </span>
                  <span className="text-[0.65rem] text-stone">
                    {percent(m.margin)} margin
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {services.length > 0 ? (
        <Section title="By service">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(([name, entry]) => (
              <Card key={name}>
                <p className="truncate text-sm text-bone">{name}</p>
                <p className="mt-2 font-display text-xl text-bone tabular-nums">
                  {money(entry.profit)}
                </p>
                <p className="mt-1 text-xs text-stone">
                  profit from {money(entry.revenue)} over {entry.count} job
                  {entry.count === 1 ? "" : "s"}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
