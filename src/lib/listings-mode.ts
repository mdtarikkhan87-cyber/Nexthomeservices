import { ListingType } from "./types";

// ---------------------------------------------------------------------------
// Buy/Rent mode for the merged /listings page.
//
// Website Revision Spec §3C: "Buy and Rent merge into a single Listings page —
// one URL, not two separate pages", with "a toggle control, not tabs and not
// separate routes", whose "state is remembered for the user for the duration
// of their visit/session rather than resetting on every navigation".
//
// That last clause is why this is a module and not just useState: the mode has
// to survive navigating to a listing and back, so it lives in sessionStorage —
// tab-scoped, cleared when the visit ends, which is exactly "the duration of
// their visit". Precedence when the page loads:
//
//   1. ?mode= in the URL   — an explicit, shareable intent always wins
//   2. sessionStorage      — what this visitor last chose
//   3. DEFAULT_MODE        — first visit
// ---------------------------------------------------------------------------

const MODE_KEY = "nexthome:listings-mode";

/**
 * OPEN ITEM (Website Revision Spec §4, item 4 — "whether a first-time
 * visitor's Listings page should default to Buy or Rent" is not yet
 * confirmed).
 *
 * "rent" is used as the interim default, and it is a continuation rather than
 * a new guess: the previous /search page already defaulted to rent whenever no
 * mode was given, the rental catalog is the larger side of the mock data, and
 * NextHome's PRD leads with rental. Isolated here as a single named constant
 * so confirming the client's answer is a one-line change, not a hunt.
 */
export const DEFAULT_MODE: ListingType = "rent";

export function isListingMode(value: unknown): value is ListingType {
  return value === "rent" || value === "sale";
}

export function readStoredMode(): ListingType | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(MODE_KEY);
    return isListingMode(stored) ? stored : null;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The toggle
    // still works, it just forgets between navigations — degraded, not broken.
    return null;
  }
}

// sessionStorage fires no event for writes made by the same tab, so the store
// keeps its own subscriber list. This exists so React can read the remembered
// mode through useSyncExternalStore — which is the SSR-safe way to read a
// browser-only store: the server snapshot is null, the client snapshot is the
// real value, and React reconciles the two itself instead of us papering over
// it with a post-mount setState (a cascading render, and one the React
// Compiler rightly rejects).
const listeners = new Set<() => void>();

export function subscribeStoredMode(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** Server snapshot: no session storage exists, so nothing is remembered. Must
    be a stable reference — returning a fresh object here would loop. */
export function serverStoredMode(): ListingType | null {
  return null;
}

export function writeStoredMode(mode: ListingType) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(MODE_KEY, mode);
  } catch {
    /* non-fatal — see readStoredMode */
  }
  listeners.forEach((l) => l());
}

/** Normalises the `?mode=` param, which may arrive as "sale", "buy", or absent. */
export function modeFromParam(value: string | null): ListingType | null {
  if (value === "sale" || value === "buy") return "sale";
  if (value === "rent") return "rent";
  return null;
}

export const MODE_COPY: Record<
  ListingType,
  { label: string; eyebrow: string; heading: string; intro: string }
> = {
  rent: {
    label: "Rent",
    eyebrow: "For rent",
    heading: "Homes to rent",
    intro:
      "Verified rental homes, reviewed by our team before they go live. Filter by state, budget, bedrooms, and rental duration.",
  },
  sale: {
    label: "Buy",
    eyebrow: "For sale",
    heading: "Homes to buy",
    intro:
      "Verified homes available to buy, reviewed by our team before they go live. Filter by state, budget, and bedrooms.",
  },
};
