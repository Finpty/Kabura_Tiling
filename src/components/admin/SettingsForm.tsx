"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveSettings, type Result } from "@/app/admin/portal-actions";
import type { BusinessSettingsRow } from "@/lib/supabase/portal-types";

const FIELD =
  "w-full rounded-lg border border-stone/25 bg-charcoal px-3.5 py-2.5 text-sm text-bone placeholder:text-stone focus:border-bronze-light focus:outline-none";
const LABEL = "block text-[0.62rem] tracking-[0.14em] text-stone uppercase";

const DAYS = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [7, "Sun"],
] as const;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 rounded-full bg-bronze px-10 text-[0.72rem] font-semibold tracking-[0.16em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save settings"}
    </button>
  );
}

function Text({
  label,
  name,
  defaultValue,
  hint,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  hint?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={LABEL}>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? undefined}
        className={FIELD}
      />
      {hint ? <span className="text-[0.68rem] text-stone">{hint}</span> : null}
    </label>
  );
}

/**
 * Business settings.
 *
 * Rates are entered as percentages and stored as fractions. Nothing in the app
 * hard-codes 10% or an income tax rate — these fields are the only source, so
 * an accountant can change them without anyone touching code, and every figure
 * on every screen follows on the next load.
 */
export function SettingsForm({ settings }: { settings: BusinessSettingsRow }) {
  const [state, action] = useActionState<Result, FormData>(saveSettings, {});

  return (
    <form action={action} className="flex flex-col gap-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[0.68rem] tracking-[0.16em] text-stone-light uppercase">
          Business
        </legend>
        <Text label="Business name" name="business_name" defaultValue={settings.business_name} />
        <Text label="ABN" name="abn" defaultValue={settings.abn} />
        <Text label="Phone" name="phone" defaultValue={settings.phone} />
        <Text
          label="Email"
          name="email"
          type="email"
          defaultValue={settings.email}
          hint="Also the sender for quote and booking notification emails — must be a verified sender in Brevo."
        />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[0.68rem] tracking-[0.16em] text-stone-light uppercase">
          Tax
        </legend>
        <label className="flex items-center gap-2.5 sm:col-span-2">
          <input
            type="checkbox"
            name="gst_registered"
            defaultChecked={settings.gst_registered}
            className="h-4 w-4 accent-bronze"
          />
          <span className="text-sm text-sand/80">Registered for GST</span>
        </label>
        <Text
          label="GST rate (%)"
          name="gst_rate"
          type="number"
          defaultValue={(settings.gst_rate * 100).toFixed(2)}
          hint="10 for the standard Australian rate."
        />
        <Text
          label="Estimated income tax rate (%)"
          name="income_tax_rate"
          type="number"
          defaultValue={(settings.income_tax_rate * 100).toFixed(2)}
          hint="Ask your accountant what to put here. It only drives an estimate."
        />
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Financial year starts</span>
          <select
            name="financial_year_start_month"
            defaultValue={settings.financial_year_start_month}
            className={FIELD}
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                1 {month}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            name="prices_include_gst"
            defaultChecked={settings.prices_include_gst}
            className="h-4 w-4 accent-bronze"
          />
          <span className="text-sm text-sand/80">Quote prices include GST by default</span>
        </label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[0.68rem] tracking-[0.16em] text-stone-light uppercase">
          Working week
        </legend>
        <div className="sm:col-span-2">
          <span className={LABEL}>Days you work</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {DAYS.map(([value, label]) => (
              <label
                key={value}
                className="flex items-center gap-2 rounded-full border border-stone/25 px-3.5 py-2 text-sm text-sand/80"
              >
                <input
                  type="checkbox"
                  name="working_days"
                  value={value}
                  defaultChecked={settings.working_days.includes(value)}
                  className="h-3.5 w-3.5 accent-bronze"
                />
                {label}
              </label>
            ))}
          </div>
          <p className="mt-2 text-[0.68rem] text-stone">
            Days outside this show as unavailable to customers unless you open
            them by hand on the calendar.
          </p>
        </div>
        <Text label="Start time" name="working_hours_start" type="time" defaultValue={settings.working_hours_start.slice(0, 5)} />
        <Text label="Finish time" name="working_hours_end" type="time" defaultValue={settings.working_hours_end.slice(0, 5)} />
        <Text
          label="Jobs at once"
          name="daily_capacity"
          type="number"
          defaultValue={settings.daily_capacity}
          hint="Below this a day reads as limited; at it, fully booked."
        />
        <Text
          label="Default deposit (%)"
          name="default_deposit_pct"
          type="number"
          defaultValue={(settings.default_deposit_pct * 100).toFixed(1)}
        />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-3 text-[0.68rem] tracking-[0.16em] text-stone-light uppercase">
          Notifications
        </legend>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Who gets notified</span>
          <input
            name="notification_emails"
            defaultValue={settings.notification_emails.join(", ")}
            placeholder="you@kaburatiling.com.au, office@…"
            className={FIELD}
          />
          <span className="text-[0.68rem] text-stone">
            Comma separated. New quotes and booking requests go to these
            addresses.
          </span>
        </label>
      </fieldset>

      {state.error ? (
        <p role="alert" className="text-sm text-bronze-light">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm text-emerald-300">
          Saved. The public calendar follows on its next load.
        </p>
      ) : null}

      <div>
        <Save />
      </div>
    </form>
  );
}
