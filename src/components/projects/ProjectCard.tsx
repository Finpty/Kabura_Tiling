"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { imageProps } from "@/lib/media";
import type { Project } from "@/lib/projects";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn, pad } from "@/lib/utils";

type Props = {
  project: Project;
  index: number;
  className?: string;
  priority?: boolean;
};

/** Portfolio tile with parallax on the image and a scale-on-hover treatment. */
export function ProjectCard({ project, index, className, priority }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <motion.article
      ref={ref}
      className={cn("group relative", className)}
      initial={reduced ? false : { opacity: 0, y: 32 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/projects/${project.slug}`} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-charcoal-2">
          <motion.div
            className="absolute inset-[-8%]"
            style={reduced ? undefined : { y }}
          >
            <Image
              {...imageProps(project.cover)}
              alt={project.title}
              fill
              sizes="(min-width: 1280px) 32vw, (min-width: 768px) 46vw, 92vw"
              priority={priority}
              className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
            />
          </motion.div>

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent transition-opacity duration-700 group-hover:opacity-90"
          />

          {project.isPlaceholder ? (
            <span className="absolute top-4 left-4 z-10 rounded-full border border-bronze/50 bg-ink/70 px-3 py-1.5 text-[0.6rem] font-medium tracking-[0.16em] text-bronze-light uppercase backdrop-blur-sm">
              Placeholder record
            </span>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
            <div className="flex items-center gap-3">
              <span className="eyebrow text-bronze-light/85 tabular-nums">
                {pad(index + 1)}
              </span>
              <span className="eyebrow text-sand/70">{project.category}</span>
            </div>
            <h3 className="mt-3 font-display text-xl font-medium tracking-[-0.03em] text-bone md:text-2xl">
              {project.title}
            </h3>
            <p className="mt-1.5 text-sm text-sand/65">
              {project.suburb} · {project.tileSize}
            </p>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
