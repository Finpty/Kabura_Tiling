import "server-only";

import { createServerSupabase } from "./supabase/server";
import {
  PLACEHOLDER_PROJECTS,
  type Project,
  type ProjectCategory,
} from "./projects";
import {
  getGoogleReviews,
  type DisplayReview,
  type GoogleReviews,
} from "./google-reviews";
import type { ReviewRow } from "./supabase/types";
import { shownReviews } from "./reviews";

/**
 * Read paths for public content.
 *
 * Each one prefers Supabase and falls back to the shipped placeholder data, so
 * the marketing site is fully functional before a database exists and upgrades
 * itself the moment real content is published — with no code change.
 */

function rowToProject(row: {
  slug: string;
  title: string;
  category: string;
  project_type: string | null;
  suburb: string | null;
  tile_type: string | null;
  tile_size: string | null;
  services_completed: string[] | null;
  description: string | null;
  cover_url: string | null;
  before_url: string | null;
  after_url: string | null;
  video_url: string | null;
  is_placeholder: boolean;
  project_media?: { url: string; caption: string | null; sort_order: number }[];
}): Project {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category as ProjectCategory,
    projectType: row.project_type ?? "—",
    suburb: row.suburb ?? "—",
    tileType: row.tile_type ?? "—",
    tileSize: row.tile_size ?? "—",
    servicesCompleted: row.services_completed ?? [],
    description: row.description ?? "",
    cover: row.cover_url ?? "bathroom",
    gallery: (row.project_media ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({ key: m.url, caption: m.caption ?? undefined })),
    beforeAfter:
      row.before_url && row.after_url
        ? { before: row.before_url, after: row.after_url }
        : undefined,
    video: row.video_url ?? undefined,
    isPlaceholder: row.is_placeholder,
  };
}

export async function getProjects(): Promise<Project[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return PLACEHOLDER_PROJECTS;

  const { data, error } = await supabase
    .from("projects")
    .select(
      "slug,title,category,project_type,suburb,tile_type,tile_size,services_completed,description,cover_url,before_url,after_url,video_url,is_placeholder,project_media(url,caption,sort_order)",
    )
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return PLACEHOLDER_PROJECTS;
  return data.map(rowToProject);
}

export async function getProject(slug: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}

/**
 * Reviews shown on the site, from the three sources that can be trusted:
 * Kabura's live Google Business Profile, reviews transcribed from that same
 * profile in `src/lib/reviews.ts`, and rows an admin approved in Supabase.
 *
 * Order matters. Google's own API comes first — it is the only source a
 * visitor can verify independently — then the transcribed list, then Supabase.
 * A review that appears in both the API and the transcription is de-duplicated
 * on author and opening words, so switching the API on does not double every
 * card.
 *
 * No review is ever authored here. Every source empty is a valid state: the
 * section renders nothing rather than filling the space with something
 * invented.
 */
export async function getReviews(): Promise<GoogleReviews> {
  const [google, supabase] = await Promise.all([
    getGoogleReviews(),
    createServerSupabase(),
  ]);

  const transcribed: DisplayReview[] = shownReviews().map((review) => ({
    id: review.id,
    authorName: review.authorName,
    authorPhotoUrl: null,
    authorProfileUrl: null,
    rating: review.rating,
    body: review.body,
    reviewedAt: null,
    dateLabel: review.date ?? null,
    reviewUrl: review.url ?? null,
    source: review.source ?? "Google",
  }));

  let approved: DisplayReview[] = [];
  if (supabase) {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("approved", true)
      .order("sort_order", { ascending: true });

    // Admin-approved rows carry no author photo or Google deep link — those
    // belong to Google's own attribution and are not invented here.
    if (!error && data) {
      approved = (data as ReviewRow[]).map((row) => ({
        id: row.id,
        authorName: row.author_name,
        authorPhotoUrl: null,
        authorProfileUrl: null,
        rating: row.rating,
        body: row.body,
        reviewedAt: row.reviewed_at,
        reviewUrl: null,
        source: row.source ?? "Kabura Tiling",
      }));
    }
  }

  /** Same person, same opening — the API and the transcription overlapping. */
  const fingerprint = (review: DisplayReview) =>
    `${review.authorName.trim().toLowerCase()}|${review.body.trim().slice(0, 40).toLowerCase()}`;

  const seen = new Set(google.reviews.map(fingerprint));
  const localOnly = transcribed.filter((review) => !seen.has(fingerprint(review)));

  if (
    google.reviews.length === 0 &&
    localOnly.length === 0 &&
    approved.length === 0
  ) {
    // Keep the diagnosis: it is the only thing that says *why* the section is
    // empty, and it is what the placeholder renders.
    return google;
  }

  return {
    ...google,
    status: "ok",
    reviews: [...google.reviews, ...localOnly, ...approved],
  };
}
