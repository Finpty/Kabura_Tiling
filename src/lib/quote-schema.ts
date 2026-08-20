import { QUOTE_SERVICE_OPTIONS } from "./services";

/**
 * Validation shared by the browser and the API route.
 *
 * Hand-written rather than pulled from a schema library: the rules are small,
 * the error messages need to be written for a customer rather than a developer,
 * and the identical module runs on both sides so the two can never drift.
 */

export type QuoteDraft = {
  service: string;
  suburb: string;
  postcode: string;
  /** Optional measurements, in metres. Free text so a half-typed "3." is not destroyed. */
  widthM: string;
  lengthM: string;
  approxSqm: string;
  /** ISO `YYYY-MM-DD`. The date the customer is asking for, not a booking. */
  preferredStartDate: string;
  tileSize: string;
  buildType: string;
  startTiming: string;
  description: string;
  name: string;
  phone: string;
  email: string;
  /** Honeypot — a real person never fills this in. */
  company?: string;
};

export const EMPTY_DRAFT: QuoteDraft = {
  service: "",
  suburb: "",
  postcode: "",
  widthM: "",
  lengthM: "",
  approxSqm: "",
  preferredStartDate: "",
  tileSize: "",
  buildType: "",
  startTiming: "",
  description: "",
  name: "",
  phone: "",
  email: "",
  company: "",
};

export const TILE_SIZE_OPTIONS = [
  "Not sure yet",
  "300 × 600",
  "600 × 600",
  "600 × 1200",
  "750 × 1500",
  "Large format / slab",
  "Mosaic",
  "Natural stone",
] as const;

export const BUILD_TYPE_OPTIONS = [
  "New build",
  "Renovation",
  "Repair",
  "Not sure yet",
] as const;

export const START_TIMING_OPTIONS = [
  "As soon as possible",
  "Within a month",
  "1–3 months",
  "3–6 months",
  "Just planning",
] as const;

export const MAX_FILES = 8;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export type FieldErrors = Partial<Record<keyof QuoteDraft, string>>;

/** Mirrors the check constraints in supabase/migrations. */
export const MAX_METRES = 1000;
export const MAX_SQM = 100_000;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[\d\s()+\-.]{6,20}$/;
const POSTCODE = /^\d{4}$/;

/**
 * Fields that must be valid before each step may be left.
 *
 * The single source of truth for the step order — the wizard renders from it
 * and jumps back to the offending step from it, so the two cannot disagree.
 */
export const STEP_FIELDS: (keyof QuoteDraft)[][] = [
  ["service"],
  ["suburb", "postcode"],
  [
    "widthM",
    "lengthM",
    "approxSqm",
    "tileSize",
    "buildType",
    "startTiming",
    "description",
  ],
  ["preferredStartDate"],
  [],
  ["name", "phone", "email"],
];

/** How far ahead a preferred date may be requested. */
export const MAX_BOOKING_MONTHS = 12;

/** Local `YYYY-MM-DD` for a Date, without the UTC shift `toISOString` causes. */
export function toISODate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses a `YYYY-MM-DD` string into a local midnight Date, or null. */
export function fromISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }
  return date;
}

/** A measurement in metres, or null if the field is empty or not a number. */
export function parseMetres(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/,/g, "."));
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

/**
 * Width × length/height, to two decimals with trailing zeros trimmed.
 * Returns null unless both measurements are present and sane, so a
 * half-entered pair never overwrites what the customer typed themselves.
 */
export function calculateSqm(width: string, length: string): string | null {
  const w = parseMetres(width);
  const l = parseMetres(length);
  if (w === null || l === null) return null;
  if (w <= 0 || l <= 0 || w > MAX_METRES || l > MAX_METRES) return null;
  const area = Math.round(w * l * 100) / 100;
  if (area <= 0) return null;
  return String(area);
}

export function validateField(
  field: keyof QuoteDraft,
  draft: QuoteDraft,
): string | undefined {
  const value = (draft[field] ?? "").trim();

  switch (field) {
    case "service":
      if (!value) return "Choose what you need help with.";
      if (!QUOTE_SERVICE_OPTIONS.some((o) => o.value === value))
        return "Choose one of the listed options.";
      return undefined;

    case "suburb":
      if (!value) return "Which suburb is the project in?";
      if (value.length > 120) return "That looks too long — just the suburb.";
      return undefined;

    case "postcode":
      if (!value) return undefined; // optional
      if (!POSTCODE.test(value)) return "Postcodes are four digits.";
      return undefined;

    case "widthM":
    case "lengthM": {
      if (!value) return undefined; // optional
      const metres = parseMetres(value);
      if (metres === null) return "Use numbers only, e.g. 3.4";
      if (metres <= 0) return "That needs to be more than zero.";
      if (metres > MAX_METRES)
        return `That looks too large — ${MAX_METRES} m is the limit.`;
      return undefined;
    }

    case "approxSqm": {
      if (!value) return undefined; // optional
      const area = Number(value.replace(/,/g, "."));
      if (!Number.isFinite(area)) return "Use numbers only, e.g. 18";
      if (area <= 0) return "That needs to be more than zero.";
      if (area > MAX_SQM) return "That looks too large — check the figure.";
      return undefined;
    }

    case "preferredStartDate": {
      if (!value) return undefined; // optional
      const date = fromISODate(value);
      if (!date) return "Pick a date from the calendar.";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return "Choose a date from today onwards.";
      const limit = new Date(today);
      limit.setMonth(limit.getMonth() + MAX_BOOKING_MONTHS);
      if (date > limit) {
        return `We can only take requests up to ${MAX_BOOKING_MONTHS} months ahead.`;
      }
      return undefined;
    }

    case "description":
      if (value.length > 4000) return "Please keep this under 4000 characters.";
      return undefined;

    case "name":
      if (!value) return "We need a name to put on the quote.";
      if (value.length > 120) return "That name looks too long.";
      return undefined;

    case "phone":
      if (!value) return "A phone number is the fastest way to reach you.";
      if (!PHONE.test(value)) return "That doesn't look like a phone number.";
      return undefined;

    case "email":
      if (!value) return "We'll send the quote here.";
      if (!EMAIL.test(value)) return "Check the email address.";
      if (value.length > 200) return "That email looks too long.";
      return undefined;

    default:
      return undefined;
  }
}

export function validateStep(step: number, draft: QuoteDraft): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of STEP_FIELDS[step] ?? []) {
    const message = validateField(field, draft);
    if (message) errors[field] = message;
  }
  return errors;
}

export function validateAll(draft: QuoteDraft): FieldErrors {
  const errors: FieldErrors = {};
  for (const fields of STEP_FIELDS) {
    for (const field of fields) {
      const message = validateField(field, draft);
      if (message) errors[field] = message;
    }
  }
  return errors;
}

export function validateFile(file: {
  type: string;
  size: number;
  name: string;
}) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `${file.name} isn't an image we can accept (JPEG, PNG, WebP or HEIC).`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return `${file.name} is larger than 10 MB.`;
  }
  return undefined;
}
