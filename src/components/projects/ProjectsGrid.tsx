"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProjectCard } from "./ProjectCard";
import { PROJECT_CATEGORIES, type Project } from "@/lib/projects";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/** Filterable portfolio grid. Filtering is client-side over an already-loaded list. */
export function ProjectsGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<string>("All");
  const reduced = usePrefersReducedMotion();

  const available = useMemo(() => {
    const used = new Set(projects.map((p) => p.category));
    return ["All", ...PROJECT_CATEGORIES.filter((c) => used.has(c))];
  }, [projects]);

  const visible = useMemo(
    () =>
      filter === "All"
        ? projects
        : projects.filter((project) => project.category === filter),
    [filter, projects],
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filter projects by category"
        className="flex flex-wrap gap-2"
      >
        {available.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={filter === category}
            onClick={() => setFilter(category)}
            className={cn(
              "rounded-full border px-5 py-2.5 text-[0.72rem] font-medium tracking-[0.14em] uppercase transition-colors duration-400",
              filter === category
                ? "border-bronze-light bg-bronze-light/12 text-bronze-light"
                : "border-stone/30 text-sand/60 hover:border-stone/60 hover:text-bone",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((project, index) => (
            <motion.div
              key={project.slug}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProjectCard
                project={project}
                index={index}
                priority={index < 3}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {visible.length === 0 ? (
        <p className="mt-16 text-center text-sand/60">
          No projects in this category yet.
        </p>
      ) : null}
    </div>
  );
}
