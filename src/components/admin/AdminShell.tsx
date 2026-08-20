"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

/**
 * The frame every admin screen sits in.
 *
 * ── Built for a phone first, on purpose ─────────────────────────────────────
 * This gets used standing in a stripped-out bathroom with one hand free. So
 * the primary navigation on a phone is a fixed bar at the *bottom*, where a
 * thumb reaches without shifting grip, and it carries the five things worth
 * interrupting a job for. Everything else lives behind "More". On a laptop the
 * same links become a sidebar, because a bottom bar on a 1440px screen is a
 * phone app pretending.
 *
 * Nothing here animates beyond a colour change. Financial screens are read at
 * speed, often in bad light, and movement on a number is noise.
 */

type Item = { href: string; label: string; icon: ReactNode; exact?: boolean };

const icon = (path: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="h-5 w-5"
  >
    <path d={path} />
  </svg>
);

/** The five that earn a place under a thumb. */
const PRIMARY: Item[] = [
  { href: "/admin", label: "Today", exact: true, icon: icon("M3 12h4l3 8 4-16 3 8h4") },
  { href: "/admin/calendar", label: "Calendar", icon: icon("M3 9h18M7 3v4M17 3v4M4 5h16v16H4z") },
  { href: "/admin/jobs", label: "Jobs", icon: icon("M3 7h18v13H3zM8 7V4h8v3") },
  { href: "/admin/quotes", label: "Quotes", icon: icon("M6 3h9l4 4v14H6zM14 3v5h5") },
  { href: "/admin/finance", label: "Money", icon: icon("M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6") },
];

const SECONDARY: Item[] = [
  { href: "/admin/bookings", label: "Booking requests", icon: icon("M9 12l2 2 4-4M4 5h16v16H4zM7 3v4M17 3v4") },
  { href: "/admin/expenses", label: "Expenses", icon: icon("M3 6h18v12H3zM3 10h18M7 15h4") },
  { href: "/admin/customers", label: "Customers", icon: icon("M16 20v-1a4 4 0 0 0-8 0v1M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7") },
  { href: "/admin/settings", label: "Settings", icon: icon("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 2.6 14H2.4a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 2.6V2.4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1") },
];

function isCurrent(pathname: string, item: Item) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function AdminShell({
  email,
  children,
}: {
  email: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col bg-ink lg:flex-row">
      {/* Sidebar — laptop and up */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-stone/12 bg-charcoal/40 lg:flex">
        <div className="border-b border-stone/12 px-5 py-5">
          <Link href="/admin" className="font-display text-lg text-bone">
            Kabura
          </Link>
          <p className="mt-0.5 text-[0.62rem] tracking-[0.18em] text-bronze-light uppercase">
            Business portal
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {[...PRIMARY, ...SECONDARY].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isCurrent(pathname, item)
                  ? "bg-bronze/15 text-bone"
                  : "text-sand/70 hover:bg-bone/[0.04] hover:text-bone",
              )}
            >
              <span
                className={
                  isCurrent(pathname, item) ? "text-bronze-light" : "text-stone"
                }
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-stone/12 p-3">
          <p className="truncate px-3 text-[0.68rem] text-stone">{email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-sand/70 transition-colors hover:bg-bone/[0.04] hover:text-bone"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Phone header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-stone/12 bg-ink/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <Link href="/admin" className="font-display text-base text-bone">
          Kabura
          <span className="ml-2 text-[0.6rem] tracking-[0.16em] text-bronze-light uppercase">
            Portal
          </span>
        </Link>
        <form action={signOut}>
          <button type="submit" className="text-xs text-stone">
            Sign out
          </button>
        </form>
      </header>

      <main className="flex-1 pb-24 lg:pb-0">{children}</main>

      {/* Phone navigation — bottom, thumb height */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone/15 bg-ink/95 backdrop-blur-sm lg:hidden">
        {moreOpen ? (
          <div className="grid grid-cols-2 gap-1 border-b border-stone/12 p-2">
            {SECONDARY.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-3 text-[0.8rem]",
                  isCurrent(pathname, item)
                    ? "bg-bronze/15 text-bone"
                    : "text-sand/75",
                )}
              >
                <span className="text-stone">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-6">
          {PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                // 56px of height: the smallest target that is reliably hit
                // with a thumb while holding something in the other hand.
                "flex min-h-[3.5rem] flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6rem] transition-colors",
                isCurrent(pathname, item)
                  ? "text-bronze-light"
                  : "text-stone hover:text-sand",
              )}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            className={cn(
              "flex min-h-[3.5rem] flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6rem] transition-colors",
              moreOpen ? "text-bronze-light" : "text-stone",
            )}
          >
            {icon("M5 12h.01M12 12h.01M19 12h.01")}
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
