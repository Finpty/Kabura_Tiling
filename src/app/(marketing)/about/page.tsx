import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { RevealText } from "@/components/ui/RevealText";
import { CTASection } from "@/components/home/CTASection";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { imageFill } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { pad } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Kabura Tiling Group is built around preparation, levels, falls, waterproofing, alignment, corners, cuts, grout joints and clean finishes — the details most people never notice.",
  path: "/about",
});

const DETAILS = [
  {
    title: "Preparation",
    body: "The substrate decides everything that follows. It gets assessed, corrected and made ready before a single tile is opened.",
  },
  {
    title: "Levels",
    body: "A floor reads as one plane or it doesn't. Levelling systems and a straight edge decide that, not optimism.",
  },
  {
    title: "Falls",
    body: "Water goes where the screed sends it. Falls are set from the waste and checked across the whole area, without flat spots or dishing.",
  },
  {
    title: "Waterproofing",
    body: "Continuous, reinforced at the junctions, sealed at the penetrations, applied to thickness and given time to cure.",
  },
  {
    title: "Tile alignment",
    body: "Joints line through from room to room. Where they can't, the break is chosen deliberately rather than discovered.",
  },
  {
    title: "Corners",
    body: "External corners are mitred or trimmed — decided before the tile is cut, because there is no fixing it afterwards.",
  },
  {
    title: "Cuts",
    body: "Cuts land where they should. A 15mm sliver in the most visible corner of a room is a set-out failure, not bad luck.",
  },
  {
    title: "Grout joints",
    body: "Consistent width, packed properly, cleaned back, and the right product for the tile and the location.",
  },
  {
    title: "Clean finishes",
    body: "Silicone where movement happens, edges tidy, surfaces washed down, and the room left usable.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Built around the details most people never notice."
        imageKey="cornerDetail"
        breadcrumbs={[{ name: "About", path: "/about" }]}
      />

      {/* Editorial statement */}
      <Section spacing="loose" className="bg-ink">
        <div className="shell">
          <div className="max-w-5xl">
            <RevealText
              as="p"
              text="Nobody walks into a finished bathroom and compliments the screed."
              className="block font-display text-headline text-bone"
              stagger={0.035}
            />
            <div className="mt-10 grid gap-8 md:grid-cols-2 md:gap-14">
              <p className="text-lead text-sand/80">
                They notice the room feels right — that the floor is flat, the
                joints line up, the corners resolve, and nothing sits at an angle
                that catches the eye. What they are actually noticing is a series
                of decisions made long before the tiles arrived.
              </p>
              <p className="text-lead text-sand/80">
                {site.name} is built around that part of the job. The
                preparation, the levels, the falls and the waterproofing are the
                work; the tile is what the work is wearing.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Full-bleed image */}
      <Section spacing="flush" className="relative">
        <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-[21/8]">
          <Image
            {...imageFill("floorTiling")}
            alt="Floor tiles set into combed adhesive with spacers at the joints."
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-ink/35" />
        </div>
      </Section>

      {/* The details */}
      <Section spacing="loose" className="border-t border-stone/12 bg-charcoal">
        <div className="shell">
          <SectionLabel eyebrow="What we pay attention to" />
          <h2 className="mt-6 max-w-2xl font-display text-headline text-bone">
            Nine things that decide the finish.
          </h2>

          <ol className="mt-14 grid gap-px overflow-hidden rounded-sm border border-stone/18 bg-stone/15 sm:grid-cols-2 lg:grid-cols-3">
            {DETAILS.map((detail, index) => (
              <li key={detail.title} className="bg-charcoal p-7">
                <span className="eyebrow text-bronze-light/80 tabular-nums">
                  {pad(index + 1)}
                </span>
                <h3 className="mt-4 font-display text-2xl font-medium tracking-[-0.03em] text-bone">
                  {detail.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-sand/70">
                  {detail.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Honest company facts */}
      <Section spacing="loose" className="border-t border-stone/12 bg-ink">
        <div className="shell grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <SectionLabel eyebrow="The company" />
            <h2 className="mt-6 font-display text-headline text-bone">
              {site.legalName}
            </h2>
            <p className="mt-7 text-lead text-sand/80">
              A tiling company working across {site.state} on residential and
              commercial projects — bathrooms, floors, walls, wet areas, stone
              and outdoor spaces — from demolition and preparation through to the
              final grout.
            </p>
            <p className="mt-5 font-serif text-3xl text-bronze-light italic">
              {site.tagline}
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <PlaceholderNotice>
              This page deliberately makes no claims about years in business,
              number of projects, awards, certifications or licence numbers,
              because none have been supplied. Send those through and they will
              be added here — with the registration numbers alongside them so
              they can be checked.
            </PlaceholderNotice>

            <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-sm">
              <Image
                {...imageFill("stoneFeature")}
                alt=""
                fill
                sizes="(min-width: 1024px) 45vw, 92vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </Section>

      <CTASection imageKey="bathroomReveal" />
    </>
  );
}
