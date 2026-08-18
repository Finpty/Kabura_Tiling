import type { Metadata } from "next";
import Image from "next/image";
import { QuoteWizard } from "@/components/quote/QuoteWizard";
import { Section } from "@/components/ui/Section";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { imageProps } from "@/lib/media";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Request a Free Quote",
  description:
    "Tell us about your tiling, bathroom, waterproofing or stone project and upload photos of the space. Kabura Tiling Group will come back with a considered quote.",
  path: "/quote",
});

export default function QuotePage() {
  // The wizard needs somewhere to write. The server route works with either the
  // service role (full flow, with photo uploads) or the anon key alone
  // (enquiry captured, photos skipped) — so the public key is the real gate.
  const enabled = isSupabaseConfigured;

  return (
    <Section
      spacing="flush"
      className="relative isolate min-h-svh pt-[calc(var(--header-h)+4rem)] pb-24"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image
          {...imageProps("heroBathroom")}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/93" />
      </div>

      <div className="shell">
        <Breadcrumbs items={[{ name: "Quote", path: "/quote" }]} className="mb-10" />

        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="eyebrow text-bronze-light">Free quote</p>
          <h1 className="mt-5 font-display text-display text-bone">
            Let&rsquo;s price it properly.
          </h1>
          <p className="mt-6 text-lead text-sand/80">
            Five short steps. The more you tell us about the space — especially
            photos — the closer the quote will be to the final number.
          </p>
          <p className="mt-3 text-sm text-stone">
            {site.state} · {site.tagline}
          </p>
        </div>

        <QuoteWizard enabled={enabled} />
      </div>
    </Section>
  );
}
