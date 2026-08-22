import { Suspense } from "react";
import type { Metadata } from "next";
import { PropertyBrowser } from "@/components/property/PropertyBrowser";

export const metadata: Metadata = {
  title: "Properties for Sale | NextHome",
  description: "Browse verified homes for sale on NextHome, reviewed by our team before they go live.",
};

// Dedicated Buy route. Uses the existing `sale` ListingType vocabulary
// internally (lib/types.ts) — only the URL and user-facing label are
// "buy", no new domain term was introduced.
export default function BuyPage() {
  return (
    <Suspense fallback={null}>
      <PropertyBrowser mode="sale" />
    </Suspense>
  );
}
