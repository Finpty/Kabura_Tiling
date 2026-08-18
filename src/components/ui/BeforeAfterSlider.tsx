"use client";

import Image from "next/image";
import { useCallback, useId, useRef, useState } from "react";
import { imageFill } from "@/lib/media";
import { clamp, cn } from "@/lib/utils";

type Props = {
  beforeKey: string;
  afterKey: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  /** Starting divider position, 0–100. */
  initial?: number;
  priority?: boolean;
};

/**
 * Drag-to-reveal comparison.
 *
 * Pointer, touch and keyboard all drive the same value. The handle is a real
 * `role="slider"` with arrow-key support, so the comparison is operable without
 * a mouse — which a `<input type=range>` overlay or a hover-only reveal is not.
 */
export function BeforeAfterSlider({
  beforeKey,
  afterKey,
  beforeLabel = "Before",
  afterLabel = "Kabura Finish",
  className,
  initial = 52,
  priority = false,
}: Props) {
  const [position, setPosition] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  // Both render with `fill`, so they must not carry width/height.
  const before = imageFill(beforeKey);
  const after = imageFill(afterKey);

  const setFromClientX = useCallback((clientX: number) => {
    const node = containerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100));
  }, []);

  const onPointerDown = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setFromClientX(event.clientX);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragging) return;
    setFromClientX(event.clientX);
  };

  const stop = (event: React.PointerEvent) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 10 : 2;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPosition((p) => clamp(p - step, 0, 100));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setPosition((p) => clamp(p + step, 0, 100));
    } else if (event.key === "Home") {
      event.preventDefault();
      setPosition(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setPosition(100);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative isolate touch-none overflow-hidden bg-charcoal select-none",
        dragging ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stop}
      onPointerCancel={stop}
      data-cursor="active"
    >
      {/* After (full width, underneath) */}
      <Image
        {...after}
        alt={`${afterLabel}: ${after.alt}`}
        fill
        sizes="(min-width: 1024px) 60vw, 100vw"
        priority={priority}
        className="object-cover"
      />

      {/* Before (clipped to the divider) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          {...before}
          alt={`${beforeLabel}: ${before.alt}`}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          priority={priority}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/25" />
      </div>

      {/* Labels */}
      <span className="pointer-events-none absolute top-4 left-4 z-10 rounded-full border border-bone/20 bg-ink/60 px-3 py-1.5 text-[0.62rem] font-medium tracking-[0.16em] text-bone/85 uppercase backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute top-4 right-4 z-10 rounded-full border border-bronze-light/40 bg-ink/60 px-3 py-1.5 text-[0.62rem] font-medium tracking-[0.16em] text-bronze-light uppercase backdrop-blur-sm">
        {afterLabel}
      </span>

      {/* Divider */}
      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-bone/85"
        style={{ left: `${position}%` }}
      >
        <div className="absolute inset-y-0 -left-px w-[3px] bg-bone/25 blur-[2px]" />
      </div>

      {/* Handle */}
      <div
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% ${beforeLabel.toLowerCase()}`}
        onKeyDown={onKeyDown}
        className="absolute top-1/2 z-20 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-bone/45 bg-ink/70 backdrop-blur-md transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 focus-visible:scale-110"
        style={{ left: `${position}%` }}
      >
        <span id={labelId} className="sr-only">
          Reveal before and after. Use the left and right arrow keys.
        </span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-bone" fill="none" aria-hidden="true">
          <path d="M9 6 4 12l5 6M15 6l5 6-5 6" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </div>
    </div>
  );
}
