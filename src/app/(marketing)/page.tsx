import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { BuildUp } from "@/components/home/BuildUp";
import { LayerStory } from "@/components/home/LayerStory";
import { ServicesShowcase } from "@/components/home/ServicesShowcase";
import { ProjectsShowcase } from "@/components/home/ProjectsShowcase";
import { BeforeAfterSection } from "@/components/home/BeforeAfterSection";
import { VideoRail } from "@/components/home/VideoRail";
import { WhyKabura } from "@/components/home/WhyKabura";
import { TileWall } from "@/components/home/TileWall";
import { BathroomVisualiser } from "@/components/home/BathroomVisualiser";
import { LatestWork } from "@/components/home/LatestWork";
import { resolveSocialPosts } from "@/lib/social-resolve";
import { Testimonials } from "@/components/home/Testimonials";
import { ServiceAreasSection } from "@/components/home/ServiceAreasSection";
import { CTASection } from "@/components/home/CTASection";
import { Marquee } from "@/components/ui/Marquee";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProjects, getReviews } from "@/lib/data";
import { faqSchema, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { SERVICES } from "@/lib/services";

export const metadata: Metadata = pageMetadata({
  title: `${site.legalName} — ${site.tagline}`,
  description: site.proposition,
  path: "/",
});

const HOME_FAQS = [
  {
    question: "What areas of Western Australia does Kabura Tiling work in?",
    answer:
      "Kabura works across Perth, Rockingham, Mandurah, Baldivis, Secret Harbour, Port Kennedy and the surrounding areas. If your project sits outside those areas, send us the address and we will tell you whether we can get there.",
  },
  {
    question: "Do you handle waterproofing as well as tiling?",
    answer:
      "Yes. Wet-area waterproofing is part of the work — surface preparation, bond breakers and reinforcing at junctions, sealing of penetrations, multi-coat application, and cure time before tiling begins.",
  },
  {
    question: "Can you do a complete bathroom renovation?",
    answer:
      "Yes. Bathroom renovations run from strip-out and disposal, through substrate rectification, screeding to falls and waterproofing, to floor and wall tiling, grouting and final silicone.",
  },
  {
    question: "Do you install large-format tiles and natural stone?",
    answer:
      "Yes. Large formats up to slab sizes are installed with back-buttering for full adhesive coverage and levelling systems through the setting time. Natural stone is dry-laid for tonal blending and vein matching, then sealed before and after grouting.",
  },
  {
    question: "How do I get a quote?",
    answer:
      "Use the quote form on the site. It asks what you need, where the project is, approximate size and timing, and lets you upload photos of the space so the quote can be based on what is actually there.",
  },
];

export default async function HomePage() {
  const [projects, reviews, posts] = await Promise.all([
    getProjects(),
    getReviews(),
    resolveSocialPosts(),
  ]);

  return (
    <>
      <JsonLd data={faqSchema(HOME_FAQS)} />

      <Hero />

      <Marquee
        items={SERVICES.map((s) => s.short)}
        className="border-y border-stone/12 bg-charcoal py-4"
      />

      <BuildUp />
      <LayerStory />
      <ServicesShowcase />
      <ProjectsShowcase projects={projects} />
      <BeforeAfterSection />
      <VideoRail />
      <WhyKabura />
      <TileWall />
      <BathroomVisualiser />
      <LatestWork posts={posts} />
      <Testimonials data={reviews} />
      <ServiceAreasSection />

      <CTASection />
    </>
  );
}
