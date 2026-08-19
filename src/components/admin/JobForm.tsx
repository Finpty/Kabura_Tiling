"use client";

import { useActionState, useEffect, useId } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteJob,
  saveJob,
  type JobActionState,
} from "@/app/admin/calendar/actions";
import { QUOTE_SERVICE_OPTIONS } from "@/lib/services";
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  type JobRow,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/**
 * Create / edit a job.
 *
 * Renders inside the calendar's dialog. Everything on this form is private
 * customer information — it exists only behind the admin session check and is
 * never imported by anything the public site renders.
 */

type Props = {
  job: JobRow | null;
  /** Pre-fills the dates when the owner clicked an empty day. */
  defaultDate?: string;
  onDone: () => void;
};

function Submit({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-bone px-6 py-2.5 text-[0.7rem] font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:bg-paper disabled:opacity-50"
    >
      {pending ? "Saving…" : editing ? "Save changes" : "Add job"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-[0.7rem] font-semibold tracking-[0.14em] text-stone uppercase transition-colors hover:text-bronze-light disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete job"}
    </button>
  );
}

const fieldClass =
  "w-full rounded-sm border bg-ink px-3.5 py-2.5 text-sm text-bone placeholder:text-stone/55 focus:outline-none focus-visible:border-bronze-light";

function Row({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="eyebrow text-stone-light">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-stone">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs text-bronze-light">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function JobForm({ job, defaultDate, onDone }: Props) {
  const uid = useId();
  const [state, action] = useActionState<JobActionState, FormData>(saveJob, {});
  const [deleteState, deleteAction] = useActionState<JobActionState, FormData>(
    deleteJob,
    {},
  );

  useEffect(() => {
    if (state.ok || deleteState.ok) onDone();
  }, [state.ok, deleteState.ok, onDone]);

  const errors = state.fields ?? {};
  const id = (name: string) => `${uid}-${name}`;
  const start = job?.starts_on ?? defaultDate ?? "";
  const end = job?.ends_on ?? defaultDate ?? "";

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-5">
        {job ? <input type="hidden" name="id" value={job.id} /> : null}

        <Row
          label="Customer / job name"
          htmlFor={id("customerName")}
          error={errors.customerName}
        >
          <input
            id={id("customerName")}
            name="customerName"
            defaultValue={job?.customer_name ?? ""}
            maxLength={160}
            required
            autoComplete="off"
            placeholder="e.g. Nguyen — ensuite retile"
            className={cn(
              fieldClass,
              errors.customerName ? "border-bronze" : "border-stone/30",
            )}
          />
        </Row>

        <div className="grid gap-5 sm:grid-cols-2">
          <Row label="Suburb" htmlFor={id("suburb")} error={errors.suburb}>
            <input
              id={id("suburb")}
              name="suburb"
              defaultValue={job?.suburb ?? ""}
              maxLength={120}
              required
              autoComplete="off"
              placeholder="e.g. Baldivis"
              className={cn(
                fieldClass,
                errors.suburb ? "border-bronze" : "border-stone/30",
              )}
            />
          </Row>

          <Row
            label="Job type"
            htmlFor={id("jobType")}
            error={errors.jobType}
            hint="Free text — the list is just a shortcut."
          >
            <input
              id={id("jobType")}
              name="jobType"
              list={id("jobTypes")}
              defaultValue={job?.job_type ?? ""}
              maxLength={120}
              autoComplete="off"
              placeholder="e.g. Bathroom"
              className={cn(
                fieldClass,
                errors.jobType ? "border-bronze" : "border-stone/30",
              )}
            />
            <datalist id={id("jobTypes")}>
              {QUOTE_SERVICE_OPTIONS.map((option) => (
                <option key={option.value} value={option.label} />
              ))}
            </datalist>
          </Row>
        </div>

        <Row
          label="Address"
          htmlFor={id("address")}
          error={errors.address}
          hint="Private. Never shown on the public site."
        >
          <input
            id={id("address")}
            name="address"
            defaultValue={job?.address ?? ""}
            maxLength={300}
            autoComplete="off"
            placeholder="e.g. 12 Example Rd"
            className={cn(
              fieldClass,
              errors.address ? "border-bronze" : "border-stone/30",
            )}
          />
        </Row>

        <div className="grid gap-5 sm:grid-cols-2">
          <Row
            label="Start date"
            htmlFor={id("startsOn")}
            error={errors.startsOn}
          >
            <input
              id={id("startsOn")}
              name="startsOn"
              type="date"
              defaultValue={start}
              required
              className={cn(
                fieldClass,
                errors.startsOn ? "border-bronze" : "border-stone/30",
              )}
            />
          </Row>
          <Row label="End date" htmlFor={id("endsOn")} error={errors.endsOn}>
            <input
              id={id("endsOn")}
              name="endsOn"
              type="date"
              defaultValue={end}
              required
              className={cn(
                fieldClass,
                errors.endsOn ? "border-bronze" : "border-stone/30",
              )}
            />
          </Row>
          <Row
            label="Start time"
            htmlFor={id("startTime")}
            error={errors.startTime}
            hint="Optional."
          >
            <input
              id={id("startTime")}
              name="startTime"
              type="time"
              defaultValue={job?.start_time?.slice(0, 5) ?? ""}
              className={cn(
                fieldClass,
                errors.startTime ? "border-bronze" : "border-stone/30",
              )}
            />
          </Row>
          <Row
            label="Finish time"
            htmlFor={id("endTime")}
            error={errors.endTime}
            hint="Optional."
          >
            <input
              id={id("endTime")}
              name="endTime"
              type="time"
              defaultValue={job?.end_time?.slice(0, 5) ?? ""}
              className={cn(
                fieldClass,
                errors.endTime ? "border-bronze" : "border-stone/30",
              )}
            />
          </Row>
        </div>

        <Row label="Status" htmlFor={id("status")} error={errors.status}>
          <select
            id={id("status")}
            name="status"
            defaultValue={job?.status ?? "tentative"}
            className={cn(fieldClass, "border-stone/30")}
          >
            {JOB_STATUSES.map((value) => (
              <option key={value} value={value}>
                {JOB_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </Row>

        <Row
          label="Notes"
          htmlFor={id("notes")}
          error={errors.notes}
          hint="Private. Access details, materials, anything worth remembering."
        >
          <textarea
            id={id("notes")}
            name="notes"
            rows={4}
            maxLength={4000}
            defaultValue={job?.notes ?? ""}
            className={cn(
              fieldClass,
              "resize-y",
              errors.notes ? "border-bronze" : "border-stone/30",
            )}
          />
        </Row>

        {state.error ? (
          <p role="alert" className="text-sm text-bronze-light">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <Submit editing={Boolean(job)} />
          <button
            type="button"
            onClick={onDone}
            className="text-[0.7rem] font-semibold tracking-[0.14em] text-stone uppercase transition-colors hover:text-sand"
          >
            Cancel
          </button>
        </div>
      </form>

      {job ? (
        <form
          action={deleteAction}
          className="flex items-center gap-4 border-t border-stone/15 pt-5"
        >
          <input type="hidden" name="id" value={job.id} />
          <DeleteButton />
          {deleteState.error ? (
            <p role="alert" className="text-xs text-bronze-light">
              {deleteState.error}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
