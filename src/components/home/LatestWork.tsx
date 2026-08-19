"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Section, SectionLabel } from "@/components/ui/Section";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { SocialIcon } from "@/components/ui/SocialIcons";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { youtubeEmbed } from "@/lib/social-posts";
import type { ResolvedPost } from "@/lib/social-resolve";
import { SOCIAL_LABELS, configuredSocials, site } from "@/lib/site";
import { centreBlock, centreRow, centreText } from "@/lib/align";
import { cn } from "@/lib/utils";

/**
 * Latest from Kabura.
 *
 * Real published posts only. Every card comes from `src/lib/social-posts.ts`,
 * which ships empty — with nothing configured this renders a follow panel
 * rather than inventing a feed. Cards link back to the original post on the
 * platform it was published to; YouTube is the one platform whose embed is
 * public and documented, so those play in place after a click rather than
 * navigating away.
 *
 * Portrait and landscape both work: the rail sizes each card from its own
 * orientation, so a 9:16 reel and a 16:9 walkthrough sit together without
 * either being letterboxed.
 */

const ORIENTATION = {
  portrait: "aspect-[9/16] w-[68vw] sm:w-[15rem]",
  landscape: "aspect-video w-[84vw] sm:w-[26rem]",
} as const;

function PostCard({ post }: { post: ResolvedPost }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const orientation = post.orientation ?? "portrait";
  const thumbnail = post.thumbnailUrl;
  const caption = post.resolvedCaption;
  /** Anything with a player, whichever platform it came from. */
  const playable = Boolean(post.embedSrc);

  const hover = (on: boolean) => {
    const node = videoRef.current;
    if (!node) return;
    if (on) void node.play().catch(() => {});
    else {
      node.pause();
      node.currentTime = 0;
    }
  };

  // Plays where it sits, once the visitor asks for it.
  if (playable && playing) {
    return (
      <li
        className={cn(
          "relative shrink-0 snap-center overflow-hidden rounded-xl border border-bronze-light/40 bg-ink",
          ORIENTATION[orientation],
        )}
      >
        <iframe
          src={post.embedSrc ?? youtubeEmbed("")}
          title={caption ?? "Kabura Tiling video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </li>
    );
  }

  const inner = (
    <>
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={caption ?? `${SOCIAL_LABELS[post.platform]} post`}
          fill
          unoptimized
          sizes="(min-width: 640px) 26rem, 84vw"
          className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
        />
      ) : null}

      {post.video ? (
        <video
          ref={videoRef}
          src={post.video}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        />
      ) : null}

      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/20 to-ink/10 transition-opacity duration-700 group-hover:from-ink/80"
      />

      {/* Platform badge */}
      <span className="absolute top-3 left-3 grid h-8 w-8 place-items-center rounded-full border border-bone/20 bg-ink/70 text-bone backdrop-blur-sm transition-colors duration-500 group-hover:border-bronze-light/70 group-hover:text-bronze-light">
        <SocialIcon name={post.platform} className="h-3.5 w-3.5" />
      </span>

      {/* Play affordance for anything with motion */}
      {playable || post.video ? (
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-bone/30 bg-ink/50 text-bone backdrop-blur-sm transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:border-bronze-light group-hover:bg-bronze/25"
        >
          <svg
            viewBox="0 0 24 24"
            className="ml-0.5 h-4 w-4"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      ) : null}

      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        {caption ? (
          <span className="line-clamp-2 text-sm leading-snug text-bone/95 [text-wrap:balance]">
            {caption}
          </span>
        ) : (
          <span />
        )}
        <span
          aria-hidden="true"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-bone/25 text-bone transition-[transform,border-color,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-bronze-light group-hover:text-bronze-light"
        >
          <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
            <path
              d="M1 11 11 1M4 1h7v7"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </span>
      </span>
    </>
  );

  const shell = cn(
    "group relative block h-full w-full overflow-hidden rounded-xl border border-stone/20 bg-charcoal-2 transition-[border-color,transform,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-bronze-light/45 hover:shadow-[0_28px_60px_-30px_color-mix(in_oklab,var(--color-bronze)_55%,transparent)]",
  );

  return (
    <li
      className={cn("shrink-0 snap-center", ORIENTATION[orientation])}
      onMouseEnter={() => hover(true)}
      onMouseLeave={() => hover(false)}
    >
      {playable ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className={cn(shell, "text-left")}
        >
          <span className="sr-only">
            Play {caption ?? "this video"} from {SOCIAL_LABELS[post.platform]}
          </span>
          {inner}
        </button>
      ) : (
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className={shell}
        >
          <span className="sr-only">
            {caption ?? "View this post"} on {SOCIAL_LABELS[post.platform]}
          </span>
          {inner}
        </a>
      )}
    </li>
  );
}

