import Link from "next/link";
import { ResetPasswordForm } from "@/components/admin/PasswordForms";
import { Logo } from "@/components/layout/Logo";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Set a new password", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Where the emailed reset link ends up — via `/auth/confirm`, which has
 * already exchanged the one-time token for a session and written the cookies
 * before anyone reaches this page. By the time this renders there are exactly
 * two possibilities, and the page shows a different thing for each:
 *
 *   · a session exists (fresh recovery, or an admin already signed in) —
 *     render the form; the action re-checks the session before writing.
 *   · no session — the link was already used, expired, or someone typed the
 *     URL by hand. No form: a plain explanation and the one useful button,
 *     because a form that can only fail is worse than no form.
 */
export default async function ResetPasswordPage() {
  const supabase = await createServerSupabase();
  const user = supabase
    ? (await supabase.auth.getUser()).data.user
    : null;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block text-bone">
          <Logo />
        </Link>

        {user ? (
          <>
            <h1 className="mt-12 font-display text-3xl font-medium tracking-[-0.03em] text-bone">
              Set a new password
            </h1>
            <p className="mt-3 text-sm text-sand/65">
              For {user.email}. Choose something you have not used elsewhere.
            </p>
            <ResetPasswordForm />
          </>
        ) : (
          <>
            <h1 className="mt-12 font-display text-3xl font-medium tracking-[-0.03em] text-bone">
              That link has been used or has expired
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-sand/65">
              Reset links work once and only for a short while. Request a fresh
              one and use it straight away.
            </p>
            <Link
              href="/admin/forgot-password"
              className="mt-8 inline-flex h-12 items-center rounded-full bg-bronze px-8 text-[0.72rem] font-semibold tracking-[0.16em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink"
            >
              Request a new reset link
            </Link>
            <p className="mt-6 text-xs text-stone">
              Know your password?{" "}
              <Link href="/admin/login" className="text-sand hover:text-bone">
                Sign in instead
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </main>
  );
}
