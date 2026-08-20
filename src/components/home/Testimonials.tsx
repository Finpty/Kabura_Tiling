"use client";

import Image from "next/image";
import { useState } from "react";
import { Section, SectionLabel } from "@/components/ui/Section";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { Marquee } from "@/components/ui/Marquee";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { SocialIcon } from "@/components/ui/SocialIcons";
import type { DisplayReview, GoogleReviews } from "@/lib/google-reviews";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { centreBlock, centreRow, centreText } from "@/lib/align";
import { site } from "@/lib/site";
import { cn, formatDate } from "@/lib/utils";

/**
 * Reviews.
 *
 * NO REVIEW IS EVER WRITTEN HERE. Every card comes from Kabura's live Google
 * Business Profile, from `src/lib/reviews.ts` where reviews from that same
 * profile are transcribed word for word, or from a row an admin approved in
 * Supabase. With all three empty the section renders nothing at all — no
 * placeholder, no "coming soon", no filler.
 *
 * The cards borrow Google's own review layout — avatar, name, star row, date,
 * body — because that is the shape people already trust, then wear the site's
 * palette rather than Google's.
 *
 * The rail drifts rather than waiting to be scrolled. A row of static cards
 * reads as a wall of text and gets skipped; a slow, even drift is legible at a
 * glance and makes it obvious there is more than fits on screen. It stops the
 * moment a pointer is over it or anything inside takes focus, so nothing a
 * visitor is trying to read ever moves out from under them, and it does not
 * run at all under reduced motion — there the cards simply wrap.
 */

/** Work the ticker names. Every one is a service the site already lists. */
const TICKER = [
  "Large Format Tiling",
  "Screeding",
  "Waterproofing",
  "Bathroom Renovations",
  "Floor Tiling",
  "Wall Tiling",
  "Outdoor Tiling",
  "Feature Tiling",
];

/** Character count past which a card offers to expand rather than clamp. */
const LONG_REVIEW = 240;

/**
 * Seconds of drift per card. Multiplied by the number of reviews so the rail
 * moves at one speed whether there are three cards or thirty — a fixed total
 * duration would sprint through a long list and crawl through a short one.
 */
const DRIFT_SECONDS_PER_CARD = 9;

function Stars({
  rating,
  className,
  size = "sm",
}: {
  rating: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const rounded = Math.round(rating);
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 20 20"
          className={cn(
            size === "md" ? "h-4 w-4" : "h-3.5 w-3.5",
            star <= rounded ? "text-bronze-light" : "text-stone/30",
          )}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.51L10 14.22l-4.94 2.6.94-5.5-4-3.9 5.53-.81L10 1.6z" />
        </svg>
      ))}
    </span>
  );
}

