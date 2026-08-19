import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionLabel } from "@/components/ui/Section";
import { ProjectGallery } from "@/components/projects/ProjectGallery";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { CTASection } from "@/components/home/CTASection";
import { getProject, getProjects } from "@/lib/data";
import { centreRow } from "@/lib/align";
import { pageMetadata } from "@/lib/seo";
import { PLACEHOLDER_PROJECTS } from "@/lib/projects";

export function generateStaticParams() {
  return PLACEHOLDER_PROJECTS.map((project) => ({ slug: project.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};

  return pageMetadata({
    title: project.title,
    description: project.description,
    path: `/projects/${project.slug}`,
    type: "article",
    noIndex: project.isPlaceholder,
  });
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const all = await getProjects();
  const others = all.filter((p) => p.slug !== project.slug).slice(0, 3);

  const facts: [string, string][] = [
    ["Project type", project.projectType],
    ["Suburb", project.suburb],
    ["Tile type", project.tileType],
    ["Tile size", project.tileSize],
    ["Category", project.category],
  ];

  return (
    <>
      <PageHero
        eyebrow={project.category}
        title={project.title}
        lead={project.description}
        imageKey={project.cover}
        size="sm"
        breadcrumbs={[
          { name: "Projects", path: "/projects" },
          { name: project.title, path: `/projects/${project.slug}` },
        ]}
      />

      <Section spacing="normal" className="bg-ink">
        <div className="shell">
          {project.isPlaceholder ? (
            <PlaceholderNotice className="mb-12 max-w-3xl">
              Placeholder project record. The imagery is brand and atmosphere
              visuals rather than photographs of completed Kabura work, and the
              metadata below is illustrative. This page is excluded from search
              indexing until it holds a real project.
            </PlaceholderNotice>
          ) : null}

          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-20">
            <div>
              <SectionLabel eyebrow="Gallery" className={centreRow} />
              <div className="mt-8">
                <ProjectGallery images={project.gallery} />
              </div>

              {project.beforeAfter ? (
                <div className="mt-16">
                  <SectionLabel
                    eyebrow="Before / after"
                    className={centreRow}
                  />
                  <BeforeAfterSlider
                    beforeKey={project.beforeAfter.before}
                    afterKey={project.beforeAfter.after}
                    afterLabel={project.beforeAfter.label ?? "Kabura Finish"}
                    className="mt-8 aspect-[16/10] w-full rounded-sm"
                  />
                </div>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-32 lg:self-start">
              <dl className="border-t border-stone/18">
                {facts.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-4 border-b border-stone/18 py-4"
                  >
                    <dt className="eyebrow text-stone-light">{label}</dt>
                    <dd className="text-right text-sm text-bone">{value}</dd>
                  </div>
                ))}
              </dl>

              {project.servicesCompleted.length > 0 ? (
                <div className="mt-10">
                  <h2 className="eyebrow text-stone-light">
                    Services completed
                  </h2>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {project.servicesCompleted.map((service) => (
                      <li
                        key={service}
                        className="rounded-full border border-stone/30 px-3.5 py-1.5 text-xs text-sand/80"
                      >
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <Link
                href="/quote"
                className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-bronze px-7 text-[0.76rem] font-semibold tracking-[0.16em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink"
              >
                Quote a project like this
              </Link>
            </aside>
          </div>
        </div>
      </Section>

      {others.length > 0 ? (
        <Section
          spacing="normal"
          className="border-t border-stone/12 bg-charcoal"
        >
          <div className="shell">
            <SectionLabel eyebrow="More projects" className={centreRow} />
            <ul className="mt-8 border-t border-stone/18">
              {others.map((other) => (
                <li key={other.slug} className="border-b border-stone/18">
                  <Link
                    href={`/projects/${other.slug}`}
                    className="group flex items-baseline justify-between gap-6 py-6"
                  >
                    <span className="font-display text-2xl font-medium tracking-[-0.03em] text-sand/70 transition-colors duration-400 group-hover:text-bone md:text-3xl">
                      {other.title}
                    </span>
                    <span className="eyebrow shrink-0 text-stone">
                      {other.category}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ) : null}

      <CTASection imageKey={project.cover} />
    </>
  );
}
