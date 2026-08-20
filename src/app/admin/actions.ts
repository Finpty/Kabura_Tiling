"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { getAdminSession } from "@/lib/admin-auth";
import { QUOTE_UPLOAD_BUCKET } from "@/lib/supabase/types";
import { QUOTE_STATUSES, type QuoteStatus } from "@/lib/supabase/portal-types";
import { site } from "@/lib/site";

export type ActionState = { error?: string; ok?: boolean };

/**
 * Resolves a typed identifier to the email Supabase authenticates with.
 *
 * "rez" maps to the email on that admin's allow-list row. The lookup runs on
 * the service-role client because it happens BEFORE authentication, when the
 * caller is nobody — and it stays server-side, so which usernames exist is
 * never observable from a browser. Anything that fails resolves to the input
 * itself, which then fails password sign-in with the same generic message as
 * every other wrong guess.
 */
async function resolveSignInEmail(identifier: string): Promise<string> {
  if (identifier.includes("@")) return identifier;

  const admin = createAdminClient();
  if (!admin) return identifier;

  const { data } = await (admin as NonNullable<ReturnType<typeof createAdminClient>>)
    .from("admin_users")
    .select("email,username")
    .not("username", "is", null)
    .returns<Database["public"]["Tables"]["admin_users"]["Row"][]>();

  const match = data?.find(
    (row) => row.username?.toLowerCase() === identifier.toLowerCase(),
  );
  return match?.email ?? identifier;
}

/** Sign in. Deliberately returns one generic message for every failure mode. */
export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const identifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Enter your username or email, and your password." };
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return { error: "The dashboard is not connected to Supabase yet." };
  }

  const email = await resolveSignInEmail(identifier);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Never distinguish "no such account" from "wrong password".
    return { error: "Those details didn't work. Please try again." };
  }

  const session = await getAdminSession();
  if (!session) {
    // Signing up is not the same as being let in. An account that is not on
    // the allow-list is signed straight back out rather than left holding a
    // session that every RLS policy would refuse anyway.
    await supabase.auth.signOut();
    return {
      error:
        "That account is not authorised for the dashboard. Ask an existing admin to add you.",
    };
  }

  // Only ever an in-app path, never an absolute URL: an open redirect on a
  // login form is how phishing links get their credibility.
  const next = String(formData.get("next") ?? "");
  const safeNext =
    next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  redirect(safeNext);
}

/**
 * Sends a password reset link.
 *
 * Always reports success. Telling an anonymous caller whether an address has
 * an account turns this form into a way to enumerate staff email addresses,
 * and the person who actually owns the address learns nothing less.
 */
export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { error: "Enter the email address you sign in with." };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Not connected." };

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site.url}/admin/reset-password`,
  });

  return { ok: true };
}

/**
 * Sets a new password.
 *
 * Reachable only while holding the recovery session Supabase creates from the
 * emailed link, which is what proves the caller owns the mailbox. Supabase
 * hashes the password; nothing plain-text is stored, sent or logged here.
 */
export async function updatePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 12) {
    return { error: "Use at least 12 characters." };
  }
  if (password !== confirm) {
    return { error: "The two passwords do not match." };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Not connected." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "That reset link has expired. Request a new one and try again.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "That password could not be set. Try another." };

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
  const status = String(formData.get("status") ?? "") as QuoteStatus;

  if (!id) return { error: "Missing enquiry." };
  if (!QUOTE_STATUSES.includes(status)) return { error: "Unknown status." };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Not connected." };

  const { error } = await supabase
    .from("quote_requests")
    .update({ status })
    .eq("id", id);

  if (error) return { error: "Couldn't update that status." };

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);
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

  revalidatePath(`/admin/quotes/${id}`);
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
