import { Suspense } from "react";
import type { Metadata } from "next";
import { ServiceDirectory } from "@/components/property/ServiceDirectory";
import { ServicesIntroCard } from "@/components/services/ServicesIntroCard";

export const metadata: Metadata = {
  title: "Local service providers | NextHome",
  description: "Find verified electricians, plumbers, mechanics, and other trades on NextHome.",
};

// Dedicated Services route — service content only, no property listings.
// The page shell (the intro card) stays a server component; the
// category filter and provider grid live in ServiceDirectory because they
// need client state.
export default function ServiceDirectoryPage() {
  return (
    <div className="mx-auto w-full max-w-[var(--width-page)] px-4 py-10 sm:px-6 sm:py-14">
      <ServicesIntroCard />

      {/* useSearchParams needs a Suspense boundary in the App Router —
          without it the build fails when prerendering this page. */}
      <div id="directory" className="mt-10 scroll-mt-24">
        <Suspense fallback={null}>
          <ServiceDirectory />
        </Suspense>
      </div>
    </div>
  );
}
