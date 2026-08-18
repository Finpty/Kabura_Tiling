"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SelectField, TextArea, TextField } from "./Field";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { QUOTE_SERVICE_OPTIONS } from "@/lib/services";
import {
  BUILD_TYPE_OPTIONS,
  EMPTY_DRAFT,
  MAX_FILES,
  START_TIMING_OPTIONS,
  TILE_SIZE_OPTIONS,
  validateAll,
  validateFile,
  validateStep,
  type FieldErrors,
  type QuoteDraft,
} from "@/lib/quote-schema";
import { site, hasEmail } from "@/lib/site";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn, formatBytes } from "@/lib/utils";

const STEPS = [
  { title: "What do you need?", hint: "Pick the closest match — we'll sort the detail out later." },
  { title: "Where is the project?", hint: "So we know whether we can get there." },
  { title: "Tell us about the project", hint: "Rough numbers are fine." },
  { title: "Upload photos", hint: "The single most useful thing you can send us." },
  { title: "Contact information", hint: "How we get the quote back to you." },
];

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Five-step quote wizard.
 *
 * Behaviour worth noting:
 *  - Validation runs per step, so nobody reaches step five to be told step two
 *    was wrong. The same module validates again on the server.
 *  - Each step moves focus to its heading, and errors are announced, so the flow
 *    is usable with a screen reader and by keyboard alone.
 *  - Images are previewed from object URLs which are revoked on removal.
 *  - A hidden honeypot field catches the most common form spam at zero cost to
 *    real visitors.
 *  - If Supabase is not configured the wizard says so plainly and offers a
 *    mailto fallback rather than silently throwing the enquiry away.
 */
