import "server-only";

import { createServerSupabase } from "./supabase/server";

export type AdminSession = {
  userId: string;
  email: string | null;
};

/**
 * Resolves the signed-in staff member, or null.
 *
 * Two checks, both required:
 *   1. `getUser()` — validates the JWT against Supabase rather than trusting
 *      the cookie, so a forged or stale session is rejected.
 *   2. membership of `admin_users` — signing up does not grant access; an
 *      existing admin has to add the row.
 *
 * Row level security enforces the same rule at the database level, so this is
 * defence in depth rather than the only gate.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id,email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return { userId: user.id, email: user.email ?? data.email ?? null };
}
