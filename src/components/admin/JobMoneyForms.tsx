"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  addJobNote,
  recordPayment,
  type Result,
} from "@/app/admin/portal-actions";
import { PAYMENT_KINDS, PAYMENT_KIND_LABELS } from "@/lib/supabase/portal-types";

const FIELD =
  "w-full rounded-lg border border-stone/25 bg-charcoal px-3.5 py-3 text-sm text-bone placeholder:text-stone focus:border-bronze-light focus:outline-none";
const LABEL = "block text-[0.62rem] tracking-[0.14em] text-stone uppercase";

function Submit({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-full border border-stone/30 px-6 text-[0.68rem] font-semibold tracking-[0.14em] text-sand uppercase transition-colors hover:border-bronze-light hover:text-bronze-light disabled:opacity-50"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

/**
 * Record a payment.
 *
 * Amounts are entered as banked — GST inclusive — because that is the figure
 * on the bank statement and asking someone to strip GST in their head at the
 * point of entry is how the wrong number gets typed. The split is derived when
 * it is reported.
 */
export function PaymentForm({ jobId }: { jobId: string }) {
  const [state, action] = useActionState<Result, FormData>(recordPayment, {});

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4">
      <input type="hidden" name="job_id" value={jobId} />
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Amount (incl GST)</span>
        <input name="amount_inc_gst" type="number" step="0.01" required className={FIELD} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Type</span>
        <select name="kind" defaultValue="progress" className={FIELD}>
          {PAYMENT_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {PAYMENT_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Received</span>
        <input name="received_on" type="date" className={FIELD} />
      </label>
      <div className="flex items-end">
        <Submit>Record</Submit>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-bronze-light sm:col-span-4">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function JobNoteForm({ jobId }: { jobId: string }) {
  const [state, action] = useActionState<Result, FormData>(addJobNote, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="job_id" value={jobId} />
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Add a note</span>
        <textarea name="body" rows={3} required className={FIELD} />
      </label>
      <div className="flex items-center gap-3">
        <Submit>Save note</Submit>
        {state.error ? (
          <p role="alert" className="text-sm text-bronze-light">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
