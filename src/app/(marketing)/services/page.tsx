import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CTASection } from "@/components/home/CTASection";
import { JsonLd } from "@/components/seo/JsonLd";
import { SERVICES, SERVICE_CATEGORIES } from "@/lib/services";
import { imageFill } from "@/lib/media";
import { pageMetadata, absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";
import { centreRow } from "@/lib/align";
import { cn, pad } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Tiling Services",
  description:
    "Residential and commercial tiling, bathroom renovations, waterproofing, screeding, large format, natural stone, outdoor tiling, demolition and repairs across Western Australia.",
  path: "/services",
});

export default function ServicesPage() {
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
        lead={`Twelve services covering the whole job — preparation, protection, installation and repair — across ${site.state}.`}
        imageKey="floorTiling"
        breadcrumbs={[{ name: "Services", path: "/services" }]}
      />

      <Section spacing="loose" className="bg-ink">
        <div className="shell">
          {SERVICE_CATEGORIES.map((category) => {
            const services = SERVICES.filter((s) => s.category === category);
            if (services.length === 0) return null;

            return (
              <div key={category} className="mb-20 last:mb-0">
                <div
                  className={cn(
                    "flex items-baseline gap-4 border-b border-stone/18 pb-4",
                    centreRow,
                  )}
                >
                  <h2 className="font-display text-title text-bone">{category}</h2>
                  <span className="text-xs text-stone tabular-nums">
                    {pad(services.length)}
                  </span>
                </div>

                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service, index) => (
                    <Reveal key={service.slug} delay={index * 0.05}>
                      <Link
                        href={`/services/${service.slug}`}
                        className="group relative flex h-full flex-col overflow-hidden rounded-sm border border-stone/18 bg-charcoal transition-colors duration-500 hover:border-bronze/50"
                      >
                        <span className="relative block aspect-[16/10] overflow-hidden">
                          <Image
                            {...imageFill(service.image)}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                            className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/25 to-transparent"
                          />
                        </span>

                        <span className="flex flex-1 flex-col p-6">
                          <span className="font-display text-xl font-medium tracking-[-0.03em] text-bone">
                            {service.title}
                          </span>
                          <span className="mt-3 flex-1 text-sm leading-relaxed text-sand/70">
                            {service.summary}
                          </span>
                          <span className="mt-5 flex items-center gap-2 text-[0.7rem] font-medium tracking-[0.16em] text-bronze-light uppercase">
                            Read more
                            <svg viewBox="0 0 12 12" className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" fill="none">
                              <path d="M1 11 11 1M4 1h7v7" stroke="currentColor" strokeWidth="1.4" />
                            </svg>
                          </span>
                        </span>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <CTASection imageKey="commercial" />
    </>
  );
}
