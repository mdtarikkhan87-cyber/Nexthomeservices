import { redirect } from "next/navigation";
import { forwardListingParams } from "@/lib/listing-redirect";

// COMPATIBILITY SHIM (Website Revision Spec §3C) — see rent/page.tsx for the
// reasoning. `sale` is the internal ListingType; only the URL and the
// user-facing label were ever "buy".
export default async function BuyRedirectPage({ searchParams }: PageProps<"/buy">) {
  redirect(forwardListingParams(await searchParams, "sale"));
}
