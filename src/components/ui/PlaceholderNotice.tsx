import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  tone?: "inline" | "block";
};

/**
 * The site's one honest-labelling device. Any surface showing content that is
 * not yet real Kabura data says so with this, rather than quietly implying it.
 */
export function PlaceholderNotice({
  children,
  className,
  tone = "block",
}: Props) {
  if (tone === "inline") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-bronze/40 bg-bronze/10 px-3 py-1 text-[0.62rem] font-medium tracking-[0.14em] text-bronze-light uppercase",
          className,
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <p
      className={cn(
        "flex items-start gap-3 border-l border-bronze/50 bg-bronze/[0.06] px-4 py-3 text-sm leading-relaxed text-sand",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-bronze-light"
      />
      <span>{children}</span>
    </p>
  );
}
