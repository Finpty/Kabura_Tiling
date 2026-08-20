"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setCalendarDay, type Result } from "@/app/admin/portal-actions";
import {
  CALENDAR_OVERRIDES,
  CALENDAR_OVERRIDE_LABELS,
  type CalendarOverride,
} from "@/lib/supabase/portal-types";

/**
 * The admin's manual word on one day.
 *
 * These rulings beat what the diary implies, in both directions: "Open for
 * bookings" makes a day available even with work on it — the admin knows
 * something the schedule does not — and "Blocked out" takes a day off the
 * public calendar even with nothing booked. "Clear" removes the ruling and
 * hands the day back to the jobs.
 */
export function DayOverride({
  day,
  current,
}: {
  day: string;
  current?: CalendarOverride | null;
}) {
  const [state, action] = useActionState<Result, FormData>(setCalendarDay, {});
  const { pending } = useFormStatus();

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="day" value={day} />
      <label className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="block text-[0.62rem] tracking-[0.14em] text-stone uppercase">
          Set this day
        </span>
        <select
          name="kind"
          defaultValue={current ?? "clear"}
          className="w-full rounded-lg border border-stone/25 bg-charcoal px-3.5 py-3 text-sm text-bone focus:border-bronze-light focus:outline-none"
        >
          <option value="clear">Clear — follow the diary</option>
          {CALENDAR_OVERRIDES.map((kind) => (
            <option key={kind} value={kind}>
              {CALENDAR_OVERRIDE_LABELS[kind]}
            </option>
          ))}
        </select>
      </label>
      <input
        name="note"
        placeholder="Note (optional)"
        className="min-w-0 flex-1 rounded-lg border border-stone/25 bg-charcoal px-3.5 py-3 text-sm text-bone placeholder:text-stone focus:border-bronze-light focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-full border border-stone/30 px-6 text-[0.68rem] font-semibold tracking-[0.14em] text-sand uppercase transition-colors hover:border-bronze-light hover:text-bronze-light disabled:opacity-50"
      >
        Apply
      </button>
      {state.error ? (
        <p role="alert" className="w-full text-sm text-bronze-light">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
