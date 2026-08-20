"use client";

import { useState } from "react";
import { Section, SectionLabel } from "@/components/ui/Section";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { centreBlock, centreItems, centreRow, centreText } from "@/lib/align";
import { cn } from "@/lib/utils";

/**
 * ⚠️  PLACEHOLDER PAIRS. These are brand/atmosphere visuals arranged to
 * demonstrate the component — they are not photographs of one room before and
 * after Kabura worked on it. Replace with genuine matched pairs (loaded from the
 * `projects` table's before_url / after_url) before launch.
 */
const PAIRS = [
  {
    id: "bathroom",
    label: "Bathroom",
    before: "waterproofing",
    after: "bathroom",
    caption: "Waterproofed wet area through to a finished bathroom.",
  },
  {
    id: "floor",
    label: "Floor",
    before: "demolition",
    after: "residential",
    caption: "Combed adhesive through to a finished large-format floor.",
  },
  {
    id: "wall",
    label: "Wall",
    before: "wall",
    after: "cornerDetail",
    caption: "Combed adhesive through to a finished corner.",
  },
];

export function BeforeAfterSection() {
  const [active, setActive] = useState(0);
  const pair = PAIRS[active];

  return (
    <Section
      id="before-after"
      spacing="loose"
      className="border-t border-stone/12 bg-charcoal"
      aria-labelledby="before-after-heading"
    >
      <div className="shell">
        <div
          className={cn(
            "flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between",
            centreItems,
          )}
        >
          <div className={cn("max-w-xl", centreText, centreBlock)}>
            <SectionLabel
              index="06"
              eyebrow="Before / after"
              className={centreRow}
            />
            <h2
              id="before-after-heading"
              className="mt-6 font-display text-headline text-bone"
            >
              Drag the line.
            </h2>
            <p className="mt-5 text-lead text-sand/70">{pair.caption}</p>
          </div>

          <div
            role="tablist"
            aria-label="Comparison examples"
            className="flex flex-wrap gap-2"
          >
            {PAIRS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={index === active}
                onClick={() => setActive(index)}
                className={cn(
                  "rounded-full border px-5 py-2.5 text-[0.72rem] font-medium tracking-[0.16em] uppercase transition-colors duration-400",
                  index === active
                    ? "border-bronze-light bg-bronze-light/12 text-bronze-light"
                    : "border-stone/30 text-sand/60 hover:border-stone/60 hover:text-bone",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <BeforeAfterSlider
          key={pair.id}
          beforeKey={pair.before}
          afterKey={pair.after}
          className="mt-12 aspect-[16/10] w-full rounded-sm md:aspect-[16/8]"
        />

        <PlaceholderNotice className="mt-8 max-w-3xl">
          Placeholder comparison. These are brand visuals shown to demonstrate
          the slider, not one room photographed before and after. Real matched
          pairs load from the <code>projects</code> table once Kabura supplies
          them.
        </PlaceholderNotice>
      </div>
    </Section>
  );
}
