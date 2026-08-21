import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The landing point for Supabase auth emails — the missing half of the
 * password-reset flow.
 *
 * ── Why this route has to exist ─────────────────────────────────────────────
 * The email does not carry a session; it carries a one-time credential. Until
 * something on the server exchanges it, there is no user, and a reset page
 * that goes looking for one finds nobody. This route is that something, and it
 * accepts both shapes that credential arrives in:
 *
 *   · `token_hash` + `type` — the customised email template links straight
 *     here: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/reset-password
 *     Verified with `verifyOtp`; works whatever browser opens the link.
 *
 *   · `code` — the stock template goes via Supabase's hosted verify endpoint,
 *     which consumes the token itself and redirects onward with a PKCE code.
 *     Exchanged with `exchangeCodeForSession`; needs the code-verifier cookie,
 *     so the link must be opened in the browser that requested the reset.
 *     (Those redirects normally land on /admin/reset-password, where the
 *     middleware does this same exchange — handled here too so either target
 *     works.)
 *
 * ── One-time by design ──────────────────────────────────────────────────────
 * Both exchanges consume the credential: the first click signs in, any later
 * click fails and lands on the forgot-password page with a friendly message
 * and the form to request a fresh one. Nothing here extends a token's life or
 * lets a failed verification through.
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
  const code = searchParams.get("code");
  const next = sanitizeNext(searchParams.get("next"));

  const failure = absolute("/admin/forgot-password", "?error=link");
  if (!isSupabaseConfigured) return NextResponse.redirect(failure);

  /**
   * Cookies Supabase asks to write are collected and attached to the redirect
   * by hand. The redirect IS this route's whole response — there is no page
   * render behind it to carry them — and a session that never reaches the
   * browser reads, one page later, as "that link has already been used".
   */
  const staged: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        staged.push(...cookiesToSet);
      },
    },
  });

  const succeed = () => {
    const redirect = NextResponse.redirect(absolute(next));
    for (const { name, value, options } of staged) {
      redirect.cookies.set(name, value, options);
    }
    return redirect;
  };

  try {
    if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!error) return succeed();
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return succeed();
    }
  } catch {
    // Network trouble reads the same as a bad token from out here: the visitor
    // needs a fresh link either way, not a stack trace.
  }

  return NextResponse.redirect(failure);
}
