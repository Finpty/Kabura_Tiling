import {
  QUOTE_STATUS_LABELS,
  normaliseQuoteStatus,
  type QuoteStatus,
} from "@/lib/supabase/portal-types";
import { cn } from "@/lib/utils";

/**
 * A quote's status.
 *
 * Takes any value the column can hold, including the three legacy ones, and
 * folds them onto the current vocabulary — so a row written before the portal
 * existed reads correctly rather than falling through to a blank badge.
 */
const TONES: Record<QuoteStatus, string> = {
  new: "border-bronze-light/60 bg-bronze-light/12 text-bronze-light",
  contacted: "border-sand/40 bg-sand/10 text-sand",
  site_visit: "border-stone/50 bg-stone/12 text-stone-light",
  quote_preparing: "border-stone/45 bg-stone/10 text-stone-light",
  quote_sent: "border-bone/40 bg-bone/10 text-bone",
  accepted: "border-emerald-400/45 bg-emerald-400/10 text-emerald-300",
  declined: "border-stone/35 bg-transparent text-stone",
  expired: "border-stone/25 bg-transparent text-stone/70",
  converted: "border-bronze/60 bg-bronze/15 text-bronze-light",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const value = normaliseQuoteStatus(status);
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-3 py-1 text-[0.62rem] font-medium tracking-[0.14em] uppercase",
        TONES[value],
        className,
      )}
    >
      {QUOTE_STATUS_LABELS[value]}
    </span>
  );
}
