import { ENQUIRY_STATUS_SHORT, type EnquiryStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const TONES: Record<EnquiryStatus, string> = {
  new: "border-bronze-light/60 bg-bronze-light/12 text-bronze-light",
  contacted: "border-sand/40 bg-sand/10 text-sand",
  site_visit: "border-stone/50 bg-stone/12 text-stone-light",
  quoted: "border-bone/40 bg-bone/10 text-bone",
  won: "border-emerald-400/45 bg-emerald-400/10 text-emerald-300",
  lost: "border-stone/35 bg-transparent text-stone",
};

export function StatusBadge({
  status,
  className,
}: {
  status: EnquiryStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-3 py-1 text-[0.62rem] font-medium tracking-[0.14em] uppercase",
        TONES[status],
        className,
      )}
    >
      {ENQUIRY_STATUS_SHORT[status]}
    </span>
  );
}
