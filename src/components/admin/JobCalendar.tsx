"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { JobForm } from "./JobForm";
import { jobCoversDay } from "@/lib/job-schema";
import { toISODate } from "@/lib/quote-schema";
import {
  JOB_STATUS_LABELS,
  type JobRow,
  type JobStatus,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/**
 * The private job diary.
 *
 * Month and week views over `public.jobs`, which is staff-only at the database
 * level. Nothing here is reachable from the marketing site: the public
 * calendar reads a separate aggregate function that returns a date and a load
 * label and cannot return any of the fields shown below.
 */

const STATUS_TONES: Record<JobStatus, string> = {
  tentative: "border-stone/45 bg-stone/12 text-stone-light",
  booked: "border-bronze/50 bg-bronze/12 text-bronze-light",
  confirmed: "border-bronze-light/60 bg-bronze-light/14 text-bronze-light",
  on_hold: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  in_progress: "border-emerald-400/50 bg-emerald-400/12 text-emerald-300",
  completed: "border-bone/30 bg-bone/8 text-bone/80",
  cancelled: "border-stone/25 bg-transparent text-stone/60 line-through",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_FORMAT = new Intl.DateTimeFormat("en-AU", {
  month: "long",
  year: "numeric",
});
const DAY_FORMAT = new Intl.DateTimeFormat("en-AU", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const LONG_DAY_FORMAT = new Intl.DateTimeFormat("en-AU", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const mondayIndex = (date: Date) => (date.getDay() + 6) % 7;
const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date: Date, n: number) =>
  new Date(date.getFullYear(), date.getMonth() + n, 1);
const addDays = (date: Date, n: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + n);
  return next;
};
const startOfWeek = (date: Date) => addDays(date, -mondayIndex(date));

const timeRange = (job: JobRow) => {
  const start = job.start_time?.slice(0, 5);
  const end = job.end_time?.slice(0, 5);
  if (start && end) return `${start}–${end}`;
  return start ?? end ?? null;
};

type View = "month" | "week";
type Editing = { job: JobRow | null; date?: string } | null;

export function JobCalendar({ jobs }: { jobs: JobRow[] }) {
  const [view, setView] = useState<View>("month");
  const [editing, setEditing] = useState<Editing>(null);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);
  const todayIso = toISODate(today);

  const [cursor, setCursor] = useState(() => new Date(today));

  const close = useCallback(() => setEditing(null), []);

  useEffect(() => {
    if (!editing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editing, close]);

  const jobsOn = useCallback(
    (iso: string) =>
      jobs
        .filter((job) => jobCoversDay(job, iso))
        .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? "")),
    [jobs],
  );

  /** Month grid, padded to whole weeks so the rows never break. */
  const monthCells = useMemo(() => {
    const first = startOfMonth(cursor);
    const total = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0,
    ).getDate();
    const lead = mondayIndex(first);
    const cells: { date: Date; iso: string; outside: boolean }[] = [];

    for (let i = lead; i > 0; i -= 1) {
      const date = addDays(first, -i);
      cells.push({ date, iso: toISODate(date), outside: true });
    }
    for (let day = 1; day <= total; day += 1) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      cells.push({ date, iso: toISODate(date), outside: false });
    }
    while (cells.length % 7 !== 0) {
      const date = addDays(cells[cells.length - 1].date, 1);
      cells.push({ date, iso: toISODate(date), outside: true });
    }
    return cells;
  }, [cursor]);

  const weekCells = useMemo(() => {
    const first = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(first, i);
      return { date, iso: toISODate(date) };
    });
  }, [cursor]);

  const upcoming = useMemo(
    () =>
      jobs
        .filter((job) => job.ends_on >= todayIso && job.status !== "cancelled")
        .sort((a, b) => a.starts_on.localeCompare(b.starts_on))
        .slice(0, 8),
    [jobs, todayIso],
  );

  const stepBy = (delta: number) =>
    setCursor((current) =>
      view === "month"
        ? addMonths(current, delta)
        : addDays(current, delta * 7),
    );

  const periodLabel =
    view === "month"
      ? MONTH_FORMAT.format(cursor)
      : `${DAY_FORMAT.format(weekCells[0].date)} – ${DAY_FORMAT.format(weekCells[6].date)}`;

  return (
    <>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label="Job calendar">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stepBy(-1)}
                className="grid h-9 w-9 place-items-center rounded-full border border-stone/30 text-sand transition-colors hover:border-bronze-light hover:text-bronze-light"
              >
                <span className="sr-only">
                  Previous {view === "month" ? "month" : "week"}
                </span>
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
              <button
                type="button"
                onClick={() => stepBy(1)}
                className="grid h-9 w-9 place-items-center rounded-full border border-stone/30 text-sand transition-colors hover:border-bronze-light hover:text-bronze-light"
              >
                <span className="sr-only">
                  Next {view === "month" ? "month" : "week"}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m9 5 7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </button>
              <p
                aria-live="polite"
                className="ml-2 font-display text-lg font-medium tracking-[-0.02em] text-bone tabular-nums"
              >
                {periodLabel}
              </p>
              <button
                type="button"
                onClick={() => setCursor(new Date(today))}
                className="ml-1 rounded-full border border-stone/30 px-3.5 py-1.5 text-[0.64rem] font-medium tracking-[0.12em] text-stone uppercase transition-colors hover:border-bronze-light hover:text-bronze-light"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label="Calendar view"
                className="flex rounded-full border border-stone/30 p-0.5"
              >
                {(["month", "week"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setView(option)}
                    aria-pressed={view === option}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-[0.64rem] font-medium tracking-[0.12em] uppercase transition-colors",
                      view === option
                        ? "bg-bone text-ink"
                        : "text-stone hover:text-sand",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setEditing({ job: null, date: todayIso })}
                className="rounded-full bg-bronze px-5 py-2 text-[0.68rem] font-semibold tracking-[0.14em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink"
              >
                Add job
              </button>
            </div>
          </div>

          {/* Weekday header */}
          <div className="mt-6 grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                aria-hidden="true"
                className="pb-1 text-center text-[0.6rem] font-medium tracking-[0.14em] text-stone uppercase"
              >
                {weekday}
              </div>
            ))}
          </div>

          {view === "month" ? (
            <div className="grid grid-cols-7 gap-1.5">
              {monthCells.map((cell) => {
                const dayJobs = jobsOn(cell.iso);
                return (
                  <div
                    key={cell.iso}
                    className={cn(
                      "min-h-[6.5rem] rounded-sm border p-1.5 transition-colors",
                      cell.outside
                        ? "border-stone/10 bg-transparent"
                        : "border-stone/18 bg-charcoal",
                      cell.iso === todayIso && "border-bronze-light/60",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setEditing({ job: null, date: cell.iso })}
                      className="flex w-full items-center justify-between rounded-sm px-1 py-0.5 text-left transition-colors hover:bg-ink/50"
                    >
                      <span className="sr-only">
                        Add a job on {LONG_DAY_FORMAT.format(cell.date)}
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "text-xs tabular-nums",
                          cell.outside ? "text-stone/35" : "text-stone",
                          cell.iso === todayIso &&
                            "font-semibold text-bronze-light",
                        )}
                      >
                        {cell.date.getDate()}
                      </span>
                      {dayJobs.length > 0 ? (
                        <span
                          aria-hidden="true"
                          className="text-[0.6rem] text-stone tabular-nums"
                        >
                          {dayJobs.length}
                        </span>
                      ) : null}
                    </button>

                    <ul className="mt-1 flex flex-col gap-1">
                      {dayJobs.slice(0, 3).map((job) => (
                        <li key={job.id}>
                          <button
                            type="button"
                            onClick={() => setEditing({ job })}
                            className={cn(
                              "block w-full truncate rounded-[3px] border px-1.5 py-1 text-left text-[0.68rem] leading-tight transition-opacity hover:opacity-80",
                              STATUS_TONES[job.status],
                            )}
                            title={`${job.customer_name} · ${job.suburb}`}
                          >
                            {job.customer_name}
                          </button>
                        </li>
                      ))}
                      {dayJobs.length > 3 ? (
                        <li className="px-1.5 text-[0.6rem] text-stone">
                          +{dayJobs.length - 3} more
                        </li>
                      ) : null}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {weekCells.map((cell) => {
                const dayJobs = jobsOn(cell.iso);
                return (
                  <div
                    key={cell.iso}
                    className={cn(
                      "flex min-h-[18rem] flex-col rounded-sm border border-stone/18 bg-charcoal p-1.5",
                      cell.iso === todayIso && "border-bronze-light/60",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setEditing({ job: null, date: cell.iso })}
                      className="rounded-sm px-1 py-1 text-left transition-colors hover:bg-ink/50"
                    >
                      <span className="sr-only">
                        Add a job on {LONG_DAY_FORMAT.format(cell.date)}
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "text-xs tabular-nums",
                          cell.iso === todayIso
                            ? "font-semibold text-bronze-light"
                            : "text-stone",
                        )}
                      >
                        {cell.date.getDate()}
                      </span>
                    </button>

                    <ul className="mt-1 flex flex-col gap-1.5">
                      {dayJobs.map((job) => (
                        <li key={job.id}>
                          <button
                            type="button"
                            onClick={() => setEditing({ job })}
                            className={cn(
                              "block w-full rounded-[3px] border px-2 py-1.5 text-left text-[0.7rem] leading-tight transition-opacity hover:opacity-80",
                              STATUS_TONES[job.status],
                            )}
                          >
                            <span className="block truncate font-medium">
                              {job.customer_name}
                            </span>
                            <span className="block truncate opacity-75">
                              {job.suburb}
                            </span>
                            {timeRange(job) ? (
                              <span className="block tabular-nums opacity-75">
                                {timeRange(job)}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[0.68rem] text-stone">
            {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((status) => (
              <li key={status} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "block h-2.5 w-2.5 rounded-[2px] border",
                    STATUS_TONES[status],
                  )}
                />
                {JOB_STATUS_LABELS[status]}
              </li>
            ))}
          </ul>
        </section>

        {/* Upcoming */}
        <section aria-labelledby="upcoming-jobs">
          <h2
            id="upcoming-jobs"
            className="text-[0.72rem] font-semibold tracking-[0.14em] text-bone uppercase"
          >
            Upcoming
          </h2>
          {upcoming.length === 0 ? (
            <p className="mt-4 rounded-sm border border-stone/18 bg-charcoal px-4 py-8 text-center text-xs text-stone">
              Nothing scheduled yet. Add a job to start the diary.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {upcoming.map((job) => (
                <li key={job.id}>
                  <button
                    type="button"
                    onClick={() => setEditing({ job })}
                    className="flex w-full flex-col gap-1 rounded-sm border border-stone/18 bg-charcoal px-4 py-3 text-left transition-colors hover:border-bronze-light/50"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-bone">
                        {job.customer_name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2.5 py-0.5 text-[0.58rem] font-medium tracking-[0.12em] uppercase",
                          STATUS_TONES[job.status],
                        )}
                      >
                        {JOB_STATUS_LABELS[job.status]}
                      </span>
                    </span>
                    <span className="truncate text-xs text-stone">
                      {job.suburb}
                      {job.job_type ? ` · ${job.job_type}` : ""}
                    </span>
                    <span className="text-xs text-sand/70 tabular-nums">
                      {job.starts_on === job.ends_on
                        ? DAY_FORMAT.format(
                            new Date(`${job.starts_on}T00:00:00`),
                          )
                        : `${DAY_FORMAT.format(new Date(`${job.starts_on}T00:00:00`))} – ${DAY_FORMAT.format(new Date(`${job.ends_on}T00:00:00`))}`}
                      {timeRange(job) ? ` · ${timeRange(job)}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Editor */}
      {editing ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/80 p-4 backdrop-blur-sm sm:p-8"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-dialog-title"
            className="w-full max-w-2xl rounded-lg border border-stone/25 bg-charcoal p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="job-dialog-title"
                  className="font-display text-2xl font-medium tracking-[-0.02em] text-bone"
                >
                  {editing.job ? "Edit job" : "New job"}
                </h2>
                <p className="mt-1.5 text-xs text-stone">
                  Private to the dashboard — never published.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-stone/30 text-sand transition-colors hover:border-bronze-light hover:text-bronze-light"
              >
                <span className="sr-only">Close</span>
                <svg
                  viewBox="0 0 12 12"
                  className="h-3 w-3"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 2l8 8M10 2l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </button>
            </div>

            <JobForm
              key={editing.job?.id ?? `new-${editing.date ?? ""}`}
              job={editing.job}
              defaultDate={editing.date}
              onDone={close}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
