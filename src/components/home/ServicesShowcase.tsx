"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Section, SectionLabel } from "@/components/ui/Section";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { SERVICES } from "@/lib/services";
import { imageProps } from "@/lib/media";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn, pad } from "@/lib/utils";

/**
 * Interactive service index.
 *
 * Desktop: a list of oversized rows; hovering or focusing a row swaps the
 * backing image behind the whole section and lifts the row in Z.
 * Mobile: the same rows, each with its own inline image — no hover dependency,
 * and nothing is hidden behind an interaction a touch device cannot perform.
 */
export function ServicesShowcase() {
  const [active, setActive] = useState(0);
  const reduced = usePrefersReducedMotion();
  const isDesktop = useIsDesktop();
  const activeService = SERVICES[active];

  return (
    <Section
      id="services"
      spacing="loose"
      className="relative overflow-hidden border-t border-stone/12 bg-ink"
      aria-labelledby="services-heading"
    >
      {/* Backdrop swaps with the focused service */}
      <div aria-hidden="true" className="absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.div
            key={activeService.image}
            className="absolute inset-0"
            initial={reduced ? false : { opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              {...imageProps(activeService.image)}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
        {/* Enough scrim to hold the type, little enough that the image reads. */}
        <div className="absolute inset-0 bg-ink/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/78 to-ink/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/60" />
      </div>

      <div className="shell relative">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel index="04" eyebrow="What we do" />
            <h2
              id="services-heading"
              className="mt-6 max-w-xl font-display text-headline text-bone"
            >
              Twelve ways we finish a room properly.
            </h2>
          </div>
          <MagneticLink href="/services" variant="outline" size="md" withArrow>
            All services
          </MagneticLink>
        </div>

        <ul className="mt-14 border-t border-stone/18">
          {SERVICES.map((service, index) => {
            const isActive = index === active;
            return (
              <li key={service.slug} className="border-b border-stone/18">
                <Link
                  href={`/services/${service.slug}`}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  className={cn(
                    "group relative flex flex-col gap-4 py-6 transition-[padding,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:grid md:grid-cols-[4rem_1fr_auto] md:items-center md:gap-8 md:py-7",
                    isActive && isDesktop && "md:pl-5",
                  )}
                >
                  {/* Bronze wash on the active row */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-y-0 -left-4 -right-4 -z-10 origin-left bg-gradient-to-r from-bone/[0.055] to-transparent transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      isActive && isDesktop ? "scale-x-100" : "scale-x-0",
                    )}
                  />

                  <span className="eyebrow text-bronze-light/70 tabular-nums">
                    {pad(index + 1)}
                  </span>

                  <span className="flex flex-col gap-2 md:flex-row md:items-baseline md:gap-6">
                    <span
                      className={cn(
                        "font-display text-2xl font-medium tracking-[-0.03em] transition-colors duration-400 md:text-4xl",
                        isActive ? "text-bone" : "text-sand/70",
                      )}
                    >
                      {service.title}
                    </span>
                    <span
                      className={cn(
                        "max-w-md text-sm leading-relaxed transition-colors duration-400 md:text-[0.9rem]",
                        isActive ? "text-sand/80" : "text-sand/45",
                      )}
                    >
                      {service.summary}
                    </span>
                  </span>

                  <span
                    className={cn(
                      "hidden items-center gap-3 text-[0.72rem] font-medium tracking-[0.16em] uppercase transition-all duration-500 md:flex",
                      isActive
                        ? "translate-x-0 text-bronze-light opacity-100"
                        : "translate-x-3 text-sand/40 opacity-0",
                    )}
                  >
                    View
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                      <path
                        d="M1 11 11 1M4 1h7v7"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                    </svg>
                  </span>

                  {/* Mobile: the image travels with the row */}
                  <span className="relative block aspect-[16/7] w-full overflow-hidden rounded-sm md:hidden">
                    <Image
                      {...imageProps(service.image)}
                      alt=""
                      fill
                      sizes="100vw"
                      className="object-cover opacity-80"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
