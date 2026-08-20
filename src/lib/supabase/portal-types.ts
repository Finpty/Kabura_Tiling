/**
 * Types and vocabularies for the private business portal.
 *
 * Everything in this file describes staff-only data. None of these types is
 * ever used to render a public page — the public calendar sees
 * `AvailabilityDay` from `./types`, which has no room for a name, an address
 * or a number.
 */

/* ============================ quote lifecycle ============================= */

/**
 * The quote pipeline.
 *
 * `quoted`, `won` and `lost` are the original three values and are still valid
 * in the database — historical rows carry them. They are treated as synonyms
 * of `quote_sent`, `accepted` and `declined` for display and filtering, so
 * nothing written before the portal existed reads as broken.
 */
export const QUOTE_STATUSES = [
  "new",
  "contacted",
  "site_visit",
  "quote_preparing",
  "quote_sent",
  "accepted",
  "declined",
  "expired",
  "converted",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/** Values that exist in the enum but are no longer offered in the UI. */
export const LEGACY_QUOTE_STATUSES = ["quoted", "won", "lost"] as const;
export type LegacyQuoteStatus = (typeof LEGACY_QUOTE_STATUSES)[number];

/** Any value the column can hold. */
export type AnyQuoteStatus = QuoteStatus | LegacyQuoteStatus;

const LEGACY_QUOTE_MAP: Record<LegacyQuoteStatus, QuoteStatus> = {
  quoted: "quote_sent",
  won: "accepted",
  lost: "declined",
};

/** Folds a legacy value onto its modern equivalent. */
export function normaliseQuoteStatus(value: string): QuoteStatus {
  if ((QUOTE_STATUSES as readonly string[]).includes(value)) {
    return value as QuoteStatus;
  }
  return LEGACY_QUOTE_MAP[value as LegacyQuoteStatus] ?? "new";
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  new: "New",
  contacted: "Contacted",
  site_visit: "Site visit required",
  quote_preparing: "Quote preparing",
  quote_sent: "Quote sent",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  converted: "Converted to job",
};

/** Statuses that still need something done about them. */
export const OPEN_QUOTE_STATUSES: QuoteStatus[] = [
  "new",
  "contacted",
  "site_visit",
  "quote_preparing",
  "quote_sent",
];

/* ============================= job lifecycle ============================== */

export const PORTAL_JOB_STATUSES = [
  "tentative",
  "booked",
  "confirmed",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
] as const;

export type PortalJobStatus = (typeof PORTAL_JOB_STATUSES)[number];

export const JOB_STATUS_LABELS_FULL: Record<PortalJobStatus, string> = {
  tentative: "Tentative",
  booked: "Booked",
  confirmed: "Confirmed",
  in_progress: "In progress",
  on_hold: "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** A job in one of these states is holding its dates in the diary. */
export const OCCUPYING_JOB_STATUSES: PortalJobStatus[] = [
  "tentative",
  "booked",
  "confirmed",
  "in_progress",
  "on_hold",
  "completed",
];

/* =========================== booking lifecycle =========================== */

export const BOOKING_STATUSES = [
  "new",
  "reviewing",
  "approved",
  "declined",
  "alternative_offered",
  "converted",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  approved: "Approved",
  declined: "Declined",
  alternative_offered: "Alternative offered",
  converted: "Converted to job",
};

/* ============================ calendar overrides ========================== */

export const CALENDAR_OVERRIDES = [
  "open",
  "limited",
  "fully_booked",
  "blocked",
  "holiday",
  "personal",
  "emergency",
] as const;

export type CalendarOverride = (typeof CALENDAR_OVERRIDES)[number];

export const CALENDAR_OVERRIDE_LABELS: Record<CalendarOverride, string> = {
  open: "Open for bookings",
  limited: "Limited availability",
  fully_booked: "Fully booked",
  blocked: "Blocked out",
  holiday: "Holiday",
  personal: "Personal day",
  emergency: "Emergency availability",
};

/* ================================= money ================================= */

export const PAYMENT_KINDS = ["deposit", "progress", "final", "other"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const PAYMENT_KIND_LABELS: Record<PaymentKind, string> = {
  deposit: "Deposit",
  progress: "Progress payment",
  final: "Final payment",
  other: "Other",
};

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "part_paid",
  "paid",
  "overdue",
  "void",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  part_paid: "Part paid",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

/**
 * Where a job sits on payment. Derived from the job's value and the payments
 * recorded against it rather than stored, so it can never drift out of step
 * with the money that actually came in.
 */
export const PAYMENT_STATES = [
  "not_invoiced",
  "deposit_due",
  "partially_paid",
  "paid",
  "overdue",
] as const;
export type PaymentState = (typeof PAYMENT_STATES)[number];

export const PAYMENT_STATE_LABELS: Record<PaymentState, string> = {
  not_invoiced: "Not invoiced",
  deposit_due: "Deposit due",
  partially_paid: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
};

export const EXPENSE_CATEGORIES = [
  "materials",
  "adhesive",
  "tiles",
  "waterproofing",
  "fuel",
  "tools",
  "vehicle",
  "subcontractors",
  "advertising",
  "insurance",
  "phone",
  "software",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  materials: "Materials",
  adhesive: "Adhesive",
  tiles: "Tiles",
  waterproofing: "Waterproofing",
  fuel: "Fuel",
  tools: "Tools",
  vehicle: "Vehicle",
  subcontractors: "Subcontractors",
  advertising: "Advertising",
  insurance: "Insurance",
  phone: "Phone",
  software: "Software",
  other: "Other",
};

/* ================================= rows ================================== */

export type CustomerRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  phone: string | null;
  email: string | null;
  suburb: string | null;
  address: string | null;
  notes: string | null;
};

/** Commercial fields added to the intake row by the portal. */
export type QuoteCommercials = {
  customer_id: string | null;
  estimated_price: number | null;
  quoted_price: number | null;
  price_includes_gst: boolean;
  material_allowance: number | null;
  labour_allowance: number | null;
  internal_notes: string | null;
  site_visit_on: string | null;
  quote_sent_on: string | null;
  decided_on: string | null;
  converted_job_id: string | null;
};

/** The job record, private in every field. */
export type PortalJobRow = {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  suburb: string;
  postcode: string | null;
  address: string | null;
  starts_on: string;
  ends_on: string;
  /** Set when the job actually finished. Drives availability once known. */
  actual_finish_on: string | null;
  start_time: string | null;
  end_time: string | null;
  job_type: string | null;
  description: string | null;
  notes: string | null;
  status: PortalJobStatus;
  /** Job value EXCLUDING GST. Everything else builds from this. */
  value_ex_gst: number | null;
  gst_amount: number | null;
  deposit_required: number | null;
  materials_cost: number | null;
  labour_cost: number | null;
  other_costs: number | null;
  invoice_reference: string | null;
  quote_request_id: string | null;
  booking_request_id: string | null;
  created_by: string | null;
};

export type JobAssignmentRow = {
  id: string;
  created_at: string;
  job_id: string;
  worker_name: string;
  role: string | null;
};

export type JobNoteRow = {
  id: string;
  created_at: string;
  job_id: string;
  body: string;
  author_email: string | null;
};

export type BookingRequestRow = {
  id: string;
  created_at: string;
  updated_at: string;
  reference: string;
  status: BookingStatus;
  name: string;
  phone: string;
  email: string;
  suburb: string;
  service: string | null;
  approx_size: string | null;
  requested_date: string;
  message: string | null;
  quote_reference: string | null;
  quote_request_id: string | null;
  customer_id: string | null;
  job_id: string | null;
  offered_date: string | null;
  admin_notes: string | null;
  source_path: string | null;
};

export type BookingRequestInsert = Pick<
  BookingRequestRow,
  "name" | "phone" | "email" | "suburb" | "requested_date"
> &
  Partial<Omit<BookingRequestRow, "name" | "phone" | "email" | "suburb" | "requested_date">>;

export type CalendarBlockRow = {
  id: string;
  created_at: string;
  updated_at: string;
  day: string;
  kind: CalendarOverride;
  note: string | null;
  created_by: string | null;
};

export type InvoiceRow = {
  id: string;
  created_at: string;
  updated_at: string;
  job_id: string | null;
  customer_id: string | null;
  number: string;
  status: InvoiceStatus;
  issued_on: string | null;
  due_on: string | null;
  total_ex_gst: number;
  gst_amount: number;
  notes: string | null;
};

export type PaymentRow = {
  id: string;
  created_at: string;
  job_id: string | null;
  invoice_id: string | null;
  kind: PaymentKind;
  /** As banked — GST inclusive. */
  amount_inc_gst: number;
  received_on: string;
  method: string | null;
  reference: string | null;
  notes: string | null;
};

export type ExpenseRow = {
  id: string;
  created_at: string;
  updated_at: string;
  spent_on: string;
  supplier: string | null;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  gst_included: boolean;
  gst_amount: number | null;
  receipt_path: string | null;
  job_id: string | null;
  notes: string | null;
  created_by: string | null;
};

/**
 * Business settings. One row.
 *
 * Tax rates live here rather than in code because they are the accountant's to
 * set, and because a rate change must not need a deployment. Nothing in the
 * app hard-codes 10% or any income tax rate.
 */
export type BusinessSettingsRow = {
  id: number;
  updated_at: string;
  business_name: string;
  abn: string | null;
  phone: string | null;
  email: string | null;
  gst_registered: boolean;
  /** Fraction, not a percentage. 0.1 = 10%. */
  gst_rate: number;
  /** A management estimate only. */
  income_tax_rate: number;
  /** 7 = the Australian financial year. */
  financial_year_start_month: number;
  prices_include_gst: boolean;
  default_deposit_pct: number;
  /** ISO weekday numbers: 1 = Monday … 7 = Sunday. */
  working_days: number[];
  working_hours_start: string;
  working_hours_end: string;
  daily_capacity: number;
  notification_emails: string[];
};

/** Used when the settings row cannot be read — never persisted. */
export const SETTINGS_FALLBACK: BusinessSettingsRow = {
  id: 1,
  updated_at: "",
  business_name: "Kabura Tiling Group Pty Ltd",
  abn: null,
  phone: null,
  email: null,
  gst_registered: true,
  gst_rate: 0.1,
  income_tax_rate: 0.25,
  financial_year_start_month: 7,
  prices_include_gst: true,
  default_deposit_pct: 0.2,
  working_days: [1, 2, 3, 4, 5],
  working_hours_start: "07:00",
  working_hours_end: "16:00",
  daily_capacity: 2,
  notification_emails: [],
};
