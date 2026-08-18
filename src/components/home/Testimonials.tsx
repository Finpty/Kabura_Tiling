"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Section, SectionLabel } from "@/components/ui/Section";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import type { ReviewRow } from "@/lib/supabase/types";
import { site } from "@/lib/site";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Testimonials.
 *
 * NO REVIEW IS FABRICATED. The component ships with an empty list and renders a
 * "coming soon" state. It is fully built for real content: pass approved rows
 * from the `reviews` table and the carousel takes over.
 */
export function Testimonials({ reviews = [] }: { reviews?: ReviewRow[] }) {
  const [index, setIndex] = useState(0);
  const reduced = usePrefersReducedMotion();
  const hasReviews = reviews.length > 0;
  const current = hasReviews ? reviews[index % reviews.length] : null;

  return (
    <Section
      id="reviews"
      spacing="loose"
      className="border-t border-stone/12 bg-ink"
      aria-labelledby="reviews-heading"
    >
      <div className="shell">
        <SectionLabel index="11" eyebrow="Reviews" />
        <h2
          id="reviews-heading"
          className="mt-6 max-w-2xl font-display text-headline text-bone"
        >
          What customers say.
        </h2>

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
                  <footer className="mt-6 text-sm text-sand/70">
                    <cite className="not-italic">{current.author_name}</cite>
                    {current.source ? (
                      <span className="text-stone"> · via {current.source}</span>
                    ) : null}
                  </footer>
                </motion.blockquote>
              </AnimatePresence>
            </div>

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
              No reviews are shown because none have been supplied. Nothing here
              is invented. Approved reviews added to the <code>reviews</code>{" "}
              table appear in this carousel automatically.
            </PlaceholderNotice>

            {site.social.google ? (
              <MagneticLink
                href={site.social.google}
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
