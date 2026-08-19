"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Section, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { imageFill } from "@/lib/media";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn, pad } from "@/lib/utils";

/**
 * Five commitments about *how the work is done*. Deliberately contains no
 * claims about awards, certifications, years in business or job volumes —
 * none of which have been supplied.
 */
const PILLARS = [
  {
    id: "preparation",
    title: "Preparation first",
    body: "Proper preparation before installation. Substrates are checked and corrected rather than tiled over and hoped for.",
    image: "demolition",
  },
  {
    id: "waterproofing",
    title: "Waterproofing",
    body: "Wet areas completed properly — continuous membrane, reinforced junctions, sealed penetrations, and cure time before tiling.",
    image: "waterproofing",
  },
  {
    id: "precision",
    title: "Precision",
    body: "Clean lines, levels, joints and finishes. Set-out is decided before the first tile, not discovered at the last one.",
    image: "cornerDetail",
  },
  {
    id: "communication",
    title: "Communication",
    body: "Clear scheduling and project updates, so you know what is happening in your house and when.",
    image: "floorTiling",
  },
  {
    id: "complete",
    title: "Complete service",
    body: "From demolition and preparation through to final grout. One team carries the room the whole way.",
    image: "bathroom",
  },
];

export function WhyKabura() {
  const [active, setActive] = useState(0);
  const reduced = usePrefersReducedMotion();

  return (
    <Section
      id="why-kabura"
      spacing="loose"
      className="border-t border-stone/12 bg-charcoal"
      aria-labelledby="why-heading"
    >
      <div className="shell">
        <SectionLabel index="08" eyebrow="Why Kabura" />
        <h2
          id="why-heading"
          className="mt-6 max-w-2xl font-display text-headline text-bone"
        >
          The parts of the job that decide the result.
        </h2>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-16">
          <ul className="flex flex-col">
            {PILLARS.map((pillar, index) => {
              const isActive = index === active;
              return (
                <li key={pillar.id} className="border-b border-stone/18 first:border-t">
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onClick={() => setActive(index)}
                    aria-expanded={isActive}
                    className="group w-full py-6 text-left md:py-7"
                  >
                    <div className="flex items-baseline gap-5">
                      <span className="eyebrow text-bronze-light/75 tabular-nums">
                        {pad(index + 1)}
                      </span>
                      <span
                        className={cn(
                          "font-display text-2xl font-medium tracking-[-0.03em] transition-colors duration-400 md:text-4xl",
                          isActive ? "text-bone" : "text-sand/60",
                        )}
                      >
                        {pillar.title}
                      </span>
                    </div>
                    <motion.p
                      className="ml-[3.6rem] max-w-lg overflow-hidden text-sand/75"
                      initial={false}
                      animate={
                        reduced
                          ? undefined
                          : {
                              height: isActive ? "auto" : 0,
                              opacity: isActive ? 1 : 0,
                              marginTop: isActive ? 12 : 0,
                            }
                      }
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {pillar.body}
                    </motion.p>

                    {/* Mobile image travels with the open item */}
                    <span
                      className={cn(
                        "relative mt-5 ml-[3.6rem] block aspect-[3/2] overflow-hidden rounded-sm transition-all duration-500 lg:hidden",
                        isActive ? "opacity-100" : "hidden opacity-0",
                      )}
                    >
                      <Image
                        {...imageFill(pillar.image)}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 0px, 100vw"
                        className="object-cover"
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <Reveal className="hidden lg:block">
            <div className="sticky top-32 aspect-[4/5] overflow-hidden rounded-sm bg-ink">
              {PILLARS.map((pillar, index) => (
                <div
                  key={pillar.id}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    index === active ? "opacity-100" : "opacity-0",
                  )}
                >
                  <Image
                    {...imageFill(pillar.image)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 28rem, 100vw"
                    className={cn(
                      "object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                      index === active ? "scale-100" : "scale-105",
                    )}
                  />
                </div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
