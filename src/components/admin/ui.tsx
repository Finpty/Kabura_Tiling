import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The handful of shapes every admin screen is built from.
 *
 * Kept deliberately small and deliberately still. An admin screen is read, not
 * admired: numbers must be scannable in bad light on a phone, so the palette
 * does the work and nothing moves except on hover.
 */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone/12 px-4 py-5 md:px-8 md:py-7">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-bone md:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-sand/60">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-stone/15 bg-charcoal/40 p-4 md:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A single figure.
 *
 * `hint` is where the qualification goes — "excl GST", "estimate" — because a
 * number on a business dashboard without its basis stated is a number someone
 * will eventually act on wrongly.
 */
export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn" | "muted";
}) {
  return (
    <Card>
      <p className="text-[0.62rem] tracking-[0.14em] text-stone uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-medium tabular-nums md:text-[1.75rem]",
          tone === "good" && "text-emerald-300",
          tone === "warn" && "text-bronze-light",
          tone === "muted" && "text-sand/60",
          tone === "default" && "text-bone",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-[0.7rem] text-stone">{hint}</p> : null}
    </Card>
  );
}

const TONES = {
  neutral: "border-stone/30 text-sand/80",
  live: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  warn: "border-bronze/50 bg-bronze/10 text-bronze-light",
  cold: "border-stone/20 bg-stone/5 text-stone",
} as const;

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[0.62rem] font-medium tracking-[0.08em] uppercase",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-stone/20 px-5 py-10 text-center text-sm text-stone">
      {children}
    </div>
  );
}

export function RowLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-stone/15 bg-charcoal/30 p-4 transition-colors hover:border-bronze-light/40 hover:bg-charcoal/60"
    >
      {children}
    </Link>
  );
}

/** The sentence that belongs under anything tax-shaped. */
export function EstimateNote({ children }: { children?: ReactNode }) {
  return (
    <p className="mt-3 text-[0.7rem] leading-relaxed text-stone">
      {children ??
        "Estimate only — confirm with your accountant or bookkeeper."}
    </p>
  );
}

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="px-4 py-6 md:px-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[0.68rem] tracking-[0.16em] text-stone-light uppercase">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
