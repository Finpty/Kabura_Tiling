import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A customer asking for a date.
 *
 * ── This never books anything ───────────────────────────────────────────────
 * It writes a row to `booking_requests` and stops. No job is created, no date
 * is held, and the public calendar does not change. An admin approves it in
 * the portal, and only that creates a job — which is what stops two customers
 * being told the same Tuesday is theirs.
 *
 * ── What the caller can learn ───────────────────────────────────────────────
 * The reference of their own request, and nothing else. `booking_requests` has
 * an INSERT policy for `anon` and no SELECT policy at all, so a request cannot
 * be read back, listed or altered once submitted — not even by the person who
 * sent it. Every response below is deliberately identical in shape whether or
 * not the date was a good one.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX = { name: 120, phone: 40, email: 200, suburb: 120, message: 4000 };

const clean = (value: unknown, limit: number): string =>
  typeof value === "string" ? value.trim().slice(0, limit) : "";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const name = clean(body.name, MAX.name);
  const phone = clean(body.phone, MAX.phone);
  const email = clean(body.email, MAX.email);
  const suburb = clean(body.suburb, MAX.suburb);
  const requestedDate = clean(body.requestedDate, 10);

  if (!name || !phone || !email.includes("@") || !suburb) {
    return NextResponse.json(
      { error: "Please fill in your name, phone, email and suburb." },
      { status: 400 },
    );
  }
  if (!ISO_DATE.test(requestedDate)) {
    return NextResponse.json({ error: "Pick a date." }, { status: 400 });
  }

  // A date in the past, or beyond any sensible horizon, is a bug or a probe.
  const today = new Date().toISOString().slice(0, 10);
  if (requestedDate < today) {
    return NextResponse.json(
      { error: "That date has already passed." },
      { status: 400 },
    );
  }

  const payload = {
    name,
    phone,
    email,
    suburb,
    requested_date: requestedDate,
    service: clean(body.service, 80) || null,
    approx_size: clean(body.approxSize, 80) || null,
    message: clean(body.message, MAX.message) || null,
    quote_reference: clean(body.quoteReference, 60) || null,
    source_path: clean(body.sourcePath, 200) || null,
  };

  // The anon client is enough: the INSERT policy permits exactly this and
  // nothing more. The service-role client is only a fallback for a deployment
  // that has not run the migration yet, and it writes the same row.
  const anon = await createServerSupabase();
  const client = anon ?? createAdminClient();
  if (!client) {
    return NextResponse.json(
      { error: "Requests are not available right now." },
      { status: 503 },
    );
  }

  const { data, error } = await client
    .from("booking_requests")
    .insert(payload)
    .select("reference")
    .maybeSingle();

  if (error) {
    console.error("Booking request failed", error.message);
    return NextResponse.json(
      { error: "That didn't send. Please call us instead." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, reference: data?.reference ?? null });
}
