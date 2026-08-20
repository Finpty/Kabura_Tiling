import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionLabel } from "@/components/ui/Section";
import { CTASection } from "@/components/home/CTASection";
import { JsonLd } from "@/components/seo/JsonLd";
import { SERVICE_AREAS, getServiceArea } from "@/lib/service-areas";
import { SERVICES } from "@/lib/services";
import { centreBlock, centreRow, centreText } from "@/lib/align";
import { absoluteUrl, faqSchema, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { cn, pad } from "@/lib/utils";

export function generateStaticParams() {
  return SERVICE_AREAS.map((area) => ({ slug: area.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const area = getServiceArea(slug);
  if (!area) return {};

  return pageMetadata({
    title: `Tiling ${area.name}`,
    description: `Tiling, waterproofing and bathroom renovations in ${area.name}, ${area.region}. ${area.intro}`,
    path: `/service-areas/${area.slug}`,
  });
}

export default async function ServiceAreaPage({ params }: Params) {
  const { slug } = await params;
  const area = getServiceArea(slug);
  if (!area) notFound();

  const nearby = area.nearby
    .map((s) => getServiceArea(s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const faqs = [
    {
      question: `Does Kabura Tiling work in ${area.name}?`,
      answer: `Yes. ${area.intro}`,
    },
    {
      question: `What postcodes does that cover?`,
      answer: `${area.name} sits in ${area.postcodes.join(", ")}, within the ${area.region}.`,
    },
    {
      question: `What tiling services are available in ${area.name}?`,
      answer: `All of them — ${SERVICES.map((s) => s.title.toLowerCase()).join(", ")}.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: `Tiling in ${area.name}`,
            description: area.intro,
            url: absoluteUrl(`/service-areas/${area.slug}`),
            provider: { "@id": `${site.url.replace(/\/$/, "")}/#business` },
            areaServed: {
              "@type": "City",
              name: area.name,
              containedInPlace: { "@type": "State", name: site.state },
            },
          },
          faqSchema(faqs),
        ]}
      />

      <PageHero
        eyebrow={area.region}
        title={`Tiling in ${area.name}.`}
        lead={area.intro}
        imageKey="residential"
        size="sm"
        breadcrumbs={[
          { name: "Service Areas", path: "/service-areas" },
          { name: area.name, path: `/service-areas/${area.slug}` },
        ]}
      />

      <Section spacing="normal" className="bg-ink">
        <div className="shell grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-20">
          <div>
            <SectionLabel
              eyebrow={`What matters in ${area.name}`}
              className={centreRow}
            />
            <ul className="mt-8 flex flex-col gap-6">
              {area.notes.map((note) => (
                <li key={note} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-2.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-bronze-light"
                  />
                  <span
                    className={cn(
                      "text-lead text-sand/80",
                      centreText,
                      centreBlock,
                    )}
                  >
                    {note}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-16">
              <h2 className="font-display text-title text-bone">
                Services available in {area.name}
              </h2>
              <ul className="mt-8 grid gap-px overflow-hidden rounded-sm border border-stone/18 bg-stone/15 sm:grid-cols-2">
                {SERVICES.map((service, index) => (
                  <li key={service.slug} className="bg-ink">
                    <Link
                      href={`/services/${service.slug}`}
                      className="group flex items-baseline gap-4 p-5 transition-colors duration-400 hover:bg-charcoal"
                    >
                      <span className="eyebrow text-bronze-light/70 tabular-nums">
                        {pad(index + 1)}
                      </span>
                      <span className="text-sand/85 transition-colors group-hover:text-bone">
                        {service.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="lg:sticky lg:top-32 lg:self-start">
            <dl className="border-t border-stone/18">
              <div className="flex items-baseline justify-between gap-4 border-b border-stone/18 py-4">
                <dt className="eyebrow text-stone-light">Region</dt>
                <dd className="text-right text-sm text-bone">{area.region}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-stone/18 py-4">
                <dt className="eyebrow text-stone-light">Postcodes</dt>
                <dd className="text-right text-sm text-bone tabular-nums">
                  {area.postcodes.join(", ")}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-stone/18 py-4">
                <dt className="eyebrow text-stone-light">State</dt>
                <dd className="text-right text-sm text-bone">{site.state}</dd>
              </div>
            </dl>

            {nearby.length > 0 ? (
              <div className="mt-10">
                <h2 className="eyebrow text-stone-light">Nearby</h2>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {nearby.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/service-areas/${item.slug}`}
                        className="inline-block rounded-full border border-stone/30 px-3.5 py-1.5 text-xs text-sand/80 transition-colors hover:border-bronze-light hover:text-bronze-light"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Link
              href="/quote"
              className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-bronze px-7 text-[0.76rem] font-semibold tracking-[0.16em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink"
            >
              Quote in {area.name}
            </Link>
          </aside>
        </div>
      </Section>

      <Section
        spacing="normal"
        className="border-t border-stone/12 bg-charcoal"
      >
        <div className="shell">
          <SectionLabel eyebrow="Questions" className={centreRow} />
          <dl className="mt-8 border-t border-stone/18">
            {faqs.map((faq) => (
              <div key={faq.question} className="border-b border-stone/18 py-6">
                <dt className="font-display text-xl font-medium tracking-[-0.02em] text-bone">
                  {faq.question}
                </dt>
                <dd className="mt-3 max-w-3xl leading-relaxed text-sand/75">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <CTASection
        eyebrow={`${area.name} quote`}
        heading={`Working on something in ${area.name}?`}
        imageKey="outdoor"
      />
    </>
  );
}
