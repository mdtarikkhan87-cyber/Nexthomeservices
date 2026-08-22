import { Suspense } from "react";
import type { Metadata } from "next";
import { PropertyBrowser } from "@/components/property/PropertyBrowser";

export const metadata: Metadata = {
  title: "Properties for Rent | NextHome",
  description: "Browse verified rental homes on NextHome, reviewed by our team before they go live.",
};

// Dedicated Rent route. Mode is fixed by the route, not by a query string
// or in-page toggle — the shared browser UI lives in PropertyBrowser so
// this and /buy stay a single implementation.
export default function RentPage() {
  return (
    <Suspense fallback={null}>
      <PropertyBrowser mode="rent" />
    </Suspense>
  );
}
