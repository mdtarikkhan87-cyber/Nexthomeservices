import { ListingType } from "./types";
import { modeFromParam } from "./listings-mode";

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * Builds the /listings URL that an old /rent, /buy or /search link should land
 * on, keeping the filters it carried.
 *
 * Shared by all three shims so they cannot drift into forwarding different
 * subsets of the query string — which is the usual way a "harmless" redirect
 * quietly loses a filter and makes the destination look broken.
 *
 * `fallbackMode` is the mode implied by the route itself (/rent, /buy). An
 * explicit ?mode= in the URL still wins, since /search's own links carry one.
 */
export function forwardListingParams(params: RawParams, fallbackMode?: ListingType): string {
  const forwarded = new URLSearchParams();

  // The full filter vocabulary lib/listing-filters.ts encodes — not just the
  // four the previous shim happened to forward.
  for (const key of [
    "state",
    "price",
    "bedrooms",
    "baths",
    "ptype",
    "furnishing",
    "amenities",
    "verified",
    "duration",
    "sort",
  ] as const) {
    const value = first(params[key]);
    if (value) forwarded.set(key, value);
  }

  forwarded.set("mode", modeFromParam(first(params.mode) ?? null) ?? fallbackMode ?? "rent");

  return `/listings?${forwarded.toString()}`;
}
