import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getCustomers } from "@/lib/admin/data";
import { Empty, PageHeader, RowLink, Section } from "@/components/admin/ui";

export const metadata = { title: "Customers", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Customer records.
 *
 * Built up automatically: converting a quote or approving a booking creates
 * the record if we do not already have one for that email, so the list fills
 * itself from real work rather than from data entry.
 */
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { q = "" } = await searchParams;
  const customers = await getCustomers(q, 200);

  return (
    <>
      <PageHeader title="Customers" subtitle={`${customers.length} shown`} />

      <Section title="Find">
        <form className="flex flex-col gap-3 sm:flex-row" action="/admin/customers">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Name, phone, email or suburb"
            className="min-w-0 flex-1 rounded-lg border border-stone/25 bg-charcoal px-4 py-3 text-sm text-bone placeholder:text-stone focus:border-bronze-light focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg border border-stone/30 px-5 py-3 text-[0.7rem] font-semibold tracking-[0.14em] text-sand uppercase transition-colors hover:border-bronze-light hover:text-bronze-light"
          >
            Search
          </button>
        </form>
      </Section>

      <Section title="Records">
        {customers.length === 0 ? (
          <Empty>
            No customers yet. They are created automatically when a quote is
            converted or a booking request is approved.
          </Empty>
        ) : (
          <div className="grid gap-2">
            {customers.map((customer) => (
              <RowLink key={customer.id} href={`/admin/customers/${customer.id}`}>
                <p className="truncate font-medium text-bone">{customer.name}</p>
                <p className="mt-0.5 truncate text-sm text-sand/70">
                  {[customer.suburb, customer.phone, customer.email]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </RowLink>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
