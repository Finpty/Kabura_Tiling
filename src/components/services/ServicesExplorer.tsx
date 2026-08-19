"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ServiceCard } from "./ServiceCard";
import { SERVICES, SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/services";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { centreRow } from "@/lib/align";
import { cn } from "@/lib/utils";

/**
 * The services grid, with a category filter.
 *
 * Every service is always in the DOM order the filter implies, so the grid
 * animates between states rather than rebuilding. The first card of each view
 * runs wide — twelve identical rectangles read as a list, one large card and a
 * grid behind it reads as an editorial page.
 */

type Filter = ServiceCategory | "All";

const FILTERS: Filter[] = ["All", ...SERVICE_CATEGORIES];

export function ServicesExplorer() {
  const [filter, setFilter] = useState<Filter>("All");
  const reduced = usePrefersReducedMotion();

  const visible = useMemo(
    () =>
      filter === "All"
        ? SERVICES
        : SERVICES.filter((service) => service.category === filter),
    [filter],
  );

  return (
    <div>
      {/* Filter */}
      <div
        role="tablist"
        aria-label="Filter services by category"
        className={cn("flex flex-wrap gap-2", centreRow)}
      >
        {FILTERS.map((option) => {
          const active = filter === option;
          const count =
            option === "All"
              ? SERVICES.length
              : SERVICES.filter((s) => s.category === option).length;

          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(option)}
              className={cn(
                "group relative overflow-hidden rounded-full border px-5 py-2.5",
                "text-[0.7rem] font-semibold tracking-[0.15em] uppercase",
                "transition-[color,border-color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                active
                  ? "border-bronze-light text-ink"
                  : "border-stone/30 text-sand/65 hover:-translate-y-0.5 hover:border-stone/60 hover:text-bone",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-bronze to-bronze-light transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  active ? "translate-y-0" : "translate-y-full",
                )}
              />
              <span className="relative">
                {option}
                <span
                  className={cn(
                    "ml-2 tabular-nums",
                    active ? "text-ink/60" : "text-stone/70",
                  )}
                >
                  {count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((service, index) => (
            <motion.div
              key={service.slug}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.97 }}
              transition={{
                duration: 0.55,
                delay: reduced ? 0 : Math.min(index * 0.04, 0.25),
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn(index === 0 && "sm:col-span-2")}
            >
              <ServiceCard
                service={service}
                index={SERVICES.indexOf(service)}
                feature={index === 0}
                priority={index < 2}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <p aria-live="polite" className="sr-only">
        Showing {visible.length} of {SERVICES.length} services
        {filter === "All" ? "" : ` in ${filter}`}.
      </p>
    </div>
  );
}
