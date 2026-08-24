import { redirect } from "next/navigation";
import { forwardListingParams } from "@/lib/listing-redirect";

// COMPATIBILITY SHIM — the oldest of the three. This route was the original
// combined Rent/Buy page (`/search?mode=rent|sale`), then became a shim onto
// /rent and /buy, and now forwards to the merged /listings page. Its own
// ?mode= param is already in the right vocabulary, so it is simply honoured.
export default async function SearchRedirectPage({ searchParams }: PageProps<"/search">) {
  redirect(forwardListingParams(await searchParams));
}
