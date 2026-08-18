"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";
import type { Database } from "./types";

/**
 * Browser client. Only ever carries the anon key, which is safe to ship —
 * every table is protected by row level security (see supabase/migrations).
 */
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
