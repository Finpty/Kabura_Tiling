"use client";

import { AmbientVideo } from "@/components/ui/AmbientVideo";
import { SectionLabel } from "@/components/ui/Section";
import { img, video } from "@/lib/media";
import { centreBlock, centreRow, centreText } from "@/lib/align";
import { cn, pad } from "@/lib/utils";

/**
 * Horizontal film strip.
 *
 * A native snap scroller at every breakpoint. It used to pin the section for
 * three viewport heights on desktop and translate the rail with scroll — which
 * meant three screens of wheel input that moved the page sideways instead of
 * down. That is indistinguishable from a broken page: the wheel works, but
 * nothing you expect to happen happens. A real horizontal scroller is better on
 * every count — it works with trackpad, touch, shift-wheel, keyboard and the
 * scrollbar, on every browser, and it never touches vertical scrolling.
 *
 * Only panels that are actually on screen mount a video, and each one pauses the
 * moment it leaves, so at most one or two ever decode at once.
 */

const PANELS = [
  {
    id: "stone",
    title: "Stone selection",
    videoKey: "stoneSlabs",
    imageKey: "stoneSlab",
    caption: "Slabs chosen and matched before anything is cut.",
  },
  {
    id: "cutting",
    title: "Precision cutting",
    videoKey: "largeFormat",
    imageKey: "largeFormat",
    caption: "Mitres, cut-outs and edges worked to the millimetre.",
  },
  {
    id: "waterproofing",
    title: "Waterproofing",
    videoKey: "waterproofing",
    imageKey: "waterproofing",
    caption: "The layer that decides whether the room lasts.",
  },
  {
    id: "screeding",
    title: "Screeding",
    videoKey: null,
    imageKey: "screed",
    caption: "Falls set from the waste, checked with a straight edge.",
  },
  {
    id: "large-format",
    title: "Large format",
    videoKey: "largeFormat",
    imageKey: "floorTiling",
    caption: "Full coverage, levelling systems, minimal joints.",
  },
  {
    id: "finish",
    title: "The finish",
    videoKey: "bathroomReveal",
    imageKey: "bathroomReveal",
    caption: "Grouted, sealed, cleaned down and handed over.",
  },
];

export function VideoRail() {
  const panels = PANELS.map((panel, index) => {
    const clip = panel.videoKey ? video(panel.videoKey) : null;
    return (
      <article
        key={panel.id}
        className="relative flex aspect-[3/4] w-[78vw] shrink-0 snap-center flex-col overflow-hidden rounded-xl bg-charcoal-2 sm:aspect-[4/5] sm:w-[22rem] lg:w-[24rem]"
      >
        <AmbientVideo
          video={clip}
          poster={img(panel.imageKey)}
          alt={panel.title}
          className="absolute inset-0 h-full w-full"
          sizes="(min-width: 1024px) 30vw, (min-width: 768px) 38vw, 78vw"
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
      id="film"
      aria-labelledby="film-heading"
      className="relative border-t border-stone/12 bg-ink"
    >
      <div className="py-20 md:py-28">
        <div className="shell pb-10">
          <SectionLabel index="07" eyebrow="On site" className={centreRow} />
          <h2
            id="film-heading"
            className={cn(
              "mt-6 max-w-2xl font-display text-headline text-bone",
              centreText,
              centreBlock,
            )}
          >
            The work, frame by frame.
          </h2>
        </div>

        {/* `overscroll-x-contain` keeps a horizontal fling inside the rail
            instead of turning into a browser back-navigation gesture. */}
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-5 pb-2 md:gap-5 md:px-10 xl:px-14">
          {panels}
        </div>
      </div>
    </section>
  );
}
