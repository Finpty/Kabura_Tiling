import "server-only";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";
import type { Database } from "./types";

/**
 * Service-role client. SERVER ONLY.
 *
 * `import "server-only"` makes it a build error to pull this module into a
 * client component, so the key can never reach the browser. It is used for
 * exactly two things: writing a quote request with its uploads, and reading
 * private upload paths back for an authenticated admin.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!SUPABASE_URL || !serviceKey) return null;

  return createClient<Database>(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const isAdminConfigured = () =>
  Boolean(SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
