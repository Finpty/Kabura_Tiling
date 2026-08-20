"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type ActionState } from "@/app/admin/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 h-12 w-full rounded-full bg-bronze text-[0.76rem] font-semibold tracking-[0.16em] text-paper uppercase transition-colors hover:bg-bronze-light hover:text-ink disabled:opacity-50"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(signIn, {});

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      {/* Where they were headed before the redirect. Validated server-side —
          the action refuses anything that is not an in-app /admin path. */}
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div className="flex flex-col gap-2">
        <label htmlFor="admin-email" className="eyebrow text-stone-light">
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="w-full rounded-sm border border-stone/30 bg-charcoal px-4 py-3 text-bone focus:border-bronze-light focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="admin-password" className="eyebrow text-stone-light">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-sm border border-stone/30 bg-charcoal px-4 py-3 text-bone focus:border-bronze-light focus:outline-none"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-bronze-light">
          {state.error}
        </p>
      ) : null}

      <Submit />

      <Link
        href="/admin/forgot-password"
        className="mt-2 text-xs text-stone transition-colors hover:text-sand"
      >
        Forgotten your password?
      </Link>
    </form>
  );
}
