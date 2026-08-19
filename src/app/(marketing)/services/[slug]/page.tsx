import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { AmbientVideo } from "@/components/ui/AmbientVideo";
import { CTASection } from "@/components/home/CTASection";
import { JsonLd } from "@/components/seo/JsonLd";
import { SERVICES, getService } from "@/lib/services";
import { SERVICE_AREAS } from "@/lib/service-areas";
import { img, imageFill, video } from "@/lib/media";
import { faqSchema, pageMetadata, serviceSchema } from "@/lib/seo";
import { site } from "@/lib/site";
import { pad } from "@/lib/utils";

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};

  return pageMetadata({
    title: `${service.title} — ${site.state}`,
    description: service.summary,
    path: `/services/${service.slug}`,
  });
}

export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const others = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 3);
  const clip = service.video ? video(service.video) : null;

  const faqs = [
    {
      question: `Does Kabura Tiling offer ${service.title.toLowerCase()} in ${site.state}?`,
      answer: `${service.summary} We cover ${SERVICE_AREAS.map((a) => a.name).join(", ")} and the surrounding areas.`,
    },
    {
      question: `What does ${service.title.toLowerCase()} involve?`,
      answer: service.scope.join("; ") + ".",
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            name: service.title,
            description: service.summary,
            path: `/services/${service.slug}`,
          }),
          faqSchema(faqs),
        ]}
      />

      <PageHero
        eyebrow={service.category}
        title={service.title}
        lead={service.summary}
        imageKey={service.image}
        breadcrumbs={[
          { name: "Services", path: "/services" },
          { name: service.title, path: `/services/${service.slug}` },
        ]}
      />

      <Section spacing="normal" className="bg-ink">
        <div className="shell grid gap-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-20">
          <div>
            <SectionLabel eyebrow="The work" />
            <div className="mt-8 flex flex-col gap-6">
              {service.body.map((paragraph) => (
                <p key={paragraph} className="text-lead text-sand/80">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-14">
              <h2 className="font-display text-title text-bone">
                What&rsquo;s included
              </h2>
              <ul className="mt-7 border-t border-stone/18">
                {service.scope.map((item, index) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-5 border-b border-stone/18 py-4"
                  >
                    <span className="eyebrow text-bronze-light/75 tabular-nums">
                      {pad(index + 1)}
                    </span>
                    <span className="text-sand/85">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="lg:sticky lg:top-32 lg:self-start">
            {clip ? (
              <AmbientVideo
                video={clip}
                poster={img(service.image)}
                alt={service.title}
                sizes="(min-width: 1024px) 22rem, 92vw"
                className="aspect-[4/5] w-full rounded-sm"
              />
            ) : (
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm">
                <Image
                  {...imageFill(service.image)}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 22rem, 92vw"
                  className="object-cover"
                />
              </div>
            )}

            <div className="mt-7 border border-stone/20 bg-charcoal p-6">
              <p className="eyebrow text-bronze-light">Next step</p>
              <p className="mt-4 text-sm leading-relaxed text-sand/75">
                Send through the room, the rough size and a few photos and
                we&rsquo;ll come back with a quote for {service.title.toLowerCase()}.
              </p>
              <Link
                href="/quote"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-bronze px-6 text-[0.74rem] font-semibold tracking-[0.16em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink"
              >
                Request a Free Quote
              </Link>
            </div>
          </aside>
        </div>
      </Section>

      <Section spacing="normal" className="border-t border-stone/12 bg-charcoal">
        <div className="shell">
          <SectionLabel eyebrow="Also available" />
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {others.map((other, index) => (
              <Reveal key={other.slug} delay={index * 0.05}>
                <Link
                  href={`/services/${other.slug}`}
                  className="group flex h-full flex-col justify-between border border-stone/20 p-6 transition-colors duration-500 hover:border-bronze/50"
                >
                  <span className="font-display text-xl font-medium tracking-[-0.03em] text-bone">
                    {other.title}
                  </span>
                  <span className="mt-4 text-sm leading-relaxed text-sand/65">
                    {other.summary}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <CTASection imageKey={service.image} />
    </>
  );
}