export function QuoteWizard({ enabled }: { enabled: boolean }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<QuoteDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string>();
  const [status, setStatus] = useState<Status>("idle");
  const [reference, setReference] = useState<string>();
  const [serverError, setServerError] = useState<string>();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const reduced = usePrefersReducedMotion();
  const isLast = step === STEPS.length - 1;

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const preview of previews) URL.revokeObjectURL(preview.url);
    };
  }, [previews]);

  useEffect(() => {
    if (status === "idle") headingRef.current?.focus();
  }, [step, status]);

  const set = useCallback(
    <K extends keyof QuoteDraft>(field: K, value: QuoteDraft[K]) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    [],
  );

  const next = () => {
    const stepErrors = validateStep(step, draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFileError(undefined);
    const incoming = Array.from(list);

    for (const file of incoming) {
      const message = validateFile(file);
      if (message) {
        setFileError(message);
        return;
      }
    }
    setFiles((current) => {
      const merged = [...current, ...incoming];
      if (merged.length > MAX_FILES) {
        setFileError(`You can attach up to ${MAX_FILES} photos.`);
        return merged.slice(0, MAX_FILES);
      }
      return merged;
    });
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index));
    setFileError(undefined);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const allErrors = validateAll(draft);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      const firstBad = Object.keys(allErrors)[0] as keyof QuoteDraft;
      const target = [
        ["service"],
        ["suburb", "postcode"],
        ["approxSqm", "tileSize", "buildType", "startTiming", "description"],
        [],
        ["name", "phone", "email"],
      ].findIndex((fields) => fields.includes(firstBad));
      if (target >= 0) setStep(target);
      return;
    }

    setStatus("submitting");
    setServerError(undefined);

    try {
      const body = new FormData();
      for (const [key, value] of Object.entries(draft)) {
        body.append(key, value ?? "");
      }
      for (const file of files) body.append("photos", file);

      const response = await fetch("/api/quote", { method: "POST", body });
      const payload = (await response.json()) as {
        ok?: boolean;
        reference?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "We couldn't send that through.");
      }

      setReference(payload.reference);
      setStatus("success");
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "We couldn't send that through.",
      );
      setStatus("error");
    }
  };

  /* ------------------------------------------------------------------ */

  if (status === "success") {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-bronze-light">Received</p>
        <h2 className="mt-6 font-display text-headline text-bone">
          Thanks — we&rsquo;ve got it.
        </h2>
        <p className="mt-6 text-lead text-sand/80">
          Your enquiry is with us and we&rsquo;ll be in touch to arrange the
          next step.
        </p>
        {reference ? (
          <p className="mt-6 inline-block rounded-full border border-stone/30 px-5 py-2.5 text-sm text-sand">
            Reference{" "}
            <span className="font-medium text-bone tabular-nums">
              {reference}
            </span>
          </p>
        ) : null}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/projects"
            className="inline-flex h-12 items-center rounded-full border border-stone/40 px-7 text-[0.76rem] font-semibold tracking-[0.16em] text-bone uppercase transition-colors hover:border-bronze-light hover:text-bronze-light"
          >
            View our work
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-full bg-bone px-7 text-[0.76rem] font-semibold tracking-[0.16em] text-ink uppercase transition-colors hover:bg-paper"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-3xl">
      {/* Progress */}
      <ol className="flex items-center gap-2" aria-label="Quote progress">
        {STEPS.map((item, index) => (
          <li key={item.title} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-medium tabular-nums transition-colors duration-500",
                index < step && "border-bronze-light bg-bronze-light text-ink",
                index === step && "border-bronze-light text-bronze-light",
                index > step && "border-stone/30 text-stone",
              )}
              aria-current={index === step ? "step" : undefined}
            >
              {index < step ? (
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
                  <path d="m2 6 3 3 5-6" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              ) : (
                index + 1
              )}
              <span className="sr-only">
                {index < step
                  ? `${item.title}, complete`
                  : index === step
                    ? `${item.title}, current step`
                    : item.title}
              </span>
            </span>
            {index < STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className="relative h-px flex-1 bg-stone/25"
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 origin-left bg-bronze-light transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    index < step ? "w-full scale-x-100" : "w-full scale-x-0",
                  )}
                />
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-12">
        <p className="eyebrow text-bronze-light">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 font-display text-headline text-bone outline-none"
        >
          {STEPS[step].title}
        </h2>
        <p className="mt-3 text-sand/65">{STEPS[step].hint}</p>
      </div>

      {!enabled ? (
        <PlaceholderNotice className="mt-8">
          The quote pipeline is not connected yet — Supabase environment
          variables have not been set, so submissions cannot be stored.
          {hasEmail() ? (
            <>
              {" "}
              In the meantime, email{" "}
              <a className="link-underline text-bone" href={`mailto:${site.email}`}>
                {site.email}
              </a>
              .
            </>
          ) : (
            " Add the credentials from .env.example to switch it on."
          )}
        </PlaceholderNotice>
      ) : null}

      {/* Honeypot — visually hidden, never announced, never focusable */}
      <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0">
        <label htmlFor="kb-company">Company</label>
        <input
          id="kb-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={draft.company ?? ""}
          onChange={(event) => set("company", event.target.value)}
        />
      </div>

      <div className="mt-10 min-h-[22rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduced ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 ? (
              <fieldset className="border-0 p-0">
                <legend className="sr-only">What do you need?</legend>
                {errors.service ? (
                  <p role="alert" className="mb-4 text-sm text-bronze-light">
                    {errors.service}
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {QUOTE_SERVICE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => set("service", option.value)}
                      aria-pressed={draft.service === option.value}
                      className={cn(
                        "rounded-sm border px-4 py-5 text-left text-sm font-medium transition-colors duration-300",
                        draft.service === option.value
                          ? "border-bronze-light bg-bronze-light/12 text-bronze-light"
                          : "border-stone/30 text-sand/75 hover:border-stone/60 hover:text-bone",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField
                  label="Suburb"
                  name="suburb"
                  autoComplete="address-level2"
                  placeholder="e.g. Baldivis"
                  value={draft.suburb}
                  error={errors.suburb}
                  onChange={(event) => set("suburb", event.target.value)}
                />
                <TextField
                  label="Postcode"
                  name="postcode"
                  optional
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="e.g. 6171"
                  maxLength={4}
                  value={draft.postcode}
                  error={errors.postcode}
                  onChange={(event) => set("postcode", event.target.value)}
                />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField
                  label="Approximate square metres"
                  name="approxSqm"
                  optional
                  inputMode="decimal"
                  placeholder="e.g. 18"
                  value={draft.approxSqm}
                  hint="A rough estimate is fine."
                  onChange={(event) => set("approxSqm", event.target.value)}
                />
                <SelectField
                  label="Tile size"
                  name="tileSize"
                  optional
                  options={TILE_SIZE_OPTIONS}
                  value={draft.tileSize}
                  onChange={(event) => set("tileSize", event.target.value)}
                />
                <SelectField
                  label="New build or renovation"
                  name="buildType"
                  optional
                  options={BUILD_TYPE_OPTIONS}
                  value={draft.buildType}
                  onChange={(event) => set("buildType", event.target.value)}
                />
                <SelectField
                  label="Desired start time"
                  name="startTiming"
                  optional
                  options={START_TIMING_OPTIONS}
                  value={draft.startTiming}
                  onChange={(event) => set("startTiming", event.target.value)}
                />
                <TextArea
                  label="Project description"
                  name="description"
                  optional
                  className="sm:col-span-2"
                  placeholder="What's the room, what's there now, and what are you hoping to end up with?"
                  value={draft.description}
                  error={errors.description}
                  onChange={(event) => set("description", event.target.value)}
                />
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <label
                  htmlFor="quote-photos"
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-stone/40 px-6 py-14 text-center transition-colors duration-300 hover:border-bronze-light"
                >
                  <svg viewBox="0 0 24 24" className="h-7 w-7 text-bronze-light" fill="none" aria-hidden="true">
                    <path d="M12 16V4m0 0L7 9m5-5 5 5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span className="text-bone">Add photos of the space</span>
                  <span className="text-xs text-stone">
                    JPEG, PNG, WebP or HEIC · up to {MAX_FILES} photos · 10 MB each
                  </span>
                </label>
                <input
                  id="quote-photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />

                {fileError ? (
                  <p role="alert" className="mt-4 text-sm text-bronze-light">
                    {fileError}
                  </p>
                ) : null}

                {previews.length > 0 ? (
                  <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {previews.map((preview, index) => (
                      <li key={preview.url} className="relative">
                        <span className="relative block aspect-square overflow-hidden rounded-sm bg-charcoal-2">
                          <Image
                            src={preview.url}
                            alt=""
                            fill
                            unoptimized
                            sizes="140px"
                            className="object-cover"
                          />
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full border border-stone/40 bg-ink text-bone transition-colors hover:border-bronze-light hover:text-bronze-light"
                        >
                          <span className="sr-only">
                            Remove {preview.file.name}
                          </span>
                          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
                            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" />
                          </svg>
                        </button>
                        <span className="mt-1.5 block truncate text-[0.65rem] text-stone">
                          {formatBytes(preview.file.size)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-6 text-sm text-stone">
                    Photos are optional, but they make the quote far more
                    accurate. You can skip this step.
                  </p>
                )}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField
                  label="Name"
                  name="name"
                  autoComplete="name"
                  value={draft.name}
                  error={errors.name}
                  onChange={(event) => set("name", event.target.value)}
                />
                <TextField
                  label="Phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={draft.phone}
                  error={errors.phone}
                  onChange={(event) => set("phone", event.target.value)}
                />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  className="sm:col-span-2"
                  value={draft.email}
                  error={errors.email}
                  onChange={(event) => set("email", event.target.value)}
                />
                <p className="text-xs leading-relaxed text-stone sm:col-span-2">
                  Your details are used to prepare and send your quote. See our{" "}
                  <Link href="/privacy" className="link-underline text-sand">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {serverError ? (
        <p role="alert" className="mt-6 text-sm text-bronze-light">
          {serverError}
        </p>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-stone/18 pt-8">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="text-[0.76rem] font-semibold tracking-[0.16em] text-sand/70 uppercase transition-colors hover:text-bone disabled:pointer-events-none disabled:opacity-35"
        >
          ← Back
        </button>

        {isLast ? (
          <MagneticButton
            type="submit"
            variant="bronze"
            size="lg"
            disabled={status === "submitting" || !enabled}
            withArrow
          >
            {status === "submitting" ? "Sending…" : "Request My Free Quote"}
          </MagneticButton>
        ) : (
          <MagneticButton type="button" onClick={next} variant="solid" size="lg">
            Continue
          </MagneticButton>
        )}
      </div>
    </form>
  );
}
