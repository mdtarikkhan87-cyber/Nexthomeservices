import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | NextHome",
  description: "NextHome's Terms of Service.",
};

// PLACEHOLDER — the real legal text has to come from the business/legal
// owner; it must not be written or guessed at in code. Replace the body
// below with the approved Terms when they exist.
export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Terms of Service</h1>
      <p className="mt-6 text-[var(--color-text-secondary)]">
        Our full Terms of Service are being finalised and will be published on this page. If you have a question
        about how NextHome works in the meantime, see our{" "}
        <Link href="/help" className="font-bold text-[var(--color-brand-primary)] hover:underline">
          Help &amp; FAQ
        </Link>{" "}
        or{" "}
        <Link href="/feedback" className="font-bold text-[var(--color-brand-primary)] hover:underline">
          send us a message
        </Link>
        .
      </p>
      <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
        See also our{" "}
        <Link href="/privacy" className="font-bold text-[var(--color-brand-primary)] hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
