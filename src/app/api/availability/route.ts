import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/availability";
import { fromISODate, MAX_BOOKING_MONTHS, toISODate } from "@/lib/quote-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Day-level availability for the public calendar.
 *
 * Returns `{ "2026-09-04": "limited", … }` and nothing else. There is no path
 * from here to a customer name, an address or a job — the underlying database
 * function aggregates before it returns, and the private `jobs` table has no
 * policy that would let an unauthenticated request read it in the first place.
 *
 * The window is clamped here and again in the database, so a crafted `from`/`to`
 * cannot be used to sweep the diary.
 */

const MAX_SPAN_DAYS = 400;

function clampWindow(fromRaw: string | null, toRaw: string | null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const horizon = new Date(today);
  horizon.setMonth(horizon.getMonth() + MAX_BOOKING_MONTHS + 1);

  let from = (fromRaw && fromISODate(fromRaw)) || today;
  if (from < today) from = today;
  if (from > horizon) from = horizon;

  const fallbackTo = new Date(from);
  fallbackTo.setMonth(fallbackTo.getMonth() + 2);

  let to = (toRaw && fromISODate(toRaw)) || fallbackTo;
  if (to < from) to = from;
  if (to > horizon) to = horizon;

  const span = new Date(from);
  span.setDate(span.getDate() + MAX_SPAN_DAYS);
  if (to > span) to = span;

  return { from, to };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const { from, to } = clampWindow(params.get("from"), params.get("to"));

  const days = await getAvailability(from, to);

  return NextResponse.json(
    { from: toISODate(from), to: toISODate(to), days },
    {
      headers: {
        // Short enough that a day filling up shows quickly, long enough that a
        // visitor paging through months does not hit the database every click.
        "Cache-Control": "private, max-age=60",
      },
    },
  );
}
