import "server-only";

/**
 * Live Google reviews, read from the Places API.
 *
 * This exists so that no review on this site is ever written by hand. Reviews
 * are pulled from Kabura's own Google Business Profile, attributed to the
 * person who wrote them, and linked back to the review on Google — which is
 * both what Google's terms require and the only honest way to show them.
 *
 * Unconfigured, it returns nothing and the site keeps its "reviews coming soon"
 * state. It never invents, paraphrases, reorders or truncates a review's text.
 *
 * Setup:
 *   1. Google Cloud console → enable "Places API (New)" → create an API key,
 *      restricted to that API.
 *   2. Find the Place ID for the business:
 *      https://developers.google.com/maps/documentation/places/web-service/place-id
 *   3. Set GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID.
 *
 * The API returns at most five reviews, chosen by Google. That is a limit of
 * the platform, not of this code — which is why the overall rating and the
 * total count are shown alongside them and link out to the full listing.
 */

const ENDPOINT = "https://places.googleapis.com/v1/places";

type GooglePlaceReview = {
  name?: string;
  rating?: number;
  text?: { text?: string; languageCode?: string };
  originalText?: { text?: string };
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  publishTime?: string;
  relativePublishTimeDescription?: string;
  googleMapsUri?: string;
};

type GooglePlaceResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: GooglePlaceReview[];
};

/**
 * One review as the site displays it.
 *
 * Separate from the Supabase `reviews` row on purpose: this carries the
 * attribution a Google review must keep — the author's photo, their profile,
 * and a link to the review itself — which a database row has no column for.
 */
export type DisplayReview = {
  id: string;
  authorName: string;
  /** Google-hosted avatar. Null when the reviewer has no photo. */
  authorPhotoUrl: string | null;
  authorProfileUrl: string | null;
  rating: number | null;
  body: string;
  /** ISO timestamp, or null. */
  reviewedAt: string | null;
  /** Deep link to this review on Google, so a visitor can verify it. */
  reviewUrl: string | null;
  source: string;
};

export type GoogleReviews = {
  reviews: DisplayReview[];
  /** Overall score across all ratings, not just the five returned. */
  rating: number | null;
  total: number | null;
  /** Link to the full listing, for the "read them all" action. */
  profileUrl: string | null;
};

export const EMPTY_GOOGLE_REVIEWS: GoogleReviews = {
  reviews: [],
  rating: null,
  total: null,
  profileUrl: null,
};

export const isGoogleReviewsConfigured = () =>
  Boolean(
    process.env.GOOGLE_PLACES_API_KEY?.trim() &&
    process.env.GOOGLE_PLACE_ID?.trim(),
  );

/**
 * Google serves avatars at whatever size the URL asks for. Requesting the size
 * actually rendered keeps the payload small and the image crisp on retina.
 */
function sizedPhoto(uri: string | undefined, px: number): string | null {
  const trimmed = uri?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    // Google user-content URLs carry their sizing in a trailing `=s96-c`
    // segment. Anything else is passed through untouched.
    if (!url.hostname.endsWith("googleusercontent.com")) return url.toString();
    url.pathname = url.pathname.replace(/=s\d+(-c)?$/, "");
    return `${url.origin}${url.pathname}=s${px}-c`;
  } catch {
    return null;
  }
}

export async function getGoogleReviews(): Promise<GoogleReviews> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  const placeId = process.env.GOOGLE_PLACE_ID?.trim();
  if (!key || !placeId) return EMPTY_GOOGLE_REVIEWS;

  try {
    const response = await fetch(`${ENDPOINT}/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "rating,userRatingCount,googleMapsUri,reviews.rating,reviews.text,reviews.authorAttribution,reviews.publishTime,reviews.relativePublishTimeDescription,reviews.googleMapsUri",
      },
      // Reviews change slowly and the API is billed per call. One fetch a day.
      next: { revalidate: 86_400 },
    });

    if (!response.ok) {
      console.error(
        `Google Places returned ${response.status}. Check the API key, its restrictions, and that Places API (New) is enabled.`,
      );
      return EMPTY_GOOGLE_REVIEWS;
    }

    const data = (await response.json()) as GooglePlaceResponse;

    const reviews: DisplayReview[] = (data.reviews ?? [])
      .map((review, index): DisplayReview | null => {
        const body = review.text?.text?.trim();
        const author = review.authorAttribution?.displayName?.trim();
        // Without both, it is not an attributable review — drop it rather than
        // display something anonymous or empty.
        if (!body || !author) return null;

        return {
          id: review.name ?? `google-${index}`,
          authorName: author,
          authorPhotoUrl: sizedPhoto(review.authorAttribution?.photoUri, 96),
          authorProfileUrl: review.authorAttribution?.uri ?? null,
          rating: typeof review.rating === "number" ? review.rating : null,
          body,
          reviewedAt: review.publishTime ?? null,
          reviewUrl: review.googleMapsUri ?? null,
          source: "Google",
        };
      })
      .filter((review): review is DisplayReview => review !== null);

    return {
      reviews,
      rating: typeof data.rating === "number" ? data.rating : null,
      total:
        typeof data.userRatingCount === "number" ? data.userRatingCount : null,
      profileUrl: data.googleMapsUri ?? null,
    };
  } catch (error) {
    console.error("Google reviews fetch failed", error);
    return EMPTY_GOOGLE_REVIEWS;
  }
}
