import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CTASection } from "@/components/home/CTASection";
import { JsonLd } from "@/components/seo/JsonLd";
import { CoverageBoard } from "@/components/service-areas/CoverageBoard";
import { SERVICE_AREAS } from "@/lib/service-areas";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { centreBlock, centreRow, centreText } from "@/lib/align";
import { cn, pad } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Service Areas",
  description: `Tiling, waterproofing and bathroom renovations across ${SERVICE_AREAS.map((a) => a.name).join(", ")} and the surrounding areas of Western Australia.`,
  path: "/service-areas",
});

export default function ServiceAreasPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Service areas",
          itemListElement: SERVICE_AREAS.map((area, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: area.name,
            url: absoluteUrl(`/service-areas/${area.slug}`),
          })),
        }}
      />

      <PageHero
        eyebrow="Where we work"
        title={`Tiling across ${site.state}.`}
        lead="These are the areas we currently cover. If your project sits outside them, ask — we would rather tell you honestly than take a job we cannot service properly."
        imageKey="outdoor"
        breadcrumbs={[{ name: "Service Areas", path: "/service-areas" }]}
      />

      <Section spacing="loose" className="bg-ink">
        <div className="shell">
          <div className={cn("mx-auto max-w-2xl", centreText, centreBlock)}>
            <SectionLabel
              eyebrow="Areas we service"
              className={cn("mb-6", centreRow)}
            />
            <h2
              className={cn(
                "font-display text-headline text-bone",
                centreText,
                centreBlock,
              )}
            >
              Our coverage.
            </h2>
            <p
              className={cn(
                "mt-5 text-lead text-sand/75",
                centreText,
                centreBlock,
              )}
            >
              The region we work across, and the suburbs we have confirmed
              inside it.
            </p>
          </div>

          <Reveal className="mt-12 flex justify-center">
            <CoverageBoard />
          </Reveal>

          <div className="mt-20 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SERVICE_AREAS.map((area, index) => (
              <Reveal key={area.slug} delay={index * 0.05}>
                <Link
                  href={`/service-areas/${area.slug}`}
                  className="group flex h-full flex-col border border-stone/20 bg-charcoal p-7 transition-colors duration-500 hover:border-bronze/50"
                >
                  <span className="eyebrow text-bronze-light/80 tabular-nums">
                    {pad(index + 1)}
                  </span>
                  <span className="mt-4 font-display text-3xl font-medium tracking-[-0.03em] text-bone">
                    {area.name}
                  </span>
                  <span className="mt-1.5 text-xs text-stone">
                    {area.region}
                  </span>
                  <span className="mt-5 flex-1 text-sm leading-relaxed text-sand/70">
                    {area.intro}
                  </span>
                  <span className="mt-6 text-xs text-stone tabular-nums">
                    {area.postcodes.join(" · ")}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>

          <div
            className={cn(
              "mt-16 max-w-3xl border-l border-bronze/50 bg-bronze/[0.06] px-6 py-5",
              centreText,
              centreBlock,
            )}
          >
            <SectionLabel eyebrow="Somewhere else?" className={centreRow} />
            <p className="mt-4 leading-relaxed text-sand/80">
              We have not listed every suburb in {site.state}, and we are not
              going to claim coverage we cannot deliver. Send us the address
              with your enquiry and we will tell you straight away whether we
              can get there.
            </p>
          </div>
        </div>
      </Section>

      <CTASection imageKey="residential" />
    </>
  );
}
