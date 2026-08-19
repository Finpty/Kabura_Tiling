"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type BaseProps = {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
};

/** Shared label/hint/error scaffolding, wired up with aria-describedby. */
function Wrapper({
  label,
  error,
  hint,
  optional,
  className,
  id,
  children,
}: BaseProps & { id: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="eyebrow text-stone-light">
        {label}
        {optional ? (
          <span className="ml-2 normal-case tracking-normal text-stone/70">
            (optional)
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-stone">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-bronze-light">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const control =
  "w-full rounded-sm border bg-ink/60 px-4 py-3.5 text-bone placeholder:text-stone/60 transition-colors duration-300 focus:outline-none focus-visible:border-bronze-light";

export function TextField({
  label,
  error,
  hint,
  optional,
  className,
  ...props
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Wrapper
      label={label}
      error={error}
      hint={hint}
      optional={optional}
      className={className}
      id={id}
    >
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(control, error ? "border-bronze" : "border-stone/30")}
        {...props}
      />
    </Wrapper>
  );
}

export function TextArea({
  label,
  error,
  hint,
  optional,
  className,
  ...props
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Wrapper
      label={label}
      error={error}
      hint={hint}
      optional={optional}
      className={className}
      id={id}
    >
      <textarea
        id={id}
        rows={5}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(control, "resize-y", error ? "border-bronze" : "border-stone/30")}
        {...props}
      />
    </Wrapper>
  );
}

export function SelectField({
  label,
  error,
  hint,
  optional,
  className,
  options,
  ...props
}: BaseProps & {
  options: readonly string[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Wrapper
      label={label}
      error={error}
      hint={hint}
      optional={optional}
      className={className}
      id={id}
    >
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          control,
          "appearance-none bg-[length:14px] bg-[right_1rem_center] bg-no-repeat pr-10",
          error ? "border-bronze" : "border-stone/30",
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238b8177' stroke-width='1.4'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}
