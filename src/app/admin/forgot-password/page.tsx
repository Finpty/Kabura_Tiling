import Link from "next/link";
import { ForgotPasswordForm } from "@/components/admin/PasswordForms";
import { Logo } from "@/components/layout/Logo";

export const metadata = { title: "Reset password", robots: { index: false } };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block text-bone">
          <Logo />
        </Link>
        <h1 className="mt-12 font-display text-3xl font-medium tracking-[-0.03em] text-bone">
          Reset your password
        </h1>
        <p className="mt-3 text-sm text-sand/65">
          We&rsquo;ll email you a link to set a new one.
        </p>
        {error === "link" ? (
          <p
            role="alert"
            className="mt-6 border-l border-bronze/50 bg-bronze/[0.06] px-4 py-3 text-sm leading-relaxed text-sand"
          >
            That reset link was invalid, already used, or expired — they work
            once. Enter your email below and we&rsquo;ll send a fresh one.
          </p>
        ) : null}
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
