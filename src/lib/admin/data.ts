import "server-only";

import { cache } from "react";
import { getAdminSession } from "@/lib/admin-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  SETTINGS_FALLBACK,
  type BookingRequestRow,
  type BusinessSettingsRow,
  type CalendarBlockRow,
  type CustomerRow,
  type ExpenseRow,
  type JobAssignmentRow,
  type JobNoteRow,
  type PaymentRow,
  type PortalJobRow,
  type QuoteCommercials,
} from "@/lib/supabase/portal-types";
import type { QuoteRequest } from "@/lib/supabase/types";
import { addDays, todayISO, type ISODate } from "./dates";

/**
 * Every read the private portal makes.
 *
 * ── The rule this file exists to enforce ────────────────────────────────────
 * NOTHING HERE RUNS WITHOUT AN ADMIN SESSION. Each function starts by
 * resolving one and returns an empty result if there is none. That is belt to
 * RLS's braces: Postgres would refuse these rows anyway, because every policy
 * on every table requires `private.is_admin()`. Two independent locks, and the
 * database one is the one that actually holds.
 *
 * The service-role key is deliberately not used anywhere in this file. These
 * queries run as the signed-in user, so RLS is evaluated against them on every
 * row — a bug in this code cannot hand out data the database would not have
 * given that person directly.
 *
 * `cache()` deduplicates within a single request: a dashboard that shows jobs
 * in four places issues one query, not four.
 */

/** Guard. Returns the client only for a signed-in member of the allow-list. */
async function adminClient() {
  const session = await getAdminSession();
  if (!session) return null;
  const supabase = await createServerSupabase();
  return supabase ? { supabase, session } : null;
}

/* =============================== settings ================================ */

export const getSettings = cache(async (): Promise<BusinessSettingsRow> => {
  const ctx = await adminClient();
  if (!ctx) return SETTINGS_FALLBACK;

  const { data, error } = await ctx.supabase
    .from("business_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  // The fallback is never written back — it exists so a missing settings row
  // shows sensible numbers rather than dividing by undefined.
  if (error || !data) return SETTINGS_FALLBACK;
  return { ...SETTINGS_FALLBACK, ...data };
});

/* ================================= jobs ================================== */

export type JobWithMoney = PortalJobRow & { payments: PaymentRow[] };

/** Jobs overlapping a window, with the payments recorded against them. */
export const getJobs = cache(
  async (from: ISODate, to: ISODate): Promise<JobWithMoney[]> => {
    const ctx = await adminClient();
    if (!ctx) return [];

    // Overlap, not containment: a job that started last month and finishes
    // next week is on this week's calendar and must not be missed.
    const { data, error } = await ctx.supabase
      .from("jobs")
      .select("*")
      .lte("starts_on", to)
      .gte("ends_on", from)
      .order("starts_on", { ascending: true });

    if (error || !data) return [];
    const jobs = data as PortalJobRow[];
    if (jobs.length === 0) return [];

    const { data: payments } = await ctx.supabase
      .from("payments")
      .select("*")
      .in(
        "job_id",
        jobs.map((job) => job.id),
      );

    const byJob = new Map<string, PaymentRow[]>();
    for (const payment of (payments ?? []) as PaymentRow[]) {
      if (!payment.job_id) continue;
      const list = byJob.get(payment.job_id) ?? [];
      list.push(payment);
      byJob.set(payment.job_id, list);
    }

    return jobs.map((job) => ({ ...job, payments: byJob.get(job.id) ?? [] }));
  },
);

export const getJob = cache(
  async (
    id: string,
  ): Promise<{
    job: PortalJobRow;
    payments: PaymentRow[];
    notes: JobNoteRow[];
    expenses: ExpenseRow[];
    assignments: JobAssignmentRow[];
  } | null> => {
    const ctx = await adminClient();
    if (!ctx) return null;

    const { data: job, error } = await ctx.supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !job) return null;

    const [{ data: payments }, { data: notes }, { data: expenses }, { data: assignments }] =
      await Promise.all([
        ctx.supabase
          .from("payments")
          .select("*")
          .eq("job_id", id)
          .order("received_on", { ascending: false }),
        ctx.supabase
          .from("job_notes")
          .select("*")
          .eq("job_id", id)
          .order("created_at", { ascending: false }),
        ctx.supabase
          .from("expenses")
          .select("*")
          .eq("job_id", id)
          .order("spent_on", { ascending: false }),
        ctx.supabase
          .from("job_assignments")
          .select("*")
          .eq("job_id", id)
          .order("created_at", { ascending: true }),
      ]);

    return {
      job: job as PortalJobRow,
      payments: (payments ?? []) as PaymentRow[],
      notes: (notes ?? []) as JobNoteRow[],
      expenses: (expenses ?? []) as ExpenseRow[],
      assignments: (assignments ?? []) as JobAssignmentRow[],
    };
  },
);

/** Every job that is not cancelled, for availability and gap finding. */
export const getScheduleJobs = cache(
  async (from: ISODate, to: ISODate): Promise<PortalJobRow[]> => {
    const ctx = await adminClient();
    if (!ctx) return [];
    const { data, error } = await ctx.supabase
      .from("jobs")
      .select(
        "id,starts_on,ends_on,actual_finish_on,status,customer_name,suburb,job_type",
      )
      .neq("status", "cancelled")
      .lte("starts_on", to)
      .gte("ends_on", from)
      .order("starts_on", { ascending: true });
    if (error || !data) return [];
    return data as PortalJobRow[];
  },
);

