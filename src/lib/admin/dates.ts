import type {
  BusinessSettingsRow,
  CalendarBlockRow,
  PortalJobRow,
} from "@/lib/supabase/portal-types";
import { OCCUPYING_JOB_STATUSES } from "@/lib/supabase/portal-types";
import type { AvailabilityStatus } from "@/lib/supabase/types";

/**
 * Calendar arithmetic for the portal.
 *
 * ── Why everything here is a plain "YYYY-MM-DD" string ──────────────────────
 * A job runs on days, not instants. Modelling a day as a Date drags a timezone
 * into every comparison, and the moment a server in UTC and a phone in Perth
 * disagree about which day it is, a job silently moves. Days are strings here
 * and only ever become Dates for arithmetic, at local midday — far enough from
 * either midnight that no offset can push it onto the day before or after.
 */

export type ISODate = string;

/** Local midday, so no timezone offset can shift the calendar day. */
export function fromISO(day: ISODate): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function toISO(date: Date): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const todayISO = (): ISODate => toISO(new Date());

export function addDays(day: ISODate, count: number): ISODate {
  const date = fromISO(day);
  date.setDate(date.getDate() + count);
  return toISO(date);
}

/** Whole days from `a` to `b`. Negative when `b` is earlier. */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86_400_000);
}

/** Every day from `from` to `to`, inclusive. */
export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  const span = daysBetween(from, to);
  if (span < 0) return out;
  for (let i = 0; i <= span; i += 1) out.push(addDays(from, i));
  return out;
}

/** 1 = Monday … 7 = Sunday, matching the `working_days` column. */
export const isoWeekday = (day: ISODate): number => {
  const js = fromISO(day).getDay();
  return js === 0 ? 7 : js;
};

export const isWorkingDay = (
  day: ISODate,
  settings: Pick<BusinessSettingsRow, "working_days">,
): boolean => settings.working_days.includes(isoWeekday(day));

/* ============================ job occupancy ============================== */

/**
 * The last day a job actually holds.
 *
 * `actual_finish_on` wins when it is set: recording that a job finished on the
 * Wednesday releases the Thursday and the Friday, and recording that it ran to
 * the Monday takes the extra days. This one line is why shortening, extending
 * or cancelling a job needs no separate "release the dates" step anywhere —
 * there is nothing to release, because nothing was ever reserved.
 */
export const jobEndsOn = (
  job: Pick<PortalJobRow, "ends_on" | "actual_finish_on">,
): ISODate => job.actual_finish_on ?? job.ends_on;

/** Does this job hold that day? Cancelled jobs hold nothing. */
export function jobCoversDay(
  job: Pick<PortalJobRow, "starts_on" | "ends_on" | "actual_finish_on" | "status">,
  day: ISODate,
): boolean {
  if (!OCCUPYING_JOB_STATUSES.includes(job.status)) return false;
  return day >= job.starts_on && day <= jobEndsOn(job);
}

/* =========================== availability model ========================== */

/**
 * Availability as the admin sees it — the same rules the public
 * `service_availability()` function applies, computed here so the admin
 * calendar and the customer calendar can never disagree.
 *
 * Order matters, and it is the order the SQL uses:
 *   1. a day already gone cannot be booked
 *   2. the admin's own ruling, where they made one
 *   3. outside the working week
 *   4. otherwise, whatever the diary implies
 */
export function availabilityFor(
  day: ISODate,
  {
    jobs,
    blocks,
    settings,
    today = todayISO(),
  }: {
    jobs: Pick<
      PortalJobRow,
      "starts_on" | "ends_on" | "actual_finish_on" | "status"
    >[];
    blocks: Map<ISODate, CalendarBlockRow["kind"]>;
    settings: Pick<BusinessSettingsRow, "working_days" | "daily_capacity">;
    today?: ISODate;
  },
): AvailabilityStatus {
  if (day < today) return "unavailable";

  const override = blocks.get(day);
  if (override === "open" || override === "emergency") return "available";
  if (override === "limited") return "limited";
  if (override === "fully_booked") return "booked";
  if (override === "blocked" || override === "holiday" || override === "personal") {
    return "unavailable";
  }

  if (!isWorkingDay(day, settings)) return "unavailable";

  const running = jobs.filter((job) => jobCoversDay(job, day)).length;
  if (running === 0) return "available";
  return running < settings.daily_capacity ? "limited" : "booked";
}

/* ============================== gap finder =============================== */

export type Gap = {
  from: ISODate;
  to: ISODate;
  /** Working days in the gap — the number that decides what fits. */
  workingDays: number;
  /** Calendar days, for showing the span. */
  span: number;
  label: string;
};

/**
 * Runs of free working days between committed work.
 *
 * Two jobs finishing Tuesday and starting Friday leave a Wednesday–Thursday
 * hole that is easy to miss in a month grid and is exactly the shape of a
 * small bathroom. Weekends and blocked days are not counted as available, but
 * they do not break a gap either: a Thursday–Monday opening is still one
 * opening, described by the three working days in it.
 */
