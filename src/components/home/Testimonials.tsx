"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Section, SectionLabel } from "@/components/ui/Section";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { SocialIcon } from "@/components/ui/SocialIcons";
import type { DisplayReview, GoogleReviews } from "@/lib/google-reviews";
import { centreBlock, centreRow, centreText } from "@/lib/align";
import { site } from "@/lib/site";
import { cn, formatDate } from "@/lib/utils";

/**
 * Reviews.
 *
 * NO REVIEW IS EVER WRITTEN HERE. Everything shown comes from Kabura's live
 * Google Business Profile or from rows an admin approved in Supabase. Each
 * carries its author, its date and — for Google reviews — a link back to the
 * original, so a visitor can check it. With neither source configured this
 * renders "coming soon" rather than filling the space.
 *
 * The rail is one component at every breakpoint: swipe on a phone,
 * arrow buttons once there is room for them. Cards snap, so a half-visible
 * card never ends up as the resting state.
 */

/** Character count past which a card offers to expand rather than clamp. */
const LONG_REVIEW = 260;

function Stars({ rating, className }: { rating: number; className?: string }) {
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
            "h-3.5 w-3.5",
            star <= rounded ? "text-bronze-light" : "text-stone/35",
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

/** Google avatar, falling back to a monogram if there is no photo or it fails. */
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
        width={48}
        height={48}
        unoptimized
        onError={() => setFailed(true)}
        className="h-12 w-12 shrink-0 rounded-full border border-stone/25 object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-stone/25 bg-charcoal-2 text-sm font-medium text-sand"
    >
      {initials || "★"}
    </span>
  );
}

function ReviewCard({ review }: { review: DisplayReview }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.body.length > LONG_REVIEW;

  return (
    <article className="glass flex h-full w-[82vw] shrink-0 snap-center flex-col rounded-xl border border-stone/20 p-6 transition-colors duration-500 hover:border-stone/35 sm:w-[22rem] sm:p-7">
      <header className="flex items-center gap-3.5">
        <Avatar review={review} />
        <div className="min-w-0">
          <p className="truncate font-medium text-bone">{review.authorName}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-stone">
            {review.source === "Google" ? (
              <span className="inline-flex items-center gap-1.5">
                <SocialIcon name="google" className="h-3 w-3" />
                Google
              </span>
            ) : (
              <span>{review.source}</span>
            )}
            {review.reviewedAt ? (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={review.reviewedAt}>
                  {formatDate(review.reviewedAt)}
                </time>
              </>
            ) : null}
          </p>
        </div>
      </header>

      {review.rating ? <Stars rating={review.rating} className="mt-5" /> : null}

      <blockquote
        className={cn(
          "mt-4 flex-1 text-sm leading-relaxed text-sand/85",
          long && !expanded && "line-clamp-[7]",
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
  const hasReviews = reviews.length > 0;
  const profileUrl = data.profileUrl ?? site.social.google;

  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setAtStart(rail.scrollLeft <= 4);
    setAtEnd(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncEdges();
    const rail = railRef.current;
    if (!rail) return;
    window.addEventListener("resize", syncEdges);
    return () => window.removeEventListener("resize", syncEdges);
  }, [syncEdges, reviews.length]);

  const scrollBy = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector("article");
    const step = card ? card.clientWidth + 16 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <Section
      id="reviews"
      spacing="loose"
      className="border-t border-stone/12 bg-ink"
      aria-labelledby="reviews-heading"
    >
      <div className="shell">
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
              Every review below is a real one, pulled straight from our Google
              Business Profile. Nothing here is written by us.
            </p>
          </div>

          {/* Aggregate rating */}
          {data.rating !== null ? (
            <a
              href={profileUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "glass group flex shrink-0 items-center gap-4 rounded-xl border border-stone/25 px-5 py-4 transition-colors duration-400 hover:border-bronze-light",
                centreBlock,
              )}
            >
              <SocialIcon
                name="google"
                className="h-6 w-6 shrink-0 text-sand transition-colors duration-400 group-hover:text-bronze-light"
              />
              <span className="flex flex-col">
                <span className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-semibold text-bone tabular-nums">
                    {data.rating.toFixed(1)}
                  </span>
                  <Stars rating={data.rating} />
                </span>
                <span className="mt-1 text-xs text-stone">
                  {data.total !== null
                    ? `${data.total} Google review${data.total === 1 ? "" : "s"}`
                    : "on Google"}
                </span>
              </span>
            </a>
          ) : null}
        </div>

        {hasReviews ? (
          <div className="mt-12">
            {/* Rail. Negative margins let cards bleed to the screen edge on a
                phone while the section keeps its gutter. */}
            <div
              ref={railRef}
              onScroll={syncEdges}
              className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:-mx-10 md:px-10 xl:-mx-14 xl:px-14"
            >
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            <div
              className={cn(
                "mt-8 flex flex-wrap items-center gap-4",
                centreRow,
              )}
            >
              {reviews.length > 1 ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => scrollBy(-1)}
                    disabled={atStart}
                    className="grid h-11 w-11 place-items-center rounded-full border border-stone/30 text-bone transition-colors hover:border-bronze-light hover:text-bronze-light disabled:pointer-events-none disabled:opacity-30"
                  >
                    <span className="sr-only">Previous reviews</span>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M15 5 8 12l7 7"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollBy(1)}
                    disabled={atEnd}
                    className="grid h-11 w-11 place-items-center rounded-full border border-stone/30 text-bone transition-colors hover:border-bronze-light hover:text-bronze-light disabled:pointer-events-none disabled:opacity-30"
                  >
                    <span className="sr-only">More reviews</span>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="m9 5 7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                  </button>
                </div>
              ) : null}

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

            <p
              className={cn(
                "mt-6 max-w-2xl text-xs leading-relaxed text-stone",
                centreText,
                centreBlock,
              )}
            >
              Google returns up to five reviews through its API. The rating and
              count above cover every review on the profile — follow the link to
              read them all.
            </p>
          </div>
        ) : (
          <div className={cn("mt-14 max-w-3xl", centreText, centreBlock)}>
            <p className="font-serif text-4xl text-bronze-light italic md:text-5xl">
              Customer reviews coming soon
            </p>
            <PlaceholderNotice className="mt-8 text-left">
              <span className="block">
                No reviews are shown because none could be read, and nothing
                here is invented.
              </span>
              {data.diagnosis ? (
                <span className="mt-3 block text-sand/85">
                  <span className="font-medium text-bone">What is wrong:</span>{" "}
                  {data.diagnosis}
                </span>
              ) : null}
              <span className="mt-3 block">
                Set <code>GOOGLE_PLACES_API_KEY</code> and{" "}
                <code>GOOGLE_PLACE_ID</code> in <code>.env.local</code> (and in
                the host&rsquo;s environment for production), then restart the
                server. Kabura&rsquo;s real Google reviews then appear here
                automatically, each attributed and linked back to Google.
              </span>
            </PlaceholderNotice>

            {profileUrl ? (
              <div className={cn("mt-8 flex flex-wrap", centreRow)}>
                <MagneticLink
                  href={profileUrl}
                  variant="outline"
                  size="md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read our Google reviews
                </MagneticLink>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Section>
  );
}
