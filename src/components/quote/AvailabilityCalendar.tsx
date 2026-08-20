"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MAX_BOOKING_MONTHS, fromISODate, toISODate } from "@/lib/quote-schema";
import type { AvailabilityStatus } from "@/lib/supabase/types";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * Customer-facing availability calendar.
 *
 * Shows how busy each day is and nothing else. It never learns who is booked,
 * where, or how many jobs are on — the API it reads returns a date and a
 * one-word load label, which is all the private diary is ever allowed to
 * expose. Choosing a day records a REQUEST; the copy says so, and a fully
 * booked day cannot be chosen at all rather than being accepted and quietly
 * disappointed later.
 *
 * If availability cannot be read — Supabase unconfigured, migration not yet
 * applied, network down — every day reads as open and the calendar keeps
 * working. An unknown diary is not a full one.
 */

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_FORMAT = new Intl.DateTimeFormat("en-AU", {
  month: "long",
  year: "numeric",
});
const FULL_DATE_FORMAT = new Intl.DateTimeFormat("en-AU", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const STATUS_STYLES: Record<AvailabilityStatus, string> = {
  available:
    "border-stone/25 text-bone hover:border-bronze-light/70 hover:bg-bronze/10",
  limited:
    "border-bronze/40 bg-bronze/[0.07] text-bone hover:border-bronze-light hover:bg-bronze/15",
  booked: "border-stone/12 bg-charcoal-2/40 text-stone/45",
  // Blocked out by hand, outside the working week, or already gone. The
  // customer is told it cannot be booked, never why.
  unavailable: "border-stone/10 bg-charcoal-2/25 text-stone/30",
};

const STATUS_DOT: Record<AvailabilityStatus, string> = {
  available: "bg-emerald-400/70",
  limited: "bg-bronze-light",
  booked: "bg-stone/40",
  unavailable: "bg-stone/25",
};

const STATUS_TEXT: Record<AvailabilityStatus, string> = {
  available: "Available",
  limited: "Limited availability",
  booked: "Fully booked",
  unavailable: "Not available",
};

/** Monday-first weekday index, matching the Australian calendar convention. */
const mondayIndex = (date: Date) => (date.getDay() + 6) % 7;

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export function AvailabilityCalendar({ value, onChange, error }: Props) {
  const reduced = usePrefersReducedMotion();

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const horizon = useMemo(() => {
    const limit = new Date(today);
    limit.setMonth(limit.getMonth() + MAX_BOOKING_MONTHS);
    return limit;
  }, [today]);

  const selected = value ? fromISODate(value) : null;
  const [month, setMonth] = useState(() =>
    startOfMonth(selected && selected >= today ? selected : today),
  );
  const [availability, setAvailability] = useState<
    Record<string, AvailabilityStatus>
  >({});
  const [loading, setLoading] = useState(true);
  // Months already fetched. Keeps paging back and forth free of new requests.
  const loaded = useRef(new Set<string>());
  const [direction, setDirection] = useState(1);

  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;

  useEffect(() => {
    if (loaded.current.has(monthKey)) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    // Fetch a month either side so paging feels instant.
    const from = addMonths(month, -1);
    const to = new Date(month.getFullYear(), month.getMonth() + 2, 0);

    setLoading(true);
    fetch(`/api/availability?from=${toISODate(from)}&to=${toISODate(to)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { days?: Record<string, AvailabilityStatus> } | null) => {
        if (payload?.days) {
          setAvailability((current) => ({ ...current, ...payload.days }));
        }
        loaded.current.add(monthKey);
      })
      .catch(() => {
        // Offline or the endpoint is unavailable: fall through to "available",
        // which is what an unknown day means.
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [month, monthKey]);

  const statusFor = useCallback(
    (iso: string): AvailabilityStatus => availability[iso] ?? "available",
    [availability],
  );

  const days = useMemo(() => {
    const first = startOfMonth(month);
    const total = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();

    const cells: ({ date: Date; iso: string } | null)[] = Array.from(
      { length: mondayIndex(first) },
      () => null,
    );

    for (let day = 1; day <= total; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      cells.push({ date, iso: toISODate(date) });
    }
    return cells;
  }, [month]);

  const canGoBack = !sameMonth(month, today) && month > today;
  const canGoForward = month < startOfMonth(horizon);

  const step = (delta: number) => {
    setDirection(delta);
    setMonth((current) => addMonths(current, delta));
  };

  const selectedLabel = selected ? FULL_DATE_FORMAT.format(selected) : null;

  return (
    <div>
      <div className="glass overflow-hidden rounded-xl border border-stone/20">
        {/* Month navigation */}
        <div className="flex items-center justify-between gap-3 border-b border-stone/15 px-4 py-3.5 sm:px-5">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={!canGoBack}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-stone/25 text-sand transition-colors duration-300 hover:border-bronze-light hover:text-bronze-light disabled:pointer-events-none disabled:opacity-30"
          >
            <span className="sr-only">Previous month</span>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M15 5 8 12l7 7"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          </button>

          <p
            aria-live="polite"
            className="font-display text-lg font-medium tracking-[-0.02em] text-bone tabular-nums"
          >
            {MONTH_FORMAT.format(month)}
          </p>

          <button
            type="button"
            onClick={() => step(1)}
            disabled={!canGoForward}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-stone/25 text-sand transition-colors duration-300 hover:border-bronze-light hover:text-bronze-light disabled:pointer-events-none disabled:opacity-30"
          >
            <span className="sr-only">Next month</span>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              aria-hidden="true"
            >
              <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1 px-2 pt-3 sm:px-3">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              aria-hidden="true"
              className="pb-1 text-center text-[0.62rem] font-medium tracking-[0.14em] text-stone uppercase"
            >
              {weekday.slice(0, 1)}
              <span className="hidden sm:inline">{weekday.slice(1)}</span>
            </div>
          ))}
        </div>

        {/* Grid. Fixed min-height so switching months never shifts the page. */}
        <div className="relative min-h-[17.5rem] px-2 pb-3 sm:px-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={monthKey}
              role="group"
              aria-label={`Availability for ${MONTH_FORMAT.format(month)}`}
              className="grid grid-cols-7 gap-1"
              initial={reduced ? false : { opacity: 0, x: direction * 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: direction * -18 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {days.map((cell, index) => {
                if (!cell) {
                  return <span key={`pad-${index}`} aria-hidden="true" />;
                }

                const past = cell.date < today;
                const beyond = cell.date > horizon;
                const status = statusFor(cell.iso);
                const unavailable =
                  past ||
                  beyond ||
                  status === "booked" ||
                  status === "unavailable";
                const isSelected = value === cell.iso;
                const isToday = cell.iso === toISODate(today);

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    disabled={unavailable}
                    aria-pressed={isSelected}
                    aria-label={`${FULL_DATE_FORMAT.format(cell.date)} — ${
                      past || beyond ? "unavailable" : STATUS_TEXT[status]
                    }`}
                    onClick={() => onChange(isSelected ? "" : cell.iso)}
                    className={cn(
                      "relative flex h-11 flex-col items-center justify-center gap-1 rounded-lg border text-sm tabular-nums transition-[color,background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:h-12",
                      unavailable
                        ? "cursor-not-allowed border-transparent text-stone/35"
                        : cn(STATUS_STYLES[status], "hover:-translate-y-px"),
                      isSelected &&
                        "!border-bronze-light !bg-bronze-light !text-ink shadow-[0_6px_20px_-8px_var(--color-bronze)]",
                    )}
                  >
                    <span
                      className={cn(isToday && !isSelected && "font-semibold")}
                    >
                      {cell.date.getDate()}
                    </span>
                    {!unavailable && !isSelected ? (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "block h-1 w-1 rounded-full",
                          STATUS_DOT[status],
                        )}
                      />
                    ) : null}
                    {isToday && !isSelected ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-3 bottom-0.5 h-px bg-bronze-light/50"
                      />
                    ) : null}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {loading ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-2 right-3 h-1.5 w-1.5 animate-pulse rounded-full bg-bronze-light/70"
            />
          ) : null}
        </div>

        {/* Legend */}
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-stone/15 px-4 py-3.5 text-xs text-stone sm:px-5">
          {(["available", "limited", "booked"] as const).map((status) => (
            <li key={status} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "block h-1.5 w-1.5 rounded-full",
                  STATUS_DOT[status],
                )}
              />
              {STATUS_TEXT[status]}
            </li>
          ))}
        </ul>
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-sand/75">
        {selectedLabel ? (
          <>
            You&rsquo;ve asked for{" "}
            <span className="font-medium text-bone">{selectedLabel}</span>.{" "}
            <button
              type="button"
              onClick={() => onChange("")}
              className="link-underline text-bronze-light"
            >
              Clear
            </button>
          </>
        ) : (
          "Pick a preferred start date, or skip this step and we'll work it out together."
        )}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-stone">
        This is a request, not a confirmed booking. We&rsquo;ll confirm the date
        with you before anything is locked in.
      </p>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-bronze-light">
          {error}
        </p>
      ) : null}
    </div>
  );
}
