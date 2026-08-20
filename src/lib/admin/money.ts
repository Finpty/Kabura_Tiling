import type {
  BusinessSettingsRow,
  ExpenseRow,
  PaymentRow,
  PaymentState,
  PortalJobRow,
} from "@/lib/supabase/portal-types";

/**
 * Australian GST, profit and tax arithmetic.
 *
 * ⚠️  EVERY FIGURE THIS FILE PRODUCES IS A MANAGEMENT ESTIMATE. It is here so
 * the business can see roughly where it stands between BAS periods. It is not
 * an accounting system, it does not know about deductions, entity eligibility,
 * capital purchases, private-use apportionment or anything else an accountant
 * adjusts, and no figure from it should be lodged anywhere without one.
 *
 * ── The one rule that keeps this honest ─────────────────────────────────────
 * GST COLLECTED IS NOT INCOME. It is money held on behalf of the ATO and paid
 * out at BAS. Nothing here adds it to revenue or to profit, and every function
 * that returns a total says which side of GST it is on in its name.
 *
 * ── Rates ───────────────────────────────────────────────────────────────────
 * Nothing hard-codes 10%. The rate is read from business_settings on every
 * call, so an accountant can change it without a deployment and every figure
 * follows.
 */

/** Cents, so a chain of divisions cannot drift into fractions of a cent. */
export const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * The GST inside a GST-inclusive amount.
 *
 *   gst = total × rate / (1 + rate)
 *
 * At 10% that is the familiar one eleventh: $11,000 inclusive holds $1,000 of
 * GST and $10,000 of income.
 */
export function gstFromInclusive(total: number, rate: number): number {
  if (!Number.isFinite(total) || rate <= 0) return 0;
  return round2((total * rate) / (1 + rate));
}

/** The GST added to a GST-exclusive amount. */
export function gstFromExclusive(subtotal: number, rate: number): number {
  if (!Number.isFinite(subtotal) || rate <= 0) return 0;
  return round2(subtotal * rate);
}

/** Strips GST out of an inclusive amount. */
export function exclusiveOf(total: number, rate: number): number {
  return round2(total - gstFromInclusive(total, rate));
}

/** Adds GST onto an exclusive amount. */
export function inclusiveOf(subtotal: number, rate: number): number {
  return round2(subtotal + gstFromExclusive(subtotal, rate));
}

/**
 * Splits an amount three ways, whichever side of GST it was entered on.
 *
 * Returned together rather than separately because these three numbers are
 * only ever meaningful side by side — showing a total without saying which of
 * the three it is has caused more confusion in small business than any other
 * single thing about GST.
 */
export type GstSplit = {
  exGst: number;
  gst: number;
  incGst: number;
};

export function splitGst(
  amount: number,
  { rate, inclusive }: { rate: number; inclusive: boolean },
): GstSplit {
  if (!Number.isFinite(amount) || amount === 0 || rate <= 0) {
    const flat = round2(Number.isFinite(amount) ? amount : 0);
    return { exGst: flat, gst: 0, incGst: flat };
  }
  if (inclusive) {
    const gst = gstFromInclusive(amount, rate);
    return { exGst: round2(amount - gst), gst, incGst: round2(amount) };
  }
  const gst = gstFromExclusive(amount, rate);
  return { exGst: round2(amount), gst, incGst: round2(amount + gst) };
}

/* ============================== per-job maths ============================= */

export type JobMoney = {
  /** Revenue excluding GST — the only figure that is income. */
  revenueExGst: number;
  /** Held for the ATO. Never counted as revenue or profit. */
  gstOnSale: number;
  revenueIncGst: number;
  materials: number;
  labour: number;
  other: number;
  costs: number;
  /** Revenue excluding GST, less costs. */
  grossProfit: number;
  /** Gross profit as a share of revenue excluding GST, or null with no revenue. */
  margin: number | null;
  depositRequired: number;
  received: number;
  outstanding: number;
};

/**
 * Everything money-shaped about one job.
 *
 * Costs are treated as GST-exclusive: a registered business claims the GST on
 * its purchases back, so the GST paid on materials is not a cost of the job —
 * it is a credit, and it is accounted for on the BAS side rather than here.
 * Where a cost was entered GST-inclusive the expense record carries that flag
 * and `expenseSplit` handles it.
 */
export function jobMoney(
  job: Pick<
    PortalJobRow,
    | "value_ex_gst"
    | "gst_amount"
    | "materials_cost"
    | "labour_cost"
    | "other_costs"
    | "deposit_required"
  >,
  payments: Pick<PaymentRow, "amount_inc_gst">[],
  settings: Pick<BusinessSettingsRow, "gst_rate" | "gst_registered">,
): JobMoney {
  const rate = settings.gst_registered ? settings.gst_rate : 0;

  const revenueExGst = round2(job.value_ex_gst ?? 0);
  const gstOnSale = round2(
    job.gst_amount ?? gstFromExclusive(revenueExGst, rate),
  );
  const revenueIncGst = round2(revenueExGst + gstOnSale);

  const materials = round2(job.materials_cost ?? 0);
  const labour = round2(job.labour_cost ?? 0);
  const other = round2(job.other_costs ?? 0);
  const costs = round2(materials + labour + other);

  const grossProfit = round2(revenueExGst - costs);
  const margin = revenueExGst > 0 ? grossProfit / revenueExGst : null;

  const received = round2(
    payments.reduce((sum, p) => sum + Number(p.amount_inc_gst ?? 0), 0),
  );

  return {
    revenueExGst,
    gstOnSale,
    revenueIncGst,
    materials,
    labour,
    other,
    costs,
    grossProfit,
    margin,
    depositRequired: round2(job.deposit_required ?? 0),
    received,
    outstanding: round2(Math.max(0, revenueIncGst - received)),
  };
}

