import Image from "next/image";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { RevealText } from "@/components/ui/RevealText";
import { imageProps } from "@/lib/media";
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
          {...imageProps(imageKey)}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/55 to-ink/85" />
      </div>

      <div className="shell relative">
        {breadcrumbs ? (
          <Breadcrumbs items={breadcrumbs} className="mb-8" />
        ) : null}

        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="h-px w-10 bg-bronze-light/80" />
          <p className="eyebrow text-bronze-light">{eyebrow}</p>
        </div>

        <RevealText
          as="h1"
          text={title}
          className={cn(
            "mt-6 block max-w-4xl font-display text-bone",
            size === "lg" ? "text-display" : "text-headline",
          )}
          stagger={0.05}
        />

        {lead ? (
          <p className="mt-7 max-w-2xl text-lead text-sand/80">{lead}</p>
        ) : null}

        {children}
      </div>
    </section>
  );
}
