/**
 * Reviews transcribed from Kabura's Google Business Profile.
 *
 * ⚠️  REAL REVIEWS ONLY. Nothing in this file is written by Kabura or on
 * Kabura's behalf. Each entry is a review a real customer left on Google,
 * copied out word for word — the name as it appears, the star count as it
 * appears, the text unedited, the date as Google shows it.
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 * The Places API returns at most five reviews and needs a billed Google Cloud
 * project. Until `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID` are set, this
 * list is what the site shows. It is a stand-in for the *source*, never for
 * the *content*.
 *
 * ── Adding a review ─────────────────────────────────────────────────────────
 * Copy it exactly. Do not tidy the grammar, do not shorten it, do not
 * paraphrase, and never write one that does not exist:
 *
 *   {
 *     id: "google-jane-doe",
 *     authorName: "Jane Doe",
 *     rating: 5,
 *     body: "Exactly what they said they would do, when they said they would do it.",
 *     date: "2 months ago",
 *   }
 *
 * `date` is free text because that is how Google shows it — "3 weeks ago",
 * "August 2026". It is displayed verbatim rather than reformatted, so it can
 * never drift from what the review actually says.
 *
 * ── Switching to the live API ───────────────────────────────────────────────
 * Set the two environment variables. `getReviews()` in `src/lib/data.ts` puts
 * Google's own reviews first and keeps these behind them, so nothing here has
 * to be deleted on the day the API goes live — the live ones simply lead. To
 * retire this list entirely, empty the array; the section then renders from
 * Google alone.
 */

export type LocalReview = {
  /** Any stable unique string. */
  id: string;
  /** The reviewer's name exactly as Google shows it. */
  authorName: string;
  /** 1–5, as left by the reviewer. */
  rating: number;
  /** The review, word for word. */
  body: string;
  /** As Google displays it — "2 months ago", "July 2026". Optional. */
  date?: string;
  /** Where it was left. Defaults to Google. */
  source?: string;
  /** Deep link to the review, if you have one. */
  url?: string;
};

/**
 * Paste the transcribed reviews here.
 *
 * Empty until real ones are supplied. An empty list is correct and safe: the
 * live site renders nothing at all rather than inventing something, and there
 * is no "coming soon" copy for a visitor to read. Running `next dev` is the
 * one exception — locally the section shows a note saying where the reviews
 * go, so an empty section is not mistaken for a broken one. That note is
 * compiled out of every production build.
 *
 * Order is the order the cards appear in. Put the strongest review first.
 */
export const LOCAL_REVIEWS: LocalReview[] = [];

/** How many cards the section shows. Extras stay in the file, unused. */
export const MAX_REVIEWS_SHOWN = 7;

/** The reviews the site will actually render, capped. */
export const shownReviews = (): LocalReview[] =>
  LOCAL_REVIEWS.slice(0, MAX_REVIEWS_SHOWN);

/**
 * Average of the reviews shown, to one decimal — never presented as Google's
 * own aggregate, which covers every review on the profile rather than these.
 */
export function localAverage(reviews: LocalReview[]): number | null {
  const rated = reviews.filter((review) => review.rating > 0);
  if (rated.length === 0) return null;
  const total = rated.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / rated.length) * 10) / 10;
}
