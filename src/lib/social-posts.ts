/**
 * Posts shown in the "Latest from Kabura" section.
 *
 * ⚠️  NOTHING HERE IS INVENTED, AND NOTHING IS SCRAPED. The array below ships
 * empty. Every entry is a real post Kabura has published, added here by hand
 * with its real URL, and the section links straight back to the original.
 *
 * ── Why this is a file and not a live feed ──────────────────────────────────
 * None of the four platforms will hand a website its own recent posts without
 * credentials, and the ways around that are all against their terms:
 *
 *   Instagram  needs a Meta app with the Instagram Basic Display or Graph API,
 *              a Business/Creator account linked to a Facebook Page, and a
 *              long-lived token that must be refreshed every 60 days.
 *   Facebook   needs the same Meta app plus a Page access token.
 *   TikTok     needs a TikTok for Developers app and Display API approval.
 *   YouTube    is the exception — thumbnails and embeds are public and
 *              documented, so a `youtubeId` alone is enough.
 *
 * Scraping the public pages, or hot-linking their CDN images, breaks all four
 * platforms' terms and stops working without warning. So: paste the post URL
 * and drop the image you already have into `public/media/social/`. It takes a
 * minute per post, it cannot break, and it never shows something that is not
 * yours.
 *
 * ── Adding a post ───────────────────────────────────────────────────────────
 *   1. Save the image (or a still from the video) into `public/media/social/`.
 *   2. Add an entry below with the real post URL.
 *   3. For YouTube, set `youtubeId` and skip the thumbnail entirely.
 *
 *   {
 *     id: "reel-ensuite-reveal",
 *     platform: "instagram",
 *     url: "https://www.instagram.com/p/XXXXXXXXXXX/",
 *     thumbnail: "/media/social/ensuite-reveal.jpg",
 *     caption: "Ensuite reveal in Baldivis",
 *     orientation: "portrait",
 *   }
 *
 * With the array empty the section renders a "follow us" panel instead — never
 * a placeholder post.
 */

import type { SocialKey } from "./site";

/** The platforms a post can come from. A subset of the social profile keys. */
export type PostPlatform = Extract<
  SocialKey,
  "instagram" | "facebook" | "tiktok" | "youtube"
>;

export type SocialPost = {
  /** Stable key. Any short unique string. */
  id: string;
  platform: PostPlatform;
  /** The original post. This is what a click opens. */
  url: string;
  /** Kabura's own words. Optional — never lifted from the post itself. */
  caption?: string;
  /**
   * Image under `public/media/social/`. Required for every platform except
   * YouTube, which supplies its own.
   */
  thumbnail?: string;
  /**
   * Optional short mp4 under `public/media/social/` that plays muted on hover
   * and on tap. Keep it under a couple of megabytes.
   */
  video?: string;
  /** YouTube video id — the part after `v=` or `youtu.be/`. */
  youtubeId?: string;
  /** Reels, Shorts and TikToks are portrait; most YouTube is landscape. */
  orientation?: "portrait" | "landscape";
};

export const SOCIAL_POSTS: SocialPost[] = [];

/** YouTube's documented public thumbnail. No API key, no scraping. */
export const youtubeThumbnail = (id: string) =>
  `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;

/** Privacy-preserving embed, only ever loaded after a click. */
export const youtubeEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`;

/** Posts that will actually render — anything without an image is skipped. */
export const displayablePosts = (): SocialPost[] =>
  SOCIAL_POSTS.filter(
    (post) => Boolean(post.thumbnail) || Boolean(post.youtubeId),
  );

/* ------------------------------- embedding ------------------------------- */

/**
 * Official embed URLs.
 *
 * Every one of these is the platform's own documented embed endpoint — the
 * same iframe their "Embed" button hands you. Nothing here scrapes a page,
 * lifts a CDN file or works around a restriction; if a platform ever turns its
 * endpoint off, the card falls back to a link and nothing breaks.
 *
 * Instagram and TikTok embeds render their own chrome (avatar, caption,
 * controls) and cannot be restyled from outside the iframe. That is the deal
 * their terms require, and it is why the cards below give them a clean frame
 * rather than trying to skin them.
 */

/** `https://www.instagram.com/reel/ABC123/` → `ABC123` */
export function instagramCode(url: string): string | null {
  return (
    /instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/.exec(url)?.[1] ??
    null
  );
}

/** `https://www.tiktok.com/@user/video/12345` → `12345` */
export function tiktokId(url: string): string | null {
  return /tiktok\.com\/@[^/]+\/video\/(\d+)/.exec(url)?.[1] ?? null;
}

/** Handles `watch?v=`, `youtu.be/` and `/shorts/`. */
export function youtubeId(url: string): string | null {
  return (
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(
      url,
    )?.[1] ?? null
  );
}

/**
 * The embed URL for a post, or null when the platform cannot be embedded from
 * the URL given — in which case the card links out instead.
 */
export function embedUrl(post: SocialPost): string | null {
  if (post.youtubeId) return youtubeEmbed(post.youtubeId);

  switch (post.platform) {
    case "youtube": {
      const id = youtubeId(post.url);
      return id ? youtubeEmbed(id) : null;
    }
    case "instagram": {
      const code = instagramCode(post.url);
      return code ? `https://www.instagram.com/p/${code}/embed/` : null;
    }
    case "tiktok": {
      const id = tiktokId(post.url);
      return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
    }
    case "facebook":
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(post.url)}&show_text=false`;
    default:
      return null;
  }
}

/** Posts that can actually be played in place. */
export const embeddablePosts = (): SocialPost[] =>
  SOCIAL_POSTS.filter((post) => embedUrl(post) !== null);
