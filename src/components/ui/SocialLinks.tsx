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
              "group relative grid place-items-center rounded-full border border-stone/25 bg-charcoal/40 text-sand transition-[color,border-color,background-color,transform] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-bronze-light/70 hover:bg-bronze/12 hover:text-bronze-light",
              SIZES[size],
            )}
          >
            <span className="sr-only">{social.label}</span>
            <SocialIcon name={social.key} />
          </a>
        </li>
      ))}
    </ul>
  );
}
