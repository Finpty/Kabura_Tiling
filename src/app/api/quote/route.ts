import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { QUOTE_UPLOAD_BUCKET } from "@/lib/supabase/types";
import {
  ACCEPTED_IMAGE_TYPES,
  EMPTY_DRAFT,
  MAX_FILES,
  MAX_FILE_BYTES,
  parseMetres,
  validateAll,
  type QuoteDraft,
} from "@/lib/quote-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Quote intake.
 *
 * Runs server-side with the service-role key so that:
 *   - the anon client never needs write access to storage metadata,
 *   - uploads land in a private bucket the public cannot list or read,
 *   - the payload is validated by the same module the browser used, so a
 *     crafted request cannot bypass the client-side rules.
 *
 * If any upload fails the enquiry itself is still kept — losing a lead because
 * one photo was rejected would be the worse failure.
 */

const MAX_FIELD_LENGTH = 4000;

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string"
    ? value.trim().slice(0, MAX_FIELD_LENGTH)
    : "";
}

function extensionFor(type: string, name: string) {
  const fromName = name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
}

export async function POST(request: Request) {
  /**
   * Two paths, deliberately:
   *
   *  - Service role configured: the full flow — the enquiry is written, photos
   *    are uploaded to the private bucket and indexed in quote_request_files,
   *    and the reference is read back for the confirmation screen.
   *
   *  - Only the anon key configured: still capture the lead. RLS grants anon
   *    INSERT on quote_requests, so the enquiry is saved; photos are skipped
   *    because indexing them needs privileges anon does not have, and silently
   *    storing files nothing points at would be worse than not storing them.
   *    Losing an enquiry because one env var is missing is the worst outcome
   *    available, so this path exists rather than a hard 503.
   */
  const admin = createAdminClient();
  const supabase = admin ?? (await createServerSupabase());

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "The quote pipeline isn't connected yet. Please try again shortly.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "We couldn't read that submission." },
      { status: 400 },
    );
  }

  // Honeypot: a bot fills every field it finds. Accept silently so it does not
  // learn to try again, but store nothing.
  if (field(form, "company")) {
    return NextResponse.json({ ok: true, reference: null });
  }

  const draft: QuoteDraft = {
    ...EMPTY_DRAFT,
    service: field(form, "service"),
    suburb: field(form, "suburb"),
    postcode: field(form, "postcode"),
    widthM: field(form, "widthM"),
    lengthM: field(form, "lengthM"),
    approxSqm: field(form, "approxSqm"),
    preferredStartDate: field(form, "preferredStartDate"),
    tileSize: field(form, "tileSize"),
    buildType: field(form, "buildType"),
    startTiming: field(form, "startTiming"),
    description: field(form, "description"),
    name: field(form, "name"),
    phone: field(form, "phone"),
    email: field(form, "email"),
  };

  const errors = validateAll(draft);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Some details need checking before we can send that through.",
        fields: errors,
      },
      { status: 422 },
    );
  }

  const insertPayload = {
    service: draft.service,
    suburb: draft.suburb,
    postcode: draft.postcode || null,
    approx_sqm: draft.approxSqm || null,
    // Validated above, so these are either a sane number or absent entirely.
    width_m: parseMetres(draft.widthM),
    length_m: parseMetres(draft.lengthM),
    // A requested date. Nothing downstream treats it as a confirmed booking —
    // only the admin calendar creates a real job.
    preferred_start_date: draft.preferredStartDate || null,
    tile_size: draft.tileSize || null,
    build_type: draft.buildType || null,
    start_timing: draft.startTiming || null,
    description: draft.description || null,
    name: draft.name,
    phone: draft.phone,
    email: draft.email,
    source_path: field(form, "sourcePath") || null,
  };

  // Only the service role can read the row back — anon has no SELECT policy,
  // which is the point. On the anon path we insert and trust the constraint.
  if (!admin) {
    const { error } = await supabase
      .from("quote_requests")
      .insert(insertPayload);
    if (error) {
      console.error("quote insert failed (anon path)", error);
      return NextResponse.json(
        { ok: false, error: "We couldn't save that. Please try again." },
        { status: 500 },
      );
    }
    const photoCount = form
      .getAll("photos")
      .filter((e): e is File => e instanceof File && e.size > 0).length;

    if (photoCount > 0) {
      console.warn(
        `quote: ${photoCount} photo(s) were not stored — SUPABASE_SERVICE_ROLE_KEY is not set`,
      );
    }
    return NextResponse.json({
      ok: true,
      reference: null,
      uploaded: 0,
      photosSkipped: photoCount,
    });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("quote_requests")
    .insert(insertPayload)
    .select("id, reference, upload_token")
    .single();

  if (insertError || !inserted) {
    console.error("quote insert failed", insertError);
    return NextResponse.json(
      { ok: false, error: "We couldn't save that. Please try again." },
      { status: 500 },
    );
  }

  /* ---------------------------- uploads ---------------------------- */
  const photos = form
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_FILES);

  const uploadFailures: string[] = [];

  for (const [index, photo] of photos.entries()) {
    if (!ACCEPTED_IMAGE_TYPES.includes(photo.type)) {
      uploadFailures.push(photo.name);
      continue;
    }
    if (photo.size > MAX_FILE_BYTES) {
      uploadFailures.push(photo.name);
      continue;
    }

    const path = `${inserted.upload_token}/${String(index + 1).padStart(2, "0")}-${Date.now()}.${extensionFor(photo.type, photo.name)}`;

    const { error: uploadError } = await admin.storage
      .from(QUOTE_UPLOAD_BUCKET)
      .upload(path, photo, {
        contentType: photo.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("quote upload failed", uploadError);
      uploadFailures.push(photo.name);
      continue;
    }

    const { error: fileRowError } = await admin
      .from("quote_request_files")
      .insert({
        quote_request_id: inserted.id,
        storage_path: path,
        file_name: photo.name.slice(0, 200),
        content_type: photo.type,
        size_bytes: photo.size,
      });

    if (fileRowError) console.error("quote file row failed", fileRowError);
  }

  return NextResponse.json({
    ok: true,
    reference: inserted.reference,
    uploaded: photos.length - uploadFailures.length,
    failed: uploadFailures,
  });
}
