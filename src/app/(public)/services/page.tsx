import { Suspense } from "react";
import type { Metadata } from "next";
import { ServiceDirectory } from "@/components/property/ServiceDirectory";

export const metadata: Metadata = {
  title: "Local Service Providers | NextHome",
  description: "Find verified electricians, plumbers, mechanics, and other trades on NextHome.",
};

// Dedicated Services route — service content only, no property listings.
// The page shell (eyebrow / heading / intro) stays a server component; the
// category filter and provider grid live in ServiceDirectory because they
// need client state.
export default function ServiceDirectoryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="border-b border-[var(--color-border-hairline)] pb-8">
        <p className="u-label text-[var(--color-brand-primary-text)]">Services</p>
        <h1 className="u-display mt-3 max-w-xl text-[2.25rem] text-[var(--color-text-primary)] sm:text-5xl">
          A home is more than the keys.
        </h1>
        <p className="mt-4 max-w-lg text-[var(--color-text-secondary)]">
          Electricians, plumbers, mechanics and other trades — verified the same way our landlords are,
          and ready to help.
        </p>
      </div>

      {/* useSearchParams needs a Suspense boundary in the App Router —
          without it the build fails when prerendering this page. */}
      <Suspense fallback={null}>
        <ServiceDirectory />
      </Suspense>
    </div>
  );
}
