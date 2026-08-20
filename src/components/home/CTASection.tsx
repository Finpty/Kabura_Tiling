import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { RevealText } from "@/components/ui/RevealText";
import { imageFill } from "@/lib/media";
import { site, hasPhone } from "@/lib/site";
import { centreBlock, centreRow, centreText } from "@/lib/align";
import { cn, telHref } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  heading?: string;
  body?: string;
  imageKey?: string;
};

/** Closing conversion block, reused at the bottom of most pages. */
export function CTASection({
  eyebrow = "Free quote",
  heading = "Tell us about your project.",
  body = "Send through the room, the rough size and a few photos. We will come back with a considered quote — not a number pulled out of the air.",
  imageKey = "heroBathroomAlt",
}: Props) {
  return (
    <Section
      spacing="flush"
      className="relative isolate overflow-hidden border-t border-stone/12"
      aria-labelledby="cta-heading"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image
          {...imageFill(imageKey)}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/82" />
      </div>

      <div className="shell py-28 md:py-40">
        <div className={cn("max-w-3xl", centreText, centreBlock)}>
          <p className="eyebrow text-bronze-light">{eyebrow}</p>
          <RevealText
            as="h2"
            text={heading}
            className="mt-6 block font-display text-headline text-bone"
            stagger={0.05}
          />
          <p
            className={cn("mt-6 max-w-xl text-lead text-sand/80", centreBlock)}
          >
            {body}
          </p>

          <div
            className={cn("mt-10 flex flex-wrap items-center gap-3", centreRow)}
          >
            <MagneticLink href="/quote" variant="bronze" size="lg" withArrow>
              Request a Free Quote
            </MagneticLink>
            {hasPhone() ? (
              <MagneticLink
                href={telHref(site.phone!)}
                variant="outline"
                size="lg"
              >
                Call {site.phone}
              </MagneticLink>
            ) : (
              <MagneticLink href="/contact" variant="outline" size="lg">
                Other ways to reach us
              </MagneticLink>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
