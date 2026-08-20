import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getBookings } from "@/lib/admin/data";
import { longDate } from "@/lib/admin/dates";
import { BOOKING_STATUS_LABELS } from "@/lib/supabase/portal-types";
import { BookingActions } from "@/components/admin/BookingActions";
import { Empty, PageHeader, Pill, Section } from "@/components/admin/ui";

export const metadata = { title: "Booking requests", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Dates customers have asked for.
 *
 * Nothing on this page is a booking. A request holds no dates and blocks no
 * calendar until it is approved, which is what stops two customers being told
 * the same Tuesday is theirs.
 */
export default async function BookingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const bookings = await getBookings(200);
  const open = bookings.filter(
    (booking) => booking.status === "new" || booking.status === "reviewing",
  );
  const rest = bookings.filter((booking) => !open.includes(booking));

  return (
    <>
      <PageHeader
        title="Booking requests"
        subtitle={`${open.length} awaiting a decision`}
      />

      {[
        { title: "Awaiting you", list: open },
        { title: "Handled", list: rest },
      ].map(({ title, list }) => (
        <Section key={title} title={title}>
          {list.length === 0 ? (
            <Empty>Nothing here.</Empty>
          ) : (
            <div className="grid gap-4">
              {list.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-xl border border-stone/15 bg-charcoal/25 p-4 md:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-bone">{booking.name}</span>
                        <span className="text-[0.65rem] text-stone tabular-nums">
                          {booking.reference}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-sand/75">
                        Asked for {longDate(booking.requested_date)}
                        {booking.service ? ` · ${booking.service}` : ""} ·{" "}
                        {booking.suburb}
                      </p>
                      <p className="mt-1 text-xs text-stone">
                        {booking.phone} · {booking.email}
                        {booking.approx_size ? ` · ${booking.approx_size}` : ""}
                      </p>
                      {booking.message ? (
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sand/70">
                          {booking.message}
                        </p>
                      ) : null}
                    </div>
                    <Pill
                      tone={
                        booking.status === "new"
                          ? "warn"
                          : booking.status === "converted"
                            ? "live"
                            : "neutral"
                      }
                    >
                      {BOOKING_STATUS_LABELS[booking.status]}
                    </Pill>
                  </div>

                  <div className="mt-4">
                    <BookingActions booking={booking} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      ))}
    </>
  );
}
