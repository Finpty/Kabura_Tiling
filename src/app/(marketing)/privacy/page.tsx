import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { pageMetadata } from "@/lib/seo";
import { PLACEHOLDER_LABEL, site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: `How ${site.legalName} collects, uses and stores the information you provide through this website.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        imageKey="repairs"
        size="sm"
        breadcrumbs={[{ name: "Privacy Policy", path: "/privacy" }]}
      />

      <Section spacing="normal" className="bg-ink">
        <div className="shell max-w-3xl">
          <PlaceholderNotice className="mb-10">
            This policy describes what the website actually does with your
            information. It has not been reviewed by a lawyer and the business
            contact points are still {PLACEHOLDER_LABEL.toLowerCase()} — have it
            checked and complete the contact section before launch.
          </PlaceholderNotice>

          <div className="flex flex-col gap-8 leading-relaxed text-sand/80">
            <section>
              <h2 className="font-display text-title text-bone">
                What we collect
              </h2>
              <p className="mt-4">
                When you submit a quote request we collect the information you
                type into the form: the service you need, the suburb and
                postcode of the project, approximate size, tile size, build
                type, desired start time, your description of the project, and
                your name, phone number and email address. If you attach photos,
                we collect those too.
              </p>
              <p className="mt-4">
                We do not run advertising trackers or third-party analytics on
                this site, and we do not set marketing cookies.
              </p>
            </section>

            <section>
              <h2 className="font-display text-title text-bone">
                Why we collect it
              </h2>
              <p className="mt-4">
                Solely to prepare and provide the quote you asked for, and to
                contact you about that enquiry. We do not sell your information,
                and we do not share it with third parties other than the
                infrastructure providers described below.
              </p>
            </section>

            <section>
              <h2 className="font-display text-title text-bone">
                Where it is stored
              </h2>
              <p className="mt-4">
                Enquiries and uploaded photos are stored in a Supabase project
                controlled by {site.legalName}. Photos are held in a private
                storage bucket that is not publicly readable — they cannot be
                accessed by anyone browsing the internet, and are only viewable
                by authorised staff through an authenticated dashboard.
              </p>
              <p className="mt-4">
                Row level security is enabled on every database table. The public
                may submit an enquiry; the public cannot list, read, modify or
                delete enquiries, including their own.
              </p>
            </section>

            <section>
              <h2 className="font-display text-title text-bone">How long we keep it</h2>
              <p className="mt-4">
                Enquiries are retained for as long as needed to respond to them
                and to meet record-keeping obligations. You can ask us to delete
                your enquiry and its photos at any time.
              </p>
            </section>

            <section>
              <h2 className="font-display text-title text-bone">Your choices</h2>
              <p className="mt-4">
                You can ask for a copy of the information we hold about you, ask
                us to correct it, or ask us to delete it. Contact us using the
                details on the contact page and we will action the request.
              </p>
            </section>

            <section>
              <h2 className="font-display text-title text-bone">Contact</h2>
              <p className="mt-4">
                Privacy questions can be sent to{" "}
                {site.email ? (
                  <a className="link-underline text-bone" href={`mailto:${site.email}`}>
                    {site.email}
                  </a>
                ) : (
                  <span className="text-sand/50 italic">
                    {PLACEHOLDER_LABEL.toLowerCase()}
                  </span>
                )}
                .
              </p>
            </section>
          </div>
        </div>
      </Section>
    </>
  );
}
