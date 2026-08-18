"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SLAB_LAYERS } from "./layers";
import { useDeviceCapability } from "@/hooks/use-device-capability";
import { imageProps } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * The 3D bundle is a separate chunk that is never requested on the server, never
 * requested on a device that fails the capability check, and never requested
 * until the section is close to the viewport.
 */
const SlabScene = dynamic(() => import("./SlabScene"), { ssr: false });

/**
 * Lightweight fallback: the same five layers, drawn as stacked plates in CSS.
 * Mobile, low-power devices and reduced-motion visitors get this — it carries
 * exactly the same message with no WebGL context and no shader compilation.
 */
function SlabFallback({ progress }: { progress: number }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center perspective">
      <div className="preserve-3d relative h-[16rem] w-[19rem] sm:h-[20rem] sm:w-[26rem]">
        {SLAB_LAYERS.map((layer, index) => (
          <div
            key={layer.id}
            className="absolute inset-x-0 top-1/2 h-24 rounded-[3px] border border-bone/10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] backface-hidden"
            style={{
              background: `linear-gradient(160deg, ${layer.colour} 0%, ${layer.colour}cc 55%, ${layer.colour}88 100%)`,
              transform: `translateY(-50%) rotateX(58deg) rotateZ(-38deg) translate3d(${index * 14 * progress}px, ${index * 34 * progress - index * 6}px, ${-index * 26}px)`,
              opacity: index === 0 ? 1 : 0.45 + 0.55 * progress,
              zIndex: SLAB_LAYERS.length - index,
              transition: "transform 700ms cubic-bezier(0.16,1,0.3,1), opacity 700ms",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function SlabStage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [near, setNear] = useState(false);
  const { ready, allow3d } = useDeviceCapability();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  /* Feed the imperative ref that drives the r3f frame loop, plus React state
     for the HTML labels. The canvas never re-renders from React. */
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (value) => {
      const eased = Math.min(1, Math.max(0, (value - 0.08) / 0.62));
      progressRef.current = eased;
      setProgress(eased);
    });
    return () => unsub();
  }, [scrollYProgress]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setNear(true),
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const headingOpacity = useTransform(scrollYProgress, [0, 0.12, 0.8, 1], [1, 1, 1, 0.35]);
  const use3d = ready && allow3d && near;
  const activeIndex = Math.min(
    SLAB_LAYERS.length - 1,
    Math.floor(progress * SLAB_LAYERS.length),
  );

  return (
    <section
      ref={sectionRef}
      id="under-the-tile"
      aria-labelledby="under-the-tile-heading"
      className="relative h-[210svh] bg-ink lg:h-[320svh]"
    >
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
        {/* Ambient backdrop */}
        <div aria-hidden="true" className="absolute inset-0">
          <Image
            {...imageProps("stoneSlab")}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-[0.13]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/60 to-ink" />
        </div>

        <div className="shell relative z-10 flex flex-1 flex-col pt-24 pb-24 md:pt-28 lg:pb-10">
          <motion.div style={{ opacity: headingOpacity }} className="max-w-3xl">
            <p className="eyebrow text-bronze-light">02 — The build-up</p>
            <h2
              id="under-the-tile-heading"
              className="mt-5 font-display text-headline text-bone"
            >
              What&rsquo;s under the tile matters.
            </h2>
            <p className="mt-5 max-w-md text-lead text-sand/75">
              A finished surface is the last of six decisions. Scroll to take it
              apart.
            </p>
          </motion.div>

          <div className="relative mt-4 flex flex-1 flex-col gap-4 lg:mt-0 lg:flex-row lg:items-center">
            <div className="relative min-h-[15rem] flex-1 overflow-hidden lg:absolute lg:inset-0 lg:min-h-0 lg:overflow-visible">
              {use3d ? (
                <SlabScene
                  progress={progressRef}
                  textureUrl={imageProps("stoneSlab").src}
                  className="h-full w-full"
                />
              ) : (
                <SlabFallback progress={progress} />
              )}
            </div>

            {/* Layer labels — real HTML, outside the canvas */}
            <ol className="relative flex w-full flex-col gap-px lg:ml-auto lg:max-w-sm">
              {SLAB_LAYERS.map((layer, index) => {
                const active = index === activeIndex && progress > 0.04;
                return (
                  <li
                    key={layer.id}
                    className={cn(
                      "group border-l-2 py-3 pl-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      active
                        ? "border-bronze-light bg-bone/[0.04]"
                        : "border-stone/25",
                    )}
                  >
                    <div className="flex items-baseline gap-3">
                      <span
                        aria-hidden="true"
                        className="eyebrow text-bronze-light/80 tabular-nums"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3
                        className={cn(
                          "font-display text-lg tracking-[-0.02em] transition-colors duration-500 md:text-xl",
                          active ? "text-bone" : "text-sand/60",
                        )}
                      >
                        {layer.label}
                      </h3>
                    </div>
                    <p
                      className={cn(
                        "mt-1 max-w-[24ch] text-sm leading-relaxed transition-all duration-500",
                        active
                          ? "text-sand/85 opacity-100"
                          : "text-sand/40 opacity-70",
                      )}
                    >
                      {layer.detail}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>

          <p className="relative z-10 mt-6 max-w-xl font-serif text-xl text-bronze-light italic md:text-2xl">
            Kabura does more than lay tiles.
          </p>
        </div>
      </div>
    </section>
  );
}
