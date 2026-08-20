"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  requestPasswordReset,
  updatePassword,
  type ActionState,
} from "@/app/admin/actions";

const FIELD =
  "w-full rounded-sm border border-stone/30 bg-charcoal px-4 py-3 text-bone focus:border-bronze-light focus:outline-none";

function Submit({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 h-12 w-full rounded-full bg-bronze text-[0.76rem] font-semibold tracking-[0.16em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink disabled:opacity-50"
    >
      {pending ? busy : idle}
    </button>
  );
}

/**
 * Asks for a reset link.
 *
 * The success message is deliberately the same whether or not the address has
 * an account — see the action. It says "if" on purpose.
 */
export function ForgotPasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.ok) {
    return (
      <div className="mt-8">
        <p className="border-l border-bronze/50 bg-bronze/[0.06] px-4 py-3 text-sm leading-relaxed text-sand">
          If that address has an account, a reset link is on its way. It expires
          shortly, so use it soon.
        </p>
        <Link
          href="/admin/login"
          className="mt-8 inline-block text-xs text-stone transition-colors hover:text-sand"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="reset-email" className="eyebrow text-stone-light">
          Email
        </label>
        <input
          id="reset-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className={FIELD}
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-bronze-light">
          {state.error}
        </p>
      ) : null}
      <Submit idle="Send reset link" busy="Sending…" />
      <Link
        href="/admin/login"
        className="mt-4 text-xs text-stone transition-colors hover:text-sand"
      >
        ← Back to sign in
      </Link>
    </form>
  );
}

/** Sets a new password. Only works while holding the recovery session. */
export function ResetPasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(
    updatePassword,
    {},
  );

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="new-password" className="eyebrow text-stone-light">
          New password
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          className={FIELD}
        />
        <p className="text-xs text-stone">
          At least 12 characters. A short phrase you can remember beats a short
          jumble you cannot.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm-password" className="eyebrow text-stone-light">
          Confirm
        </label>
        <input
          id="confirm-password"
          name="confirm"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          className={FIELD}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-bronze-light">
          {state.error}
        </p>
      ) : null}
      <Submit idle="Set password" busy="Saving…" />
    </form>
  );
}
