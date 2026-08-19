import Link from "next/link";
import { Logo } from "./Logo";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { SERVICES } from "@/lib/services";
import { SERVICE_AREAS } from "@/lib/service-areas";
import { configuredSocials, site, PLACEHOLDER_LABEL } from "@/lib/site";
import { telHref } from "@/lib/utils";

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
        <div className="flex flex-col gap-8 border-b border-stone/15 pb-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow text-bronze-light">Start a project</p>
            <p className="mt-5 font-display text-headline text-bone">
              Tell us what you&rsquo;re planning.
            </p>
            <p className="mt-4 max-w-lg text-lead text-sand/80">
              Send through the details and photos of your space and we&rsquo;ll
              come back with a considered quote.
            </p>
          </div>
          <MagneticLink href="/quote" variant="bronze" size="lg" withArrow>
            Request a Free Quote
          </MagneticLink>
        </div>

        {/* Columns */}
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-block text-bone">
              <Logo />
            </Link>
            <p className="mt-6 font-serif text-2xl text-bronze-light italic">
              {site.tagline}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-sand/70">
              {site.proposition}
            </p>
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

            <h2 className="eyebrow mt-10 text-stone-light">Social</h2>
            {socials.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {socials.map((social) => (
                  <li key={social.key}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="link-underline text-sm text-sand/80 hover:text-bone"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-sm text-sand/45 italic">
                Social profiles {PLACEHOLDER_LABEL.toLowerCase()}
              </p>
            )}
          </div>
        </div>

        {!site.phone || !site.email || !site.abn ? (
          <PlaceholderNotice className="mb-10">
            Contact details, ABN and social links are read from environment
            variables and are intentionally blank until Kabura supplies them —
            nothing here is invented. See <code>.env.example</code>.
          </PlaceholderNotice>
        ) : null}

        <div className="flex flex-col gap-5 border-t border-stone/15 pt-8 text-xs text-stone md:flex-row md:items-center md:justify-between">
          <p>
            © {YEAR} {site.legalName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
