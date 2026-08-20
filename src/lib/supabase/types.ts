/** Lead pipeline states shown as columns in the admin dashboard. */
export const ENQUIRY_STATUSES = [
  "new",
  "contacted",
  "site_visit",
  "quoted",
  "won",
  "lost",
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New Leads",
  contacted: "Contacted",
  site_visit: "Site Visit",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

export const ENQUIRY_STATUS_SHORT: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  site_visit: "Site visit",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

export type QuoteRequest = {
  id: string;
  reference: string;
  created_at: string;
  updated_at: string;
  /** Any value the enum holds, including the three legacy ones. */
  status: AnyQuoteStatus;
  service: string;
  suburb: string;
  postcode: string | null;
  approx_sqm: string | null;
  /** Customer-entered width in metres. Numeric in Postgres, so it arrives as a number. */
  width_m: number | null;
  /** Customer-entered length (floors) or height (walls) in metres. */
  length_m: number | null;
  /** ISO date the customer asked for. A request, never a confirmed booking. */
  preferred_start_date: string | null;
  tile_size: string | null;
  build_type: string | null;
  start_timing: string | null;
  description: string | null;
  name: string;
  phone: string;
  email: string;
  upload_token: string;
  source_path: string | null;
};

export type QuoteRequestFile = {
  id: string;
  quote_request_id: string;
  storage_path: string;
  file_name: string;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export type QuoteRequestNote = {
  id: string;
  quote_request_id: string;
  body: string;
  author_email: string | null;
  created_at: string;
};

export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  project_type: string | null;
  suburb: string | null;
  tile_type: string | null;
  tile_size: string | null;
  services_completed: string[] | null;
  description: string | null;
  cover_url: string | null;
  before_url: string | null;
  after_url: string | null;
  video_url: string | null;
  is_placeholder: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
};

export type ProjectMediaRow = {
  id: string;
  project_id: string;
  url: string;
  caption: string | null;
  alt: string | null;
  sort_order: number;
};

/**
 * Private job-calendar states. Owner-facing only — never rendered publicly.
 *
 * Re-exported from `portal-types` rather than declared twice: two lists of the
 * same enum drift, and the one that drifts is always the one a policy checks.
 */
export const JOB_STATUSES = PORTAL_JOB_STATUSES;
export type JobStatus = PortalJobStatus;
export const JOB_STATUS_LABELS = JOB_STATUS_LABELS_FULL;

/**
 * A scheduled job.
 *
 * Every field is private. This type is only ever used behind the admin auth
 * check — the public site reads availability through `AvailabilityDay`, which
 * carries no customer information at all.
 */
export type JobRow = PortalJobRow;

export type JobInsert = Pick<
  PortalJobRow,
  "customer_name" | "suburb" | "starts_on" | "ends_on"
> &
  Partial<Omit<PortalJobRow, "customer_name" | "suburb" | "starts_on" | "ends_on">>;

/* ------------------------------ public view ------------------------------ */

export const AVAILABILITY_STATUSES = [
  "available",
  "limited",
  "booked",
  // Added with the portal: a day the admin has blocked out, a day outside the
  // working week, or a day that has already gone. Still says nothing about why.
  "unavailable",
] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

/**
 * The only calendar information the public is ever given: a date and how busy
 * it is. Deliberately has no room for a name, an address or a count.
 */
export type AvailabilityDay = {
  day: string;
  status: AvailabilityStatus;
};

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: "Available",
  limited: "Limited",
  booked: "Booked",
  unavailable: "Unavailable",
};

export type ReviewRow = {
  id: string;
  author_name: string;
  rating: number | null;
  body: string;
  source: string | null;
  reviewed_at: string | null;
  approved: boolean;
  sort_order: number;
};

/**
 * Minimal typing for the tables this app touches.
 *
 * Shaped to satisfy supabase-js's `GenericSchema`: every table needs Row /
 * Insert / Update / Relationships, and the schema needs the Views, Functions,
 * Enums and CompositeTypes keys even when empty. Generate the full types with
 * `supabase gen types typescript` once the project exists if you prefer.
 */
import {
  JOB_STATUS_LABELS_FULL,
  PORTAL_JOB_STATUSES,
} from "./portal-types";
import type {
  AnyQuoteStatus,
  BookingRequestInsert,
  BookingRequestRow,
  BusinessSettingsRow,
  CalendarBlockRow,
  CustomerRow,
  ExpenseRow,
  InvoiceRow,
  JobAssignmentRow,
  JobNoteRow,
  PaymentRow,
  PortalJobRow,
  PortalJobStatus,
  QuoteCommercials,
} from "./portal-types";