/* ============================ calendar blocks ============================ */

export const getCalendarBlocks = cache(
  async (from: ISODate, to: ISODate): Promise<CalendarBlockRow[]> => {
    const ctx = await adminClient();
    if (!ctx) return [];
    const { data, error } = await ctx.supabase
      .from("calendar_blocks")
      .select("*")
      .gte("day", from)
      .lte("day", to)
      .order("day", { ascending: true });
    if (error || !data) return [];
    return data as CalendarBlockRow[];
  },
);

/** Blocks as a lookup, which is what every availability call actually wants. */
export async function getBlockMap(
  from: ISODate,
  to: ISODate,
): Promise<Map<ISODate, CalendarBlockRow["kind"]>> {
  const blocks = await getCalendarBlocks(from, to);
  return new Map(blocks.map((block) => [block.day, block.kind]));
}

/* ================================ quotes ================================= */

export type QuoteRow = QuoteRequest & QuoteCommercials;

export const getQuotes = cache(async (limit = 200): Promise<QuoteRow[]> => {
  const ctx = await adminClient();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as QuoteRow[];
});

export const getQuote = cache(async (id: string): Promise<QuoteRow | null> => {
  const ctx = await adminClient();
  if (!ctx) return null;
  const { data, error } = await ctx.supabase
    .from("quote_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as QuoteRow;
});

/* ============================ booking requests =========================== */

export const getBookings = cache(
  async (limit = 200): Promise<BookingRequestRow[]> => {
    const ctx = await adminClient();
    if (!ctx) return [];
    const { data, error } = await ctx.supabase
      .from("booking_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as BookingRequestRow[];
  },
);

export const getBooking = cache(
  async (id: string): Promise<BookingRequestRow | null> => {
    const ctx = await adminClient();
    if (!ctx) return null;
    const { data, error } = await ctx.supabase
      .from("booking_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as BookingRequestRow;
  },
);

/* ================================ money ================================== */

export const getPayments = cache(
  async (from: ISODate, to: ISODate): Promise<PaymentRow[]> => {
    const ctx = await adminClient();
    if (!ctx) return [];
    const { data, error } = await ctx.supabase
      .from("payments")
      .select("*")
      .gte("received_on", from)
      .lte("received_on", to)
      .order("received_on", { ascending: false });
    if (error || !data) return [];
    return data as PaymentRow[];
  },
);

export const getExpenses = cache(
  async (from: ISODate, to: ISODate): Promise<ExpenseRow[]> => {
    const ctx = await adminClient();
    if (!ctx) return [];
    const { data, error } = await ctx.supabase
      .from("expenses")
      .select("*")
      .gte("spent_on", from)
      .lte("spent_on", to)
      .order("spent_on", { ascending: false });
    if (error || !data) return [];
    return data as ExpenseRow[];
  },
);

/* =============================== customers =============================== */

export const getCustomers = cache(
  async (search = "", limit = 100): Promise<CustomerRow[]> => {
    const ctx = await adminClient();
    if (!ctx) return [];

    let query = ctx.supabase.from("customers").select("*");
    if (search.trim()) {
      // Escape the wildcards so a customer searching for "100%" does not match
      // everything.
      const term = search.trim().replace(/[%_]/g, "\\$&");
      query = query.or(
        `name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,suburb.ilike.%${term}%`,
      );
    }

    const { data, error } = await query
      .order("name", { ascending: true })
      .limit(limit);
    if (error || !data) return [];
    return data as CustomerRow[];
  },
);

export const getCustomer = cache(
  async (
    id: string,
  ): Promise<{
    customer: CustomerRow;
    jobs: PortalJobRow[];
    quotes: QuoteRow[];
    payments: PaymentRow[];
  } | null> => {
    const ctx = await adminClient();
    if (!ctx) return null;

    const { data: customer, error } = await ctx.supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !customer) return null;

    const [{ data: jobs }, { data: quotes }] = await Promise.all([
      ctx.supabase
        .from("jobs")
        .select("*")
        .eq("customer_id", id)
        .order("starts_on", { ascending: false }),
      ctx.supabase
        .from("quote_requests")
        .select("*")
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
    ]);

    const jobRows = (jobs ?? []) as PortalJobRow[];
    let payments: PaymentRow[] = [];
    if (jobRows.length > 0) {
      const { data } = await ctx.supabase
        .from("payments")
        .select("*")
        .in(
          "job_id",
          jobRows.map((job) => job.id),
        );
      payments = (data ?? []) as PaymentRow[];
    }

    return {
      customer: customer as CustomerRow,
      jobs: jobRows,
      quotes: (quotes ?? []) as QuoteRow[],
      payments,
    };
  },
);

/* ============================== dashboard ================================ */

/**
 * Everything the dashboard needs, in one place.
 *
 * Assembled here rather than in the page so the page stays a layout and the
 * window each query covers is written down once.
 */
export async function getDashboardData() {
  const today = todayISO();
  const [settings, jobs, quotes, bookings] = await Promise.all([
    getSettings(),
    getJobs(addDays(today, -14), addDays(today, 60)),
    getQuotes(100),
    getBookings(50),
  ]);
  const blocks = await getBlockMap(today, addDays(today, 90));
  return { today, settings, jobs, quotes, bookings, blocks };
}
