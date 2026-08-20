import { JOB_STATUSES, type JobStatus } from "./supabase/types";
import { fromISODate } from "./quote-schema";

/**
 * Validation for the private job calendar.
 *
 * Same shape as the quote schema: one hand-written module, run by the admin
 * form and again by the server action, so the browser can never talk the server
 * into storing something the database would reject.
 *
 * Bounds mirror the check constraints in
 * `supabase/migrations/20260819100100_job_calendar.sql`.
 */

export type JobDraft = {
  id: string;
  customerName: string;
  suburb: string;
  address: string;
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
  jobType: string;
  notes: string;
  status: JobStatus;
};

export const EMPTY_JOB: JobDraft = {
  id: "",
  customerName: "",
  suburb: "",
  address: "",
  startsOn: "",
  endsOn: "",
  startTime: "",
  endTime: "",
  jobType: "",
  notes: "",
  status: "tentative",
};

export type JobFieldErrors = Partial<Record<keyof JobDraft, string>>;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isJobStatus = (value: string): value is JobStatus =>
  (JOB_STATUSES as readonly string[]).includes(value);

export function validateJob(draft: JobDraft): JobFieldErrors {
  const errors: JobFieldErrors = {};
  const trim = (value: string) => (value ?? "").trim();

  const customerName = trim(draft.customerName);
  if (!customerName) errors.customerName = "Who is the job for?";
  else if (customerName.length > 160)
    errors.customerName = "That name is too long.";

  const suburb = trim(draft.suburb);
  if (!suburb) errors.suburb = "Which suburb?";
  else if (suburb.length > 120) errors.suburb = "That suburb is too long.";

  if (trim(draft.address).length > 300)
    errors.address = "That address is too long.";
  if (trim(draft.jobType).length > 120)
    errors.jobType = "Keep the job type short.";
  if (trim(draft.notes).length > 4000)
    errors.notes = "Notes are capped at 4000 characters.";

  const start = fromISODate(trim(draft.startsOn));
  if (!start) errors.startsOn = "Pick a start date.";

  const end = fromISODate(trim(draft.endsOn));
  if (!end) errors.endsOn = "Pick an end date.";
  else if (start && end < start)
    errors.endsOn = "The end date is before the start.";

  const startTime = trim(draft.startTime);
  if (startTime && !TIME.test(startTime))
    errors.startTime = "Use 24-hour time, e.g. 07:30.";

  const endTime = trim(draft.endTime);
  if (endTime && !TIME.test(endTime))
    errors.endTime = "Use 24-hour time, e.g. 15:00.";

  // Times only order each other on a single-day job; across days they are just
  // the start of the first day and the end of the last.
  if (
    !errors.startTime &&
    !errors.endTime &&
    startTime &&
    endTime &&
    start &&
    end &&
    start.getTime() === end.getTime() &&
    endTime <= startTime
  ) {
    errors.endTime = "The finish time is before the start.";
  }

  if (!isJobStatus(draft.status)) errors.status = "Pick a status.";

  return errors;
}

/** Inclusive day span of a job, used for the month grid. */
export function jobCoversDay(
  job: { starts_on: string; ends_on: string },
  iso: string,
) {
  return job.starts_on <= iso && iso <= job.ends_on;
}
