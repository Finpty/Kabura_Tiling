"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { AmbientVideo } from "@/components/ui/AmbientVideo";
import { SectionLabel } from "@/components/ui/Section";
import { img, video } from "@/lib/media";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { useIsDesktop } from "@/hooks/use-media-query";
import { pad } from "@/lib/utils";

/**
 * Horizontal film strip.
 *
 * On desktop the section pins and the rail translates with scroll. On touch it
 * degrades to a native horizontal scroller with snap points — no scroll
 * hijacking on the devices least able to afford it.
 *
 * Only panels that are actually on screen mount a video, and each one pauses the
 * moment it leaves, so at most one or two ever decode at once.
 */

const PANELS = [
  { id: "stone", title: "Stone selection", videoKey: "stoneSlabs", imageKey: "stoneSlab", caption: "Slabs chosen and matched before anything is cut." },
  { id: "cutting", title: "Precision cutting", videoKey: "largeFormat", imageKey: "largeFormat", caption: "Mitres, cut-outs and edges worked to the millimetre." },
  { id: "waterproofing", title: "Waterproofing", videoKey: "waterproofing", imageKey: "waterproofing", caption: "The layer that decides whether the room lasts." },
  { id: "screeding", title: "Screeding", videoKey: null, imageKey: "screed", caption: "Falls set from the waste, checked with a straight edge." },
  { id: "large-format", title: "Large format", videoKey: "largeFormat", imageKey: "floorTiling", caption: "Full coverage, levelling systems, minimal joints." },
  { id: "finish", title: "The finish", videoKey: "bathroomReveal", imageKey: "bathroomReveal", caption: "Grouted, sealed, cleaned down and handed over." },
];

export function VideoRail() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const isDesktop = useIsDesktop();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-66%"]);
  const pinned = isDesktop && !reduced;

  const panels = PANELS.map((panel, index) => {
    const clip = panel.videoKey ? video(panel.videoKey) : null;
    return (
      <article
        key={panel.id}
        className="relative flex h-[62vh] w-[78vw] shrink-0 snap-center flex-col overflow-hidden rounded-sm bg-charcoal-2 md:h-[66vh] md:w-[38vw] lg:w-[30vw]"
      >
        <AmbientVideo
          video={clip}
          poster={img(panel.imageKey)}
          alt={panel.title}
          className="absolute inset-0 h-full w-full"
          placeholderLabel={clip ? undefined : "Footage to come"}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/25 to-ink/15"
        />
        <div className="relative mt-auto p-6 md:p-7">
          <span className="eyebrow text-bronze-light/85 tabular-nums">
            {pad(index + 1)}
          </span>
          <h3 className="mt-3 font-display text-2xl font-medium tracking-[-0.03em] text-bone md:text-3xl">
            {panel.title}
          </h3>
          <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-sand/75">
            {panel.caption}
          </p>
        </div>
      </article>
    );
  });

  return (
    <section
      ref={sectionRef}
      id="film"
      aria-labelledby="film-heading"
      className="relative border-t border-stone/12 bg-ink lg:h-[300svh]"
    >
      <div className="lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-center lg:overflow-hidden">
        <div className="shell pt-20 pb-10 lg:pt-0 lg:pb-12">
          <SectionLabel index="07" eyebrow="On site" />
          <h2
            id="film-heading"
            className="mt-6 max-w-2xl font-display text-headline text-bone"
          >
            The work, frame by frame.
          </h2>
        </div>

        {pinned ? (
          <motion.div style={{ x }} className="flex gap-5 pl-[5vw] will-change-transform">
            {panels}
          </motion.div>
        ) : (
          <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-20 md:px-10 lg:pb-0">
            {panels}
          </div>
        )}
      </div>
    </section>
  );
}
