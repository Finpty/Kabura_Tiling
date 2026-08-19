/**
 * Next config.
 *
 * Kept as `.mjs` deliberately — `next.config.ts` needs a TypeScript loader that
 * the Hostinger build does not have, which is what the earlier fix addressed.
 * Do not rename this file back to `.ts`.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    /**
     * Google review avatars. Reviewer photos are served from Google's
     * user-content CDN; without this the reviews section could not show them.
     * The avatars themselves are rendered `unoptimized` — at 48px there is
     * nothing to gain from re-encoding, and it keeps the image pipeline out of
     * the critical path on hosts without sharp.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
