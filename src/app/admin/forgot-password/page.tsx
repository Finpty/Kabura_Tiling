import Link from "next/link";
import { ForgotPasswordForm } from "@/components/admin/PasswordForms";
import { Logo } from "@/components/layout/Logo";

export const metadata = { title: "Reset password", robots: { index: false } };

export default function ForgotPasswordPage() {
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
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
