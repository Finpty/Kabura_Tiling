import "server-only";

import type { ReviewRow } from "./supabase/types";

/**
 * Live Google reviews, read from the Places API.
 *
 * This exists so that no review on this site is ever written by hand. Reviews
 * are pulled from Kabura's own Google Business Profile, attributed to the
 * person who wrote them, and linked back to the review on Google — which is
 * both what Google's terms require and the only honest way to show them.
 *
 * Unconfigured, it returns nothing and the site keeps its "reviews coming soon"
 * state. It never invents, paraphrases or reorders a review's text.
 *
 * Setup:
 *   1. Google Cloud console → enable "Places API (New)" → create an API key,
 *      restricted to that API.
 *   2. Find the Place ID for the business:
 *      https://developers.google.com/maps/documentation/places/web-service/place-id
 *   3. Set GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID.
 *
 * The API returns at most five reviews, chosen by Google. That is a limit of
 * the platform, not of this code.
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
  googleMapsUri?: string;
};

type GooglePlaceResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: GooglePlaceReview[];
};

export type GoogleReviews = {
  reviews: ReviewRow[];
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

export async function getGoogleReviews(): Promise<GoogleReviews> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  const placeId = process.env.GOOGLE_PLACE_ID?.trim();
  if (!key || !placeId) return EMPTY_GOOGLE_REVIEWS;

  try {
    const response = await fetch(`${ENDPOINT}/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "rating,userRatingCount,googleMapsUri,reviews.rating,reviews.text,reviews.authorAttribution,reviews.publishTime,reviews.googleMapsUri",
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

    const reviews: ReviewRow[] = (data.reviews ?? [])
      .map((review, index): ReviewRow | null => {
        const body = review.text?.text?.trim();
        const author = review.authorAttribution?.displayName?.trim();
        // Without both, it is not an attributable review — drop it rather than
        // display something anonymous or empty.
        if (!body || !author) return null;

        return {
          id: review.name ?? `google-${index}`,
          author_name: author,
          rating: typeof review.rating === "number" ? review.rating : null,
          body,
          source: "Google",
          reviewed_at: review.publishTime ?? null,
          approved: true,
          sort_order: index,
        };
      })
      .filter((review): review is ReviewRow => review !== null);

    return {
      reviews,
      rating: typeof data.rating === "number" ? data.rating : null,
      total: typeof data.userRatingCount === "number" ? data.userRatingCount : null,
      profileUrl: data.googleMapsUri ?? null,
    };
  } catch (error) {
    console.error("Google reviews fetch failed", error);
    return EMPTY_GOOGLE_REVIEWS;
  }
}
