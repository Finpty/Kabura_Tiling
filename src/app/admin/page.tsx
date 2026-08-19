import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getAdminSession } from "@/lib/admin-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  type EnquiryStatus,
  type QuoteRequest,
} from "@/lib/supabase/types";
import { QUOTE_SERVICE_OPTIONS } from "@/lib/services";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const serviceLabel = (value: string) =>
  QUOTE_SERVICE_OPTIONS.find((option) => option.value === value)?.label ?? value;

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const supabase = await createServerSupabase();
  const { data, error } = await supabase!
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  const enquiries = (data ?? []) as QuoteRequest[];

  const byStatus = Object.fromEntries(
    ENQUIRY_STATUSES.map((status) => [
      status,
      enquiries.filter((enquiry) => enquiry.status === status),
    ]),
  ) as Record<EnquiryStatus, QuoteRequest[]>;

  return (
    <AdminShell email={session.email}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-[-0.03em] text-bone md:text-4xl">
            Enquiries
          </h1>
          <p className="mt-2 text-sm text-stone">
            {enquiries.length} total · newest first
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-8 text-sm text-bronze-light">
          Couldn&rsquo;t load enquiries. Check that the migration has been
          applied and that your user id is in <code>admin_users</code>.
        </p>
      ) : null}

      {/* Pipeline */}
      <div className="no-scrollbar mt-10 flex gap-4 overflow-x-auto pb-4">
        {ENQUIRY_STATUSES.map((status) => {
          const items = byStatus[status];
          return (
            <section
              key={status}
              aria-labelledby={`col-${status}`}
              className="flex w-[19rem] shrink-0 flex-col rounded-sm border border-stone/18 bg-charcoal"
            >
              <div className="flex items-center justify-between gap-3 border-b border-stone/18 px-4 py-3.5">
                <h2
                  id={`col-${status}`}
                  className="text-[0.72rem] font-semibold tracking-[0.14em] text-bone uppercase"
                >
                  {ENQUIRY_STATUS_LABELS[status]}
                </h2>
                <span className="rounded-full bg-ink px-2.5 py-1 text-[0.68rem] text-stone tabular-nums">
                  {items.length}
                </span>
              </div>

              <ul className="flex flex-1 flex-col gap-px bg-stone/10">
                {items.length === 0 ? (
                  <li className="bg-charcoal px-4 py-8 text-center text-xs text-stone">
                    Nothing here
                  </li>
                ) : (
                  items.map((enquiry) => (
                    <li key={enquiry.id} className="bg-charcoal">
                      <Link
                        href={`/admin/enquiries/${enquiry.id}`}
                        className="block px-4 py-4 transition-colors hover:bg-ink"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-medium text-bone">
                            {enquiry.name}
                          </span>
                          <span className="shrink-0 text-[0.66rem] text-stone tabular-nums">
                            {formatDate(enquiry.created_at)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-sand/70">
                          {serviceLabel(enquiry.service)} · {enquiry.suburb}
                        </p>
                        <p className="mt-2 text-[0.66rem] text-stone tabular-nums">
                          {enquiry.reference}
                        </p>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Full table */}
      <section aria-labelledby="all-enquiries" className="mt-14">
        <h2
          id="all-enquiries"
          className="text-[0.72rem] font-semibold tracking-[0.14em] text-bone uppercase"
        >
          All enquiries
        </h2>

        <div className="mt-5 overflow-x-auto rounded-sm border border-stone/18">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <caption className="sr-only">
              All quote enquiries, newest first
            </caption>
            <thead>
              <tr className="border-b border-stone/18 bg-charcoal text-left">
                <th scope="col" className="px-4 py-3 font-medium text-stone-light">Reference</th>
                <th scope="col" className="px-4 py-3 font-medium text-stone-light">Name</th>
                <th scope="col" className="px-4 py-3 font-medium text-stone-light">Service</th>
                <th scope="col" className="px-4 py-3 font-medium text-stone-light">Suburb</th>
                <th scope="col" className="px-4 py-3 font-medium text-stone-light">Received</th>
                <th scope="col" className="px-4 py-3 font-medium text-stone-light">Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-stone">
                    No enquiries yet. They will appear here as soon as the quote
                    form is submitted.
                  </td>
                </tr>
              ) : (
                enquiries.map((enquiry) => (
                  <tr
                    key={enquiry.id}
                    className="border-b border-stone/12 last:border-b-0 hover:bg-charcoal"
                  >
                    <td className="px-4 py-3 text-stone tabular-nums">
                      <Link
                        href={`/admin/enquiries/${enquiry.id}`}
                        className="link-underline text-bone"
                      >
                        {enquiry.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-bone">{enquiry.name}</td>
                    <td className="px-4 py-3 text-sand/80">
                      {serviceLabel(enquiry.service)}
                    </td>
                    <td className="px-4 py-3 text-sand/80">{enquiry.suburb}</td>
                    <td className="px-4 py-3 text-stone tabular-nums">
                      {formatDate(enquiry.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={enquiry.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
