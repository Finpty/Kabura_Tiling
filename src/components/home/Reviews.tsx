"use client";

import { useCallback, useEffect, useRef } from "react";
import { Section, SectionLabel } from "@/components/ui/Section";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { Marquee } from "@/components/ui/Marquee";
import { SocialIcon } from "@/components/ui/SocialIcons";
import {
  CUSTOMER_REVIEWS,
  averageRating,
  initialsFor,
  type CustomerReview,
} from "@/lib/customer-reviews";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { centreBlock, centreRow, centreText } from "@/lib/align";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * What customers say.
 *
 * Every card is a real review from Kabura's Google Business Profile,
 * transcribed from the profile itself — see `src/lib/customer-reviews.ts`.
 * Nothing is fetched: there is no Places API key, no billed cloud project and
 * no request that can fail while a customer is reading the page. The wording
 * on screen says "from our Google Business Profile", never "live" or "synced",
 * because transcribed is what it is.
 *
 * ── The movement ────────────────────────────────────────────────────────────
 * The rail drifts right to left, and it drifts by moving `scrollLeft` rather
 * than by animating a transform. That is the whole trick: it stays an ordinary
 * scroll container, so a thumb drags it, a trackpad flicks it, momentum works,
 * and none of that has to be reimplemented. The cards are rendered twice and
 * the offset wraps at the halfway mark, which is a seam the eye cannot find
 * because both halves are identical.
 *
 * It stops while a pointer is on it, while anything inside has focus, and for
 * a moment after a flick so the drift does not fight the momentum. Under
 * reduced motion there is no loop and no duplicate — the cards simply wrap.
 */

/** The services named in the ticker above the reviews. */
const TICKER = [
  "Large Format Tiling",
  "Screeding",
  "Waterproofing",
  "Bathroom Renovations",
  "Floor Tiling",
  "Wall Tiling",
  "Outdoor Tiling",
];

/** Drift speed. Slow enough to read a card as it passes. */
const DRIFT_PX_PER_SECOND = 26;
/** How long the drift waits after a flick before taking over again. */
const RESUME_AFTER_MS = 1_400;

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={cn(
            size === "md" ? "h-4 w-4" : "h-3.5 w-3.5",
            star <= Math.round(rating) ? "text-[#f5b544]" : "text-stone/30",
          )}
        >
          <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.51L10 14.22l-4.94 2.6.94-5.5-4-3.9 5.53-.81L10 1.6z" />
        </svg>
      ))}
    </span>
  );
}