type Table<
  Row,
  Insert = Partial<Row>,
  Update = Partial<Row>,
  Relationships extends readonly unknown[] = [],
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

/** Declared so embedded selects such as `projects(project_media(...))` resolve. */
type ProjectMediaRelationships = [
  {
    foreignKeyName: "project_media_project_id_fkey";
    columns: ["project_id"];
    isOneToOne: false;
    referencedRelation: "projects";
    referencedColumns: ["id"];
  },
];

type JobQuoteRelationships = [
  {
    foreignKeyName: "jobs_quote_request_id_fkey";
    columns: ["quote_request_id"];
    isOneToOne: false;
    referencedRelation: "quote_requests";
    referencedColumns: ["id"];
  },
];

type QuoteChildRelationships<Name extends string> = [
  {
    foreignKeyName: `${Name}_quote_request_id_fkey`;
    columns: ["quote_request_id"];
    isOneToOne: false;
    referencedRelation: "quote_requests";
    referencedColumns: ["id"];
  },
];

export type QuoteRequestInsert = Pick<
  QuoteRequest,
  "service" | "suburb" | "name" | "phone" | "email"
> &
  Partial<
    Omit<QuoteRequest, "service" | "suburb" | "name" | "phone" | "email">
  >;

export type Database = {
  public: {
    Tables: {
      quote_requests: Table<
        QuoteRequest & QuoteCommercials,
        QuoteRequestInsert,
        Partial<QuoteRequest & QuoteCommercials>
      >;
      quote_request_files: Table<
        QuoteRequestFile,
        Omit<QuoteRequestFile, "id" | "created_at"> & { id?: string },
        Partial<QuoteRequestFile>,
        QuoteChildRelationships<"quote_request_files">
      >;
      quote_request_notes: Table<
        QuoteRequestNote,
        Omit<QuoteRequestNote, "id" | "created_at"> & { id?: string },
        Partial<QuoteRequestNote>,
        QuoteChildRelationships<"quote_request_notes">
      >;
      projects: Table<ProjectRow>;
      project_media: Table<
        ProjectMediaRow,
        Partial<ProjectMediaRow>,
        Partial<ProjectMediaRow>,
        ProjectMediaRelationships
      >;
      reviews: Table<ReviewRow>;
      jobs: Table<
        PortalJobRow,
        JobInsert,
        Partial<PortalJobRow>,
        JobQuoteRelationships
      >;
      customers: Table<
        CustomerRow,
        Pick<CustomerRow, "name"> & Partial<CustomerRow>
      >;
      job_assignments: Table<
        JobAssignmentRow,
        Pick<JobAssignmentRow, "job_id" | "worker_name"> & Partial<JobAssignmentRow>
      >;
      job_notes: Table<
        JobNoteRow,
        Pick<JobNoteRow, "job_id" | "body"> & Partial<JobNoteRow>
      >;
      booking_requests: Table<BookingRequestRow, BookingRequestInsert>;
      calendar_blocks: Table<
        CalendarBlockRow,
        Pick<CalendarBlockRow, "day" | "kind"> & Partial<CalendarBlockRow>
      >;
      invoices: Table<
        InvoiceRow,
        Pick<InvoiceRow, "number"> & Partial<InvoiceRow>
      >;
      payments: Table<
        PaymentRow,
        Pick<PaymentRow, "amount_inc_gst"> & Partial<PaymentRow>
      >;
      expenses: Table<
        ExpenseRow,
        Pick<ExpenseRow, "amount"> & Partial<ExpenseRow>
      >;
      business_settings: Table<BusinessSettingsRow, Partial<BusinessSettingsRow>>;
      admin_users: Table<
        {
          user_id: string;
          email: string | null;
          username: string | null;
          created_at: string;
        },
        { user_id: string; email?: string | null; username?: string | null }
      >;
    };
    Views: Record<never, never>;
    Functions: {
      /** Aggregate-only day availability. See supabase/migrations. */
      service_availability: {
        Args: { from_date?: string; to_date?: string };
        Returns: AvailabilityDay[];
      };
    };
    Enums: { enquiry_status: AnyQuoteStatus; job_status: PortalJobStatus };
    CompositeTypes: Record<never, never>;
  };
};

export const QUOTE_UPLOAD_BUCKET = "quote-uploads";
