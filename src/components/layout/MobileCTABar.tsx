"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScrollPast } from "@/hooks/use-scroll-past";
import { site, hasPhone } from "@/lib/site";
import { telHref, cn } from "@/lib/utils";

/**
 * Sticky mobile conversion bar. Appears once the visitor has moved past the
 * hero, and hides itself on the quote flow so it never competes with the form.
 */
export function MobileCTABar() {
  const pathname = usePathname();
  // Roughly one hero's worth of scrolling before the bar appears.
  const shown = useScrollPast(420);

  if (pathname.startsWith("/quote")) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-stone/20 lg:hidden",
        "glass transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        shown ? "translate-y-0" : "translate-y-full",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch gap-px p-2">
        <Link
          href="/quote"
          className="flex flex-1 items-center justify-center rounded-full bg-bronze px-5 py-3.5 text-[0.78rem] font-semibold tracking-[0.16em] text-paper uppercase"
        >
          Free Quote
        </Link>
        {hasPhone() ? (
          <a
            href={telHref(site.phone!)}
            className="flex items-center justify-center rounded-full border border-stone/35 px-6 py-3.5 text-[0.78rem] font-semibold tracking-[0.16em] text-bone uppercase"
          >
            Call
          </a>
        ) : (
          <Link
            href="/contact"
            className="flex items-center justify-center rounded-full border border-stone/35 px-6 py-3.5 text-[0.78rem] font-semibold tracking-[0.16em] text-bone uppercase"
          >
            Contact
          </Link>
        )}
      </div>
    </div>
  );
}
