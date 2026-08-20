import "server-only";

import {
  embedUrl,
  embeddablePosts,
  isTikTokShareLink,
  type SocialPost,
} from "./social-posts";

/**
 * Turns a configured post into everything the page needs to render it.
 *
 * TikTok share links — the `tiktok.com/t/ABC123/` form the app's share sheet
 * produces — carry no video id, and the embed player needs one. TikTok's own
 * oEmbed endpoint resolves them: it is public, documented, needs no key or
 * token, and returns the numeric id, the post's real caption and its cover
 * frame in a single call. That is three things this site would otherwise have
 * to either do without or make up.
 *
 * Resolution happens on the server and is cached for a day, so a visitor never
 * waits on TikTok and TikTok never sees the visitor. If the call fails — no
 * network, rate limit, post deleted — the post keeps its link-out card and the
 * page is otherwise unaffected. Nothing here is ever invented: a caption is
 * shown only when TikTok returned one.
 *
 * A post configured with a full `@user/video/12345` URL skips all of this and
 * resolves offline.
 */

export type ResolvedPost = SocialPost & {
  /** Ready-to-use iframe src, or null when the post can only be linked to. */
  embedSrc: string | null;
  /** Cover frame from the platform, when it supplied one. */
  thumbnailUrl: string | null;
  /** The author's own caption. Never written here. */
  resolvedCaption: string | null;
};

type TikTokOEmbed = {
  title?: string;
  thumbnail_url?: string;
  embed_product_id?: string;
};

const OEMBED = "https://www.tiktok.com/oembed";

async function resolveTikTok(post: SocialPost): Promise<ResolvedPost> {
  const fallback: ResolvedPost = {
    ...post,
    embedSrc: embedUrl(post),
    thumbnailUrl: post.thumbnail ?? null,
    resolvedCaption: post.caption ?? null,
  };

  try {
    const response = await fetch(
      `${OEMBED}?url=${encodeURIComponent(post.url)}`,
      {
        headers: { Accept: "application/json" },
        /**
         * An hour. Posts themselves do not change, but a *failed* lookup is
         * cached too — and a build that ran somewhere without outbound access
         * to tiktok.com would otherwise serve link-out cards for a full day.
         * An hour keeps the endpoint quiet and still self-heals.
         */
        next: { revalidate: 3_600 },
      },
    );

    if (!response.ok) {
      console.error(
        `TikTok oEmbed returned ${response.status} for ${post.url}. ` +
          (response.status === 404
            ? "The post is private or removed."
            : "Most likely the server could not reach tiktok.com — check outbound network access, then rate limits."),
      );
      return fallback;
    }

    const data = (await response.json()) as TikTokOEmbed;
    const id = data.embed_product_id?.trim();

    return {
      ...post,
      embedSrc: id
        ? `https://www.tiktok.com/embed/v2/${id}`
        : fallback.embedSrc,
      thumbnailUrl: post.thumbnail ?? data.thumbnail_url?.trim() ?? null,
      resolvedCaption: post.caption ?? data.title?.trim() ?? null,
    };
  } catch (error) {
    console.error(`TikTok oEmbed failed for ${post.url}`, error);
    return fallback;
  }
}

/** Resolves every configured post, in parallel. */
export async function resolveSocialPosts(): Promise<ResolvedPost[]> {
  return Promise.all(
    embeddablePosts().map((post) => {
      if (post.platform === "tiktok" && isTikTokShareLink(post.url)) {
        return resolveTikTok(post);
      }
      return Promise.resolve<ResolvedPost>({
        ...post,
        embedSrc: embedUrl(post),
        thumbnailUrl: post.thumbnail ?? null,
        resolvedCaption: post.caption ?? null,
      });
    }),
  );
}
