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

/** Minimal typing for the tables this app touches. */
export type Database = {
  public: {
    Tables: {
      quote_requests: {
        Row: QuoteRequest;
        Insert: Omit<
          QuoteRequest,
          "id" | "created_at" | "updated_at" | "reference" | "status"
        > &
          Partial<Pick<QuoteRequest, "status">>;
        Update: Partial<QuoteRequest>;
      };
      quote_request_files: {
        Row: QuoteRequestFile;
        Insert: Omit<QuoteRequestFile, "id" | "created_at">;
        Update: Partial<QuoteRequestFile>;
      };
      quote_request_notes: {
        Row: QuoteRequestNote;
        Insert: Omit<QuoteRequestNote, "id" | "created_at">;
        Update: Partial<QuoteRequestNote>;
      };
      projects: {
        Row: ProjectRow;
        Insert: Partial<ProjectRow>;
        Update: Partial<ProjectRow>;
      };
      project_media: {
        Row: ProjectMediaRow;
        Insert: Partial<ProjectMediaRow>;
        Update: Partial<ProjectMediaRow>;
      };
      reviews: {
        Row: ReviewRow;
        Insert: Partial<ReviewRow>;
        Update: Partial<ReviewRow>;
      };
      admin_users: {
        Row: { user_id: string; email: string | null; created_at: string };
        Insert: { user_id: string; email?: string | null };
        Update: Partial<{ user_id: string; email: string | null }>;
      };
    };
  };
};

export const QUOTE_UPLOAD_BUCKET = "quote-uploads";
