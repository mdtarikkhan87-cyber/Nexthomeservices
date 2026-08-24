"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

// ---------------------------------------------------------------------------
// The homepage's closing band, made role-consistent.
//
// Website Revision Spec §3A gates "List Your Property" on the Landlord role,
// and §3B makes registration the gate on every account feature. This CTA used
// to offer anonymous visitors "Post a property" via an auth-intercept — which
// after those two changes would have been the only place on the public site
// still inviting a logged-out visitor to do a landlord's job, one section
// below a nav that had just stopped showing them that option at all.
//
// ⚠ INFERENCE, FLAGGED: §3A names the NAV specifically. Extending the same
// rule to this marketing CTA is a judgement call, made because the alternative
// is a visible inconsistency the client would read as a bug. It is a small,
// easily reverted change — the second CTA below is the only line affected.
//
// The copy also changes to match the new access model: browsing being "free
// and open" is still true and still worth saying, but the old line implied no
// account was needed "until you save, message or list", which is no longer the
// boundary — full property details need one now too.
// ---------------------------------------------------------------------------
export function ClosingCta() {
  const { isAuthenticated, activeRole } = useAuth();
  const isActingLandlord = isAuthenticated && activeRole === "landlord";

  const primary =
    "inline-flex items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand-primary)] px-5 py-3 text-sm font-bold text-white shadow-[var(--elevation-xs)] transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-brand-primary-hover)]";
  const secondary =
    "inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border-default)] px-5 py-3 text-sm font-bold text-[var(--color-text-primary)] transition-colors duration-[var(--motion-duration-short)] hover:border-[var(--color-deep-blue)]";

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="flex flex-col gap-6 border-t border-[var(--color-border-hairline)] pt-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="u-heading max-w-sm text-2xl text-[var(--color-text-primary)] sm:text-3xl">
            Ready to find your next home?
          </h2>
          <p className="u-ui mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">
            {isAuthenticated
              ? "Every listing is reviewed by our team before it goes live."
              : "Browse every listing for free. A free account unlocks full property details, messaging and saved homes."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <Link href="/listings" className={primary}>
            Browse listings
          </Link>

          {isActingLandlord ? (
            <Link href="/dashboard/listings/new" className={secondary}>
              List a property
            </Link>
          ) : !isAuthenticated ? (
            <Link href="/register" className={secondary}>
              Create a free account
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
