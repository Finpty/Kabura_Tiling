"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { imageFill } from "@/lib/media";
import type { Project } from "@/lib/projects";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn, pad } from "@/lib/utils";

type Props = {
  project: Project;
  index: number;
  className?: string;
  priority?: boolean;
};

/**
 * Portfolio tile, drawn like a technical plate.
 *
 * The framing borrows from a drawing sheet rather than a lookbook: corner
 * registration marks, a measure rule along the bottom edge, and a spec strip
 * that slides up on hover with the numbers a tiler actually cares about — tile
 * size, format, suburb. It suits the trade better than a caption would, and it
 * gives the card something to *do* on hover beyond growing slightly.
 *
 * The image holds a slow scroll parallax and desaturates a touch until the
 * card is hovered, so a grid of six reads as one composition and the one under
 * the cursor is unmistakably the live one.
 */

/** Corner registration mark, mirrored into each corner by rotation. */
function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute h-4 w-4 border-bone/0 transition-[border-color,width,height] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "group-hover:h-6 group-hover:w-6 group-hover:border-bronze-light/70",
        className,
      )}
    />
  );
}

export function ProjectCard({ project, index, className, priority }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  const specs = [
    ["Format", project.tileSize],
    ["Tile", project.tileType],
    ["Location", project.suburb],
  ] as const;

  return (
    <motion.article
      ref={ref}
      className={cn("group relative", className)}
      initial={reduced ? false : { opacity: 0, y: 32 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/projects/${project.slug}`} className="block">
        <div
          className={cn(
            "relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-stone/18 bg-charcoal-2",
            "transition-[border-color,box-shadow,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "group-hover:-translate-y-1.5 group-hover:border-bronze-light/45",
            "group-hover:shadow-[0_36px_80px_-40px_color-mix(in_oklab,var(--color-bronze)_60%,transparent)]",
          )}
        >
          <motion.div
            className="absolute inset-[-8%]"
            style={reduced ? undefined : { y }}
          >
            <Image
              {...imageFill(project.cover)}
              alt={project.title}
              fill
              sizes="(min-width: 1280px) 32vw, (min-width: 768px) 46vw, 92vw"
              priority={priority}
              className="object-cover saturate-[0.82] transition-[transform,filter] duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] group-hover:saturate-100"
            />
          </motion.div>

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/15 to-ink/25 transition-opacity duration-700"
          />

          {/* Setting-out grid, the way a tiler chalks a floor before laying it */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            style={{
              backgroundImage:
                "linear-gradient(color-mix(in oklab, var(--color-bone) 22%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--color-bone) 22%, transparent) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage:
                "radial-gradient(circle at 50% 38%, #000 0%, transparent 72%)",
            }}
          />

          {/* Registration marks */}
          <Corner className="top-3 left-3 border-t border-l" />
          <Corner className="top-3 right-3 border-t border-r" />
          <Corner className="bottom-3 left-3 border-b border-l" />
          <Corner className="bottom-3 right-3 border-b border-r" />

          {project.isPlaceholder ? (
            <span className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-bronze/50 bg-ink/75 px-3 py-1 text-[0.58rem] font-medium tracking-[0.18em] text-bronze-light uppercase backdrop-blur-sm">
              Sample
            </span>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
            <div className="flex items-center gap-3">
              <span className="eyebrow text-bronze-light/85 tabular-nums">
                {pad(index + 1)}
              </span>
              <span
                aria-hidden="true"
                className="h-px w-6 origin-left bg-bronze-light/50 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-[2.2]"
              />
              <span className="eyebrow text-sand/70">{project.category}</span>
            </div>

            <h3 className="mt-3 font-display text-xl font-medium tracking-[-0.03em] text-bone md:text-2xl">
              {project.title}
            </h3>

            {/* Spec strip — collapsed until hover, so the grid stays calm */}
            <dl
              className={cn(
                "grid grid-cols-3 gap-x-4 overflow-hidden border-t border-bone/15",
                "max-h-0 opacity-0 transition-[max-height,opacity,margin,padding] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                "group-hover:mt-4 group-hover:max-h-24 group-hover:pt-3 group-hover:opacity-100",
                "group-focus-within:mt-4 group-focus-within:max-h-24 group-focus-within:pt-3 group-focus-within:opacity-100",
              )}
            >
              {specs.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-[0.55rem] tracking-[0.16em] text-stone uppercase">
                    {label}
                  </dt>
                  <dd className="mt-1 truncate text-[0.72rem] text-sand/85 tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Measure rule along the bottom edge */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-bronze-light via-bronze-light/60 to-transparent transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
          />
        </div>
      </Link>
    </motion.article>
  );
}
