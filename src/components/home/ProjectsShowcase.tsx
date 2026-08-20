import { Section, SectionLabel } from "@/components/ui/Section";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Project } from "@/lib/projects";
import { centreBlock, centreItems, centreRow, centreText } from "@/lib/align";
import { cn } from "@/lib/utils";

export function ProjectsShowcase({ projects }: { projects: Project[] }) {
  const featured = projects.slice(0, 6);

  return (
    <Section
      id="projects"
      spacing="loose"
      className="border-t border-stone/12 bg-ink"
      aria-labelledby="projects-heading"
    >
      <div className="shell">
        <div
          className={cn(
            "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
            centreItems,
          )}
        >
          <div className={cn("max-w-xl", centreText, centreBlock)}>
            <SectionLabel
              index="05"
              eyebrow="Portfolio"
              className={centreRow}
            />
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


        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project, index) => (
            <ProjectCard
              key={project.slug}
              project={project}
              index={index}
              priority={index < 2}
              className={
                index === 0 ? "sm:col-span-2 lg:col-span-1" : undefined
              }
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
