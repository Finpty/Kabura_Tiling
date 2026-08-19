/**
 * Supabase is optional. The marketing site renders completely without it; only
 * the quote pipeline and the admin dashboard require a configured project.
 * Nothing here reads the service-role key — see `admin.ts`, which is server-only.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
