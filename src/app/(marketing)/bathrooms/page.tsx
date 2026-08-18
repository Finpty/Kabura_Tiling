import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { BathroomVisualiser } from "@/components/home/BathroomVisualiser";
import { AmbientVideo } from "@/components/ui/AmbientVideo";
import { CTASection } from "@/components/home/CTASection";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { JsonLd } from "@/components/seo/JsonLd";
import { img, imageProps, video } from "@/lib/media";
import { faqSchema, pageMetadata, serviceSchema } from "@/lib/seo";
import { site } from "@/lib/site";
import { pad } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Bathroom Renovations",
  description:
    "Complete bathroom renovations across Western Australia — strip-out, substrate rectification, screeding to falls, wet-area waterproofing, tiling, grouting and final finishes.",
  path: "/bathrooms",
});

const STAGES = [
  {
    title: "Strip-out",
    body: "The old room comes out and the waste goes with it. Everything behind the surfaces gets looked at while it is open.",
  },
  {
    title: "Rectification",
    body: "Whatever the strip-out finds — failed membranes, unsupported sheeting, out-of-plumb walls — is corrected now, not tiled over.",
  },
  {
    title: "Screed",
    body: "Falls are set from the waste and the finished floor level, then worked to a straight edge so water actually goes where it should.",
  },
  {
    title: "Waterproofing",
    body: "Continuous membrane across the wet area, reinforced at junctions, sealed at penetrations, and left to cure before anything covers it.",
  },
  {
    title: "Tiling",
    body: "Set out first: full tiles where they matter, cuts balanced, joints lined through, niches and corners resolved on paper before they are cut.",
  },
  {
    title: "Finishing",
    body: "Grout packed and cleaned, silicone where the surface needs to move, and a room handed back that is ready to use.",
  },
];

const FAQS = [
  {
    question: "How long does a bathroom renovation take?",
    answer:
      "It depends on the size of the room and what the strip-out uncovers. The sequence itself is fixed — strip-out, rectification, screed, waterproofing and its cure time, tiling, then finishing — and the waterproofing cure is not something that can be compressed.",
  },
  {
    question: "Do you do the whole bathroom or only the tiling?",
    answer:
      "Kabura carries the room from demolition and preparation through to the final grout and silicone, including screeding and wet-area waterproofing.",
  },
  {
    question: "Can you work with tiles I have already chosen?",
    answer:
      "Yes. Tell us the tile, the format and the finish and the set-out is planned around what you have selected.",
  },
  {
    question: "What happens if you find a problem behind the old tiles?",
    answer:
      "We tell you what we found and what it will take to fix before we go any further. Covering it back up is not a repair.",
  },
];

export default function BathroomsPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            name: "Bathroom Renovations",
            description:
              "Complete bathroom renovations including demolition, substrate preparation, screeding, wet-area waterproofing, tiling and finishing.",
            path: "/bathrooms",
          }),
          faqSchema(FAQS),
        ]}
      />

      <PageHero
        eyebrow="Bathrooms"
        title="The hardest room in the house to get right."
        lead={`Complete bathroom renovations across ${site.state} — demolition through to final grout, by one team.`}
        imageKey="bathroom"
        breadcrumbs={[{ name: "Bathrooms", path: "/bathrooms" }]}
      />

      {/* Editorial split */}
      <Section spacing="loose" className="bg-ink">
        <div className="shell grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <Reveal>
            <SectionLabel eyebrow="Why it is different" />
            <h2 className="mt-6 font-display text-headline text-bone">
              Every surface has to shed water.
            </h2>
            <div className="mt-7 flex flex-col gap-5 text-lead text-sand/80">
              <p>
                A bathroom asks more of a trade than any other room. Every
                junction has to stay sealed, every fall has to run to the waste,
                and every line is visible from a metre away in good light.
              </p>
              <p>
                It rewards preparation and punishes shortcuts — usually about
                two years later, in the corner nobody can reach without removing
                the vanity.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <AmbientVideo
              video={video("bathroomReveal")}
              poster={img("bathroomReveal")}
              alt="Bathroom finished in large-format stone-look tiles."
              className="aspect-[4/5] w-full rounded-sm"
              placeholderLabel={video("bathroomReveal") ? undefined : "Footage to come"}
            />
          </Reveal>
        </div>
      </Section>

      {/* Stages */}
      <Section spacing="loose" className="border-t border-stone/12 bg-charcoal">
        <div className="shell">
          <SectionLabel eyebrow="The sequence" />
          <h2 className="mt-6 max-w-2xl font-display text-headline text-bone">
            Six stages, in order.
          </h2>

          <ol className="mt-14 grid gap-px overflow-hidden rounded-sm border border-stone/18 bg-stone/15 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((stage, index) => (
              <li key={stage.title} className="bg-charcoal p-7">
                <span className="eyebrow text-bronze-light/80 tabular-nums">
                  {pad(index + 1)}
                </span>
                <h3 className="mt-4 font-display text-2xl font-medium tracking-[-0.03em] text-bone">
                  {stage.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-sand/70">
                  {stage.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Before / after */}
      <Section spacing="loose" className="border-t border-stone/12 bg-ink">
        <div className="shell">
          <SectionLabel eyebrow="Before / after" />
          <h2 className="mt-6 max-w-2xl font-display text-headline text-bone">
            From waterproofed to finished.
          </h2>
          <BeforeAfterSlider
            beforeKey="waterproofing"
            afterKey="bathroom"
            className="mt-12 aspect-[16/10] w-full rounded-sm md:aspect-[16/8]"
          />
          <PlaceholderNotice className="mt-8 max-w-3xl">
            Placeholder comparison shown to demonstrate the slider — not one
            room photographed before and after. Real matched pairs replace this
            once Kabura supplies project photography.
          </PlaceholderNotice>
        </div>
      </Section>

      <BathroomVisualiser />

      {/* FAQs */}
      <Section spacing="loose" className="border-t border-stone/12 bg-ink">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
          <div>
            <SectionLabel eyebrow="Questions" />
            <h2 className="mt-6 font-display text-headline text-bone">
              Before you ask.
            </h2>
            <div className="relative mt-10 hidden aspect-[3/4] overflow-hidden rounded-sm lg:block">
              <Image
                {...imageProps("cornerDetail")}
                alt=""
                fill
                sizes="22rem"
                className="object-cover"
              />
            </div>
          </div>

          <dl className="border-t border-stone/18">
            {FAQS.map((faq) => (
              <div key={faq.question} className="border-b border-stone/18 py-7">
                <dt className="font-display text-xl font-medium tracking-[-0.02em] text-bone md:text-2xl">
                  {faq.question}
                </dt>
                <dd className="mt-3 max-w-2xl leading-relaxed text-sand/75">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <CTASection
        eyebrow="Bathroom quote"
        heading="Send us your bathroom."
        body="Photos of the room as it stands, rough dimensions and when you'd like it done. That's enough for us to come back with something considered."
        imageKey="heroBathroom"
      />
    </>
  );
}
