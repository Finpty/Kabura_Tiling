"use client";

import Link from "next/link";
import { useState } from "react";
import { Section, SectionLabel } from "@/components/ui/Section";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { CoverageMap } from "@/components/service-areas/CoverageMap";
import { SERVICE_AREAS } from "@/lib/service-areas";
import { site } from "@/lib/site";
import { centreBlock, centreRow, centreText } from "@/lib/align";
import { cn, pad } from "@/lib/utils";

/**
 * Service areas.
 *
 * Lists only the locations Kabura has confirmed. It never claims blanket WA
 * coverage — anywhere else is an explicit "ask us" rather than an implied yes.
 */
export function ServiceAreasSection() {
  const [active, setActive] = useState(0);
  const area = SERVICE_AREAS[active];

  return (
    <Section
      id="service-areas"
      spacing="loose"
      className="border-t border-stone/12 bg-charcoal"
      aria-labelledby="areas-heading"
    >
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
          <div>
            <SectionLabel
              index="12"
              eyebrow="Where we work"
              className={centreRow}
            />
            <h2
              id="areas-heading"
              className={cn(
                "mt-6 max-w-xl font-display text-headline text-bone",
                centreText,
                centreBlock,
              )}
            >
              Areas we service.
            </h2>
            <p
              className={cn(
                "mt-5 max-w-lg text-lead text-sand/75",
                centreText,
                centreBlock,
              )}
            >
              The suburbs we have confirmed we cover, across the Perth,
              Rockingham and Mandurah corridor.
            </p>

            <ul className="mt-12 border-t border-stone/18">
              {SERVICE_AREAS.map((item, index) => (
                <li key={item.slug} className="border-b border-stone/18">
                  <Link
                    href={`/service-areas/${item.slug}`}
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    className="group flex items-baseline justify-between gap-6 py-5"
                  >
                    <span className="flex items-baseline gap-5">
                      <span className="eyebrow text-bronze-light/70 tabular-nums">
                        {pad(index + 1)}
                      </span>
                      <span
                        className={cn(
                          "font-display text-2xl font-medium tracking-[-0.03em] transition-colors duration-400 md:text-4xl",
                          index === active ? "text-bone" : "text-sand/65",
                        )}
                      >
                        {item.name}
                      </span>
                    </span>
                    <span className="hidden text-xs text-stone tabular-nums sm:block">
                      {item.postcodes.join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-8 lg:sticky lg:top-32 lg:self-start">
            <CoverageMap />

            <div className="border border-stone/20 bg-ink/50 p-7">
              <p className="eyebrow text-bronze-light">{area.region}</p>
              <h3 className="mt-4 font-display text-3xl font-medium tracking-[-0.03em] text-bone">
                {area.name}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-sand/75">
                {area.intro}
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {area.notes.map((note) => (
                  <li
                    key={note}
                    className="flex gap-3 text-sm leading-relaxed text-sand/65"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 block h-1 w-1 shrink-0 rounded-full bg-bronze-light"
                    />
                    {note}
                  </li>
                ))}
              </ul>
              <MagneticLink
                href={`/service-areas/${area.slug}`}
                variant="outline"
                size="sm"
                className="mt-7"
                withArrow
              >
                {area.name} tiling
              </MagneticLink>
            </div>

            <div className={cn(centreText, centreBlock)}>
              <p className="text-sm leading-relaxed text-sand/60">
                Somewhere else in {site.state}? We have not listed every suburb
                — send us the address and we will tell you honestly whether we
                can get there.
              </p>
              <div className={cn("mt-6 flex flex-wrap gap-3", centreRow)}>
                <MagneticLink
                  href="/service-areas"
                  variant="outline"
                  size="sm"
                  withArrow
                >
                  View service areas
                </MagneticLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