/**
 * Where a job stands on payment.
 *
 * Derived rather than stored: a stored status drifts the moment a payment is
 * recorded and nobody remembers to change it.
 */
export function paymentState(
  money: JobMoney,
  job: Pick<PortalJobRow, "invoice_reference" | "ends_on" | "status">,
  today = new Date(),
): PaymentState {
  if (money.revenueIncGst <= 0) return "not_invoiced";
  if (money.outstanding <= 0) return "paid";

  const invoiced = Boolean(job.invoice_reference);
  const finished = job.status === "completed";
  const endedDaysAgo =
    (today.getTime() - new Date(`${job.ends_on}T00:00:00`).getTime()) /
    86_400_000;

  // Overdue is a judgement about a finished, invoiced job that has not been
  // paid a fortnight later — deliberately conservative, because chasing a
  // customer who is not actually late costs more than the reminder saves.
  if (invoiced && finished && endedDaysAgo > 14) return "overdue";
  if (money.received > 0) return "partially_paid";
  if (money.depositRequired > 0) return "deposit_due";
  return invoiced ? "partially_paid" : "not_invoiced";
}

/* ================================ expenses =============================== */

/**
 * The GST inside an expense.
 *
 * `gst_amount` on the row wins when it is set, because a receipt sometimes
 * states a GST figure that is not exactly one eleventh — mixed GST-free items,
 * rounding — and the receipt is the evidence. Only when it is absent is the
 * figure derived.
 */
export function expenseSplit(
  expense: Pick<ExpenseRow, "amount" | "gst_included" | "gst_amount">,
  rate: number,
): GstSplit {
  const amount = round2(Number(expense.amount ?? 0));
  if (expense.gst_amount !== null && expense.gst_amount !== undefined) {
    const gst = round2(Number(expense.gst_amount));
    return expense.gst_included
      ? { exGst: round2(amount - gst), gst, incGst: amount }
      : { exGst: amount, gst, incGst: round2(amount + gst) };
  }
  return splitGst(amount, { rate, inclusive: expense.gst_included });
}

/* ================================== BAS ================================== */

export type BasSummary = {
  /** G1-ish: total sales including GST over the period. */
  salesIncGst: number;
  /** 1A: GST collected on sales. */
  gstOnSales: number;
  /** 1B: GST paid on purchases, claimable as a credit. */
  gstOnPurchases: number;
  /** Positive = owed to the ATO. Negative = refundable. */
  netGst: number;
  salesExGst: number;
  expensesExGst: number;
};

/**
 * An estimated GST position for a period.
 *
 * Sales are counted from payments actually received, not from invoices issued:
 * that is cash-basis GST, which is what most small trade businesses report on.
 * A business on an accruals basis should read these figures as indicative only
 * — one more reason every screen showing them says "estimate".
 */
export function basSummary(
  payments: Pick<PaymentRow, "amount_inc_gst">[],
  expenses: Pick<ExpenseRow, "amount" | "gst_included" | "gst_amount">[],
  settings: Pick<BusinessSettingsRow, "gst_rate" | "gst_registered">,
): BasSummary {
  const rate = settings.gst_registered ? settings.gst_rate : 0;

  const salesIncGst = round2(
    payments.reduce((sum, p) => sum + Number(p.amount_inc_gst ?? 0), 0),
  );
  const gstOnSales = gstFromInclusive(salesIncGst, rate);

  let gstOnPurchases = 0;
  let expensesExGst = 0;
  for (const expense of expenses) {
    const split = expenseSplit(expense, rate);
    gstOnPurchases = round2(gstOnPurchases + split.gst);
    expensesExGst = round2(expensesExGst + split.exGst);
  }

  return {
    salesIncGst,
    gstOnSales,
    gstOnPurchases,
    netGst: round2(gstOnSales - gstOnPurchases),
    salesExGst: round2(salesIncGst - gstOnSales),
    expensesExGst,
  };
}

/* =============================== income tax ============================== */

export type TaxEstimate = {
  revenueExGst: number;
  expensesExGst: number;
  taxableProfit: number;
  rate: number;
  provision: number;
};

/**
 * A rough tax provision — profit before tax times the configured rate.
 *
 * The rate is whatever the accountant put in settings. Nothing here assumes a
 * company rate, a small-business rate, or that the entity is a company at all,
 * because getting that wrong in either direction is worse than not guessing.
 */
export function taxEstimate(
  revenueExGst: number,
  expensesExGst: number,
  settings: Pick<BusinessSettingsRow, "income_tax_rate">,
): TaxEstimate {
  const taxableProfit = round2(revenueExGst - expensesExGst);
  const rate = settings.income_tax_rate ?? 0;
  return {
    revenueExGst: round2(revenueExGst),
    expensesExGst: round2(expensesExGst),
    taxableProfit,
    rate,
    provision: round2(Math.max(0, taxableProfit) * rate),
  };
}

/* =============================== formatting ============================== */

const AUD = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const AUD_EXACT = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Whole dollars — for headline figures, where cents are noise. */
export const money = (value: number | null | undefined): string =>
  AUD.format(Number.isFinite(Number(value)) ? Number(value) : 0);

/** To the cent — for anything an accountant might reconcile. */
export const moneyExact = (value: number | null | undefined): string =>
  AUD_EXACT.format(Number.isFinite(Number(value)) ? Number(value) : 0);

export const percent = (fraction: number | null | undefined): string =>
  fraction === null || fraction === undefined || !Number.isFinite(fraction)
    ? "—"
    : `${(fraction * 100).toFixed(1)}%`;

/** The sentence that belongs under every tax figure on every screen. */
export const ESTIMATE_NOTICE =
  "Estimate only — confirm with your accountant or bookkeeper.";
