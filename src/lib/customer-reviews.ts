/**
 * Reviews left on Kabura's Google Business Profile.
 *
 * ⚠️  REAL REVIEWS ONLY. Every entry below was transcribed from a screenshot of
 * the live profile. Nothing here is written by Kabura or on Kabura's behalf,
 * and nothing is invented — not a name, not a word of a review, not a rating,
 * not a date.
 *
 * ── Why a file and not the API ──────────────────────────────────────────────
 * The Places API needs a billed Google Cloud project and returns at most five
 * reviews. This list is all ten, costs nothing and cannot fail at request time.
 * The trade-off is that it does not update itself: when a new review is left,
 * it is transcribed here. The site therefore never claims to be "live from
 * Google" or "automatically synced", because it is not.
 *
 * ── Editing rules ───────────────────────────────────────────────────────────
 * Punctuation and obvious spelling slips may be tidied — a missing full stop, a
 * lower-case "i" — because the reviews are being re-typeset, not re-written.
 * Nothing that changes what the customer said may be touched: not their
 * wording, not their emphasis, not their meaning. Where a review was cut off by
 * Google's own "… More" link in the screenshot, `truncated` is set and the card
 * says so and links out rather than inventing an ending.
 *
 * ── Adding one ──────────────────────────────────────────────────────────────
 * Screenshot the review, copy it out exactly, append an entry. `date` is free
 * text because that is how Google words it — "4 weeks ago", "a year ago" — and
 * it is displayed verbatim so it can never drift from the review it describes.
 */

export type CustomerReview = {
  /** Stable, unique. */
  id: string;
  /** Exactly as the reviewer's name appears on Google. */
  name: string;
  /** 1–5, as left by the reviewer. */
  rating: number;
  /** The review, as written. */
  body: string;
  /** Google's own wording for when it was left. Shown verbatim. */
  date: string;
  /**
   * True when Google truncated the review behind "… More" in the screenshot.
   * The card then shows the text as an extract and links to the full review,
   * rather than implying the review ends where the screenshot did.
   */
  truncated?: boolean;
  /** Kabura's published reply, where there is one. Also verbatim. */
  ownerReply?: string;
  /** Reviewer's own context line, e.g. "Local Guide · 20 reviews". */
  context?: string;
};

/**
 * Ten reviews, newest first by Google's own ordering of the words it shows.
 *
 * No reviewer photographs are stored. Several of these people have a profile
 * picture on Google; copying someone's face onto another company's website is
 * not something to do without asking them, so every card uses a monogram.
 */
export const CUSTOMER_REVIEWS: CustomerReview[] = [
  {
    id: "aleksandra-wojcik",
    name: "Aleksandra Wójcik",
    rating: 5,
    body: "Great quality tiling and professional service. Everything was completed on time with excellent attention to detail. Highly recommended.",
    date: "4 weeks ago",
    context: "3 reviews",
  },
  {
    id: "yazdan-danish",
    name: "Yazdan Danish",
    rating: 5,
    body: "High quality tiling services plus punctuality.",
    date: "3 months ago",
    context: "3 reviews",
  },
  {
    id: "r-b",
    name: "R B",
    rating: 5,
    body: "So glad we picked Kabura Tiling to tile our house! Rez was amazing from the first email I sent, answering all my questions promptly, keeping us informed the whole way. Making sure we were happy each step of the way which is amazing because",
    date: "4 months ago",
    truncated: true,
    context: "4 reviews",
  },
  {
    id: "sean-brook",
    name: "Sean Brook",
    rating: 5,
    body: "These guys were fantastic from start to finish. Great communication, turned up when they said they would, and the workmanship is top-notch. Clean, professional, and clearly experienced. Couldn't be happier with the result and would happily recommend them to anyone.",
    date: "6 months ago",
    ownerReply: "Thanks Sean for your trust mate",
    context: "Local Guide · 20 reviews",
  },
  {
    id: "mohmmad-aqa-arifi",
    name: "Mohmmad Aqa Arifi",
    rating: 5,
    body: "Good craftsmanship, punctual, reasonable price.",
    date: "8 months ago",
    context: "6 reviews",
  },
  {
    id: "renae-evans",
    name: "Renae Evans",
    rating: 5,
    body: "We were fortunate enough recently to have Rez and Jawad renovate our main bathroom and tile our kitchen splashback. Both amazing, very professional, organised and tidy tradesmen. Will 100% use them again for all our tiling work. We are",
    date: "a year ago",
    truncated: true,
    ownerReply:
      "Thank you so much, Renae! It was a pleasure working on your home. We're really glad you love the new bathroom and splashback — no more terracotta indeed 😄. Appreciate your kind words and support! — Rez & Jawad",
    context: "7 reviews · 2 photos",
  },
  {
    id: "mohammad-jan-noori",
    name: "Mohammad Jan Noori",
    rating: 5,
    body: "Kabura is the best Tiling company, responsive, clean and respective. They have done my tiling job and I'm really satisfied of the job they have done for me, I highly recommend Kabura Tiling Group thanks. 🙏",
    date: "a year ago",
    ownerReply: "Thanks Jan for trusting us.",
    context: "2 reviews",
  },
  {
    id: "jordan-treanor",
    name: "Jordan Treanor",
    rating: 5,
    body: "Great tiler that really knows his Trade! Attention to detail and always prompt, friendly service.",
    date: "a year ago",
    truncated: true,
    ownerReply: "Thanks Jordan for trusting us.",
    context: "11 reviews · 1 photo",
  },
  {
    id: "yazran-dana",
    name: "Yazran Dana",
    rating: 5,
    body: "Highly recommend, got the job done on time.",
    date: "a year ago",
    ownerReply: "Thanks a lot for your trust bro.",
    context: "4 reviews",
  },
  {
    id: "jose-devaananth",
    name: "Jose Devaananth",
    rating: 5,
    body: "Timely and Quality",
    date: "a year ago",
    ownerReply: "Thanks a lot for your trust on us.",
    context: "3 reviews",
  },
];

/** Average of the reviews above, to one decimal. Never presented as anything else. */
export function averageRating(
  reviews: CustomerReview[] = CUSTOMER_REVIEWS,
): number | null {
  const rated = reviews.filter((review) => review.rating > 0);
  if (rated.length === 0) return null;
  const total = rated.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / rated.length) * 10) / 10;
}

/** Initials for the monogram avatar. */
export function initialsFor(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "★"
  );
}
