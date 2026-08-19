"use client";

import { useState } from "react";
import { SocialIcon } from "@/components/ui/SocialIcons";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { embedUrl, embeddablePosts, type SocialPost } from "@/lib/social-posts";
import { SOCIAL_LABELS } from "@/lib/site";
import { centreBlock, centreRow } from "@/lib/align";
import { cn } from "@/lib/utils";

/**
 * The project wall, as video.
 *
 * Each tile is a real post from Kabura's own Instagram, TikTok, Facebook or
 * YouTube, played through that platform's official embed. Nothing is scraped
 * and nothing is re-hosted: the URL goes in, the platform's own player comes
 * out, and the view count stays where it belongs.
 *
 * Click to load, not autoplay. Four embedded players mounted at once is four
 * third-party frames, four sets of cookies and several megabytes before the
 * visitor has asked for anything — so a tile stays a poster until it is
 * played, and only then becomes an iframe.
 *
 * With nothing configured this renders the instructions instead of an empty
 * grid. It never shows a stand-in video.
 */

const ORIENTATION = {
  portrait: "aspect-[9/16]",
  landscape: "aspect-video sm:col-span-2",
} as const;

function VideoTile({ post }: { post: SocialPost }) {
  const [playing, setPlaying] = useState(false);
  const src = embedUrl(post);
  const orientation = post.orientation ?? "portrait";
  const label = post.caption ?? `${SOCIAL_LABELS[post.platform]} post`;

  return (
    <li
      className={cn(
        "relative overflow-hidden rounded-xl border border-stone/20 bg-charcoal-2",
        ORIENTATION[orientation],
      )}
    >
      {playing && src ? (
        <iframe
          src={src}
          title={label}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          scrolling="no"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-5 transition-colors duration-700 hover:bg-charcoal"
        >
          <span className="sr-only">Play {label}</span>

          {/* Poster: the platform's own colour language, not a photograph. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 opacity-70 transition-opacity duration-700 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, color-mix(in oklab, var(--color-bronze) 22%, transparent) 0%, transparent 64%)",
            }}
          />

          <span
            aria-hidden="true"
            className="relative grid h-16 w-16 place-items-center rounded-full border border-bone/25 bg-ink/60 text-bone backdrop-blur-sm transition-[transform,border-color,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:border-bronze-light group-hover:bg-bronze/30"
          >
            <svg
              viewBox="0 0 24 24"
              className="ml-1 h-6 w-6"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>

          <span className="relative flex items-center gap-2 text-xs tracking-[0.16em] text-sand/80 uppercase">
            <SocialIcon name={post.platform} className="h-3.5 w-3.5" />
            {SOCIAL_LABELS[post.platform]}
          </span>

          {post.caption ? (
            <span className="relative max-w-[22ch] px-6 text-center text-sm leading-snug text-bone/90">
              {post.caption}
            </span>
          ) : null}
        </button>
      )}
    </li>
  );
}

export function VideoWall() {
  const posts = embeddablePosts();

  if (posts.length === 0) {
    return (
      <div className={cn("max-w-3xl", centreBlock)}>
        <PlaceholderNotice className="text-left">
          <span className="block">
            No project videos are shown because none have been added yet, and
            nothing here is invented.
          </span>
          <span className="mt-3 block">
            Paste the post URLs into <code>src/lib/social-posts.ts</code> — one
            entry per video, straight from the address bar:
          </span>
          {/* `break-all` because these are URLs: without it a phone-width
              column cannot break them and the page scrolls sideways. */}
          <span className="mt-3 block [&_code]:break-all">
            <span className="block text-sand/85">
              Instagram — <code>instagram.com/reel/…</code>
            </span>
            <span className="mt-1 block text-sand/85">
              TikTok — <code>tiktok.com/@…/video/…</code>
            </span>
            <span className="mt-1 block text-sand/85">
              YouTube — <code>youtube.com/watch?v=…</code> or{" "}
              <code>/shorts/…</code>
            </span>
            <span className="mt-1 block text-sand/85">
              Facebook — the post permalink
            </span>
          </span>
          <span className="mt-3 block">
            Each one plays here through the platform&rsquo;s own embed. No API
            keys, no tokens, nothing to renew.
          </span>
        </PlaceholderNotice>

        <div className={cn("mt-8 flex flex-wrap", centreRow)}>
          <SocialLinks centred />
        </div>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
      {posts.map((post) => (
        <VideoTile key={post.id} post={post} />
      ))}
    </ul>
  );
}
