import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { VideoWall } from "@/components/projects/VideoWall";
import { CTASection } from "@/components/home/CTASection";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Projects",
  description:
    "Tiling, bathroom, stone, commercial, outdoor and large-format work by Kabura Tiling Group across Western Australia, filmed on site.",
  path: "/projects",
});

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title="The work, on video."
        titleFace="serif"
        lead={`Rooms as they were handed over — filmed on site across ${site.state}, straight from our own channels.`}
        imageKey="bathroomReveal"
        breadcrumbs={[{ name: "Projects", path: "/projects" }]}
      />

      <Section spacing="loose" className="bg-ink">
        <div className="shell">
          <VideoWall />
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
