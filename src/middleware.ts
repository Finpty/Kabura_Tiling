import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Admin route protection, and session refresh.
 *
 * ── What this is, and what it is not ────────────────────────────────────────
 * This is the *outer* gate. It keeps a signed-out visitor from ever rendering
 * an admin page, which is worth doing because a page that briefly renders and
 * then redirects has already run its queries. It is NOT the security boundary:
 * row level security is, and it is enforced by Postgres against the signed-in
 * user on every single read. If this file were deleted tomorrow, an
 * unauthorised visitor would still get nothing back but empty result sets.
 *
 * That distinction matters because middleware runs on the edge with a cookie
 * it has not fully validated. It checks that a session exists; it deliberately
 * does not decide who is an admin. Membership of the allow-list is checked
 * server-side in `getAdminSession()` and again by every RLS policy — a forged
 * cookie gets past this and no further.
 *
 * ── The other job ───────────────────────────────────────────────────────────
 * Supabase access tokens are short-lived. Refreshing them needs a place that
 * can write cookies on the way out, which a Server Component cannot do. This
 * runs on every admin request and hands the refreshed cookies back, so a long
 * afternoon on site does not end in a surprise logout.
 */

/**
 * Redirects are issued on the canonical origin, not the request's own — behind
 * Hostinger's proxy the request origin is 0.0.0.0:<port>, which no browser
 * can follow. Mirrors src/lib/site.ts (middleware cannot import it wholesale
 * without dragging the full site config into the edge bundle).
 */
const CANONICAL_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://kaburatiling.com.au");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

/** Pages inside /admin that a signed-out visitor is allowed to reach. */
const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Without Supabase configured there is no auth to enforce and no session to
  // refresh. The admin pages render their own "not connected" state.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // `getUser` rather than `getSession`: it validates the token with Supabase
  // instead of trusting whatever is in the cookie jar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!user && !isPublicAdminPath) {
    const login = new URL("/admin/login", CANONICAL_ORIGIN);
    // Carry the destination so signing in lands where they were headed.
    if (pathname !== "/admin") login.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(login);
  }

  // Already signed in and asking for the login page: send them on.
  if (user && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin", CANONICAL_ORIGIN));
  }

  return response;
}

export const config = {
  // Only /admin. The marketing site is static and must not pay for a
  // middleware hop, let alone an auth round trip, on every request.
  matcher: ["/admin/:path*"],
};
