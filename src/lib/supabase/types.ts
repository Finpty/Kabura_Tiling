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
  status: EnquiryStatus;
  service: string;
  suburb: string;
  postcode: string | null;
  approx_sqm: string | null;
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
  Partial<Omit<QuoteRequest, "service" | "suburb" | "name" | "phone" | "email">>;

export type Database = {
  public: {
    Tables: {
      quote_requests: Table<QuoteRequest, QuoteRequestInsert>;
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
      admin_users: Table<
        { user_id: string; email: string | null; created_at: string },
        { user_id: string; email?: string | null }
      >;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: { enquiry_status: EnquiryStatus };
    CompositeTypes: Record<never, never>;
  };
};

export const QUOTE_UPLOAD_BUCKET = "quote-uploads";
