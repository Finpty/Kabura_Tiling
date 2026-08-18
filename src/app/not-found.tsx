import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-ink px-6 text-center">
      <Link href="/" className="text-bone">
        <Logo />
      </Link>
      <p className="eyebrow mt-16 text-bronze-light">404</p>
      <h1 className="mt-5 max-w-2xl font-display text-headline text-bone">
        That page isn&rsquo;t here.
      </h1>
      <p className="mt-5 max-w-md text-lead text-sand/70">
        It may have moved, or the link may be out of date.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-full bg-bone px-7 text-[0.76rem] font-semibold tracking-[0.16em] text-ink uppercase transition-colors hover:bg-paper"
        >
          Back to home
        </Link>
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
