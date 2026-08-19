import Image from "next/image";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { RevealText } from "@/components/ui/RevealText";
import { imageFill } from "@/lib/media";
import { centreBlock, centreRow, centreText } from "@/lib/align";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow: string;
  title: string;
  lead?: string;
  imageKey?: string;
  breadcrumbs?: { name: string; path: string }[];
  children?: ReactNode;
  className?: string;
  /** Shorter hero for detail pages. */
  size?: "sm" | "lg";
  /**
   * `display` is the big uppercase-scale sans. `serif` sets the heading in
   * Instrument Serif italic at the much quieter `--text-feature` size — for
   * pages where the sentence is doing the work and a nine-rem headline would
   * only shout over it.
   */
  titleFace?: "display" | "serif";
};

/** Shared interior-page opener: image, scrim, breadcrumbs, display heading. */
export function PageHero({
  eyebrow,
  title,
  lead,
  imageKey = "heroBathroomAlt",
  breadcrumbs,
  children,
  className,
  size = "lg",
  titleFace = "display",
}: Props) {
  return (
    <section
      className={cn(
        "grain relative isolate flex flex-col justify-end overflow-hidden",
        size === "lg"
          ? "min-h-[72svh] pt-[calc(var(--header-h)+5rem)] pb-16 md:pb-20"
          : "min-h-[52svh] pt-[calc(var(--header-h)+4rem)] pb-12 md:pb-16",
        className,
      )}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image
          {...imageFill(imageKey)}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/55 to-ink/85" />
      </div>

      <div className={cn("shell relative", centreText)}>
        {breadcrumbs ? (
          <Breadcrumbs items={breadcrumbs} className="mb-8" />
        ) : null}

        <div className={cn("flex items-center gap-4", centreRow)}>
          <span
            aria-hidden="true"
            className="hidden h-px lg:block w-10 bg-bronze-light/80"
          />
          <p className="eyebrow text-bronze-light">{eyebrow}</p>
        </div>

        <RevealText
          as="h1"
          text={title}
          className={cn(
            "mt-6 block text-bone",
            centreBlock,
            titleFace === "serif"
              ? "max-w-2xl font-serif text-feature italic"
              : cn(
                  "max-w-4xl font-display",
                  size === "lg" ? "text-display" : "text-headline",
                ),
          )}
          stagger={titleFace === "serif" ? 0.035 : 0.05}
        />

        {lead ? (
          <p
            className={cn("mt-7 max-w-2xl text-lead text-sand/80", centreBlock)}
          >
            {lead}
          </p>
        ) : null}

        {children}
      </div>
    </section>
  );
}
