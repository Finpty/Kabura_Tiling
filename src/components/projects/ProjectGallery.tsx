"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { imageProps } from "@/lib/media";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import type { ProjectImage } from "@/lib/projects";
import { cn } from "@/lib/utils";

/**
 * Project gallery with a full-screen lightbox.
 *
 * The lightbox is a modal dialog: Escape closes it, arrows move between images,
 * focus returns to the trigger, and the page behind it stops scrolling.
 */
export function ProjectGallery({ images }: { images: ProjectImage[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const reduced = usePrefersReducedMotion();

  const close = useCallback(() => setOpen(null), []);
  const next = useCallback(
    () => setOpen((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length],
  );
  const prev = useCallback(
    () =>
      setOpen((i) =>
        i === null ? null : (i - 1 + images.length) % images.length,
      ),
    [images.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, next, prev]);

  if (images.length === 0) return null;

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2">
        {images.map((image, index) => (
          <li
            key={`${image.key}-${index}`}
            className={cn(index === 0 && images.length > 2 && "sm:col-span-2")}
          >
            <button
              type="button"
              onClick={() => setOpen(index)}
              className="group relative block aspect-[3/2] w-full overflow-hidden rounded-sm bg-charcoal-2"
            >
              <Image
                {...imageProps(image.key)}
                alt={image.caption ?? ""}
                fill
                sizes="(min-width: 640px) 46vw, 92vw"
                className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/20"
              />
              <span className="sr-only">
                Open image {index + 1} of {images.length}
              </span>
              {image.caption ? (
                <span className="absolute bottom-3 left-3 rounded-full border border-bone/20 bg-ink/65 px-3 py-1 text-[0.6rem] font-medium tracking-[0.14em] text-bone/80 uppercase backdrop-blur-sm">
                  {image.caption}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {open !== null ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Image ${open + 1} of ${images.length}`}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/96 p-4 backdrop-blur-xl"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close gallery"
              className="absolute top-5 right-5 z-10 grid h-12 w-12 place-items-center rounded-full border border-stone/35 text-bone transition-colors hover:border-bronze-light hover:text-bronze-light"
              autoFocus
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>

            <motion.div
              key={open}
              className="relative h-full max-h-[82vh] w-full max-w-6xl"
              initial={reduced ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                {...imageProps(images[open].key)}
                alt={images[open].caption ?? ""}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </motion.div>

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous image"
                  className="absolute left-4 grid h-12 w-12 place-items-center rounded-full border border-stone/35 text-bone transition-colors hover:border-bronze-light hover:text-bronze-light md:left-8"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next image"
                  className="absolute right-4 grid h-12 w-12 place-items-center rounded-full border border-stone/35 text-bone transition-colors hover:border-bronze-light hover:text-bronze-light md:right-8"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </button>
                <p className="absolute bottom-6 text-xs text-stone tabular-nums">
                  {open + 1} / {images.length}
                </p>
              </>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
