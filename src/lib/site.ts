/**
 * Single source of truth for business facts.
 *
 * ⚠️  NOTHING IN HERE IS INVENTED. Every contact detail, registration number and
 * social profile is read from an environment variable and is `null` until Kabura
 * supplies the real value. Components must use the `has*` helpers and render the
 * `PLACEHOLDER_LABEL` treatment rather than a broken link when a value is missing.
 *
 * Set the values in `.env.local` (see `.env.example`).
 */

const env = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

export const PLACEHOLDER_LABEL = "To be supplied";

export const site = {
  legalName: "Kabura Tiling Group Pty Ltd",
  name: "Kabura Tiling Group",
  shortName: "Kabura",
  tagline: "We Tile. You Smile.",
  proposition:
    "Premium tiling, waterproofing, stone and bathroom finishes across Western Australia.",
  state: "Western Australia",
  stateCode: "WA",
  country: "Australia",
  countryCode: "AU",
  locale: "en-AU",
  currency: "AUD",
  timeZone: "Australia/Perth",

  /** Canonical origin. Falls back to the Vercel-provided URL, then localhost. */
  url:
    env(process.env.NEXT_PUBLIC_SITE_URL) ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),

  /* ---------- Supplied by Kabura, 18 Aug 2026 ----------
     Committed as defaults because they are public business facts meant to be
     displayed; an environment variable still overrides for staging setups.
     The ABN passes the ATO checksum. Anything below still reading only from
     env (address, hours, socials) has not been supplied yet. */
  phone: env(process.env.NEXT_PUBLIC_BUSINESS_PHONE) ?? "0481 000 331",
  email:
    env(process.env.NEXT_PUBLIC_BUSINESS_EMAIL) ?? "Kaburatiling@gmail.com",
  abn: env(process.env.NEXT_PUBLIC_BUSINESS_ABN) ?? "84 668 679 114",
  /** Street address is optional — many trade businesses operate without a shopfront. */
  streetAddress: env(process.env.NEXT_PUBLIC_BUSINESS_STREET),
  addressLocality: env(process.env.NEXT_PUBLIC_BUSINESS_SUBURB),
  postalCode: env(process.env.NEXT_PUBLIC_BUSINESS_POSTCODE),
  openingHours: env(process.env.NEXT_PUBLIC_BUSINESS_HOURS),

  /**
   * Social profiles. Key order is display order.
   *
   * Every entry except Instagram is `null` until the matching environment
   * variable is set — no URL here is guessed from the business name. A missing
   * profile is hidden entirely rather than rendered as a dead icon.
   */
  social: {
    // Verified account, found via search. Everything else still unset.
    instagram:
      env(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM) ??
      "https://www.instagram.com/kaburatilinggroupptyltd/",
    facebook: env(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK),
    tiktok: env(process.env.NEXT_PUBLIC_SOCIAL_TIKTOK),
    youtube: env(process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE),
    google: env(process.env.NEXT_PUBLIC_SOCIAL_GOOGLE),
    linkedin: env(process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN),
  },
} as const;

export type SocialKey = keyof typeof site.social;

export const SOCIAL_LABELS: Record<SocialKey, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  google: "Google Business Profile",
  linkedin: "LinkedIn",
};

/** Shorter label for tight spaces such as the footer icon row. */
export const SOCIAL_SHORT_LABELS: Record<SocialKey, string> = {
  ...SOCIAL_LABELS,
  google: "Google",
};

export type ConfiguredSocial = {
  key: SocialKey;
  label: string;
  shortLabel: string;
  href: string;
};

export const hasPhone = () => Boolean(site.phone);
export const hasEmail = () => Boolean(site.email);
export const hasAddress = () =>
  Boolean(site.addressLocality && site.postalCode);

/** Social links that are actually configured, in display order. */
export const configuredSocials = (): ConfiguredSocial[] =>
  (Object.keys(site.social) as SocialKey[])
    .filter((key) => Boolean(site.social[key]))
    .map((key) => ({
      key,
      label: SOCIAL_LABELS[key],
      shortLabel: SOCIAL_SHORT_LABELS[key],
      href: site.social[key]!,
    }));

/** Primary navigation — every entry resolves to a real route. */
export const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/services", label: "Services" },
  { href: "/bathrooms", label: "Bathrooms" },
  { href: "/about", label: "About" },
  { href: "/service-areas", label: "Service Areas" },
  { href: "/contact", label: "Contact" },
] as const;
