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
  /**
   * The date exactly as the source shows it — "2 months ago", "July 2026".
   * Takes precedence over formatting `reviewedAt`, so a transcribed review
   * displays the words that are actually on it.
   */
  dateLabel?: string | null;
  /** Deep link to this review on Google, so a visitor can verify it. */
  reviewUrl: string | null;
  source: string;
};

/**
 * Why the reviews list is empty.
 *
 * Without this the section fails the same silent way whether nobody set the
 * keys, the wrong API is enabled, or the Place ID is a typo — three problems
 * with three different fixes and no way to tell them apart from the page.
 */
export type ReviewsStatus =
  | "ok"
  | "missing_key"
  | "missing_place_id"
  | "missing_both"
  | "api_denied"
  | "place_not_found"
  | "api_error"
  | "network_error"
  | "no_reviews";

export type GoogleReviews = {
  reviews: DisplayReview[];
  /** Overall score across all ratings, not just the five returned. */
  rating: number | null;
  total: number | null;
  /** Link to the full listing, for the "read them all" action. */
  profileUrl: string | null;
  status: ReviewsStatus;
  /**
   * One sentence naming the exact problem and its fix. Safe to render: it
   * names environment variables and Google console settings, never a key or
   * any part of one.
   */
  diagnosis: string | null;
};

const empty = (
  status: ReviewsStatus,
  diagnosis: string | null = null,
): GoogleReviews => ({
  reviews: [],
  rating: null,
  total: null,
  profileUrl: null,
  status,
  diagnosis,
});

export const EMPTY_GOOGLE_REVIEWS: GoogleReviews = empty("missing_both");

export const isGoogleReviewsConfigured = () =>
  Boolean(
    process.env.GOOGLE_PLACES_API_KEY?.trim() &&
    process.env.GOOGLE_PLACE_ID?.trim(),
  );

/** Which of the two variables are missing, if either. */
export function missingReviewEnv(): ReviewsStatus | null {
  const hasKey = Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim());
  const hasPlace = Boolean(process.env.GOOGLE_PLACE_ID?.trim());
  if (!hasKey && !hasPlace) return "missing_both";
  if (!hasKey) return "missing_key";
  if (!hasPlace) return "missing_place_id";
  return null;
}

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

const MISSING_MESSAGES: Record<string, string> = {
  missing_both:
    "Neither GOOGLE_PLACES_API_KEY nor GOOGLE_PLACE_ID is set, so there is nothing to fetch.",
  missing_key: "GOOGLE_PLACE_ID is set but GOOGLE_PLACES_API_KEY is not.",
  missing_place_id: "GOOGLE_PLACES_API_KEY is set but GOOGLE_PLACE_ID is not.",
};

export async function getGoogleReviews(): Promise<GoogleReviews> {
  const missing = missingReviewEnv();
  if (missing) {
    return empty(missing, MISSING_MESSAGES[missing] ?? null);
  }

  const key = process.env.GOOGLE_PLACES_API_KEY!.trim();
  const placeId = process.env.GOOGLE_PLACE_ID!.trim();

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
      // Google puts the real reason in the body. Read it, name it, and never
      // echo the key itself.
      const detail = await response.text().catch(() => "");
      const reason = /"message"\s*:\s*"([^"]+)"/.exec(detail)?.[1] ?? "";

      const { status, diagnosis } = describeHttpFailure(
        response.status,
        reason,
      );
      console.error(
        `Google Places ${response.status} (${status}): ${diagnosis}` +
          (reason ? ` — Google said: ${reason}` : ""),
      );
      return empty(status, diagnosis);
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

    const rating = typeof data.rating === "number" ? data.rating : null;
    const total =
      typeof data.userRatingCount === "number" ? data.userRatingCount : null;

    if (reviews.length === 0) {
      // The call worked — the profile simply has no written reviews yet, or
      // Google chose to return none. Nothing to fix, and nothing to invent.
      console.warn(
        `Google Places returned no reviews for ${placeId}. The profile may have ratings but no written reviews yet.`,
      );
      return {
        reviews,
        rating,
        total,
        profileUrl: data.googleMapsUri ?? null,
        status: "no_reviews",
        diagnosis:
          "Google answered, but returned no written reviews for this Place ID. Check GOOGLE_PLACE_ID points at the right listing.",
      };
    }

    return {
      reviews,
      rating,
      total,
      profileUrl: data.googleMapsUri ?? null,
      status: "ok",
      diagnosis: null,
    };
  } catch (error) {
    console.error("Google reviews fetch failed", error);
    return empty(
      "network_error",
      "The request to Google could not be completed. Check outbound network access from the server.",
    );
  }
}

/** Maps an HTTP failure onto the thing that actually has to be changed. */
function describeHttpFailure(
  code: number,
  reason: string,
): { status: ReviewsStatus; diagnosis: string } {
  if (code === 403 || /API_KEY|PERMISSION|blocked|referer/i.test(reason)) {
    return {
      status: "api_denied",
      diagnosis:
        "Google rejected the key. Enable \u201cPlaces API (New)\u201d for the project, and make sure the key has no HTTP-referrer restriction \u2014 this call is made from the server, not the browser.",
    };
  }
  if (code === 404) {
    return {
      status: "place_not_found",
      diagnosis:
        "Google could not find that Place ID. Check GOOGLE_PLACE_ID \u2014 it should look like ChIJ\u2026 and come from the Place ID finder, not from the profile URL.",
    };
  }
  if (code === 429) {
    return {
      status: "api_error",
      diagnosis:
        "Google rate-limited the request. Check the quota and billing on the Cloud project.",
    };
  }
  return {
    status: "api_error",
    diagnosis: `Google returned HTTP ${code}. Check the Cloud project's Places API (New) setup and billing.`,
  };
}
