"use client";

import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { useAuth } from "@/lib/auth-context";
import { Reveal } from "./Reveal";

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
    "inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-brand-primary)] px-6 text-sm font-bold text-white transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-brand-primary-hover)]";

  return (
    <section className="bg-[var(--color-surface-base)] py-12 md:py-20">
      <Container>
        <Reveal>
          <div className="flex flex-col gap-8 rounded-3xl bg-[var(--color-surface-raised)] p-8 shadow-[var(--elevation-card)] md:flex-row md:items-center md:justify-between md:p-12">
            <div>
              <h2 className="u-heading max-w-sm text-3xl text-[var(--color-text-primary)] sm:text-4xl">
                Ready to find your next home?
              </h2>
              <p className="mt-3 max-w-md text-base text-[var(--color-text-body)]">
                {isAuthenticated
                  ? "Every listing is reviewed by our team before it goes live."
                  : "Browse every listing for free. A free account unlocks full property details, messaging and saved homes."}
              </p>
            </div>
            {/* One action, by who is reading: "Browse listings" is not repeated here
                (the search card, the nav and the sections above already cover it).
                A signed-in non-landlord has no action to take, so no button. */}
            {(isActingLandlord || !isAuthenticated) && (
              <div className="flex shrink-0 flex-wrap gap-2.5">
                {isActingLandlord ? (
                  <Link href="/dashboard/listings/new" className={primary}>
                    List a property
                  </Link>
                ) : (
                  <Link href="/register" className={primary}>
                    Create a free account
                  </Link>
                )}
              </div>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
