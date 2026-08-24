import { redirect } from "next/navigation";
import { forwardListingParams } from "@/lib/listing-redirect";

// COMPATIBILITY SHIM (Website Revision Spec §3C).
//
// /rent was a real route until the Buy/Rent merge; every existing link,
// bookmark, shared URL and search-engine result pointing at it still has to
// land somewhere correct. It forwards to the merged /listings page with the
// mode pre-selected and its filters intact, rather than 404-ing or silently
// dropping the user on an unfiltered page.
//
// Kept as a redirect rather than deleted deliberately: deleting the route is
// the one version of "merge the pages" that breaks things outside our control.
export default async function RentRedirectPage({ searchParams }: PageProps<"/rent">) {
  redirect(forwardListingParams(await searchParams, "rent"));
}
