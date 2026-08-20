import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getExpenses, getJobs, getSettings } from "@/lib/admin/data";
import {
  addDays,
  financialYear,
  longDate,
  todayISO,
} from "@/lib/admin/dates";
import { expenseSplit, money, moneyExact } from "@/lib/admin/money";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/supabase/portal-types";
import { ExpenseForm } from "@/components/admin/ExpenseForm";
import {
  Card,
  Empty,
  EstimateNote,
  PageHeader,
  Section,
  Stat,
} from "@/components/admin/ui";

export const metadata = { title: "Expenses", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const settings = await getSettings();
  const today = todayISO();
  const fy = financialYear(today, settings);

  const [expenses, jobs] = await Promise.all([
    getExpenses(fy.from, fy.to),
    getJobs(addDays(today, -365), addDays(today, 120)),
  ]);

  const rate = settings.gst_registered ? settings.gst_rate : 0;
  const totals = expenses.reduce(
    (acc, expense) => {
      const split = expenseSplit(expense, rate);
      acc.exGst += split.exGst;
      acc.gst += split.gst;
      return acc;
    },
    { exGst: 0, gst: 0 },
  );

  const jobOptions = jobs
    .filter((job) => job.status !== "cancelled")
    .map((job) => ({
      id: job.id,
      label: `${job.customer_name} · ${job.suburb} · ${job.starts_on}`,
    }));

  return (
    <>
      <PageHeader title="Expenses" subtitle={`${fy.label} to date`} />

      <Section title="This financial year">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Total (excl GST)" value={money(totals.exGst)} />
          <Stat
            label="GST credits"
            value={money(totals.gst)}
            hint="Claimable against GST collected"
            tone="good"
          />
          <Stat label="Records" value={String(expenses.length)} tone="muted" />
        </div>
        <EstimateNote>
          GST credits are an estimate from what has been entered here. Keep the
          receipts — they are the evidence, not this screen.
        </EstimateNote>
      </Section>

      <Section title="Add one">
        <Card>
          <ExpenseForm jobs={jobOptions} />
        </Card>
      </Section>

      <Section title="Recorded">
        {expenses.length === 0 ? (
          <Empty>Nothing recorded this financial year.</Empty>
        ) : (
          <ul className="grid gap-2">
            {expenses.map((expense) => {
              const split = expenseSplit(expense, rate);
              return (
                <li
                  key={expense.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-stone/15 bg-charcoal/30 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-bone">
                      {expense.supplier ?? EXPENSE_CATEGORY_LABELS[expense.category]}
                    </span>
                    <span className="text-xs text-stone">
                      {longDate(expense.spent_on)} ·{" "}
                      {EXPENSE_CATEGORY_LABELS[expense.category]}
                      {expense.description ? ` · ${expense.description}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm text-bone tabular-nums">
                      {moneyExact(split.incGst)}
                    </span>
                    <span className="text-[0.65rem] text-stone">
                      {moneyExact(split.gst)} GST
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </>
  );
}
