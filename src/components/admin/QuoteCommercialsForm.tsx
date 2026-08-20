"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  convertQuoteToJob,
  updateQuote,
  type Result,
} from "@/app/admin/portal-actions";
import {
  QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  normaliseQuoteStatus,
} from "@/lib/supabase/portal-types";
import type { QuoteRow } from "@/lib/admin/data";

const FIELD =
  "w-full rounded-lg border border-stone/25 bg-charcoal px-3.5 py-2.5 text-sm text-bone placeholder:text-stone focus:border-bronze-light focus:outline-none";
const LABEL = "block text-[0.62rem] tracking-[0.14em] text-stone uppercase";

function Go({ children, primary }: { children: string; primary?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        primary
          ? "h-11 rounded-full bg-bronze px-8 text-[0.68rem] font-semibold tracking-[0.14em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink disabled:opacity-50"
          : "h-11 rounded-full border border-stone/30 px-8 text-[0.68rem] font-semibold tracking-[0.14em] text-sand uppercase transition-colors hover:border-bronze-light hover:text-bronze-light disabled:opacity-50"
      }
    >
      {pending ? "Working…" : children}
    </button>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={LABEL}>{label}</span>
      <input
        name={name}
        type={type}
        step={type === "number" ? "0.01" : undefined}
        defaultValue={defaultValue ?? undefined}
        className={FIELD}
      />
      {hint ? <span className="text-[0.68rem] text-stone">{hint}</span> : null}
    </label>
  );
}

/** The commercial side of a quote, and the button that turns it into work. */
export function QuoteCommercialsForm({ quote }: { quote: QuoteRow }) {
  const [saveState, save] = useActionState<Result, FormData>(updateQuote, {});
  const [convertState, convert] = useActionState<Result, FormData>(
    convertQuoteToJob,
    {},
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={save} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={quote.id} />
        <input type="hidden" name="name" value={quote.name} />
        <input type="hidden" name="phone" value={quote.phone} />
        <input type="hidden" name="email" value={quote.email} />
        <input type="hidden" name="suburb" value={quote.suburb} />

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Status</span>
          <select
            name="status"
            defaultValue={normaliseQuoteStatus(quote.status)}
            className={FIELD}
          >
            {QUOTE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {QUOTE_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="Site visit"
          name="site_visit_on"
          type="date"
          defaultValue={quote.site_visit_on}
        />
        <Field
          label="Estimated price"
          name="estimated_price"
          type="number"
          defaultValue={quote.estimated_price}
        />
        <Field
          label="Final quoted price"
          name="quoted_price"
          type="number"
          defaultValue={quote.quoted_price}
        />
        <Field
          label="Materials allowance"
          name="material_allowance"
          type="number"
          defaultValue={quote.material_allowance}
        />
        <Field
          label="Labour allowance"
          name="labour_allowance"
          type="number"
          defaultValue={quote.labour_allowance}
        />
        <Field
          label="Quote sent"
          name="quote_sent_on"
          type="date"
          defaultValue={quote.quote_sent_on}
        />
        <Field
          label="Decision date"
          name="decided_on"
          type="date"
          defaultValue={quote.decided_on}
        />

        <label className="flex items-center gap-2.5 sm:col-span-2">
          <input
            type="checkbox"
            name="price_includes_gst"
            defaultChecked={quote.price_includes_gst ?? true}
            className="h-4 w-4 accent-bronze"
          />
          <span className="text-sm text-sand/80">
            Prices above include GST
          </span>
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={LABEL}>Internal notes</span>
          <textarea
            name="internal_notes"
            rows={3}
            defaultValue={quote.internal_notes ?? ""}
            className={FIELD}
          />
          <span className="text-[0.68rem] text-stone">
            Staff only. Never sent to the customer.
          </span>
        </label>

        <div className="sm:col-span-2">
          <Go>Save quote</Go>
          {saveState.error ? (
            <p role="alert" className="mt-2 text-sm text-bronze-light">
              {saveState.error}
            </p>
          ) : null}
          {saveState.ok ? (
            <p role="status" className="mt-2 text-sm text-emerald-300">
              Saved.
            </p>
          ) : null}
        </div>
      </form>

      {quote.converted_job_id ? (
        <p className="rounded-xl border border-bronze/30 bg-bronze/[0.06] px-4 py-3 text-sm text-sand">
          This quote is already a job.
        </p>
      ) : (
        <form
          action={convert}
          className="flex flex-col gap-3 rounded-xl border border-bronze/30 bg-bronze/[0.05] p-4"
        >
          <input type="hidden" name="id" value={quote.id} />
          <p className="text-[0.68rem] tracking-[0.14em] text-bronze-light uppercase">
            Convert to a job
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Start</span>
              <input
                name="starts_on"
                type="date"
                required
                defaultValue={quote.preferred_start_date ?? undefined}
                className={FIELD}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Expected finish</span>
              <input name="ends_on" type="date" className={FIELD} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Address</span>
              <input name="address" className={FIELD} />
            </label>
          </div>
          <p className="text-[0.68rem] leading-relaxed text-stone">
            Carries the customer, the service, the description and the price
            across. The quote is kept exactly as it is — it is the record of
            what was actually asked for. The dates come off the public calendar
            as soon as the job exists.
          </p>
          <div>
            <Go primary>Create the job</Go>
          </div>
          {convertState.error ? (
            <p role="alert" className="text-sm text-bronze-light">
              {convertState.error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
