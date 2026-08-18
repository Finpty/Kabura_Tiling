import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { pageMetadata } from "@/lib/seo";
import { PLACEHOLDER_LABEL, site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Terms",
  description: `Terms of use for the ${site.legalName} website.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms"
        imageKey="demolition"
        size="sm"
        breadcrumbs={[{ name: "Terms", path: "/terms" }]}
      />

      <Section spacing="normal" className="bg-ink">
        <div className="shell max-w-3xl">
          <PlaceholderNotice className="mb-10">
            These are website terms of use only. They are not trade terms, a
            contract for works, or a warranty statement, and they have not been
            reviewed by a lawyer. Kabura&rsquo;s trading terms, ABN and licence
            details are {PLACEHOLDER_LABEL.toLowerCase()}.
          </PlaceholderNotice>

          <div className="flex flex-col gap-8 leading-relaxed text-sand/80">
            <section>
              <h2 className="font-display text-title text-bone">Using this site</h2>
              <p className="mt-4">
                This website is operated by {site.legalName}. By using it you
                agree to use it lawfully and not to interfere with its operation
                or security.
              </p>
            </section>

            <section>
              <h2 className="font-display text-title text-bone">
                Quotes and enquiries
              </h2>
              <p className="mt-4">
                Submitting the quote form is an enquiry, not a booking, and does
                not create a contract. Any figure we provide in response is an
                estimate based on the information and photos supplied. A final
                price depends on an inspection of the actual site — what is found
                behind existing surfaces can change the scope materially.
              </p>
            </section>

            <section>
              <h2 className="font-display text-title text-bone">
                Imagery and examples
              </h2>
              <p className="mt-4">
                Some imagery on this site is used to illustrate materials,
                finishes and layouts rather than to depict specific completed
                work, and is labelled as such where that is the case. The tile
                layout tool and bathroom visualiser are visual guides only:
                on-screen colours will not match physical samples, and the
                surfaces shown are representative rather than specific products.
              </p>
            </section>

            <section>
              <h2 className="font-display text-title text-bone">
                Intellectual property
              </h2>
              <p className="mt-4">
                The content, design and code of this site belong to{" "}
                {site.legalName} or its licensors. Photographs you upload with an
                enquiry remain yours; you grant us permission to use them for the
                purpose of preparing and delivering your quote.
              </p>
            </section>

            <section>
              <h2 className="font-display text-title text-bone">Liability</h2>
              <p className="mt-4">
                We take care to keep the information on this site accurate, but
                it is provided for general guidance. Nothing here limits any
                rights you have under the Australian Consumer Law.
              </p>
            </section>
          </div>
        </div>
      </Section>
    </>
  );
}
