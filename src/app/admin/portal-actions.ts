"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  BOOKING_STATUSES,
  CALENDAR_OVERRIDES,
  EXPENSE_CATEGORIES,
  PAYMENT_KINDS,
  PORTAL_JOB_STATUSES,
  QUOTE_STATUSES,
  type BookingStatus,
  type CalendarOverride,
  type ExpenseCategory,
  type PaymentKind,
  type PortalJobStatus,
  type QuoteStatus,
} from "@/lib/supabase/portal-types";
import { gstFromExclusive, gstFromInclusive, round2 } from "@/lib/admin/money";
import { getSettings } from "@/lib/admin/data";

/**
 * Every write the portal makes.
 *
 * ── The shape of each one ───────────────────────────────────────────────────
 * Resolve the admin session, validate the input against a closed vocabulary,
 * write, revalidate. No action trusts a string that arrived in a FormData: a
 * status is checked against its enum, money is parsed and bounded, and an id
 * that is not a UUID never reaches a query.
 *
 * These run as the signed-in user, not the service role, so row level security
 * is evaluated on every statement. An action that forgot its session check
 * would still be refused by Postgres.
 *
 * ── Availability ────────────────────────────────────────────────────────────
 * Nothing in this file reserves or releases a date, because nothing stores
 * them. Moving, shortening or cancelling a job changes the job row, and the
 * calendars recompute from it. That is the whole mechanism.
 */

