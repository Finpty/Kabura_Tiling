"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { AmbientVideo } from "@/components/ui/AmbientVideo";
import type { Service } from "@/lib/services";
import { imageFill, img, video } from "@/lib/media";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { useIsCoarsePointer } from "@/hooks/use-media-query";
import { cn, pad } from "@/lib/utils";

/**
 * A service, as a card.
 *
 * The whole card is one link — no nested interactive elements, so a screen
 * reader announces it once and a keyboard tabs through twelve of these rather
 * than thirty-six.
 *
 * Motion is layered so it degrades cleanly: the image zoom and the bronze wash
 * are CSS on `:hover`, the parallax follows the pointer and is skipped on
 * touch, and the whole lot is inert under `prefers-reduced-motion`. Footage,
 * where a service has it, only loads on a fine pointer — a phone gets the
 * still, which is what it wants anyway.
 */

type Props = {
  service: Service;
  index: number;
  /** The first card in each category runs wide and taller. */
  feature?: boolean;
  priority?: boolean;
};

export function ServiceCard({ service, index, feature = false, priority }: Props) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const reduced = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();
  const parallax = !reduced && !coarse;
  const clip = video(service.video ?? "");

  /**
   * Pointer parallax, written straight to CSS custom properties.
   * Deliberately not React state: this fires on every mouse move, and a
   * re-render per frame across twelve cards would cost more than the effect is
   * worth.
   */
  const onMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!parallax) return;
    const node = cardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty("--px", `${(px * 14).toFixed(2)}px`);
    node.style.setProperty("--py", `${(py * 14).toFixed(2)}px`);
  };

  const onLeave = () => {
    const node = cardRef.current;
    if (!node) return;
    node.style.setProperty("--px", "0px");
    node.style.setProperty("--py", "0px");
  };

  return (
    <Link
      ref={cardRef}
      href={`/services/${service.slug}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ ["--px" as string]: "0px", ["--py" as string]: "0px" }}
      className={cn(
        "group relative isolate flex flex-col justify-end overflow-hidden rounded-2xl border border-stone/18 bg-charcoal",
        "transition-[border-color,transform,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:-translate-y-1.5 hover:border-bronze-light/45",
        "hover:shadow-[0_36px_80px_-40px_color-mix(in_oklab,var(--color-bronze)_60%,transparent)]",
        "focus-visible:-translate-y-1.5 focus-visible:border-bronze-light/45",
        feature
          ? "min-h-[26rem] sm:col-span-2 sm:min-h-[30rem]"
          : "min-h-[22rem]",
      )}
    >
      {/* Media */}
      <span aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <span
          className={cn(
            "absolute inset-[-8%] block",
            "transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            "group-hover:scale-[1.06]",
          )}
          style={
            parallax
              ? { transform: "translate3d(var(--px), var(--py), 0)" }
              : undefined
          }
        >
          {clip && parallax ? (
            <AmbientVideo
              video={clip}
              poster={img(service.image)}
              alt=""
              className="h-full w-full"
              sizes={feature ? "(min-width: 640px) 60vw, 92vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"}
            />
          ) : (
            <Image
              {...imageFill(service.image)}
              alt=""
              fill
              priority={priority}
              sizes={
                feature
                  ? "(min-width: 640px) 60vw, 92vw"
                  : "(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
              }
              className="object-cover"
            />
          )}
        </span>

        {/* Legibility scrim, then a bronze wash that only arrives on hover. */}
        <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
        <span className="absolute inset-0 bg-gradient-to-t from-bronze/35 via-transparent to-transparent opacity-0 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100" />
      </span>

      {/* Hairline that lights up from the left */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-bronze-light via-bronze-light/60 to-transparent transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
      />

      <span className="relative flex items-start justify-between gap-4 p-6 md:p-7">
        <span className="min-w-0">
          <span className="eyebrow block text-bronze-light/85 tabular-nums">
            {pad(index + 1)} — {service.category}
          </span>
          <span
            className={cn(
              "mt-3 block font-display font-medium tracking-[-0.03em] text-bone",
              feature ? "text-3xl md:text-4xl" : "text-2xl",
            )}
          >
            {service.title}
          </span>
          <span
            className={cn(
              "mt-3 block text-sm leading-relaxed text-sand/75",
              feature ? "max-w-lg" : "max-w-sm",
              // The summary is the reward for hovering on a compact card; on the
              // feature card it is always worth showing.
              feature
                ? ""
                : "max-h-0 overflow-hidden opacity-0 transition-[max-height,opacity,margin] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:mt-3 group-hover:max-h-32 group-hover:opacity-100 group-focus-visible:max-h-32 group-focus-visible:opacity-100",
            )}
          >
            {service.summary}
          </span>
        </span>

        {/* Animated arrow */}
        <span
          aria-hidden="true"
          className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-bone/25 text-bone transition-[border-color,color] duration-500 group-hover:border-bronze-light group-hover:text-ink"
        >
          <span className="absolute inset-0 translate-y-full bg-bronze-light transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0" />
          <svg viewBox="0 0 12 12" fill="none" className="relative h-3 w-3 overflow-visible">
            <path
              d="M1 11 11 1M4 1h7v7"
              stroke="currentColor"
              strokeWidth="1.5"
              className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[2px] group-hover:-translate-y-[2px]"
            />
          </svg>
        </span>
      </span>
    </Link>
  );
}
