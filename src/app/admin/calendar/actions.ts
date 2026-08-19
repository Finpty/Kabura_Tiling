"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { EMPTY_JOB, validateJob, type JobDraft } from "@/lib/job-schema";
import type { JobStatus } from "@/lib/supabase/types";

/**
 * Job calendar writes.
 *
 * Every action re-checks the admin session before it touches anything. That is
 * belt and braces — RLS on `public.jobs` requires `private.is_admin()` and would
 * reject the write anyway — but it means an unauthorised call gets a clean
 * "Not authorised" instead of a database error, and the check is visible at the
 * point of use rather than only in a migration.
 */

export type JobActionState = {
  error?: string;
  fields?: Partial<Record<keyof JobDraft, string>>;
  ok?: boolean;
  /** Set on a successful create so the client can close and reset the form. */
  savedId?: string;
};

const text = (form: FormData, name: string) =>
  String(form.get(name) ?? "").trim();

function readDraft(form: FormData): JobDraft {
  return {
    ...EMPTY_JOB,
    id: text(form, "id"),
    customerName: text(form, "customerName"),
    suburb: text(form, "suburb"),
    address: text(form, "address"),
    startsOn: text(form, "startsOn"),
    endsOn: text(form, "endsOn"),
    startTime: text(form, "startTime"),
    endTime: text(form, "endTime"),
    jobType: text(form, "jobType"),
    notes: text(form, "notes"),
    status: (text(form, "status") || "tentative") as JobStatus,
  };
}

export async function saveJob(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const session = await getAdminSession();
  if (!session) return { error: "Not authorised." };

  const draft = readDraft(formData);
  const fields = validateJob(draft);
  if (Object.keys(fields).length > 0) {
    return { error: "Check the highlighted fields.", fields };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Not connected to Supabase." };

  const payload = {
    customer_name: draft.customerName,
    suburb: draft.suburb,
    address: draft.address || null,
    starts_on: draft.startsOn,
    ends_on: draft.endsOn,
    start_time: draft.startTime || null,
    end_time: draft.endTime || null,
    job_type: draft.jobType || null,
    notes: draft.notes || null,
    status: draft.status,
  };

  if (draft.id) {
    const { error } = await supabase
      .from("jobs")
      .update(payload)
      .eq("id", draft.id);

    if (error) {
      console.error("job update failed", error);
      return { error: "Couldn't save that job." };
    }
    revalidatePath("/admin/calendar");
    return { ok: true, savedId: draft.id };
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...payload, created_by: session.userId })
    .select("id")
    .single();

  if (error || !data) {
    console.error("job insert failed", error);
    return { error: "Couldn't create that job." };
  }

  revalidatePath("/admin/calendar");
  return { ok: true, savedId: data.id };
}

export async function deleteJob(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const session = await getAdminSession();
  if (!session) return { error: "Not authorised." };

  const id = text(formData, "id");
  if (!id) return { error: "Missing job." };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Not connected to Supabase." };

  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) {
    console.error("job delete failed", error);
    return { error: "Couldn't delete that job." };
  }

  revalidatePath("/admin/calendar");
  return { ok: true };
}
