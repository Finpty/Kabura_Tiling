"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { AmbientVideo } from "@/components/ui/AmbientVideo";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { RevealText } from "@/components/ui/RevealText";
import { img, video } from "@/lib/media";
import { site } from "@/lib/site";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { centreBlock, centreItems, centreRow, centreText } from "@/lib/align";
import { cn } from "@/lib/utils";

/**
 * Full-viewport cinematic opener.
 *
 * The background is a video when footage exists and a graded still otherwise —
 * the still is a real `next/image` with priority and a blur placeholder, so the
 * largest contentful paint is an optimised image either way, never a video.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-24%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const poster = img("heroBathroom");
  const clip = video("heroBathroom");

  return (
    <section
      ref={ref}
      className="grain relative isolate flex h-svh min-h-[38rem] flex-col justify-end overflow-hidden"
      aria-label="Introduction"
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={reduced ? undefined : { y, scale }}
      >
        <AmbientVideo
          video={clip}
          poster={poster}
          alt=""
          priority
          className="h-full w-full"
          objectPosition="center 42%"
        />
      </motion.div>

      {/* Cinematic scrims */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/72 via-ink/34 to-ink/40"
      />
      <div
        aria-hidden="true"
        className="scrim-bottom absolute inset-x-0 bottom-0 -z-10 h-3/4"
      />

      <motion.div
        className={cn("shell relative w-full pb-14 md:pb-20", centreText)}
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <div className={cn("flex items-center gap-4", centreRow)}>
          <span aria-hidden="true" className="hidden h-px lg:block w-12 bg-bronze-light/80" />
          <p className="eyebrow text-bronze-light">
            {site.state} · Tiling &amp; Waterproofing
          </p>
        </div>

        <RevealText
          as="h1"
          by="line"
          text={"CRAFTED IN TILE.\nBUILT TO LAST."}
          className="mt-7 block font-display text-hero font-semibold text-bone uppercase"
          stagger={0.11}
          delay={0.15}
        />

        <div
          className={cn(
            "mt-9 flex flex-col gap-9 lg:flex-row lg:items-end lg:justify-between",
            centreItems,
          )}
        >
          <motion.div
            className={cn("max-w-xl", centreBlock)}
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-lead text-bone/85">{site.proposition}</p>
            <p className="mt-4 font-serif text-2xl text-bronze-light italic md:text-3xl">
              {site.tagline}
            </p>
          </motion.div>

          <motion.div
            className={cn("flex flex-wrap items-center gap-3", centreRow)}
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <MagneticLink href="/quote" variant="solid" size="lg" withArrow>
              Request a Free Quote
            </MagneticLink>
            <MagneticLink href="/projects" variant="outline" size="lg">
              View Our Work
            </MagneticLink>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute right-6 bottom-8 hidden items-center gap-3 lg:flex"
        style={reduced ? undefined : { opacity: contentOpacity }}
      >
        <span className="eyebrow text-bone/50">Scroll</span>
        <span className="relative block h-12 w-px overflow-hidden bg-bone/20">
          <motion.span
            className="absolute inset-x-0 top-0 block h-4 bg-bronze-light"
            animate={reduced ? undefined : { y: ["-100%", "300%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
