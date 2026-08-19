import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { ProjectsGrid } from "@/components/projects/ProjectsGrid";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { CTASection } from "@/components/home/CTASection";
import { getProjects } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Projects",
  description:
    "Selected tiling, bathroom, stone, commercial, outdoor and large-format projects by Kabura Tiling Group across Western Australia.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const projects = await getProjects();
  const anyPlaceholder = projects.some((project) => project.isPlaceholder);

  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title="Selected Projects"
        lead={`Residential, bathrooms, commercial, stone, outdoor and large format across ${site.state}.`}
        imageKey="bathroomReveal"
        breadcrumbs={[{ name: "Projects", path: "/projects" }]}
      />

      <Section spacing="loose" className="bg-ink">
        <div className="shell">
          {anyPlaceholder ? (
            <PlaceholderNotice className="mb-10 max-w-3xl">
              Every record below is a placeholder built to demonstrate the
              portfolio. The imagery is brand and atmosphere visuals — not
              photographs of completed Kabura work — and suburbs, tile
              selections and scopes are illustrative. Real projects replace them
              once Kabura supplies photography.
            </PlaceholderNotice>
          ) : null}

          <ProjectsGrid projects={projects} />
        </div>
      </Section>

      <CTASection
        eyebrow="Your project next"
        heading="Every one of these starts the same way."
        imageKey="stoneFeature"
      />
    </>
  );
}
