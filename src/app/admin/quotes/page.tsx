import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getQuotes, getSettings } from "@/lib/admin/data";
import { longDate } from "@/lib/admin/dates";
import { money } from "@/lib/admin/money";
import {
  OPEN_QUOTE_STATUSES,
  QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  normaliseQuoteStatus,
} from "@/lib/supabase/portal-types";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Empty, PageHeader, RowLink, Section } from "@/components/admin/ui";

export const metadata = { title: "Quotes", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Every quote request, searchable and filterable.
 *
 * Search runs here rather than in the database: the whole list is already
 * loaded for the counts along the top, and a business doing tens of quotes a
 * month will not have enough of them for a round trip to beat a filter.
 */
export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { q = "", status = "" } = await searchParams;
  const [quotes, settings] = await Promise.all([getQuotes(300), getSettings()]);

  const term = q.trim().toLowerCase();
  const filtered = quotes.filter((quote) => {
    const current = normaliseQuoteStatus(quote.status);
    if (status === "open" && !OPEN_QUOTE_STATUSES.includes(current)) return false;
    if (status && status !== "open" && current !== status) return false;
    if (!term) return true;
    return [
      quote.reference,
      quote.name,
      quote.phone,
      quote.email,
      quote.suburb,
      quote.service,
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(term));
  });

  const openCount = quotes.filter((quote) =>
    OPEN_QUOTE_STATUSES.includes(normaliseQuoteStatus(quote.status)),
  ).length;

  return (
    <>
      <PageHeader
        title="Quotes"
        subtitle={`${quotes.length} in total · ${openCount} still open`}
      />

      <Section title="Find">
        <form className="flex flex-col gap-3 sm:flex-row" action="/admin/quotes">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Name, phone, email, suburb or reference"
            className="min-w-0 flex-1 rounded-lg border border-stone/25 bg-charcoal px-4 py-3 text-sm text-bone placeholder:text-stone focus:border-bronze-light focus:outline-none"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-stone/25 bg-charcoal px-4 py-3 text-sm text-bone focus:border-bronze-light focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="open">Open only</option>
            {QUOTE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {QUOTE_STATUS_LABELS[value]}
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
          <Empty>Nothing matches that.</Empty>
        ) : (
          <div className="grid gap-2">
            {filtered.map((quote) => {
              const price = quote.quoted_price ?? quote.estimated_price;
              return (
                <RowLink key={quote.id} href={`/admin/quotes/${quote.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-bone">
                          {quote.name}
                        </span>
                        <span className="text-[0.65rem] text-stone tabular-nums">
                          {quote.reference}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-sm text-sand/70">
                        {quote.service} · {quote.suburb}
                      </p>
                      <p className="mt-1 text-xs text-stone">
                        {longDate(quote.created_at.slice(0, 10))}
                        {quote.preferred_start_date
                          ? ` · asked for ${longDate(quote.preferred_start_date)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {price ? (
                        <span className="text-sm text-bone tabular-nums">
                          {money(price)}
                          <span className="ml-1 text-[0.6rem] text-stone">
                            {quote.price_includes_gst ? "inc" : "ex"} GST
                          </span>
                        </span>
                      ) : null}
                      <StatusBadge status={quote.status} />
                    </div>
                  </div>
                </RowLink>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Note">
        <p className="text-xs leading-relaxed text-stone">
          Prices are stored exactly as entered and flagged inclusive or
          exclusive. Converting a quote to a job stores the value excluding GST
          at the rate in{" "}
          <Link href="/admin/settings" className="text-bronze-light">
            settings
          </Link>{" "}
          ({(settings.gst_rate * 100).toFixed(1)}%), so every figure downstream
          has one unambiguous basis.
        </p>
      </Section>
    </>
  );
}
