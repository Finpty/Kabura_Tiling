"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-auth";
import { ENQUIRY_STATUSES, QUOTE_UPLOAD_BUCKET, type EnquiryStatus } from "@/lib/supabase/types";

export type ActionState = { error?: string; ok?: boolean };

/** Sign in. Deliberately returns one generic message for every failure mode. */
export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return { error: "The dashboard is not connected to Supabase yet." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Never distinguish "no such account" from "wrong password".
    return { error: "Those details didn't work. Please try again." };
  }

  const session = await getAdminSession();
  if (!session) {
    await supabase.auth.signOut();
    return {
      error:
        "That account is not authorised for the dashboard. Ask an existing admin to add you.",
    };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

export async function updateStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAdminSession();
  if (!session) return { error: "Not authorised." };

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as EnquiryStatus;

  if (!id) return { error: "Missing enquiry." };
  if (!ENQUIRY_STATUSES.includes(status)) return { error: "Unknown status." };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Not connected." };

  const { error } = await supabase
    .from("quote_requests")
    .update({ status })
    .eq("id", id);

  if (error) return { error: "Couldn't update that status." };

  revalidatePath("/admin");
  revalidatePath(`/admin/enquiries/${id}`);
  return { ok: true };
}

export async function addNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAdminSession();
  if (!session) return { error: "Not authorised." };

  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!id) return { error: "Missing enquiry." };
  if (!body) return { error: "Write something first." };
  if (body.length > 4000) return { error: "That note is too long." };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Not connected." };

  const { error } = await supabase.from("quote_request_notes").insert({
    quote_request_id: id,
    body,
    author_email: session.email,
  });

  if (error) return { error: "Couldn't save that note." };

  revalidatePath(`/admin/enquiries/${id}`);
  return { ok: true };
}

/**
 * Mints short-lived signed URLs for an enquiry's photos.
 *
 * The bucket is private, so this is the only way to view them. Signing happens
 * server-side after the admin check, and the links expire in five minutes —
 * a forwarded URL stops working almost immediately.
 */
export async function signUploadUrls(paths: string[]): Promise<string[]> {
  const session = await getAdminSession();
  if (!session || paths.length === 0) return [];

  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin.storage
    .from(QUOTE_UPLOAD_BUCKET)
    .createSignedUrls(paths, 300);

  if (error || !data) return [];
  return data.map((entry) => entry.signedUrl ?? "");
}