export function LatestWork({
  posts,
  className,
}: {
  posts: ResolvedPost[];
  className?: string;
}) {
  const socials = configuredSocials();

  const railRef = useRef<HTMLUListElement>(null);
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
    window.addEventListener("resize", syncEdges);
    return () => window.removeEventListener("resize", syncEdges);
  }, [syncEdges, posts.length]);

  const nudge = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector("li");
    const step = card ? card.clientWidth + 16 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <Section
      id="latest"
      spacing="loose"
      className={cn("border-t border-stone/12 bg-charcoal", className)}
      aria-labelledby="latest-heading"
    >
      <div className="shell">
        <SectionLabel eyebrow="Latest from Kabura" className={centreRow} />

        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2
              id="latest-heading"
              className={cn(
                "max-w-2xl font-display text-headline text-bone",
                centreText,
                centreBlock,
              )}
            >
              See our work.
            </h2>
            <p
              className={cn(
                "mt-5 max-w-xl text-lead text-sand/75",
                centreText,
                centreBlock,
              )}
            >
              Rooms as they were handed over, straight from the jobs we post
              about.
            </p>
          </div>

          {socials.length > 0 ? (
            <SocialLinks className={cn("shrink-0", centreBlock)} centred />
          ) : null}
        </div>

        {posts.length > 0 ? (
          <div className="mt-12">
            <ul
              ref={railRef}
              onScroll={syncEdges}
              className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-5 pb-2 md:-mx-10 md:px-10 xl:-mx-14 xl:px-14"
            >
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </ul>

            {posts.length > 1 ? (
              <div
                className={cn(
                  "mt-8 hidden items-center gap-2 sm:flex",
                  centreRow,
                )}
              >
                <button
                  type="button"
                  onClick={() => nudge(-1)}
                  disabled={atStart}
                  className="grid h-11 w-11 place-items-center rounded-full border border-stone/30 text-bone transition-colors hover:border-bronze-light hover:text-bronze-light disabled:pointer-events-none disabled:opacity-30"
                >
                  <span className="sr-only">Previous posts</span>
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
                  onClick={() => nudge(1)}
                  disabled={atEnd}
                  className="grid h-11 w-11 place-items-center rounded-full border border-stone/30 text-bone transition-colors hover:border-bronze-light hover:text-bronze-light disabled:pointer-events-none disabled:opacity-30"
                >
                  <span className="sr-only">More posts</span>
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
          </div>
        ) : (
          <div className={cn("mt-12 max-w-3xl", centreBlock)}>
            <PlaceholderNotice className="text-left">
              No posts are shown because none have been added yet, and nothing
              here is invented. Add real published posts to{" "}
              <code>src/lib/social-posts.ts</code> — the file explains the shape
              and why a live feed needs platform credentials. Until then the
              buttons above go straight to the profiles.
            </PlaceholderNotice>

            {site.social.instagram ? (
              <div className={cn("mt-8 flex flex-wrap", centreRow)}>
                <MagneticLink
                  href={site.social.instagram}
                  variant="outline"
                  size="md"
                  target="_blank"
                  rel="noopener noreferrer"
                  withArrow
                >
                  Follow on Instagram
                </MagneticLink>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Section>
  );
}
