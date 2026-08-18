"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Section, SectionLabel } from "@/components/ui/Section";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import type { GoogleReviews } from "@/lib/google-reviews";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Testimonials.
 *
 * NO REVIEW IS EVER WRITTEN HERE. Everything shown comes from Kabura's live
 * Google Business Profile or from rows an admin approved in Supabase. Each
 * carries its author and links back to the original on Google, so a visitor can
 * check it. With neither source configured this renders "coming soon" rather
 * than filling the space.
 */
export function Testimonials({ data }: { data: GoogleReviews }) {
  const [index, setIndex] = useState(0);
  const reduced = usePrefersReducedMotion();
  const reviews = data.reviews;
  const hasReviews = reviews.length > 0;
  const current = hasReviews ? reviews[index % reviews.length] : null;
  const profileUrl = data.profileUrl ?? site.social.google;

  return (
    <Section
      id="reviews"
      spacing="loose"
      className="border-t border-stone/12 bg-ink"
      aria-labelledby="reviews-heading"
    >
      <div className="shell">
        <SectionLabel index="11" eyebrow="Reviews" />
        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <h2
            id="reviews-heading"
            className="max-w-2xl font-display text-headline text-bone"
          >
            What customers say.
          </h2>

          {data.rating !== null ? (
            <a
              href={profileUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex shrink-0 items-center gap-4 border border-stone/25 px-5 py-3.5 transition-colors duration-400 hover:border-bronze-light"
            >
              <span className="font-display text-3xl font-semibold text-bone tabular-nums">
                {data.rating.toFixed(1)}
              </span>
              <span className="flex flex-col">
                <span
                  className="text-sm text-bronze-light"
                  aria-label={`${data.rating.toFixed(1)} out of 5`}
                >
                  {"★".repeat(Math.round(data.rating))}
                  <span className="text-stone">
                    {"★".repeat(5 - Math.round(data.rating))}
                  </span>
                </span>
                <span className="mt-0.5 text-xs text-stone">
                  {data.total !== null
                    ? `${data.total} Google review${data.total === 1 ? "" : "s"}`
                    : "on Google"}
                </span>
              </span>
            </a>
          ) : null}
        </div>

        {hasReviews && current ? (
          <div className="mt-14">
            <div className="min-h-[16rem]">
              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={current.id}
                  initial={reduced ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -14 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-4xl"
                >
                  {current.rating ? (
                    <p
                      className="eyebrow text-bronze-light"
                      aria-label={`${current.rating} out of 5`}
                    >
                      {"★".repeat(current.rating)}
                      <span className="text-stone">
                        {"★".repeat(5 - current.rating)}
                      </span>
                    </p>
                  ) : null}
                  <p className="mt-6 font-display text-title font-medium text-bone">
                    &ldquo;{current.body}&rdquo;
                  </p>
                  <footer className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-sand/70">
                    <cite className="not-italic">{current.author_name}</cite>
                    {current.source ? (
                      <span className="text-stone">· via {current.source}</span>
                    ) : null}
                    {current.reviewed_at ? (
                      <span className="text-stone">
                        · {formatDate(current.reviewed_at)}
                      </span>
                    ) : null}
                  </footer>
                </motion.blockquote>
              </AnimatePresence>
            </div>

            {profileUrl ? (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline mt-6 inline-block text-sm text-bronze-light"
              >
                Read this and every review on Google
              </a>
            ) : null}

            {reviews.length > 1 ? (
              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setIndex((i) => (i - 1 + reviews.length) % reviews.length)
                  }
                  className="grid h-11 w-11 place-items-center rounded-full border border-stone/30 text-bone transition-colors hover:border-bronze-light hover:text-bronze-light"
                >
                  <span className="sr-only">Previous review</span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i + 1) % reviews.length)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-stone/30 text-bone transition-colors hover:border-bronze-light hover:text-bronze-light"
                >
                  <span className="sr-only">Next review</span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </button>
                <span className="ml-2 text-xs text-stone tabular-nums">
                  {(index % reviews.length) + 1} / {reviews.length}
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-14 max-w-3xl">
            <p className="font-serif text-4xl text-bronze-light italic md:text-5xl">
              Customer reviews coming soon
            </p>
            <PlaceholderNotice className="mt-8">
              No reviews are shown because none have been connected yet, and
              nothing here is invented. Set <code>GOOGLE_PLACES_API_KEY</code>{" "}
              and <code>GOOGLE_PLACE_ID</code> and Kabura&rsquo;s real Google
              reviews appear here automatically, each attributed and linked back
              to Google.
            </PlaceholderNotice>

            {profileUrl ? (
              <MagneticLink
                href={profileUrl}
                variant="outline"
                size="md"
                className="mt-8"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read our Google reviews
              </MagneticLink>
            ) : null}
          </div>
        )}
      </div>
    </Section>
  );
}
