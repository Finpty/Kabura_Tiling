import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getJob, getSettings } from "@/lib/admin/data";
import { dateRange, longDate } from "@/lib/admin/dates";
import {
  ESTIMATE_NOTICE,
  expenseSplit,
  jobMoney,
  money,
  moneyExact,
  paymentState,
  percent,
} from "@/lib/admin/money";
import {
  EXPENSE_CATEGORY_LABELS,
  JOB_STATUS_LABELS_FULL,
  PAYMENT_KIND_LABELS,
  PAYMENT_STATE_LABELS,
} from "@/lib/supabase/portal-types";
import { JobEditor } from "@/components/admin/JobEditor";
import { JobNoteForm, PaymentForm } from "@/components/admin/JobMoneyForms";
import { CrewList } from "@/components/admin/CrewList";
import {
  Card,
  Empty,
  EstimateNote,
  PageHeader,
  Pill,
  Section,
  Stat,
} from "@/components/admin/ui";

export const metadata = { title: "Job", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * One job: the schedule, the money and the paper trail.
 *
 * The profit block is the point of the page. Revenue excluding GST, less what
 * the job cost, is the number that tells you whether the work was worth doing
 * — and it is the number a business most often gets wrong, by starting from a
 * GST-inclusive figure.
 */
export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [data, settings] = await Promise.all([getJob(id), getSettings()]);
  if (!data) notFound();

  const { job, payments, notes, expenses, assignments } = data;
  const m = jobMoney(job, payments, settings);
  const state = paymentState(m, job);
  const rate = settings.gst_registered ? settings.gst_rate : 0;

  const jobExpenses = expenses.reduce(
    (sum, expense) => sum + expenseSplit(expense, rate).exGst,
    0,
  );

  return (
    <>
      <PageHeader
        title={job.customer_name}
        subtitle={`${job.job_type ?? "Tiling"} · ${job.suburb} · ${dateRange(
          job.starts_on,
          job.actual_finish_on ?? job.ends_on,
        )}`}
        action={
          <Pill tone={job.status === "in_progress" ? "live" : "neutral"}>
            {JOB_STATUS_LABELS_FULL[job.status]}
          </Pill>
        }
      />

      <Section title="Money">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Revenue (excl GST)" value={money(m.revenueExGst)} tone="good" />
          <Stat
            label="GST on sale"
            value={money(m.gstOnSale)}
            hint="Held for the ATO"
            tone="warn"
          />
          <Stat label="Invoiced (incl GST)" value={money(m.revenueIncGst)} />
          <Stat
            label="Outstanding"
            value={money(m.outstanding)}
            hint={PAYMENT_STATE_LABELS[state]}
            tone={m.outstanding > 0 ? "warn" : "good"}
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Materials" value={money(m.materials)} tone="muted" />
          <Stat label="Labour" value={money(m.labour)} tone="muted" />
          <Stat
            label="Other costs"
            value={money(m.other + jobExpenses)}
            hint={
              jobExpenses > 0
                ? `Includes ${money(jobExpenses)} of recorded expenses`
                : undefined
            }
            tone="muted"
          />
          <Stat
            label="Estimated gross profit"
            value={money(m.grossProfit - jobExpenses)}
            hint={`Margin ${percent(
              m.revenueExGst > 0
                ? (m.grossProfit - jobExpenses) / m.revenueExGst
                : null,
            )}`}
            tone={m.grossProfit - jobExpenses >= 0 ? "good" : "warn"}
          />
        </div>
        <EstimateNote>
          Revenue excluding GST, less costs. {ESTIMATE_NOTICE}
        </EstimateNote>
      </Section>

      <Section title="Payments">
        <Card>
          <PaymentForm jobId={job.id} />
        </Card>
        {payments.length === 0 ? (
          <div className="mt-3">
            <Empty>Nothing received yet.</Empty>
          </div>
        ) : (
          <ul className="mt-3 grid gap-2">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-stone/15 bg-charcoal/30 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block text-sm text-bone">
                    {PAYMENT_KIND_LABELS[payment.kind]}
                  </span>
                  <span className="text-xs text-stone">
                    {longDate(payment.received_on)}
                    {payment.method ? ` · ${payment.method}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-bone tabular-nums">
                  {moneyExact(payment.amount_inc_gst)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {expenses.length > 0 ? (
        <Section title="Expenses on this job">
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
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm text-bone tabular-nums">
                      {moneyExact(split.exGst)}
                    </span>
                    <span className="text-[0.65rem] text-stone">
                      excl GST · {moneyExact(split.gst)} credit
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      <Section title="On the job">
        <Card>
          <CrewList jobId={job.id} assignments={assignments} />
        </Card>
      </Section>

      <Section title="Notes">
        <Card>
          <JobNoteForm jobId={job.id} />
        </Card>
        {notes.length === 0 ? null : (
          <ul className="mt-3 grid gap-2">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-lg border border-stone/15 bg-charcoal/30 px-4 py-3"
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-sand/85">
                  {note.body}
                </p>
                <p className="mt-2 text-[0.65rem] text-stone">
                  {note.author_email ?? "Staff"} ·{" "}
                  {longDate(note.created_at.slice(0, 10))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Edit"
        action={
          job.quote_request_id ? (
            <Link
              href={`/admin/quotes/${job.quote_request_id}`}
              className="text-xs text-bronze-light"
            >
              Original quote →
            </Link>
          ) : null
        }
      >
        <JobEditor job={job} />
      </Section>
    </>
  );
}
