import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/services";
import { SERVICE_AREAS } from "@/lib/service-areas";
import { getProjects } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const projects = await getProjects();

  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
      { url: absoluteUrl("/services"), changeFrequency: "monthly", priority: 0.9 },
      { url: absoluteUrl("/projects"), changeFrequency: "weekly", priority: 0.9 },
      { url: absoluteUrl("/bathrooms"), changeFrequency: "monthly", priority: 0.9 },
      { url: absoluteUrl("/about"), changeFrequency: "yearly", priority: 0.6 },
      { url: absoluteUrl("/service-areas"), changeFrequency: "monthly", priority: 0.8 },
      { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.7 },
      { url: absoluteUrl("/quote"), changeFrequency: "yearly", priority: 0.95 },
      { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
      { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
    ] satisfies MetadataRoute.Sitemap
  ).map((entry) => ({ ...entry, lastModified: now }));

  const serviceRoutes: MetadataRoute.Sitemap = SERVICES.map((service) => ({
    url: absoluteUrl(`/services/${service.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const areaRoutes: MetadataRoute.Sitemap = SERVICE_AREAS.map((area) => ({
    url: absoluteUrl(`/service-areas/${area.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  // Placeholder projects are noindex, so they stay out of the sitemap too.
  const projectRoutes: MetadataRoute.Sitemap = projects
    .filter((project) => !project.isPlaceholder)
    .map((project) => ({
      url: absoluteUrl(`/projects/${project.slug}`),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.7,
    }));

  return [...staticRoutes, ...serviceRoutes, ...areaRoutes, ...projectRoutes];
}
