import Link from "next/link";
import { ResetPasswordForm } from "@/components/admin/PasswordForms";
import { Logo } from "@/components/layout/Logo";

export const metadata = { title: "Set a new password", robots: { index: false } };

/**
 * Landing page for the emailed reset link.
 *
 * Supabase turns the link into a recovery session before this renders, so the
 * form below is only usable by whoever opened the email. Nothing on this page
 * reveals whether the link was valid — an expired one simply fails at submit,
 * with the same wording either way.
 */
export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block text-bone">
          <Logo />
        </Link>
        <h1 className="mt-12 font-display text-3xl font-medium tracking-[-0.03em] text-bone">
          Set a new password
        </h1>
        <p className="mt-3 text-sm text-sand/65">
          Choose something you have not used elsewhere.
        </p>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
