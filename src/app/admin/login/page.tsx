import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/layout/Logo";
import { getAdminSession } from "@/lib/admin-auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block text-bone">
          <Logo />
        </Link>

        <h1 className="mt-12 font-display text-3xl font-medium tracking-[-0.03em] text-bone">
          Staff sign in
        </h1>
        <p className="mt-3 text-sm text-sand/65">
          Enquiries, statuses and internal notes.
        </p>

        {isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <p className="mt-8 border-l border-bronze/50 bg-bronze/[0.06] px-4 py-3 text-sm leading-relaxed text-sand">
            Supabase is not configured, so the dashboard is switched off. Add{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your environment (see{" "}
            <code>.env.example</code>), run the migration in{" "}
            <code>supabase/migrations</code>, then add your user id to the{" "}
            <code>admin_users</code> table.
          </p>
        )}

        <Link
          href="/"
          className="mt-10 inline-block text-xs text-stone transition-colors hover:text-sand"
        >
          ← Back to the site
        </Link>
      </div>
    </main>
  );
}
