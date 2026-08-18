"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Section, SectionLabel } from "@/components/ui/Section";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * The seven-step build sequence, driven by scroll.
 *
 * Distinct from the 3D slab: that one shows the *stack* in space, this one shows
 * the *order of work* in time. Each step lights up as it reaches the centre of
 * the viewport.
 */

const STEPS = [
  {
    id: "substrate",
    title: "Substrate",
    body: "Everything is judged against what is underneath. Sound, supported, and flat enough to take what follows.",
  },
  {
    id: "preparation",
    title: "Preparation",
    body: "Strip out, correct, sheet and pack. The stage that decides whether the rest of the job is easy or impossible.",
  },
  {
    id: "screed",
    title: "Screed",
    body: "Set from the waste and the finished floor level, worked to a straight edge so the falls hold across the whole area.",
  },
  {
    id: "waterproofing",
    title: "Waterproofing",
    body: "Continuous across the wet area, reinforced at every junction, sealed at every penetration, and given time to cure.",
  },
  {
    id: "adhesive",
    title: "Adhesive",
    body: "The right adhesive for the tile and the substrate, combed and back-buttered for full coverage behind the whole tile.",
  },
  {
    id: "tile",
    title: "Tile",
    body: "Set out before it is set down. Cuts balanced, joints lined through, levels held across the plane.",
  },
  {
    id: "grout",
    title: "Grout",
    body: "Packed, cleaned and finished, with silicone where the surface needs to move rather than crack.",
  },
];

function Step({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "end 40%"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0.25, 1, 1]);
  const x = useTransform(scrollYProgress, [0, 0.5], [-24, 0]);
  const lineScale = useTransform(scrollYProgress, [0, 0.6], [0, 1]);

  return (
    <li ref={ref} className="relative grid grid-cols-[auto_1fr] gap-6 pb-14 md:gap-10 md:pb-20">
      {/* Spine */}
      <div className="relative flex flex-col items-center">
        <motion.span
          aria-hidden="true"
          className="block h-3 w-3 rounded-full border border-bronze-light"
          style={reduced ? undefined : { opacity }}
        />
        {index < STEPS.length - 1 ? (
          <span
            aria-hidden="true"
            className="relative mt-2 block w-px flex-1 bg-stone/20"
          >
            <motion.span
              className="absolute inset-x-0 top-0 block h-full origin-top bg-bronze-light/70"
              style={reduced ? { scaleY: 1 } : { scaleY: lineScale }}
            />
          </span>
        ) : null}
      </div>

      <motion.div
        style={reduced ? undefined : { opacity, x }}
        className="max-w-2xl pb-2"
      >
        <div className="flex items-baseline gap-4">
          <span className="eyebrow text-bronze-light/80 tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3
            className={cn(
              "font-display text-3xl font-medium tracking-[-0.035em] text-bone md:text-5xl",
            )}
          >
            {step.title}
          </h3>
        </div>
        <p className="mt-3 text-lead text-sand/70 md:mt-4">{step.body}</p>
      </motion.div>
    </li>
  );
}

export function LayerStory() {
  return (
    <Section
      id="process"
      spacing="loose"
      className="border-t border-stone/12 bg-charcoal"
      aria-labelledby="process-heading"
    >
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionLabel index="03" eyebrow="The sequence" />
            <h2
              id="process-heading"
              className="mt-6 font-display text-headline text-bone"
            >
              Built properly from the first layer.
            </h2>
            <p className="mt-6 max-w-sm text-lead text-sand/70">
              Seven stages, in order. Skip one and the finish will tell on you
              eventually — usually in the most visible corner of the room.
            </p>
          </div>

          <ol className="relative">
            {STEPS.map((step, index) => (
              <Step key={step.id} step={step} index={index} />
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
