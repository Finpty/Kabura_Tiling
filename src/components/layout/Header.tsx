"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "./Logo";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { useScrollPast } from "@/hooks/use-scroll-past";
import { NAV_LINKS, site, hasPhone } from "@/lib/site";
import { telHref } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Transparent over the hero, then a quiet glass bar once the page moves.
 * The mobile panel traps nothing and closes on route change, Escape, or a
 * backdrop click.
 */
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const scrolled = useScrollPast(24);

  // Close the panel on navigation by adjusting state during render — the
  // documented alternative to an effect, and it avoids a flash of the open menu
  // on the new route.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-full bg-bone px-5 py-3 text-sm font-medium text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          scrolled || open
            ? "glass border-b border-stone/15"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="shell flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link
            href="/"
            aria-label={`${site.name} — home`}
            className="text-bone transition-opacity duration-300 hover:opacity-75"
          >
            <Logo />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {NAV_LINKS.map((link) => {
                const active =
                  pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "link-underline text-[0.82rem] font-medium tracking-[0.02em] transition-colors duration-300",
                        active ? "text-bone" : "text-sand/75 hover:text-bone",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            {hasPhone() ? (
              <a
                href={telHref(site.phone!)}
                className="hidden text-[0.82rem] font-medium tracking-[0.02em] text-sand/80 transition-colors duration-300 hover:text-bone xl:block"
              >
                {site.phone}
              </a>
            ) : null}

            <MagneticLink
              href="/quote"
              variant="bronze"
              size="sm"
              className="hidden sm:inline-flex"
            >
              Get a Quote
            </MagneticLink>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-stone/30 text-bone lg:hidden"
            >
              <span className="sr-only">
                {open ? "Close menu" : "Open menu"}
              </span>
              <span aria-hidden="true" className="relative block h-3 w-4">
                <span
                  className={cn(
                    "absolute left-0 block h-px w-4 bg-current transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    open ? "top-1.5 rotate-45" : "top-0",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 block h-px w-4 bg-current transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    open ? "top-1.5 -rotate-45" : "top-3",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-ink/80 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />
            <motion.nav
              aria-label="Mobile"
              className="absolute inset-x-0 top-[var(--header-h)] border-t border-stone/15 bg-charcoal px-6 pt-8 pb-10"
              initial={{ y: -18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <ul className="flex flex-col">
                {NAV_LINKS.map((link, index) => (
                  <li key={link.href} className="border-b border-stone/12">
                    <Link
                      href={link.href}
                      className="flex items-baseline gap-4 py-4 text-2xl font-medium tracking-[-0.02em] text-bone"
                    >
                      <span className="eyebrow w-6 text-bronze-light tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3">
                <MagneticLink href="/quote" variant="bronze" size="md">
                  Request a Free Quote
                </MagneticLink>
                {hasPhone() ? (
                  <a
                    href={telHref(site.phone!)}
                    className="text-center text-sm text-sand/80"
                  >
                    {site.phone}
                  </a>
                ) : null}
              </div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