export type Result = { error?: string; ok?: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const text = (form: FormData, key: string): string =>
  String(form.get(key) ?? "").trim();

/** Empty string means "clear this field", not "zero". */
function optionalText(form: FormData, key: string): string | null {
  const value = text(form, key);
  return value === "" ? null : value;
}

function optionalDate(form: FormData, key: string): string | null {
  const value = text(form, key);
  if (value === "") return null;
  return ISO_DATE.test(value) ? value : null;
}

/** Parses money. Rejects nonsense rather than silently storing NaN. */
function optionalMoney(form: FormData, key: string): number | null {
  const raw = text(form, key).replace(/[$,\s]/g, "");
  if (raw === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 100_000_000) return null;
  return round2(value);
}

async function session() {
  const admin = await getAdminSession();
  if (!admin) return null;
  const supabase = await createServerSupabase();
  return supabase ? { supabase, admin } : null;
}

/* ================================ quotes ================================= */

export async function updateQuote(
  _prev: Result,
  form: FormData,
): Promise<Result> {
  const ctx = await session();
  if (!ctx) return { error: "Not authorised." };

  const id = text(form, "id");
  if (!UUID.test(id)) return { error: "Missing quote." };

  const status = text(form, "status") as QuoteStatus;
  if (!QUOTE_STATUSES.includes(status)) return { error: "Unknown status." };

  const { error } = await ctx.supabase
    .from("quote_requests")
    .update({
      status,
      name: text(form, "name") || undefined,
      phone: text(form, "phone") || undefined,
      email: text(form, "email") || undefined,
      suburb: text(form, "suburb") || undefined,
      estimated_price: optionalMoney(form, "estimated_price"),
      quoted_price: optionalMoney(form, "quoted_price"),
      price_includes_gst: form.get("price_includes_gst") === "on",
      material_allowance: optionalMoney(form, "material_allowance"),
      labour_allowance: optionalMoney(form, "labour_allowance"),
      internal_notes: optionalText(form, "internal_notes"),
      site_visit_on: optionalDate(form, "site_visit_on"),
      quote_sent_on: optionalDate(form, "quote_sent_on"),
      decided_on: optionalDate(form, "decided_on"),
    })
    .eq("id", id);

  if (error) return { error: "Couldn't save that quote." };

  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Turns an accepted quote into a job.
 *
 * The quote is never deleted and never emptied — it is the record of what the
 * customer actually asked for, in their words. It is marked `converted` and
 * pointed at the job it became, so the trail runs both ways.
 *
 * Everything the customer already told us is carried across rather than
 * retyped: name, phone, email, suburb, service and the description. A quoted
 * price is stored on the job GST-exclusive whichever way it was entered, so
 * every downstream figure has one unambiguous basis.
 */
export async function convertQuoteToJob(
  _prev: Result,
  form: FormData,
): Promise<Result> {
  const ctx = await session();
  if (!ctx) return { error: "Not authorised." };

  const id = text(form, "id");
  if (!UUID.test(id)) return { error: "Missing quote." };

  const startsOn = optionalDate(form, "starts_on");
  const endsOn = optionalDate(form, "ends_on") ?? startsOn;
  if (!startsOn || !endsOn) return { error: "Give the job a start date." };
  if (endsOn < startsOn) return { error: "The finish date is before the start." };

  const { data: quote, error: readError } = await ctx.supabase
    .from("quote_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readError || !quote) return { error: "Couldn't find that quote." };
  if (quote.converted_job_id) {
    return { error: "That quote has already been converted." };
  }

  const settings = await getSettings();
  const rate = settings.gst_registered ? settings.gst_rate : 0;

  // Whatever was entered, store the job value excluding GST.
  const quoted = quote.quoted_price ?? quote.estimated_price ?? null;
  const valueExGst =
    quoted === null
      ? null
      : quote.price_includes_gst
        ? round2(quoted - gstFromInclusive(quoted, rate))
        : round2(quoted);
  const gstAmount =
    valueExGst === null ? null : gstFromExclusive(valueExGst, rate);

  // One customer record per person, reused when we already know them.
  let customerId = quote.customer_id;
  if (!customerId) {
    const { data: existing } = await ctx.supabase
      .from("customers")
      .select("id")
      .eq("email", quote.email)
      .maybeSingle();

    if (existing?.id) {
      customerId = existing.id;
    } else {
      const { data: created } = await ctx.supabase
        .from("customers")
        .insert({
          name: quote.name,
          phone: quote.phone,
          email: quote.email,
          suburb: quote.suburb,
        })
        .select("id")
        .maybeSingle();
      customerId = created?.id ?? null;
    }
  }

  const { data: job, error: insertError } = await ctx.supabase
    .from("jobs")
    .insert({
      customer_id: customerId,
      customer_name: quote.name,
      customer_phone: quote.phone,
      customer_email: quote.email,
      suburb: quote.suburb,
      postcode: quote.postcode,
      address: optionalText(form, "address"),
      starts_on: startsOn,
      ends_on: endsOn,
      job_type: quote.service,
      description: quote.description,
      status: "booked",
      value_ex_gst: valueExGst,
      gst_amount: gstAmount,
      deposit_required:
        valueExGst === null
          ? null
          : round2(
              (valueExGst + (gstAmount ?? 0)) * settings.default_deposit_pct,
            ),
      materials_cost: quote.material_allowance,
      labour_cost: quote.labour_allowance,
      quote_request_id: quote.id,
      created_by: ctx.admin.userId,
    })
    .select("id")
    .maybeSingle();

  if (insertError || !job) return { error: "Couldn't create the job." };

  await ctx.supabase
    .from("quote_requests")
    .update({
      status: "converted",
      converted_job_id: job.id,
      customer_id: customerId,
      decided_on: quote.decided_on ?? startsOn,
    })
    .eq("id", id);

  revalidatePath("/admin/quotes");
  revalidatePath("/admin/jobs");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  return { ok: true };
}

/* ================================= jobs ================================== */

export async function saveJob(_prev: Result, form: FormData): Promise<Result> {
  const ctx = await session();
  if (!ctx) return { error: "Not authorised." };

  const id = text(form, "id");
  const status = text(form, "status") as PortalJobStatus;
  if (!PORTAL_JOB_STATUSES.includes(status)) return { error: "Unknown status." };

  const startsOn = optionalDate(form, "starts_on");
  const endsOn = optionalDate(form, "ends_on") ?? startsOn;
  if (!startsOn || !endsOn) return { error: "Give the job a start date." };
  if (endsOn < startsOn) return { error: "The finish date is before the start." };

  const actualFinish = optionalDate(form, "actual_finish_on");
  if (actualFinish && actualFinish < startsOn) {
    return { error: "The actual finish is before the job started." };
  }

  const settings = await getSettings();
  const rate = settings.gst_registered ? settings.gst_rate : 0;
  const valueExGst = optionalMoney(form, "value_ex_gst");

  const payload = {
    customer_name: text(form, "customer_name"),
    customer_phone: optionalText(form, "customer_phone"),
    customer_email: optionalText(form, "customer_email"),
    suburb: text(form, "suburb"),
    postcode: optionalText(form, "postcode"),
    address: optionalText(form, "address"),
    starts_on: startsOn,
    ends_on: endsOn,
    // The single line that releases dates. Recording an early finish frees the
    // days after it; recording a late one takes the extra days. Nothing else
    // has to happen.
    actual_finish_on: actualFinish,
    start_time: optionalText(form, "start_time"),
    end_time: optionalText(form, "end_time"),
    job_type: optionalText(form, "job_type"),
    description: optionalText(form, "description"),
    notes: optionalText(form, "notes"),
    status,
    value_ex_gst: valueExGst,
    gst_amount: valueExGst === null ? null : gstFromExclusive(valueExGst, rate),
    deposit_required: optionalMoney(form, "deposit_required"),
    materials_cost: optionalMoney(form, "materials_cost"),
    labour_cost: optionalMoney(form, "labour_cost"),
    other_costs: optionalMoney(form, "other_costs"),
    invoice_reference: optionalText(form, "invoice_reference"),
  };

  if (!payload.customer_name || !payload.suburb) {
    return { error: "A job needs a customer name and a suburb." };
  }

  if (UUID.test(id)) {
    const { error } = await ctx.supabase.from("jobs").update(payload).eq("id", id);
    if (error) return { error: "Couldn't save that job." };
  } else {
    const { error } = await ctx.supabase
      .from("jobs")
      .insert({ ...payload, created_by: ctx.admin.userId });
    if (error) return { error: "Couldn't create that job." };
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  if (UUID.test(id)) revalidatePath(`/admin/jobs/${id}`);
  return { ok: true };
}

export async function addJobNote(
  _prev: Result,
  form: FormData,
): Promise<Result> {
  const ctx = await session();
  if (!ctx) return { error: "Not authorised." };

  const jobId = text(form, "job_id");
  const body = text(form, "body");
  if (!UUID.test(jobId)) return { error: "Missing job." };
  if (!body) return { error: "Write something first." };
  if (body.length > 8000) return { error: "That note is too long." };

  const { error } = await ctx.supabase.from("job_notes").insert({
    job_id: jobId,
    body,
    author_email: ctx.admin.email,
  });
  if (error) return { error: "Couldn't save that note." };

  revalidatePath(`/admin/jobs/${jobId}`);
  return { ok: true };
}

/* =============================== payments ================================ */

export async function recordPayment(
  _prev: Result,
  form: FormData,
): Promise<Result> {
  const ctx = await session();
  if (!ctx) return { error: "Not authorised." };

  const jobId = text(form, "job_id");
  if (!UUID.test(jobId)) return { error: "Missing job." };

  const amount = optionalMoney(form, "amount_inc_gst");
  if (amount === null || amount <= 0) return { error: "Enter an amount." };

  const kind = text(form, "kind") as PaymentKind;
  if (!PAYMENT_KINDS.includes(kind)) return { error: "Unknown payment type." };

  const { error } = await ctx.supabase.from("payments").insert({
    job_id: jobId,
    kind,
    // Recorded as banked, GST inclusive — what the statement shows. The split
    // is derived at report time from the rate in settings, so changing the
    // rate never rewrites history.
    amount_inc_gst: amount,
    received_on: optionalDate(form, "received_on") ?? undefined,
    method: optionalText(form, "method"),
    reference: optionalText(form, "reference"),
  });
  if (error) return { error: "Couldn't record that payment." };

  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  return { ok: true };
}

/* =============================== expenses ================================ */

export async function saveExpense(
  _prev: Result,
  form: FormData,
): Promise<Result> {
  const ctx = await session();
  if (!ctx) return { error: "Not authorised." };

  const amount = optionalMoney(form, "amount");
  if (amount === null || amount <= 0) return { error: "Enter an amount." };

  const category = text(form, "category") as ExpenseCategory;
  if (!EXPENSE_CATEGORIES.includes(category)) {
    return { error: "Unknown category." };
  }

  const jobId = text(form, "job_id");

  const { error } = await ctx.supabase.from("expenses").insert({
    spent_on: optionalDate(form, "spent_on") ?? undefined,
    supplier: optionalText(form, "supplier"),
    category,
    description: optionalText(form, "description"),
    amount,
    gst_included: form.get("gst_included") === "on",
    // Left null unless the receipt states a figure — see `expenseSplit`.
    gst_amount: optionalMoney(form, "gst_amount"),
    job_id: UUID.test(jobId) ? jobId : null,
    notes: optionalText(form, "notes"),
    created_by: ctx.admin.userId,
  });
  if (error) return { error: "Couldn't save that expense." };

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/finance");
  return { ok: true };
}

export async function deleteExpense(
  _prev: Result,
  form: FormData,
): Promise<Result> {
  const ctx = await session();
  if (!ctx) return { error: "Not authorised." };
  const id = text(form, "id");
  if (!UUID.test(id)) return { error: "Missing expense." };

  const { error } = await ctx.supabase.from("expenses").delete().eq("id", id);
  if (error) return { error: "Couldn't remove that expense." };

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/finance");
  return { ok: true };
}

/* =========================== calendar overrides ========================== */

/**
 * The admin's word on a day.
 *
 * One ruling per day — setting a day twice replaces the previous ruling rather
 * than stacking two contradictory ones, which the unique index enforces.
 * Choosing "clear" removes the ruling and hands the day back to whatever the
 * jobs imply.
 */
export async function setCalendarDay(
  _prev: Result,
  form: FormData,
): Promise<Result> {
  const ctx = await session();
  if (!ctx) return { error: "Not authorised." };

  const day = optionalDate(form, "day");
  if (!day) return { error: "Pick a date." };

  const kind = text(form, "kind");

  if (kind === "clear") {
    const { error } = await ctx.supabase
      .from("calendar_blocks")
      .delete()
      .eq("day", day);
    if (error) return { error: "Couldn't clear that day." };
  } else {
    if (!CALENDAR_OVERRIDES.includes(kind as CalendarOverride)) {
      return { error: "Unknown setting." };
    }
    const { error } = await ctx.supabase.from("calendar_blocks").upsert(
      {
        day,
        kind: kind as CalendarOverride,
        note: optionalText(form, "note"),
        created_by: ctx.admin.userId,
      },
      { onConflict: "day" },
    );
    if (error) return { error: "Couldn't set that day." };
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  return { ok: true };
}

/* ============================ booking requests =========================== */

export async function updateBooking(
  _prev: Result,
  form: FormData,
): Promise<Result> {
  const ctx = await session();
  if (!ctx) return { error: "Not authorised." };

  const id = text(form, "id");
  if (!UUID.test(id)) return { error: "Missing request." };

  const status = text(form, "status") as BookingStatus;
  if (!BOOKING_STATUSES.includes(status)) return { error: "Unknown status." };

  const { error } = await ctx.supabase
    .from("booking_requests")
    .update({
      status,
      offered_date: optionalDate(form, "offered_date"),
      admin_notes: optionalText(form, "admin_notes"),
    })
    .eq("id", id);
  if (error) return { error: "Couldn't update that request." };

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Approves a request and puts it in the diary.
 *
 * This is the only path from a customer choosing a date to that date being
 * held, and it runs behind the admin login. That is the whole reason the
 * public calendar creates a *request* rather than a booking: two customers can
 * ask for the same Tuesday, and only one of them can have it.
 */
export async function approveBooking(
  _prev: Result,
  form: FormData,
): Promise<Result> {
  const ctx = await session();
  if (!ctx) return { error: "Not authorised." };

  const id = text(form, "id");
  if (!UUID.test(id)) return { error: "Missing request." };

  const { data: request, error: readError } = await ctx.supabase
    .from("booking_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readError || !request) return { error: "Couldn't find that request." };
  if (request.job_id) return { error: "That request is already in the diary." };

  const startsOn = optionalDate(form, "starts_on") ?? request.requested_date;
  const endsOn = optionalDate(form, "ends_on") ?? startsOn;
  if (endsOn < startsOn) return { error: "The finish date is before the start." };

  let customerId = request.customer_id;
  if (!customerId) {
    const { data: existing } = await ctx.supabase
      .from("customers")
      .select("id")
      .eq("email", request.email)
      .maybeSingle();
    customerId = existing?.id ?? null;
    if (!customerId) {
      const { data: created } = await ctx.supabase
        .from("customers")
        .insert({
          name: request.name,
          phone: request.phone,
          email: request.email,
          suburb: request.suburb,
        })
        .select("id")
        .maybeSingle();
      customerId = created?.id ?? null;
    }
  }

  const { data: job, error: insertError } = await ctx.supabase
    .from("jobs")
    .insert({
      customer_id: customerId,
      customer_name: request.name,
      customer_phone: request.phone,
      customer_email: request.email,
      suburb: request.suburb,
      starts_on: startsOn,
      ends_on: endsOn,
      job_type: request.service,
      description: request.message,
      // Tentative, not confirmed: approving the date is agreeing to hold it,
      // not agreeing a price. It occupies the calendar either way.
      status: "tentative",
      booking_request_id: request.id,
      quote_request_id: request.quote_request_id,
      created_by: ctx.admin.userId,
    })
    .select("id")
    .maybeSingle();

  if (insertError || !job) return { error: "Couldn't create the job." };

  await ctx.supabase
    .from("booking_requests")
    .update({ status: "converted", job_id: job.id, customer_id: customerId })
    .eq("id", id);

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/jobs");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  return { ok: true };
}

/* =============================== customers =============================== */

export async function saveCustomer(
  _prev: Result,
  form: FormData,
): Promise<Result> {
  const ctx = await session();
  if (!ctx) return { error: "Not authorised." };

  const id = text(form, "id");
  const name = text(form, "name");
  if (!name) return { error: "A customer needs a name." };

  const payload = {
    name,
    phone: optionalText(form, "phone"),
    email: optionalText(form, "email"),
    suburb: optionalText(form, "suburb"),
    address: optionalText(form, "address"),
    notes: optionalText(form, "notes"),
  };

  if (UUID.test(id)) {
    const { error } = await ctx.supabase
      .from("customers")
      .update(payload)
      .eq("id", id);
    if (error) return { error: "Couldn't save that customer." };
    revalidatePath(`/admin/customers/${id}`);
  } else {
    const { error } = await ctx.supabase.from("customers").insert(payload);
    if (error) return { error: "Couldn't create that customer." };
  }

  revalidatePath("/admin/customers");
  return { ok: true };
}

/* =============================== settings ================================ */

/** Percentages arrive as "10" and are stored as 0.1. */
function rateFrom(form: FormData, key: string, fallback: number): number {
  const raw = text(form, key).replace("%", "");
  if (raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value >= 100) return fallback;
  return round2(value) / 100;
}

export async function saveSettings(
  _prev: Result,
  form: FormData,
): Promise<Result> {
  const ctx = await session();
  if (!ctx) return { error: "Not authorised." };

  const current = await getSettings();

  const capacity = Number(text(form, "daily_capacity"));
  const fyMonth = Number(text(form, "financial_year_start_month"));
  const workingDays = form
    .getAll("working_days")
    .map((value) => Number(value))
    .filter((day) => day >= 1 && day <= 7);

  const emails = text(form, "notification_emails")
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter((value) => value.includes("@"));

  const { error } = await ctx.supabase
    .from("business_settings")
    .update({
      business_name: text(form, "business_name") || current.business_name,
      abn: optionalText(form, "abn"),
      phone: optionalText(form, "phone"),
      email: optionalText(form, "email"),
      gst_registered: form.get("gst_registered") === "on",
      gst_rate: rateFrom(form, "gst_rate", current.gst_rate),
      income_tax_rate: rateFrom(form, "income_tax_rate", current.income_tax_rate),
      financial_year_start_month:
        fyMonth >= 1 && fyMonth <= 12
          ? fyMonth
          : current.financial_year_start_month,
      prices_include_gst: form.get("prices_include_gst") === "on",
      default_deposit_pct: rateFrom(
        form,
        "default_deposit_pct",
        current.default_deposit_pct,
      ),
      working_days: workingDays.length > 0 ? workingDays : current.working_days,
      working_hours_start: text(form, "working_hours_start") || current.working_hours_start,
      working_hours_end: text(form, "working_hours_end") || current.working_hours_end,
      daily_capacity:
        capacity >= 1 && capacity <= 20 ? capacity : current.daily_capacity,
      notification_emails: emails,
    })
    .eq("id", 1);

  if (error) return { error: "Couldn't save those settings." };

  // Capacity and the working week change what the public calendar shows.
  revalidatePath("/admin/settings");
  revalidatePath("/admin/calendar");
  revalidatePath("/quote");
  return { ok: true };
}
