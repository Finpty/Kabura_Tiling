"use client";

import { useState } from "react";
import { AvailabilityCalendar } from "@/components/quote/AvailabilityCalendar";
import { SERVICES } from "@/lib/services";
import { centreBlock, centreText } from "@/lib/align";
import { cn } from "@/lib/utils";

/**
 * Pick an open date, ask for it.
 *
 * ── What submitting actually does ───────────────────────────────────────────
 * It creates a booking REQUEST — a row an admin approves in the portal before
 * anything is held. The customer is told exactly that, twice: under the button
 * before they send, and in the confirmation after. Two people can ask for the
 * same Tuesday; the portal is where one of them gets it, which is what makes
 * double-booking impossible rather than merely unlikely.
 *
 * The calendar is the same component the quote form uses, reading the same
 * aggregate endpoint — a date and one word per day. Nothing about who or what
 * is on a booked day ever reaches this page.
 */

const FIELD =
  "w-full rounded-lg border border-stone/25 bg-charcoal px-4 py-3 text-sm text-bone placeholder:text-stone focus:border-bronze-light focus:outline-none";
const LABEL = "block text-[0.62rem] tracking-[0.14em] text-stone uppercase";

const LONG_DATE = new Intl.DateTimeFormat("en-AU", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const prettyDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return LONG_DATE.format(new Date(y, (m ?? 1) - 1, d ?? 1, 12));
};

type Phase =
  | { name: "filling" }
  | { name: "sending" }
  | { name: "sent"; reference: string | null }
  | { name: "failed"; message: string };

export function RequestDate() {
  const [date, setDate] = useState("");
  const [phase, setPhase] = useState<Phase>({ name: "filling" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date || phase.name === "sending") return;

    const form = new FormData(event.currentTarget);
    setPhase({ name: "sending" });

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email"),
          suburb: form.get("suburb"),
          service: form.get("service"),
          approxSize: form.get("approxSize"),
          message: form.get("message"),
          quoteReference: form.get("quoteReference"),
          requestedDate: date,
          sourcePath: "/book",
        }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        reference?: string | null;
        error?: string;
      };
      if (!response.ok || !body.ok) {
        setPhase({
          name: "failed",
          message:
            body.error ?? "That didn't send. Please try again or call us.",
        });
        return;
      }
      setPhase({ name: "sent", reference: body.reference ?? null });
    } catch {
      setPhase({
        name: "failed",
        message: "That didn't send. Please check your connection and try again.",
      });
    }
  }

  if (phase.name === "sent") {
    return (
      <div className={cn("max-w-xl", centreText, centreBlock)}>
        <p className="font-display text-2xl text-bone md:text-3xl">
          Request received.
        </p>
        <p className="mt-4 text-lead text-sand/80">
          You have asked for <strong className="text-bone">{prettyDate(date)}</strong>.
        </p>
        {phase.reference ? (
          <p className="mt-3 text-sm text-sand/70">
            Your reference is{" "}
            <code className="rounded bg-charcoal px-2 py-1 text-bronze-light">
              {phase.reference}
            </code>
            .
          </p>
        ) : null}
        <p className="mt-6 border-l border-bronze/50 bg-bronze/[0.06] px-4 py-3 text-left text-sm leading-relaxed text-sand">
          This is a request, not a confirmed booking. We check the diary and
          come back to you — usually the same day — to confirm the date or
          offer the nearest one that works.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
      <div>
        <AvailabilityCalendar value={date} onChange={setDate} />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div
          aria-live="polite"
          className="rounded-lg border border-stone/20 bg-charcoal/40 px-4 py-3 text-sm text-sand/80"
        >
          {date ? (
            <>
              Asking for{" "}
              <strong className="text-bone">{prettyDate(date)}</strong>
            </>
          ) : (
            "Pick an available day on the calendar first."
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Name</span>
            <input name="name" required autoComplete="name" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Phone</span>
            <input name="phone" type="tel" required autoComplete="tel" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Email</span>
            <input name="email" type="email" required autoComplete="email" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Suburb</span>
            <input name="suburb" required className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Service</span>
            <select name="service" defaultValue="" className={FIELD}>
              <option value="">Not sure yet</option>
              {SERVICES.map((service) => (
                <option key={service.slug} value={service.title}>
                  {service.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Rough size</span>
            <input
              name="approxSize"
              placeholder="e.g. one bathroom, 40 m²"
              className={FIELD}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Anything else</span>
          <textarea name="message" rows={3} className={FIELD} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Quote reference, if you have one</span>
          <input name="quoteReference" placeholder="KB-…" className={FIELD} />
        </label>

        {phase.name === "failed" ? (
          <p role="alert" className="text-sm text-bronze-light">
            {phase.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!date || phase.name === "sending"}
          className="mt-2 h-13 rounded-full bg-bronze px-8 text-[0.76rem] font-semibold tracking-[0.16em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {phase.name === "sending" ? "Sending…" : "Request this date"}
        </button>
        <p className="text-xs leading-relaxed text-stone">
          This sends a request, not a confirmed booking — we confirm every date
          personally before it is locked in, so no one is ever double-booked.
        </p>
      </form>
    </div>
  );
}
