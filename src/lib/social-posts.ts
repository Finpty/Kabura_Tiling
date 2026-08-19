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
