import { Suspense } from "react";
import type { Metadata } from "next";
import { PropertyBrowser } from "@/components/property/PropertyBrowser";

// The single Listings route (Website Revision Spec §3C). /rent and /buy are
// now redirect shims onto this page's ?mode= param — see their route files.
//
// The metadata is deliberately mode-neutral. Mode is client state, so it
// cannot be read here to produce a mode-specific title, and inventing one
// would mean every shared /listings link claimed to be about renting.
export const metadata: Metadata = {
  title: "Listings — Homes to Rent and Buy | NextHome",
  description:
    "Browse verified homes to rent or buy on NextHome, reviewed by our team before they go live. Switch between renting and buying with one toggle.",
};

export default function ListingsPage() {
  return (
    <Suspense fallback={null}>
      <PropertyBrowser />
    </Suspense>
  );
}
