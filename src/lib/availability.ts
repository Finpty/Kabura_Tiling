import "server-only";

import { createServerSupabase } from "./supabase/server";
import {
  AVAILABILITY_STATUSES,
  type AvailabilityDay,
  type AvailabilityStatus,
} from "./supabase/types";
import { toISODate } from "./quote-schema";

/**
 * Public availability.
 *
 * Reads `public.service_availability`, the SECURITY DEFINER function that is
 * the calendar's entire public surface. It returns a date and one of
 * available / limited / booked — it cannot return a customer name, an address
 * or a job, because those columns are not in its result type. The private
 * `jobs` table is never queried from anywhere the public can reach.
 *
 * With Supabase unconfigured, or the migration not yet applied, this returns an
 * empty map. The calendar then treats every day as open and simply says so,
 * which is the honest fallback: an unknown diary is not a full one.
 */

export type AvailabilityMap = Record<string, AvailabilityStatus>;

const isStatus = (value: unknown): value is AvailabilityStatus =>
  typeof value === "string" &&
  (AVAILABILITY_STATUSES as readonly string[]).includes(value);

export async function getAvailability(
  from: Date,
  to: Date,
): Promise<AvailabilityMap> {
  const supabase = await createServerSupabase();
  if (!supabase) return {};

  const { data, error } = await supabase.rpc("service_availability", {
    from_date: toISODate(from),
    to_date: toISODate(to),
  });

  if (error) {
    // Most likely the migration has not been applied yet. The calendar still
    // works — every day reads as open — so this is a log, not a failure.
    console.error("availability lookup failed", error.message);
    return {};
  }

  const map: AvailabilityMap = {};
  for (const row of (data ?? []) as AvailabilityDay[]) {
    if (typeof row?.day === "string" && isStatus(row.status)) {
      // Postgres `date` arrives as `YYYY-MM-DD`; keep only that much.
      map[row.day.slice(0, 10)] = row.status;
    }
  }
  return map;
}
