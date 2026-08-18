"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { MediaVideo } from "@/lib/media";
import { useDeviceCapability } from "@/hooks/use-device-capability";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

type Props = {
  video: MediaVideo | null;
  /** Shown before the video is eligible to play, and whenever it cannot. */
  poster: { src: string; width: number; height: number; blurDataURL: string };
  alt: string;
  className?: string;
  /** The hero video is the only one allowed to preload. */
  priority?: boolean;
  /** Marks a slot that is waiting on real footage. */
  placeholderLabel?: string;
  objectPosition?: string;
};

/**
 * Decorative looping video with the whole performance story handled in one place:
 *
 *  - nothing is fetched until the element is near the viewport
 *  - playback pauses the moment it leaves, so offscreen panels cost nothing
 *  - `preload="none"` (or `metadata` for the hero) keeps it off the critical path
 *  - low-power devices, save-data and reduced-motion never load it at all and
 *    keep the poster instead
 *  - the poster is a real `next/image` with a blur placeholder, so the section
 *    is never empty while the video warms up
 */
export function AmbientVideo({
  video,
  poster,
  alt,
  className,
  priority = false,
  placeholderLabel,
  objectPosition = "center",
}: Props) {
  const { ready, allowVideo } = useDeviceCapability();
  const { ref, inView } = useInView<HTMLDivElement>({
    rootMargin: "200px 0px",
    threshold: 0.01,
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [canPlay, setCanPlay] = useState(false);

  const shouldMount = Boolean(video) && ready && allowVideo && inView;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (inView) {
      const attempt = el.play();
      if (attempt && typeof attempt.catch === "function") {
        // Autoplay can still be refused; the poster simply stays visible.
        attempt.catch(() => setCanPlay(false));
      }
    } else {
      el.pause();
    }
  }, [inView, shouldMount]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden bg-charcoal", className)}>
      <Image
        src={poster.src}
        alt={alt}
        fill
        sizes="100vw"
        placeholder="blur"
        blurDataURL={poster.blurDataURL}
        priority={priority}
        className={cn(
          "object-cover transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]",
          canPlay ? "opacity-0" : "opacity-100",
        )}
        style={{ objectPosition }}
      />

      {shouldMount && video ? (
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]",
            canPlay ? "opacity-100" : "opacity-0",
          )}
          style={{ objectPosition }}
          muted
          loop
          playsInline
          autoPlay
          disablePictureInPicture
          preload={priority ? "metadata" : "none"}
          poster={video.poster}
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setCanPlay(true)}
        >
          {video.webm ? <source src={video.webm} type="video/webm" /> : null}
          <source src={video.mp4} type="video/mp4" />
        </video>
      ) : null}

      {!video && placeholderLabel ? (
        <span className="absolute bottom-4 left-4 z-10 rounded-full border border-bone/25 bg-ink/55 px-3 py-1.5 text-[0.62rem] font-medium tracking-[0.16em] text-bone/80 uppercase backdrop-blur-sm">
          {placeholderLabel}
        </span>
      ) : null}
    </div>
  );
}
