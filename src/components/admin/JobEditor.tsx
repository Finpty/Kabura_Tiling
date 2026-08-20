"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveJob, type Result } from "@/app/admin/portal-actions";
import {
  JOB_STATUS_LABELS_FULL,
  PORTAL_JOB_STATUSES,
  type PortalJobRow,
} from "@/lib/supabase/portal-types";

/**
 * Create or edit a job.
 *
 * ── The field that does the most work ───────────────────────────────────────
 * "Actually finished on". Setting it to the Wednesday of a job booked through
 * to Friday hands Thursday and Friday straight back to the public calendar,
 * because availability is computed from the job rather than from a separate
 * table of reserved days. There is no "release these dates" button anywhere in
 * this portal, and there does not need to be.
 *
 * Money is entered excluding GST, once, and everything downstream builds from
 * it. Asking for an inclusive figure here and an exclusive one there is how a
 * business ends up reporting its GST as profit.
 */

const FIELD =
  "w-full rounded-lg border border-stone/25 bg-charcoal px-3.5 py-3 text-sm text-bone placeholder:text-stone focus:border-bronze-light focus:outline-none";
const LABEL = "block text-[0.62rem] tracking-[0.14em] text-stone uppercase";

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  step,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
  step?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={LABEL}>{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className={FIELD}
      />
      {hint ? <span className="text-[0.68rem] text-stone">{hint}</span> : null}
    </label>
  );
}

function Save({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-full bg-bronze text-[0.72rem] font-semibold tracking-[0.16em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink disabled:opacity-50 sm:w-auto sm:px-10"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

export function JobEditor({ job }: { job?: PortalJobRow }) {
  const [state, action] = useActionState<Result, FormData>(saveJob, {});

  return (
    <form action={action} className="flex flex-col gap-8">
      {job ? <input type="hidden" name="id" value={job.id} /> : null}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[0.68rem] tracking-[0.16em] text-stone-light uppercase">
          Customer
        </legend>
        <Field label="Name" name="customer_name" required defaultValue={job?.customer_name} />
        <Field label="Phone" name="customer_phone" type="tel" defaultValue={job?.customer_phone} />
        <Field label="Email" name="customer_email" type="email" defaultValue={job?.customer_email} />
        <Field label="Suburb" name="suburb" required defaultValue={job?.suburb} />
        <Field label="Address" name="address" defaultValue={job?.address} />
        <Field label="Postcode" name="postcode" defaultValue={job?.postcode} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[0.68rem] tracking-[0.16em] text-stone-light uppercase">
          Schedule
        </legend>
        <Field label="Starts" name="starts_on" type="date" required defaultValue={job?.starts_on} />
        <Field label="Expected finish" name="ends_on" type="date" defaultValue={job?.ends_on} />
        <Field
          label="Actually finished"
          name="actual_finish_on"
          type="date"
          defaultValue={job?.actual_finish_on}
          hint="Finished early? Set this and the unused days open back up for customers straight away."
        />
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Status</span>
          <select name="status" defaultValue={job?.status ?? "booked"} className={FIELD}>
            {PORTAL_JOB_STATUSES.map((value) => (
              <option key={value} value={value}>
                {JOB_STATUS_LABELS_FULL[value]}
              </option>
            ))}
          </select>
        </label>
        <Field label="Start time" name="start_time" type="time" defaultValue={job?.start_time?.slice(0, 5)} />
        <Field label="End time" name="end_time" type="time" defaultValue={job?.end_time?.slice(0, 5)} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[0.68rem] tracking-[0.16em] text-stone-light uppercase">
          Work
        </legend>
        <Field label="Service" name="job_type" defaultValue={job?.job_type} placeholder="Bathroom renovation" />
        <Field label="Invoice reference" name="invoice_reference" defaultValue={job?.invoice_reference} />
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={LABEL}>Description</span>
          <textarea
            name="description"
            rows={3}
            defaultValue={job?.description ?? ""}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={LABEL}>Private notes</span>
          <textarea
            name="notes"
            rows={3}
            defaultValue={job?.notes ?? ""}
            className={FIELD}
          />
          <span className="text-[0.68rem] text-stone">
            Staff only. Never shown to anyone outside the portal.
          </span>
        </label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[0.68rem] tracking-[0.16em] text-stone-light uppercase">
          Money
        </legend>
        <Field
          label="Job value (excl GST)"
          name="value_ex_gst"
          type="number"
          step="0.01"
          defaultValue={job?.value_ex_gst}
          hint="GST is added from the rate in settings. Enter the figure before GST."
        />
        <Field label="Deposit required (incl GST)" name="deposit_required" type="number" step="0.01" defaultValue={job?.deposit_required} />
        <Field label="Materials cost" name="materials_cost" type="number" step="0.01" defaultValue={job?.materials_cost} />
        <Field label="Labour / subcontractors" name="labour_cost" type="number" step="0.01" defaultValue={job?.labour_cost} />
        <Field label="Other costs" name="other_costs" type="number" step="0.01" defaultValue={job?.other_costs} />
      </fieldset>

      {state.error ? (
        <p role="alert" className="text-sm text-bronze-light">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm text-emerald-300">
          Saved.
        </p>
      ) : null}

      <Save>{job ? "Save job" : "Create job"}</Save>
    </form>
  );
}
