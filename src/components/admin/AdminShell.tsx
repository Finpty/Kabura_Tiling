import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";
import { signOut } from "@/app/admin/actions";

const SECTIONS = [
  { href: "/admin", label: "Enquiries" },
  { href: "/admin/calendar", label: "Calendar" },
] as const;

export function AdminShell({
  email,
  children,
}: {
  email: string | null;
  children: ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone/15 bg-charcoal/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[110rem] items-center justify-between gap-6 px-5 md:px-8">
          <div className="flex items-center gap-5">
            <Link href="/admin" className="text-bone">
              <Logo markOnly className="md:hidden" />
              <Logo className="hidden md:flex" />
            </Link>
            <span className="hidden rounded-full border border-stone/30 px-3 py-1 text-[0.6rem] font-medium tracking-[0.16em] text-stone-light uppercase sm:inline-block">
              Admin
            </span>

            <nav aria-label="Dashboard" className="flex items-center gap-1">
              {SECTIONS.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="rounded-full px-3 py-1.5 text-xs text-stone transition-colors hover:bg-charcoal-2 hover:text-sand"
                >
                  {section.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="hidden text-xs text-stone transition-colors hover:text-sand sm:block"
            >
              View site
            </Link>
            {email ? (
              <span className="hidden text-xs text-stone md:block">
                {email}
              </span>
            ) : null}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-stone/30 px-4 py-2 text-[0.68rem] font-medium tracking-[0.14em] text-sand uppercase transition-colors hover:border-bronze-light hover:text-bronze-light"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[110rem] flex-1 px-5 py-10 md:px-8">
        {children}
      </main>
    </>
  );
}
