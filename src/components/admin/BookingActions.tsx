"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  approveBooking,
  updateBooking,
  type Result,
} from "@/app/admin/portal-actions";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  type BookingRequestRow,
} from "@/lib/supabase/portal-types";

const FIELD =
  "w-full rounded-lg border border-stone/25 bg-charcoal px-3.5 py-2.5 text-sm text-bone placeholder:text-stone focus:border-bronze-light focus:outline-none";
const LABEL = "block text-[0.62rem] tracking-[0.14em] text-stone uppercase";

function Go({ children, primary }: { children: string; primary?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        primary
          ? "h-11 rounded-full bg-bronze px-6 text-[0.68rem] font-semibold tracking-[0.14em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink disabled:opacity-50"
          : "h-11 rounded-full border border-stone/30 px-6 text-[0.68rem] font-semibold tracking-[0.14em] text-sand uppercase transition-colors hover:border-bronze-light hover:text-bronze-light disabled:opacity-50"
      }
    >
      {pending ? "Working…" : children}
    </button>
  );
}

/**
 * Approving is the only path from "a customer asked" to "the diary holds it".
 *
 * That gap is the whole point of the public calendar creating a request rather
 * than a booking: two people can ask for the same Tuesday, and only one of
 * them can have it. Approving here creates a tentative job, which occupies the
 * dates immediately and takes them off the public calendar.
 */
export function BookingActions({ booking }: { booking: BookingRequestRow }) {
  const [approveState, approve] = useActionState<Result, FormData>(
    approveBooking,
    {},
  );
  const [updateState, update] = useActionState<Result, FormData>(
    updateBooking,
    {},
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {!booking.job_id ? (
        <form action={approve} className="flex flex-col gap-3 rounded-xl border border-bronze/30 bg-bronze/[0.05] p-4">
          <input type="hidden" name="id" value={booking.id} />
          <p className="text-[0.68rem] tracking-[0.14em] text-bronze-light uppercase">
            Approve and book
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Start</span>
              <input
                name="starts_on"
                type="date"
                defaultValue={booking.requested_date}
                className={FIELD}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Finish</span>
              <input
                name="ends_on"
                type="date"
                defaultValue={booking.requested_date}
                className={FIELD}
              />
            </label>
          </div>
          <p className="text-[0.68rem] leading-relaxed text-stone">
            Creates a tentative job for {booking.name}. Those dates come off the
            public calendar straight away.
          </p>
          <div>
            <Go primary>Approve and create job</Go>
          </div>
          {approveState.error ? (
            <p role="alert" className="text-sm text-bronze-light">
              {approveState.error}
            </p>
          ) : null}
        </form>
      ) : null}

      <form action={update} className="flex flex-col gap-3 rounded-xl border border-stone/15 bg-charcoal/30 p-4">
        <input type="hidden" name="id" value={booking.id} />
        <p className="text-[0.68rem] tracking-[0.14em] text-stone-light uppercase">
          Or just update it
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Status</span>
            <select name="status" defaultValue={booking.status} className={FIELD}>
              {BOOKING_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {BOOKING_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Offer another date</span>
            <input
              name="offered_date"
              type="date"
              defaultValue={booking.offered_date ?? undefined}
              className={FIELD}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Private notes</span>
          <textarea
            name="admin_notes"
            rows={2}
            defaultValue={booking.admin_notes ?? ""}
            className={FIELD}
          />
        </label>
        <div>
          <Go>Save</Go>
        </div>
        {updateState.error ? (
          <p role="alert" className="text-sm text-bronze-light">
            {updateState.error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
