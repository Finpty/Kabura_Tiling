import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionLabel } from "@/components/ui/Section";
import { CTASection } from "@/components/home/CTASection";
import { RequestDate } from "@/components/booking/RequestDate";
import { pageMetadata } from "@/lib/seo";
import { centreRow } from "@/lib/align";

export const metadata: Metadata = pageMetadata({
  title: "Check availability",
  description:
    "See which days Kabura Tiling has open, pick one that suits, and request it. Every date is confirmed personally before it is locked in.",
  path: "/book",
});

/**
 * The public booking page.
 *
 * The calendar shows exactly four words — available, limited, booked,
 * unavailable — derived live from the diary. Choosing a day sends a request
 * the office approves before anything is held; the page says so in plain
 * terms, because a customer who believes they have booked something that was
 * never confirmed is the worst outcome this page could produce.
 */
export default function BookPage() {
  return (
    <>
      <PageHero
        eyebrow="Availability"
        title="Pick a day that suits."
        lead="The calendar shows our real availability. Choose an open day, tell us about the job, and we confirm the date with you personally — usually the same day."
      />

      <Section spacing="loose">
        <div className="shell">
          <SectionLabel index="01" eyebrow="Request a date" className={centreRow} />
          <div className="mt-10">
            <RequestDate />
          </div>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
