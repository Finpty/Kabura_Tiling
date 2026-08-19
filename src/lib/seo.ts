import type { Metadata } from "next";
import { site } from "./site";
import { SERVICES } from "./services";
import { SERVICE_AREAS } from "./service-areas";

const BASE = site.url.replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  /** Path to the OG image. Defaults to the site-wide one. */
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
};

/** Builds a complete, canonical-correct metadata object for a route. */
export function pageMetadata({
  title,
  description,
  path,
  image = "/opengraph-image",
  noIndex = false,
  type = "website",
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: site.legalName,
      locale: "en_AU",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

/* ------------------------------------------------------------------ *
 * Structured data
 *
 * Every value is drawn from configured data. Fields Kabura has not supplied
 * (telephone, address, ABN) are omitted entirely rather than filled with a
 * placeholder — an invented value in schema.org markup is worse than an absent
 * one, both for the business and for search engines.
 * ------------------------------------------------------------------ */

type Json = Record<string, unknown>;

const compact = (obj: Json): Json =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0),
    ),
  );

export function localBusinessSchema(): Json {
  const sameAs = Object.values(site.social).filter(Boolean) as string[];

  return compact({
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${BASE}/#business`,
    name: site.legalName,
    alternateName: site.name,
    slogan: site.tagline,
    description: site.proposition,
    url: BASE,
    image: absoluteUrl("/opengraph-image"),
    telephone: site.phone ?? undefined,
    email: site.email ?? undefined,
    priceRange: undefined, // not supplied — deliberately omitted
    address: compact({
      "@type": "PostalAddress",
      streetAddress: site.streetAddress ?? undefined,
      addressLocality: site.addressLocality ?? undefined,
      postalCode: site.postalCode ?? undefined,
      addressRegion: site.stateCode,
      addressCountry: site.countryCode,
    }),
    areaServed: SERVICE_AREAS.map((area) => ({
      "@type": "City",
      name: area.name,
      containedInPlace: {
        "@type": "State",
        name: site.state,
      },
    })),
    knowsAbout: SERVICES.map((service) => service.title),
    sameAs,
    openingHours: site.openingHours ?? undefined,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Tiling services",
      itemListElement: SERVICES.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          description: service.summary,
          url: absoluteUrl(`/services/${service.slug}`),
        },
      })),
    },
  });
}

export function websiteSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE}/#website`,
    url: BASE,
    name: site.legalName,
    inLanguage: "en-AU",
    publisher: { "@id": `${BASE}/#business` },
  };
}

export function serviceSchema(input: {
  name: string;
  description: string;
  path: string;
}): Json {
  return compact({
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    serviceType: input.name,
    provider: { "@id": `${BASE}/#business` },
    areaServed: SERVICE_AREAS.map((area) => ({
      "@type": "City",
      name: area.name,
    })),
  });
}

export function breadcrumbSchema(
  items: { name: string; path: string }[],
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
