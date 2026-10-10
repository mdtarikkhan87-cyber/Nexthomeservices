"use client";

import { useEffect } from "react";
import Link from "next/link";

// Catches anything thrown while rendering a route segment (including a
// failed backend fetch in a server component) so one broken page shows a
// recoverable message instead of a blank crash. The root layout and its
// providers stay mounted; global-error.tsx covers a failure in those.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Something went wrong</h1>
      <p className="mt-3 text-[var(--color-text-secondary)]">
        We hit a problem loading this page. It&rsquo;s likely temporary — try again, or head back home.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-[var(--radius-control)] bg-[var(--color-brand-primary)] px-5 py-2.5 font-bold text-white hover:bg-[var(--color-brand-primary-hover)]"
        >
          Try again
        </button>
        <Link href="/" className="font-bold text-[var(--color-brand-primary)] hover:underline">
          Go to the homepage
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-[var(--color-text-secondary)]">Reference: {error.digest}</p>
      )}
    </div>
  );
}
