import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getCustomer, getSettings } from "@/lib/admin/data";
import { dateRange, longDate } from "@/lib/admin/dates";
import { jobMoney, money } from "@/lib/admin/money";
import {
  JOB_STATUS_LABELS_FULL,
  normaliseQuoteStatus,
  QUOTE_STATUS_LABELS,
} from "@/lib/supabase/portal-types";
import { Empty, PageHeader, RowLink, Section, Stat } from "@/components/admin/ui";

export const metadata = { title: "Customer", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [data, settings] = await Promise.all([getCustomer(id), getSettings()]);
  if (!data) notFound();

  const { customer, jobs, quotes, payments } = data;

  const byJob = new Map<string, typeof payments>();
  for (const payment of payments) {
    if (!payment.job_id) continue;
    byJob.set(payment.job_id, [...(byJob.get(payment.job_id) ?? []), payment]);
  }

  const totals = jobs.reduce(
    (acc, job) => {
      const m = jobMoney(job, byJob.get(job.id) ?? [], settings);
      acc.invoiced += m.revenueIncGst;
      acc.paid += m.received;
      acc.outstanding += m.outstanding;
      return acc;
    },
    { invoiced: 0, paid: 0, outstanding: 0 },
  );

  return (
    <>
      <PageHeader
        title={customer.name}
        subtitle={[customer.suburb, customer.phone, customer.email]
          .filter(Boolean)
          .join(" · ")}
      />

      <Section title="Total">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Invoiced (incl GST)" value={money(totals.invoiced)} />
          <Stat label="Paid" value={money(totals.paid)} tone="good" />
          <Stat
            label="Outstanding"
            value={money(totals.outstanding)}
            tone={totals.outstanding > 0 ? "warn" : "muted"}
          />
        </div>
      </Section>

      <Section title={`Jobs — ${jobs.length}`}>
        {jobs.length === 0 ? (
          <Empty>No jobs yet.</Empty>
        ) : (
          <div className="grid gap-2">
            {jobs.map((job) => (
              <RowLink key={job.id} href={`/admin/jobs/${job.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-bone">
                      {job.job_type ?? "Tiling"} · {job.suburb}
                    </span>
                    <span className="text-xs text-stone">
                      {dateRange(job.starts_on, job.actual_finish_on ?? job.ends_on)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-stone">
                    {JOB_STATUS_LABELS_FULL[job.status]}
                  </span>
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Quotes — ${quotes.length}`}>
        {quotes.length === 0 ? (
          <Empty>No quotes on file.</Empty>
        ) : (
          <div className="grid gap-2">
            {quotes.map((quote) => (
              <RowLink key={quote.id} href={`/admin/quotes/${quote.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-bone">
                      {quote.service} · {quote.reference}
                    </span>
                    <span className="text-xs text-stone">
                      {longDate(quote.created_at.slice(0, 10))}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-stone">
                    {QUOTE_STATUS_LABELS[normaliseQuoteStatus(quote.status)]}
                  </span>
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </Section>

      {customer.notes ? (
        <Section title="Notes">
          <p className="rounded-xl border border-stone/15 bg-charcoal/30 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-sand/80">
            {customer.notes}
          </p>
        </Section>
      ) : null}

      <Section title="">
        <Link href="/admin/customers" className="text-xs text-stone hover:text-sand">
          ← All customers
        </Link>
      </Section>
    </>
  );
}
