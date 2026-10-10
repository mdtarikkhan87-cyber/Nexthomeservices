import type { PropertyListing } from "@/lib/types";

// The landing page's "browse by" facets, computed from the live listings the
// homepage fetches (every listing passed in is already "live").
//
// NextHome has no property-type taxonomy (see lib/types.ts), so every facet is
// built from data the catalog really has — state and rent duration — and links
// to a real pre-filtered /listings result. Nothing here advertises inventory
// that is not there.

export interface StateFacet {
  key: string;
  label: string;
  count: number;
  /** A real listing's photo from that state, for the landing-page cards
      (empty if none of that state's listings has one). */
  photoUrl: string;
  href: string;
}

export interface DurationFacet {
  key: "short-term" | "long-term";
  label: string;
  count: number;
  href: string;
}

export function browseFacets(
  listings: PropertyListing[],
  maxStates = 4
): { states: StateFacet[]; durations: DurationFacet[] } {
  const liveRentals = listings.filter((l) => l.type === "rent");

  const states = Array.from(new Set(liveRentals.map((l) => l.state)))
    .map((state) => {
      const inState = liveRentals.filter((l) => l.state === state);
      return {
        key: state,
        label: state,
        count: inState.length,
        photoUrl: inState.find((l) => l.photoUrl)?.photoUrl ?? "",
        href: `/listings?mode=rent&state=${encodeURIComponent(state)}`,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, maxStates);

  const durations = (["short-term", "long-term"] as const)
    .map((duration) => ({
      key: duration,
      label: duration === "short-term" ? "Short-Term" : "Long-Term",
      count: liveRentals.filter((l) => l.rentDuration === duration).length,
      href: `/listings?mode=rent&duration=${duration}`,
    }))
    .filter((d) => d.count > 0);

  return { states, durations };
}
