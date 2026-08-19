import { SocialIcon } from "./SocialIcons";
import { configuredSocials } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The social row.
 *
 * Renders only the profiles that are actually configured — an unset platform
 * is absent from the DOM rather than rendered as a disabled or dead icon. With
 * nothing configured the component renders nothing at all, so a caller can drop
 * it in without guarding.
 *
 * Every link is `rel="me"` so the profiles verify against each other, and each
 * carries a visible-to-assistive-tech label because the glyph alone is not a
 * name.
 */

type Props = {
  className?: string;
  /** `icons` is the compact circular row; `labels` shows the platform name. */
  variant?: "icons" | "labels";
  size?: "sm" | "md";
  /** Centre the row below `lg`, matching the mobile-centred sections. */
  centred?: boolean;
};

const SIZES = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
} as const;

export function SocialLinks({
  className,
  variant = "icons",
  size = "md",
  centred = false,
}: Props) {
  const socials = configuredSocials();
  if (socials.length === 0) return null;

  if (variant === "labels") {
    return (
      <ul
        className={cn(
          "flex flex-wrap gap-x-5 gap-y-2.5",
          centred && "justify-center lg:justify-start",
          className,
        )}
      >
        {socials.map((social) => (
          <li key={social.key}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer me"
              className="group inline-flex items-center gap-2.5 text-sm text-sand/80 transition-colors duration-300 hover:text-bone"
            >
              <SocialIcon
                name={social.key}
                className="h-4 w-4 text-stone-light transition-colors duration-300 group-hover:text-bronze-light"
              />
              <span className="link-underline">{social.shortLabel}</span>
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className={cn(
        "flex flex-wrap gap-2.5",
        centred && "justify-center lg:justify-start",
        className,
      )}
    >
      {socials.map((social) => (
        <li key={social.key}>
          <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer me"
            title={social.label}
            className={cn(
              "group relative grid place-items-center overflow-hidden rounded-full border border-stone/25 text-sand",
              "transition-[color,border-color,transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
              "hover:-translate-y-1 hover:border-bronze-light/70 hover:text-ink",
              "hover:shadow-[0_12px_28px_-14px_color-mix(in_oklab,var(--color-bronze)_75%,transparent)]",
              "focus-visible:-translate-y-1 focus-visible:border-bronze-light/70",
              SIZES[size],
            )}
          >
            <span className="sr-only">{social.label}</span>

            {/* Bronze fill wipes up from the bottom rather than fading in —
                the same easing as the buttons, so the whole site moves alike. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 translate-y-full rounded-full bg-gradient-to-t from-bronze to-bronze-light transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-focus-visible:translate-y-0"
            />
            {/* Hairline ring that blooms outward on hover. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full ring-1 ring-bronze-light/0 transition-[transform,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:shadow-[0_0_0_5px_color-mix(in_oklab,var(--color-bronze)_16%,transparent)]"
            />
            <SocialIcon
              name={social.key}
              className="relative h-[1.05rem] w-[1.05rem] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
