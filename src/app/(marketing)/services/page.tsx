import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { RevealText } from "@/components/ui/RevealText";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { CTASection } from "@/components/home/CTASection";
import { LatestWork } from "@/components/home/LatestWork";
import { resolveSocialPosts } from "@/lib/social-resolve";
import { ServicesExplorer } from "@/components/services/ServicesExplorer";
import { JsonLd } from "@/components/seo/JsonLd";
import { SERVICES, SERVICE_CATEGORIES } from "@/lib/services";
import { pageMetadata, absoluteUrl } from "@/lib/seo";
import { site, hasPhone } from "@/lib/site";
import { centreBlock, centreRow, centreText } from "@/lib/align";
import { cn, telHref } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Tiling Services",
  description:
    "Residential and commercial tiling, bathroom renovations, waterproofing, screeding, large format, natural stone, outdoor tiling, demolition and repairs across Western Australia.",
  path: "/services",
});

/**
 * The four stages every job passes through. Not a claim about the business —
 * a description of the order the work happens in, which is the same order the
 * categories are listed in.
 */
const STAGES = [
  {
    label: "Preparation",
    note: "Strip out, level, sheet and set out before anything is fixed.",
  },
  {
    label: "Protection",
    note: "Waterproofing and screeding, detailed at every junction.",
  },
  {
    label: "Installation",
    note: "Floors, walls, stone and large format, set out before set down.",
  },
  {
    label: "Aftercare",
    note: "Repairs, regrouting and resealing when a surface needs it.",
  },
];

export default async function ServicesPage() {
  const posts = await resolveSocialPosts();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Tiling services",
          itemListElement: SERVICES.map((service, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: service.title,
            url: absoluteUrl(`/services/${service.slug}`),
          })),
        }}
      />

      <PageHero
        eyebrow="Services"
        title="Everything between the substrate and the grout."
        titleFace="serif"
        lead={`${SERVICES.length} services covering the whole job — preparation, protection, installation and repair — across ${site.state}.`}
        imageKey="floorTiling"
        breadcrumbs={[{ name: "Services", path: "/services" }]}
      />

      {/* The shape of a job */}
      <Section
        spacing="normal"
        className="border-t border-stone/12 bg-charcoal"
      >
        <div className="shell">
          <div className={cn("max-w-3xl", centreText, centreBlock)}>
            <SectionLabel eyebrow="How a job runs" className={centreRow} />
            <RevealText
              as="h2"
              text="Four stages, in the order they happen."
              className={cn(
                "mt-6 block font-display text-headline text-bone",
                centreBlock,
              )}
              stagger={0.04}
            />
          </div>

          <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-stone/18 bg-stone/15 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((stage, index) => (
              <li
                key={stage.label}
                className="group relative bg-charcoal p-7 transition-colors duration-700 hover:bg-charcoal-2"
              >
                {/* Bronze underline that draws in on hover */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-bronze-light to-transparent transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                />
                <p className="eyebrow text-bronze-light/85 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 font-display text-2xl font-medium tracking-[-0.03em] text-bone">
                  {stage.label}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-sand/70">
                  {stage.note}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* The services themselves */}
      <Section spacing="loose" className="border-t border-stone/12 bg-ink">
        <div className="shell">
          <div
            className={cn(
              "flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between",
              "items-center lg:items-end",
            )}
          >
            <div>
              <SectionLabel eyebrow="What we do" className={centreRow} />
              <h2
                className={cn(
                  "mt-6 max-w-xl font-display text-headline text-bone",
                  centreText,
                  centreBlock,
                )}
              >
                Every surface, properly built up.
              </h2>
              <p
                className={cn(
                  "mt-5 max-w-lg text-lead text-sand/75",
                  centreText,
                  centreBlock,
                )}
              >
                {SERVICE_CATEGORIES.length} categories, {SERVICES.length}{" "}
                services. Filter to what your project needs.
              </p>
            </div>

            <div className={cn("flex flex-wrap gap-3", centreRow)}>
              <MagneticLink href="/quote" variant="bronze" size="md" withArrow>
                Request a quote
              </MagneticLink>
              {hasPhone() ? (
                <MagneticLink
                  href={telHref(site.phone!)}
                  variant="outline"
                  size="md"
                >
                  {site.phone}
                </MagneticLink>
              ) : null}
            </div>
          </div>

          <Reveal className="mt-14">
            <ServicesExplorer />
          </Reveal>
        </div>
      </Section>

      <LatestWork posts={posts} />

      <CTASection imageKey="commercial" />
    </>
  );
}
