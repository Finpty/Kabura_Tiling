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
  approxSqm: string;
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
  approxSqm: "",
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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[\d\s()+\-.]{6,20}$/;
const POSTCODE = /^\d{4}$/;

/** Fields that must be valid before each step may be left. */
export const STEP_FIELDS: (keyof QuoteDraft)[][] = [
  ["service"],
  ["suburb", "postcode"],
  ["approxSqm", "tileSize", "buildType", "startTiming", "description"],
  [],
  ["name", "phone", "email"],
];

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

export function validateFile(file: { type: string; size: number; name: string }) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `${file.name} isn't an image we can accept (JPEG, PNG, WebP or HEIC).`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return `${file.name} is larger than 10 MB.`;
  }
  return undefined;
}