export function findGaps(
  {
    jobs,
    blocks,
    settings,
    from = todayISO(),
    days = 90,
    minWorkingDays = 1,
  }: {
    jobs: Pick<
      PortalJobRow,
      "starts_on" | "ends_on" | "actual_finish_on" | "status"
    >[];
    blocks: Map<ISODate, CalendarBlockRow["kind"]>;
    settings: Pick<BusinessSettingsRow, "working_days" | "daily_capacity">;
    from?: ISODate;
    days?: number;
    minWorkingDays?: number;
  },
): Gap[] {
  const window = eachDay(from, addDays(from, Math.max(0, days)));
  const gaps: Gap[] = [];

  let start: ISODate | null = null;
  let last: ISODate | null = null;
  let working = 0;

  const close = () => {
    if (start && last && working >= minWorkingDays) {
      gaps.push({
        from: start,
        to: last,
        workingDays: working,
        span: daysBetween(start, last) + 1,
        label: describeGap(working),
      });
    }
    start = null;
    last = null;
    working = 0;
  };

  for (const day of window) {
    const status = availabilityFor(day, { jobs, blocks, settings, today: from });

    if (status === "available") {
      start ??= day;
      last = day;
      working += 1;
      continue;
    }

    // A weekend or a public holiday sits inside an opening rather than ending
    // it — but only once the opening has started, and only if work resumes.
    if (status === "unavailable" && start && !isWorkingDay(day, settings)) {
      continue;
    }

    close();
  }
  close();

  return gaps;
}

function describeGap(workingDays: number): string {
  if (workingDays >= 20) return `${Math.round(workingDays / 5)}-week opening`;
  if (workingDays >= 5) {
    const weeks = Math.floor(workingDays / 5);
    const rest = workingDays % 5;
    const w = `${weeks} week${weeks === 1 ? "" : "s"}`;
    return rest === 0 ? `${w} available` : `${w} ${rest}d available`;
  }
  return `${workingDays}-day opening`;
}

/* ========================= Australian financial year ===================== */

export type Period = { from: ISODate; to: ISODate; label: string };

/** The financial year containing `day`, per the configured start month. */
export function financialYear(
  day: ISODate,
  settings: Pick<BusinessSettingsRow, "financial_year_start_month">,
): Period {
  const date = fromISO(day);
  const startMonth = settings.financial_year_start_month; // 1-based
  const year =
    date.getMonth() + 1 >= startMonth
      ? date.getFullYear()
      : date.getFullYear() - 1;
  const from = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const to = addDays(
    `${year + 1}-${String(startMonth).padStart(2, "0")}-01`,
    -1,
  );
  return { from, to, label: `FY ${year}–${String(year + 1).slice(2)}` };
}

/** The BAS quarter containing `day`. Calendar quarters, as the ATO uses. */
export function basQuarter(day: ISODate): Period {
  const date = fromISO(day);
  const q = Math.floor(date.getMonth() / 3);
  const startMonth = q * 3 + 1;
  const year = date.getFullYear();
  const from = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const nextMonth = startMonth + 3;
  const to = addDays(
    nextMonth > 12
      ? `${year + 1}-01-01`
      : `${year}-${String(nextMonth).padStart(2, "0")}-01`,
    -1,
  );
  const names = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"];
  return { from, to, label: `${names[q]} ${year}` };
}

/** This week, Monday to Sunday. */
export function thisWeek(day: ISODate = todayISO()): Period {
  const back = isoWeekday(day) - 1;
  const from = addDays(day, -back);
  return { from, to: addDays(from, 6), label: "This week" };
}

export function thisMonth(day: ISODate = todayISO()): Period {
  const date = fromISO(day);
  const from = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
  const next =
    date.getMonth() === 11
      ? `${date.getFullYear() + 1}-01-01`
      : `${date.getFullYear()}-${String(date.getMonth() + 2).padStart(2, "0")}-01`;
  return { from, to: addDays(next, -1), label: "This month" };
}

/* =============================== formatting ============================== */

const SHORT = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
});
const LONG = new Intl.DateTimeFormat("en-AU", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const DAY_ONLY = new Intl.DateTimeFormat("en-AU", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export const shortDate = (day: ISODate): string => SHORT.format(fromISO(day));
export const longDate = (day: ISODate): string => LONG.format(fromISO(day));
export const dayName = (day: ISODate): string => DAY_ONLY.format(fromISO(day));

/** "Mon 3 Mar – Fri 7 Mar", or one date when the span is a single day. */
export function dateRange(from: ISODate, to: ISODate): string {
  return from === to ? longDate(from) : `${shortDate(from)} – ${longDate(to)}`;
}