/** Google avatar when there is one, a monogram when there is not. */
function Avatar({ review }: { review: DisplayReview }) {
  const [failed, setFailed] = useState(false);
  const initials = review.authorName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (review.authorPhotoUrl && !failed) {
    return (
      <Image
        src={review.authorPhotoUrl}
        alt=""
        width={44}
        height={44}
        unoptimized
        onError={() => setFailed(true)}
        className="h-11 w-11 shrink-0 rounded-full border border-stone/25 object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-bronze/35 bg-gradient-to-br from-bronze/25 to-charcoal-2 text-sm font-semibold text-bronze-light"
    >
      {initials || "★"}
    </span>
  );
}

function ReviewCard({ review }: { review: DisplayReview }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.body.length > LONG_REVIEW;
  const date =
    review.dateLabel ??
    (review.reviewedAt ? formatDate(review.reviewedAt) : null);

  return (
    <article className="glass flex w-[80vw] shrink-0 flex-col rounded-2xl border border-stone/20 p-6 text-left transition-[border-color,transform,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-bronze-light/40 hover:shadow-[0_28px_60px_-34px_color-mix(in_oklab,var(--color-bronze)_55%,transparent)] sm:w-[21rem] sm:p-7">
      <header className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3.5">
          <Avatar review={review} />
          <span className="min-w-0">
            <span className="block truncate font-medium text-bone">
              {review.authorName}
            </span>
            {date ? (
              <span className="mt-0.5 block text-xs text-stone">{date}</span>
            ) : null}
          </span>
        </span>

        {/* Google's mark, so the card's provenance is visible at a glance. */}
        <SocialIcon
          name="google"
          className="mt-1 h-4 w-4 shrink-0 text-stone-light"
        />
      </header>

      {review.rating ? <Stars rating={review.rating} className="mt-5" /> : null}

      <blockquote
        className={cn(
          "mt-4 flex-1 text-sm leading-relaxed text-sand/85",
          long && !expanded && "line-clamp-6",
        )}
      >
        {review.body}
      </blockquote>

      <footer className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        {long ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="link-underline text-xs text-sand/70"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        ) : null}
        {review.reviewUrl ? (
          <a
            href={review.reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-xs text-bronze-light"
          >
            View on Google
          </a>
        ) : null}
      </footer>
    </article>
  );
}

export function Testimonials({ data }: { data: GoogleReviews }) {
  const reviews = data.reviews;
  const profileUrl = data.profileUrl ?? site.social.google;

  const reduced = usePrefersReducedMotion();
  /**
   * Pausing is state rather than `:hover`/`:focus-within` classes because the
   * duration has to be inline — it is derived from the number of reviews — and
   * an inline `animation` shorthand resets play-state, so no class can pause
   * it. Pointer events rather than mouse events so a finger on the rail stops
   * it too.
   */
  const [pointerOver, setPointerOver] = useState(false);
  const [focusInside, setFocusInside] = useState(false);

  /**
   * Nothing real to show means nothing at all — in production. An empty reviews
   * section is a worse look than no reviews section, and a "coming soon" line
   * tells a customer the business has none.
   *
   * Running `next dev` is the exception. A section that vanishes silently is
   * indistinguishable from one that is broken, so locally it says where the
   * reviews go. `process.env.NODE_ENV` is inlined at build time, so this branch
   * is dead code the production bundle never contains.
   */
  if (reviews.length === 0) {
    if (process.env.NODE_ENV !== "development") return null;
    return <EmptyInDev />;
  }

  /**
   * Google's own aggregate when the API supplied one; otherwise the average of
   * the cards on screen, labelled as exactly that. The two are different
   * numbers and are never presented as the same thing.
   */
  const rated = reviews.filter((review) => (review.rating ?? 0) > 0);
  const shownAverage =
    rated.length > 0
      ? Math.round(
          (rated.reduce((sum, review) => sum + (review.rating ?? 0), 0) /
            rated.length) *
            10,
        ) / 10
      : null;

  const headline = data.rating ?? shownAverage;
  const countLabel =
    data.total !== null
      ? `${data.total} Google review${data.total === 1 ? "" : "s"}`
      : `${reviews.length} of our Google reviews`;

  return (
    <Section
      id="reviews"
      spacing="loose"
      className="border-t border-stone/12 bg-ink"
      aria-labelledby="reviews-heading"
    >
      {/* Service ticker — the same right-to-left drift used at the top of the
          page, kept small so it reads as texture rather than a banner. */}
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
              Every review below was left by a real customer on Google. Nothing
              here is written by us.
            </p>
          </div>

          {/* Aggregate */}
          {headline !== null ? (
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
                    {headline.toFixed(1)}
                  </span>
                  <Stars rating={headline} size="md" />
                </span>
                <span className="mt-1 text-xs text-stone">{countLabel}</span>
              </span>
            </a>
          ) : null}
        </div>

        {/* Rail */}
        <div className="mt-12">
          {reduced ? (
            /* No drift, no clone: every card, wrapped and still. */
            <ul className={cn("flex flex-wrap gap-4", centreRow)}>
              {reviews.map((review) => (
                <li key={review.id} className="contents">
                  <ReviewCard review={review} />
                </li>
              ))}
            </ul>
          ) : (
            <div
              onPointerEnter={() => setPointerOver(true)}
              onPointerLeave={() => setPointerOver(false)}
              onFocusCapture={() => setFocusInside(true)}
              onBlurCapture={() => setFocusInside(false)}
              className="-mx-5 flex overflow-hidden select-none md:-mx-10 xl:-mx-14"
              style={{
                // Fade the cards out at both edges rather than cutting them,
                // so a card leaving the frame does not read as clipped.
                maskImage:
                  "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
              }}
            >
              <div
                className="flex shrink-0 gap-4 pr-4"
                style={{
                  animation: `marquee ${DRIFT_SECONDS_PER_CARD * reviews.length}s linear infinite`,
                  // Longhand after the shorthand: this is what actually pauses.
                  animationPlayState:
                    pointerOver || focusInside ? "paused" : "running",
                }}
              >
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
                {/*
                  The second run is what makes the loop seamless — the track
                  travels exactly its own half-width and starts again. It is
                  hidden from assistive technology and taken out of the tab
                  order so the same seven reviews are not announced twice.
                */}
                <div aria-hidden="true" className="flex shrink-0 gap-4" inert>
                  {reviews.map((review) => (
                    <ReviewCard key={`${review.id}-loop`} review={review} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className={cn("mt-10 flex flex-wrap items-center gap-4", centreRow)}>
            {profileUrl ? (
              <MagneticLink
                href={profileUrl}
                variant="outline"
                size="md"
                target="_blank"
                rel="noopener noreferrer"
                withArrow
              >
                Read all reviews on Google
              </MagneticLink>
            ) : null}
          </div>
        </div>
      </div>
    </Section>
  );
}

/**
 * Shown only while developing, never in a production build.
 *
 * The reviews section renders nothing at all when there is nothing real to
 * render. That is right for visitors and confusing for whoever is building the
 * site, so this stands in its place locally and says exactly what is missing.
 */
function EmptyInDev() {
  return (
    <Section
      id="reviews"
      spacing="loose"
      className="border-t border-stone/12 bg-ink"
    >
      <div className="border-y border-stone/10 bg-charcoal/40 py-3">
        <Marquee items={TICKER} className="opacity-70" />
      </div>

      <div className="shell pt-16 md:pt-20">
        <SectionLabel index="11" eyebrow="Reviews" className={centreRow} />
        <div className={cn("mt-8 max-w-2xl", centreBlock)}>
          <PlaceholderNotice className="text-left">
            <span className="block">
              No reviews are shown because none have been added yet, and none
              are invented. This notice appears in <code>next dev</code> only —
              a production build renders nothing here at all.
            </span>
            <span className="mt-3 block">
              Transcribe the reviews into{" "}
              <code>src/lib/reviews.ts</code>, word for word, or set{" "}
              <code>GOOGLE_PLACES_API_KEY</code> and{" "}
              <code>GOOGLE_PLACE_ID</code> to pull them live from the Google
              Business Profile.
            </span>
          </PlaceholderNotice>
        </div>
      </div>
    </Section>
  );
}
