"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveExpense, type Result } from "@/app/admin/portal-actions";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/supabase/portal-types";

const FIELD =
  "w-full rounded-lg border border-stone/25 bg-charcoal px-3.5 py-2.5 text-sm text-bone placeholder:text-stone focus:border-bronze-light focus:outline-none";
const LABEL = "block text-[0.62rem] tracking-[0.14em] text-stone uppercase";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-full bg-bronze px-8 text-[0.68rem] font-semibold tracking-[0.14em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink disabled:opacity-50"
    >
      {pending ? "Saving…" : "Add expense"}
    </button>
  );
}

/**
 * Record what went out.
 *
 * The GST field is deliberately optional. Leave it blank and the amount is
 * split at the configured rate; fill it in and the receipt wins — because a
 * docket with GST-free items on it does not divide by eleven, and the receipt
 * is the evidence the ATO would want, not the formula.
 */
export function ExpenseForm({ jobs }: { jobs: { id: string; label: string }[] }) {
  const [state, action] = useActionState<Result, FormData>(saveExpense, {});

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Date</span>
        <input name="spent_on" type="date" className={FIELD} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Supplier</span>
        <input name="supplier" placeholder="Bunnings" className={FIELD} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Category</span>
        <select name="category" defaultValue="materials" className={FIELD}>
          {EXPENSE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {EXPENSE_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Amount</span>
        <input name="amount" type="number" step="0.01" required className={FIELD} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>GST on the receipt</span>
        <input
          name="gst_amount"
          type="number"
          step="0.01"
          placeholder="Leave blank to work it out"
          className={FIELD}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Job</span>
        <select name="job_id" defaultValue="" className={FIELD}>
          <option value="">Not job-specific</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className={LABEL}>Description</span>
        <input name="description" className={FIELD} />
      </label>
      <label className="flex items-center gap-2.5 pt-6">
        <input
          type="checkbox"
          name="gst_included"
          defaultChecked
          className="h-4 w-4 accent-bronze"
        />
        <span className="text-sm text-sand/80">Amount includes GST</span>
      </label>

      <div className="sm:col-span-2 lg:col-span-3">
        <Save />
        {state.error ? (
          <p role="alert" className="mt-2 text-sm text-bronze-light">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
