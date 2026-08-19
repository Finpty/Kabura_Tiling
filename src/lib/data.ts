import "server-only";

import { createServerSupabase } from "./supabase/server";
import { PLACEHOLDER_PROJECTS, type Project, type ProjectCategory } from "./projects";
import {
  EMPTY_GOOGLE_REVIEWS,
  getGoogleReviews,
  type GoogleReviews,
} from "./google-reviews";
import type { ReviewRow } from "./supabase/types";

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
 * Reviews shown on the site, from the two sources that can be trusted:
 * Kabura's live Google Business Profile, and rows an admin has explicitly
 * approved in Supabase. Google comes first — it is verifiable by anyone.
 *
 * No review is ever authored here. Both sources empty is the expected state
 * before launch, and the UI says "reviews coming soon" rather than filling
 * the space with something invented.
 */
export async function getReviews(): Promise<GoogleReviews> {
  const [google, supabase] = await Promise.all([
    getGoogleReviews(),
    createServerSupabase(),
  ]);

  let approved: ReviewRow[] = [];
  if (supabase) {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("approved", true)
      .order("sort_order", { ascending: true });
    if (!error && data) approved = data as ReviewRow[];
  }

  if (google.reviews.length === 0 && approved.length === 0) {
    return EMPTY_GOOGLE_REVIEWS;
  }

  return { ...google, reviews: [...google.reviews, ...approved] };
}
