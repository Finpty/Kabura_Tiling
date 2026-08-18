"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-ink px-6 text-center">
      <Link href="/" className="text-bone">
        <Logo />
      </Link>
      <p className="eyebrow mt-16 text-bronze-light">Something went wrong</p>
      <h1 className="mt-5 max-w-2xl font-display text-headline text-bone">
        We hit a problem loading that.
      </h1>
      <p className="mt-5 max-w-md text-lead text-sand/70">
        Try again — and if it keeps happening, the quote form is the surest way
        to reach us.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-12 items-center rounded-full bg-bone px-7 text-[0.76rem] font-semibold tracking-[0.16em] text-ink uppercase transition-colors hover:bg-paper"
        >
          Try again
        </button>
        <Link
          href="/quote"
          className="inline-flex h-12 items-center rounded-full border border-stone/40 px-7 text-[0.76rem] font-semibold tracking-[0.16em] text-bone uppercase transition-colors hover:border-bronze-light hover:text-bronze-light"
        >
          Request a quote
        </Link>
      </div>
    </main>
  );
}
