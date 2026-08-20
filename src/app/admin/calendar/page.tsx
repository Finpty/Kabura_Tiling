import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { JobCalendar } from "@/components/admin/JobCalendar";
import { DayOverride } from "@/components/admin/DayOverride";
import {
  getBlockMap,
  getCalendarBlocks,
  getJobs,
  getSettings,
} from "@/lib/admin/data";
import {
  addDays,
  availabilityFor,
  dateRange,
  dayName,
  eachDay,
  findGaps,
  longDate,
  todayISO,
} from "@/lib/admin/dates";
import {
  CALENDAR_OVERRIDE_LABELS,
  JOB_STATUS_LABELS_FULL,
} from "@/lib/supabase/portal-types";
import { AVAILABILITY_LABELS } from "@/lib/supabase/types";
import {
  Card,
  Empty,
  PageHeader,
  Pill,
  RowLink,
  Section,
} from "@/components/admin/ui";

export const metadata = { title: "Calendar", robots: { index: false } };
export const dynamic = "force-dynamic";

const TONE: Record<string, string> = {
  available: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  limited: "border-bronze/50 bg-bronze/10 text-bronze-light",
  booked: "border-stone/30 bg-stone/10 text-stone-light",
  unavailable: "border-stone/15 bg-transparent text-stone/50",
};

/**
 * The diary, and what the public sees because of it.
 *
 * The two are computed from the same jobs by the same rules — `availabilityFor`
 * here, `service_availability()` in Postgres — so they cannot disagree. Move a
 * job and both change together; there is no reserved-days table to fall out of
 * step.
 */
export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const today = todayISO();
  const horizon = addDays(today, 90);
  const { day } = await searchParams;
  const selected = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : today;

  const [settings, jobs, blocks, blockRows] = await Promise.all([
    getSettings(),
    getJobs(addDays(today, -60), addDays(today, 180)),
    getBlockMap(today, horizon),
    getCalendarBlocks(today, horizon),
  ]);

  const live = jobs.filter((job) => job.status !== "cancelled");
  const gaps = findGaps({ jobs: live, blocks, settings, from: today, days: 90 });

  const next21 = eachDay(today, addDays(today, 20)).map((d) => ({
    day: d,
    status: availabilityFor(d, { jobs: live, blocks, settings, today }),
    override: blocks.get(d) ?? null,
  }));

  const onSelected = live.filter(
    (job) =>
      job.starts_on <= selected &&
      selected <= (job.actual_finish_on ?? job.ends_on),
  );

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="What is booked, and what customers can see."
        action={
          <Link
            href="/admin/jobs/new"
            className="rounded-full bg-bronze px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.14em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink"
          >
            Add job
          </Link>
        }
      />

      {/* ------------------------ next three weeks ------------------------ */}
      <Section title="Next three weeks — what a customer sees">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
          {next21.map((entry) => (
            <Link
              key={entry.day}
              href={`/admin/calendar?day=${entry.day}`}
              className={`rounded-lg border px-2 py-2.5 text-center transition-colors ${TONE[entry.status]} ${
                entry.day === selected ? "ring-1 ring-bronze-light" : ""
              }`}
            >
              <span className="block text-[0.6rem] tracking-[0.1em] uppercase opacity-70">
                {dayName(entry.day).split(" ")[0].slice(0, 3)}
              </span>
              <span className="mt-0.5 block text-sm font-medium tabular-nums">
                {entry.day.slice(8)}
              </span>
              <span className="mt-1 block text-[0.55rem] uppercase opacity-80">
                {AVAILABILITY_LABELS[entry.status]}
              </span>
              {entry.override ? (
                <span className="mt-0.5 block text-[0.5rem] text-bronze-light">
                  set
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </Section>

      {/* --------------------------- selected day -------------------------- */}
      <Section title={longDate(selected)}>
        <Card>
          <DayOverride day={selected} current={blocks.get(selected) ?? null} />
        </Card>

        {onSelected.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {onSelected.map((job) => (
              <RowLink key={job.id} href={`/admin/jobs/${job.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-bone">
                      {job.customer_name} · {job.suburb}
                    </span>
                    <span className="text-xs text-stone">
                      {dateRange(
                        job.starts_on,
                        job.actual_finish_on ?? job.ends_on,
                      )}
                    </span>
                  </span>
                  <Pill tone={job.status === "in_progress" ? "live" : "neutral"}>
                    {JOB_STATUS_LABELS_FULL[job.status]}
                  </Pill>
                </div>
              </RowLink>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <Empty>Nothing booked on this day.</Empty>
          </div>
        )}
      </Section>

      {/* ------------------------------ gaps ------------------------------- */}
      <Section title="Openings">
        {gaps.length === 0 ? (
          <Empty>No free runs in the next three months.</Empty>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {gaps.map((gap) => (
              <Link key={gap.from} href={`/admin/calendar?day=${gap.from}`}>
                <Card className="transition-colors hover:border-bronze-light/40">
                  <p className="font-display text-lg text-bone">{gap.label}</p>
                  <p className="mt-1 text-xs text-stone">
                    {dateRange(gap.from, gap.to)}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* --------------------------- manual rulings ------------------------ */}
      {blockRows.length > 0 ? (
        <Section title="Days you have set by hand">
          <ul className="grid gap-2">
            {blockRows.map((block) => (
              <li
                key={block.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-stone/15 bg-charcoal/30 px-4 py-3"
              >
                <span className="min-w-0">
                  <Link
                    href={`/admin/calendar?day=${block.day}`}
                    className="block truncate text-sm text-bone"
                  >
                    {longDate(block.day)}
                  </Link>
                  {block.note ? (
                    <span className="text-xs text-stone">{block.note}</span>
                  ) : null}
                </span>
                <Pill tone="warn">{CALENDAR_OVERRIDE_LABELS[block.kind]}</Pill>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* ---------------------------- full diary --------------------------- */}
      <Section title="Full diary">
        <JobCalendar jobs={jobs} />
      </Section>
    </>
  );
}
