import { Section, SectionLabel } from "@/components/ui/Section";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Project } from "@/lib/projects";

export function ProjectsShowcase({ projects }: { projects: Project[] }) {
  const featured = projects.slice(0, 6);
  const anyPlaceholder = featured.some((p) => p.isPlaceholder);

  return (
    <Section
      id="projects"
      spacing="loose"
      className="border-t border-stone/12 bg-ink"
      aria-labelledby="projects-heading"
    >
      <div className="shell">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <SectionLabel index="05" eyebrow="Portfolio" />
            <h2
              id="projects-heading"
              className="mt-6 font-display text-headline text-bone"
            >
              Selected Projects
            </h2>
          </div>
          <MagneticLink href="/projects" variant="outline" size="md" withArrow>
            All projects
          </MagneticLink>
        </div>

        {anyPlaceholder ? (
          <PlaceholderNotice className="mt-8 max-w-3xl">
            These are placeholder project records built to demonstrate the
            portfolio layout. The imagery is brand and atmosphere visuals — not
            photographs of completed Kabura work — and every record is replaced
            once Kabura supplies real project photography.
          </PlaceholderNotice>
        ) : null}

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project, index) => (
            <ProjectCard
              key={project.slug}
              project={project}
              index={index}
              priority={index < 2}
              className={index === 0 ? "sm:col-span-2 lg:col-span-1" : undefined}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
