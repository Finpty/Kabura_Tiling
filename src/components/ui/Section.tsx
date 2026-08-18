import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Vertical rhythm. `flush` removes padding for full-bleed sections. */
  spacing?: "flush" | "tight" | "normal" | "loose";
  as?: "section" | "div" | "article" | "footer";
  "aria-labelledby"?: string;
};

const SPACING = {
  flush: "",
  tight: "py-16 md:py-20",
  normal: "py-24 md:py-32",
  loose: "py-28 md:py-44",
} as const;

export function Section({
  children,
  className,
  id,
  spacing = "normal",
  as: Tag = "section",
  ...rest
}: SectionProps) {
  return (
    <Tag id={id} className={cn("relative", SPACING[spacing], className)} {...rest}>
      {children}
    </Tag>
  );
}

type HeaderProps = {
  eyebrow?: string;
  index?: string;
  className?: string;
  children?: ReactNode;
};

/** Small numbered section label used across the site. */
export function SectionLabel({ eyebrow, index, className }: HeaderProps) {
  if (!eyebrow && !index) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-4 text-stone-light",
        className,
      )}
    >
      {index ? (
        <span className="eyebrow text-bronze-light/90 tabular-nums">{index}</span>
      ) : null}
      {index && eyebrow ? (
        <span aria-hidden="true" className="h-px w-10 bg-stone/40" />
      ) : null}
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
    </div>
  );
}
