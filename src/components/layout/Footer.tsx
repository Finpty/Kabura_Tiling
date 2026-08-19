import Link from "next/link";
import { Logo } from "./Logo";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { SERVICES } from "@/lib/services";
import { SERVICE_AREAS } from "@/lib/service-areas";
import { configuredSocials, site, PLACEHOLDER_LABEL } from "@/lib/site";
import { centreBlock, centreItems, centreText } from "@/lib/align";
import { cn, telHref } from "@/lib/utils";

const YEAR = new Date().getFullYear();

/** Contact details render as an inert placeholder until the real value is configured. */
function ContactValue({
  value,
  href,
  label,
}: {
  value: string | null;
  href?: string;
  label: string;
}) {
  if (!value) {
    return (
      <span className="flex flex-col gap-1">
        <span className="text-stone">{label}</span>
        <span className="text-sand/45 italic">{PLACEHOLDER_LABEL}</span>
      </span>
    );
  }
  return (
    <span className="flex flex-col gap-1">
      <span className="text-stone">{label}</span>
      {href ? (
        <a className="link-underline text-bone" href={href}>
          {value}
        </a>
      ) : (
        <span className="text-bone">{value}</span>
      )}
    </span>
  );
}

export function Footer() {
  const socials = configuredSocials();

  return (
    <footer className="relative overflow-hidden border-t border-stone/15 bg-charcoal">
      <div className="shell py-20 md:py-28">
        {/* Closing CTA */}
        <div
          className={cn(
            "flex flex-col gap-8 border-b border-stone/15 pb-16",
            centreItems,
            "lg:flex-row lg:justify-between lg:items-end",
          )}
        >
          <div className={cn("max-w-2xl", centreText)}>
            <p className="eyebrow text-bronze-light">Start a project</p>
            <p className="mt-5 font-display text-headline text-bone">
              Tell us what you&rsquo;re planning.
            </p>
            <p
              className={cn(
                "mt-4 max-w-lg text-lead text-sand/80",
                centreBlock,
              )}
            >
              Send through the details and photos of your space and we&rsquo;ll
              come back with a considered quote.
            </p>
          </div>
          <MagneticLink href="/quote" variant="bronze" size="lg" withArrow>
            Request a Free Quote
          </MagneticLink>
        </div>

        {/* Columns */}
        <div
          className={cn(
            "grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4",
            centreText,
          )}
        >
          <div>
            <Link href="/" className="inline-block text-bone">
              <Logo />
            </Link>
            <p className="mt-6 font-serif text-2xl text-bronze-light italic">
              {site.tagline}
            </p>
            <p
              className={cn(
                "mt-4 max-w-xs text-sm leading-relaxed text-sand/70",
                centreBlock,
              )}
            >
              {site.proposition}
            </p>
            <SocialLinks className="mt-7 lg:hidden" size="sm" centred />
          </div>

          <nav aria-labelledby="footer-services">
            <h2 id="footer-services" className="eyebrow text-stone-light">
              Services
            </h2>
            <ul className="mt-6 flex flex-col gap-2.5">
              {SERVICES.slice(0, 8).map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="link-underline text-sm text-sand/80 hover:text-bone"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/services"
                  className="link-underline text-sm text-bronze-light"
                >
                  All services
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-areas">
            <h2 id="footer-areas" className="eyebrow text-stone-light">
              Service Areas
            </h2>
            <ul className="mt-6 flex flex-col gap-2.5">
              {SERVICE_AREAS.map((area) => (
                <li key={area.slug}>
                  <Link
                    href={`/service-areas/${area.slug}`}
                    className="link-underline text-sm text-sand/80 hover:text-bone"
                  >
                    {area.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="eyebrow mt-10 text-stone-light">Explore</h2>
            <ul className="mt-6 flex flex-col gap-2.5">
              <li>
                <Link
                  href="/projects"
                  className="link-underline text-sm text-sand/80 hover:text-bone"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/bathrooms"
                  className="link-underline text-sm text-sand/80 hover:text-bone"
                >
                  Bathrooms
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="link-underline text-sm text-sand/80 hover:text-bone"
                >
                  About
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow text-stone-light">Contact</h2>
            <div className="mt-6 flex flex-col gap-5 text-sm">
              <ContactValue
                label="Phone"
                value={site.phone}
                href={site.phone ? telHref(site.phone) : undefined}
              />
              <ContactValue
                label="Email"
                value={site.email}
                href={site.email ? `mailto:${site.email}` : undefined}
              />
              <ContactValue
                label="Service region"
                value={`${site.state}, ${site.country}`}
              />
              <ContactValue label="ABN" value={site.abn} />
            </div>

            {/* Below `lg` the icons sit under the wordmark instead, so the
                heading has to move with them — a "Follow" label with nothing
                beneath it is worse than no label at all. */}
            <div className={socials.length > 0 ? "hidden lg:block" : undefined}>
              <h2 className="eyebrow mt-10 text-stone-light">Follow</h2>
              {socials.length > 0 ? (
                <SocialLinks className="mt-6" size="sm" />
              ) : (
                <p className="mt-6 text-sm text-sand/45 italic">
                  Social profiles {PLACEHOLDER_LABEL.toLowerCase()}
                </p>
              )}
            </div>
          </div>
        </div>

        {!site.phone || !site.email || !site.abn ? (
          <PlaceholderNotice className="mb-10">
            Contact details, ABN and social links are read from environment
            variables and are intentionally blank until Kabura supplies them —
            nothing here is invented. See <code>.env.example</code>.
          </PlaceholderNotice>
        ) : null}

        <div className="flex flex-col items-center gap-5 border-t border-stone/15 pt-8 text-center text-xs text-stone md:flex-row md:items-center md:justify-between md:text-left">
          <p>
            © {YEAR} {site.legalName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <li>
              <Link href="/privacy" className="link-underline hover:text-sand">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="link-underline hover:text-sand">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/contact" className="link-underline hover:text-sand">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Oversized watermark wordmark */}
      <p
        aria-hidden="true"
        className="pointer-events-none -mb-[0.22em] w-full text-center font-display text-[19vw] leading-none font-semibold tracking-[-0.05em] text-bone/[0.035] select-none"
      >
        KABURA
      </p>
    </footer>
  );
}
