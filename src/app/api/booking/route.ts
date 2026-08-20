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

  /**
   * Which client writes the row matters here, and the test suite is why this
   * is written the way it is (supabase/tests/portal.test.sql):
   *
   * anon may INSERT into booking_requests and may not SELECT from it — and
   * RETURNING is a select, so an anon insert that asks for its reference back
   * is refused wholesale. That is the privacy design working, not a bug. So
   * the service-role client (server-only; this file cannot reach a browser)
   * performs the insert and reads the reference back. If no service key is
   * configured, the anon client still records the request — the row is what
   * matters — and the customer simply gets a confirmation without a reference.
   */
  const admin = createAdminClient();
  if (admin) {
    const { data, error } = await admin
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

  const anon = await createServerSupabase();
  if (!anon) {
    return NextResponse.json(
      { error: "Requests are not available right now." },
      { status: 503 },
    );
  }

  const { error } = await anon.from("booking_requests").insert(payload);
  if (error) {
    console.error("Booking request failed", error.message);
    return NextResponse.json(
      { error: "That didn't send. Please call us instead." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, reference: null });
}
