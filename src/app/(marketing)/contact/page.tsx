import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionLabel } from "@/components/ui/Section";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { SERVICE_AREAS } from "@/lib/service-areas";
import {
  PLACEHOLDER_LABEL,
  configuredSocials,
  hasEmail,
  hasPhone,
  site,
} from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { centreRow, centreText } from "@/lib/align";
import { cn, telHref } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: `Get in touch with ${site.legalName} about tiling, bathroom renovations, waterproofing and stone work across ${site.state}.`,
  path: "/contact",
});

function Row({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-stone/18 py-6">
      <dt className="eyebrow text-stone-light">{label}</dt>
      <dd className="text-xl text-bone md:text-2xl">
        {value ? (
          href ? (
            <a className="link-underline" href={href}>
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-sand/40 italic">{PLACEHOLDER_LABEL}</span>
        )}
      </dd>
    </div>
  );
}

export default function ContactPage() {
  const socials = configuredSocials();
  const missing = !hasPhone() || !hasEmail();

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch."
        lead="The quote form is the fastest way to get a real answer — it captures the detail and the photos we need. Everything else is below."
        imageKey="stoneFeature"
        size="sm"
        breadcrumbs={[{ name: "Contact", path: "/contact" }]}
      />

      <Section spacing="loose" className="bg-ink">
        <div className="shell grid gap-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-20">
          <div>
            <SectionLabel eyebrow="Details" className={centreRow} />
            <dl className="mt-8 border-t border-stone/18">
              <Row
                label="Phone"
                value={site.phone}
                href={site.phone ? telHref(site.phone) : undefined}
              />
              <Row
                label="Email"
                value={site.email}
                href={site.email ? `mailto:${site.email}` : undefined}
              />
              <Row label="ABN" value={site.abn} />
              <Row label="Opening hours" value={site.openingHours} />
              <Row
                label="Service region"
                value={`${site.state}, ${site.country}`}
              />
            </dl>

            {missing ? (
              <PlaceholderNotice className="mt-10">
                Phone and email are read from environment variables and are
                deliberately blank until Kabura supplies them — the site will
                never show an invented number or address. Set them in{" "}
                <code>.env.local</code> (see <code>.env.example</code>) and they
                appear here, in the header, in the footer and in the
                site&rsquo;s structured data automatically.
              </PlaceholderNotice>
            ) : null}

            <div className={cn("mt-12", centreText)}>
              <h2 className="eyebrow text-stone-light">Follow us</h2>
              {socials.length > 0 ? (
                <SocialLinks className="mt-5" centred />
              ) : (
                <p className="mt-5 text-sand/50 italic">
                  Social profiles {PLACEHOLDER_LABEL.toLowerCase()}
                </p>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="border border-stone/20 bg-charcoal p-7">
              <p className="eyebrow text-bronze-light">Fastest route</p>
              <h2 className="mt-4 font-display text-2xl font-medium tracking-[-0.03em] text-bone">
                Send us the project
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-sand/75">
                Five short steps, including photo upload. It gives us everything
                we need to quote without a round of back-and-forth.
              </p>
              <MagneticLink
                href="/quote"
                variant="bronze"
                size="md"
                className="mt-6"
                withArrow
              >
                Request a Free Quote
              </MagneticLink>
            </div>

            <div className="mt-8">
              <h2 className="eyebrow text-stone-light">Where we work</h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {SERVICE_AREAS.map((area) => (
                  <li key={area.slug}>
                    <Link
                      href={`/service-areas/${area.slug}`}
                      className="inline-block rounded-full border border-stone/30 px-3.5 py-1.5 text-xs text-sand/80 transition-colors hover:border-bronze-light hover:text-bronze-light"
                    >
                      {area.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
