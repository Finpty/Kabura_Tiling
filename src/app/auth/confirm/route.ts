import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The landing point for Supabase auth emails — the missing half of the
 * password-reset flow.
 *
 * ── Why this route has to exist ─────────────────────────────────────────────
 * The email does not carry a session; it carries a one-time token hash. Until
 * something on the server calls `verifyOtp` with that hash, there is no user,
 * and a reset page that goes looking for one finds nobody. This route is that
 * something: it verifies the hash, lets the SSR client write the session
 * cookies (a Route Handler may write cookies; a Server Component may not,
 * which is why the reset page could never have done this itself), and only
 * then hands the now-signed-in visitor to the reset form.
 *
 * The email template must therefore link HERE, not to the reset page:
 *
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/reset-password
 *
 * ── One-time by design ──────────────────────────────────────────────────────
 * `verifyOtp` consumes the hash: the first click exchanges it, any later click
 * fails and lands on the forgot-password page with a friendly message and the
 * form to request a fresh one. Nothing here extends a token's life or lets a
 * failed verification through.
 */

/** The email flows this site actually sends. Anything else is rejected. */
const ALLOWED_TYPES: readonly EmailOtpType[] = ["recovery"];

/**
 * `next` must be a path inside this app. Anything absolute, protocol-relative
 * or outside /admin is discarded — a redirect target taken from a query string
 * is otherwise a phishing link with our domain on it.
 */
function sanitizeNext(raw: string | null): string {
  if (raw && raw.startsWith("/admin") && !raw.startsWith("//")) return raw;
  return "/admin/reset-password";
}

/**
 * Absolute URLs are built on the site's canonical origin, never on
 * `request.nextUrl`. Behind Hostinger's proxy the request's own origin is the
 * server's internal address — 0.0.0.0:<port> — and a redirect built from it
 * sends the visitor's browser somewhere that does not exist.
 */
const absolute = (path: string, search = "") => {
  const url = new URL(path, site.url);
  url.search = search;
  return url;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeNext(searchParams.get("next"));

  const failure = absolute("/admin/forgot-password", "?error=link");

  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.redirect(failure);
  }

  const supabase = await createServerSupabase();
  if (!supabase) return NextResponse.redirect(failure);

  try {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) return NextResponse.redirect(failure);
  } catch {
    // Network trouble reads the same as a bad token from out here: the visitor
    // needs a fresh link either way, not a stack trace.
    return NextResponse.redirect(failure);
  }

  return NextResponse.redirect(absolute(next));
}