function ReviewCard({
  review,
  profileUrl,
  cloned,
}: {
  review: CustomerReview;
  profileUrl: string | null;
  cloned?: boolean;
}) {
  return (
    <article
      className={cn(
        "glass flex w-[81vw] shrink-0 flex-col rounded-2xl border border-stone/20 p-6 text-left sm:w-[22rem] sm:p-7",
        "transition-[border-color,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:border-bronze-light/45 hover:shadow-[0_28px_60px_-34px_color-mix(in_oklab,var(--color-bronze)_55%,transparent)]",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3.5">
          {/* Monogram, not a photograph: these are real people, and their
              Google profile picture is theirs rather than Kabura's to publish. */}
          <span
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-bronze/35 bg-gradient-to-br from-bronze/25 to-charcoal-2 text-sm font-semibold text-bronze-light"
          >
            {initialsFor(review.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-bone">
              {review.name}
            </span>
            {review.context ? (
              <span className="mt-0.5 block truncate text-[0.68rem] text-stone">
                {review.context}
              </span>
            ) : null}
          </span>
        </span>
        <SocialIcon
          name="google"
          className="mt-1 h-4 w-4 shrink-0 text-stone-light"
        />
      </header>

      <div className="mt-5 flex items-center gap-2.5">
        <Stars rating={review.rating} />
        <span className="text-xs text-stone">{review.date}</span>
      </div>

      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-sand/85">
        {review.body}
        {review.truncated ? <span className="text-stone">&nbsp;…</span> : null}
      </blockquote>

      {review.ownerReply ? (
        <div className="mt-5 border-l border-bronze/40 pl-3.5">
          <span className="block text-[0.66rem] tracking-[0.1em] text-bronze-light/90 uppercase">
            Kabura replied
          </span>
          <p className="mt-1.5 text-[0.78rem] leading-relaxed text-sand/60">
            {review.ownerReply}
          </p>
        </div>
      ) : null}

      <footer className="mt-6 flex items-center justify-between gap-3 border-t border-stone/12 pt-4">
        <span className="text-[0.66rem] tracking-[0.1em] text-stone uppercase">
          Google review
        </span>
        {review.truncated && profileUrl ? (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            // A clone is hidden from assistive technology and taken out of the
            // tab order by its wrapper; giving it a tabbable link would undo that.
            tabIndex={cloned ? -1 : undefined}
            className="link-underline shrink-0 text-[0.7rem] text-bronze-light"
          >
            Read in full
          </a>
        ) : null}
      </footer>
    </article>
  );
}

export function Reviews() {
  const reduced = usePrefersReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reviews = CUSTOMER_REVIEWS;
  const profileUrl = site.social.google ?? null;
  const average = averageRating(reviews);

  const hold = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    paused.current = true;
  }, []);

  /** Let a flick finish before the drift starts pushing again. */
  const release = useCallback((delay = 0) => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      paused.current = false;
    }, delay);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const rail = railRef.current;
    if (!rail) return;

    let frame = 0;
    let previous = 0;
    /**
     * The drift position is kept here, not read back out of the DOM.
     *
     * At one device pixel per CSS pixel Chromium snaps `scrollLeft` to whole
     * pixels, so `scrollLeft += 0.43` sixty times a second writes 0.43 and
     * reads back 0 — the rail sits still, or creeps erratically depending on
     * which way each fraction happens to round. Accumulating in a number and
     * assigning the absolute value moves it exactly as intended at any device
     * pixel ratio.
     */
    let offset = rail.scrollLeft;

    const step = (now: number) => {
      const half = rail.scrollWidth / 2;

      if (paused.current) {
        // The visitor is driving. Follow them, and keep the wrap honest so a
        // long drag still loops.
        if (half > 0 && rail.scrollLeft >= half) rail.scrollLeft -= half;
        offset = rail.scrollLeft;
      } else if (previous) {
        // `Math.min` caps the step after a background tab or a long frame, so
        // returning to the page does not fling the rail forwards.
        offset +=
          (DRIFT_PX_PER_SECOND * Math.min(now - previous, 100)) / 1000;
        /**
         * Wrap, forward only. The rail holds the reviews twice, so half its
         * scroll width is one full pass and subtracting it lands on identical
         * pixels. A mirror-image "jump forward at the start" rule reads as the
         * obvious complement and is a trap: landing on exactly `half`
         * satisfies the forward test, which takes it straight back off, and
         * the rail sits at zero flickering between the two. Backward is also
         * the direction nothing travels on its own.
         */
        if (half > 0 && offset >= half) offset -= half;
        rail.scrollLeft = offset;
      }

      previous = now;
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [reduced]);

  return (
    <Section
      id="reviews"
      spacing="loose"
      className="border-t border-stone/12 bg-ink"
      aria-labelledby="reviews-heading"
    >
      {/* Service ticker — the same drift as the top of the page, kept small so
          it reads as texture rather than a banner. */}
      <div className="border-y border-stone/10 bg-charcoal/40 py-3">
        <Marquee items={TICKER} className="opacity-70" />
      </div>

      <div className="shell pt-16 md:pt-20">
        <SectionLabel index="11" eyebrow="Reviews" className={centreRow} />

        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2
              id="reviews-heading"
              className={cn(
                "max-w-2xl font-display text-headline text-bone",
                centreText,
                centreBlock,
              )}
            >
              What customers say.
            </h2>
            <p
              className={cn(
                "mt-5 max-w-xl text-lead text-sand/75",
                centreText,
                centreBlock,
              )}
            >
              Every one of these was left by a real customer on our Google
              Business Profile. Nothing here is written by us.
            </p>
          </div>

          {average !== null ? (
            <a
              href={profileUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "glass group flex shrink-0 items-center gap-4 rounded-2xl border border-stone/25 px-5 py-4 transition-[border-color,transform] duration-500 hover:-translate-y-0.5 hover:border-bronze-light",
                centreBlock,
              )}
            >
              <SocialIcon
                name="google"
                className="h-7 w-7 shrink-0 text-sand transition-colors duration-400 group-hover:text-bronze-light"
              />
              <span className="flex flex-col">
                <span className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-semibold text-bone tabular-nums">
                    {average.toFixed(1)}
                  </span>
                  <Stars rating={average} size="md" />
                </span>
                <span className="mt-1 text-xs text-stone">
                  {reviews.length} Google review
                  {reviews.length === 1 ? "" : "s"}
                </span>
              </span>
            </a>
          ) : null}
        </div>

        <div className="mt-12">
          {reduced ? (
            <ul className={cn("flex flex-wrap items-start gap-4", centreRow)}>
              {reviews.map((review) => (
                <li key={review.id} className="contents">
                  <ReviewCard review={review} profileUrl={profileUrl} />
                </li>
              ))}
            </ul>
          ) : (
            <div
              ref={railRef}
              onPointerEnter={hold}
              onPointerLeave={() => release()}
              onPointerDown={hold}
              onPointerUp={() => release(RESUME_AFTER_MS)}
              onPointerCancel={() => release(RESUME_AFTER_MS)}
              onFocusCapture={hold}
              onBlurCapture={() => release()}
              // An ordinary scroll container: drag, swipe and momentum are the
              // browser's, not reimplemented. `overscroll-x-contain` keeps the
              // gesture from ever chaining out to the page.
              /**
               * `scroll-behavior:auto` is load-bearing. The document sets
               * `scroll-behavior: smooth`, which inherits, and smooth turns
               * every one of the drift's per-frame nudges into an animation
               * that the next frame cancels — the rail creeps a couple of
               * pixels a second instead of drifting. Dragging still feels
               * exactly the same; this only governs scripted scrolling.
               */
              className="no-scrollbar -mx-5 flex cursor-grab items-start gap-4 overflow-x-auto overscroll-x-contain px-5 pb-2 [scroll-behavior:auto] active:cursor-grabbing md:-mx-10 md:px-10 xl:-mx-14 xl:px-14"
              style={{
                maskImage:
                  "linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)",
              }}
            >
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  profileUrl={profileUrl}
                />
              ))}
              {/* The second pass is what makes the loop seamless. Hidden from
                  assistive technology and out of the tab order, so ten reviews
                  are not announced twenty times. */}
              <div aria-hidden="true" className="flex shrink-0 items-start gap-4" inert>
                {reviews.map((review) => (
                  <ReviewCard
                    key={`${review.id}-loop`}
                    review={review}
                    profileUrl={profileUrl}
                    cloned
                  />
                ))}
              </div>
            </div>
          )}

          <div
            className={cn(
              "mt-10 flex flex-col items-center gap-4 sm:flex-row",
              centreRow,
            )}
          >
            {profileUrl ? (
              <MagneticLink
                href={profileUrl}
                variant="outline"
                size="md"
                target="_blank"
                rel="noopener noreferrer"
                withArrow
              >
                Read our reviews on Google
              </MagneticLink>
            ) : null}
            <p className="text-xs text-stone">
              Shown from our Google Business Profile.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
