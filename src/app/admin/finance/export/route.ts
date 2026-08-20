import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getExpenses, getPayments, getSettings } from "@/lib/admin/data";
import { basQuarter, financialYear, todayISO } from "@/lib/admin/dates";
import { basSummary, expenseSplit, gstFromInclusive } from "@/lib/admin/money";
import {
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_KIND_LABELS,
} from "@/lib/supabase/portal-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * BAS working papers as CSV — the file to email the bookkeeper.
 *
 * Admin-only: the session check below is the gate for the response, and the
 * reads underneath run as the signed-in user, so RLS would return nothing to
 * anyone else even if this check were somehow skipped.
 *
 * Three sections in one file: the summary (the numbers a BAS asks about),
 * then every payment and every expense that produced them, so the totals can
 * be audited line by line rather than taken on faith. Every figure is labelled
 * an estimate — this is a working paper, not a lodgement.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** RFC 4180: quote when needed, double internal quotes. */
const cell = (value: unknown): string => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const row = (...values: unknown[]): string => values.map(cell).join(",");

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const settings = await getSettings();
  const params = new URL(request.url).searchParams;
  const today = todayISO();

  // ?period=fy | quarter, or explicit ?from=&to= — clamped to sane ISO dates.
  let period =
    params.get("period") === "fy"
      ? financialYear(today, settings)
      : basQuarter(today);
  const from = params.get("from");
  const to = params.get("to");
  if (from && to && ISO_DATE.test(from) && ISO_DATE.test(to) && from <= to) {
    period = { from, to, label: `${from} to ${to}` };
  }

  const [payments, expenses] = await Promise.all([
    getPayments(period.from, period.to),
    getExpenses(period.from, period.to),
  ]);
  const rate = settings.gst_registered ? settings.gst_rate : 0;
  const bas = basSummary(payments, expenses, settings);

  const lines: string[] = [
    row(`Kabura Tiling Group — BAS working paper (ESTIMATE ONLY)`),
    row(`Period`, period.label, `${period.from} to ${period.to}`),
    row(`GST rate`, `${(rate * 100).toFixed(2)}%`, settings.gst_registered ? "registered" : "not registered"),
    row(`Basis`, "Cash — payments as banked, expenses as recorded"),
    row(),
    row("SUMMARY"),
    row("Total sales incl GST (G1)", bas.salesIncGst.toFixed(2)),
    row("GST on sales (1A)", bas.gstOnSales.toFixed(2)),
    row("GST credits on purchases (1B)", bas.gstOnPurchases.toFixed(2)),
    row(
      bas.netGst >= 0 ? "Estimated GST payable" : "Estimated GST refundable",
      Math.abs(bas.netGst).toFixed(2),
    ),
    row("Sales excl GST", bas.salesExGst.toFixed(2)),
    row("Expenses excl GST", bas.expensesExGst.toFixed(2)),
    row(),
    row("PAYMENTS RECEIVED"),
    row("Received on", "Type", "Amount incl GST", "GST component", "Method", "Reference"),
    ...payments.map((payment) =>
      row(
        payment.received_on,
        PAYMENT_KIND_LABELS[payment.kind],
        Number(payment.amount_inc_gst).toFixed(2),
        gstFromInclusive(Number(payment.amount_inc_gst), rate).toFixed(2),
        payment.method,
        payment.reference,
      ),
    ),
    row(),
    row("EXPENSES"),
    row("Spent on", "Supplier", "Category", "Amount excl GST", "GST credit", "Amount incl GST", "Description"),
    ...expenses.map((expense) => {
      const split = expenseSplit(expense, rate);
      return row(
        expense.spent_on,
        expense.supplier,
        EXPENSE_CATEGORY_LABELS[expense.category],
        split.exGst.toFixed(2),
        split.gst.toFixed(2),
        split.incGst.toFixed(2),
        expense.description,
      );
    }),
    row(),
    row("Estimate only — confirm with your accountant or bookkeeper before lodging anything."),
  ];

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kabura-bas-${period.from}-to-${period.to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
