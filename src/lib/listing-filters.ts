import {
  Amenity,
  AMENITY_LABELS,
  FURNISHING_LABELS,
  FurnishingStatus,
  ListingType,
  PROPERTY_TYPE_LABELS,
  PropertyListing,
  PropertyType,
} from "./types";
import { isLgaInState } from "./nigeria-locations";

// ---------------------------------------------------------------------------
// One place that owns filtering: the shape, the URL encoding, the predicate,
// the sort, and the "what is currently active" summary.
//
// This is deliberately NOT inside PropertyBrowser. The same rules have to be
// applied by the desktop sidebar and the mobile drawer, reflected in the
// active-filter chips, and round-tripped through the URL so a filtered view
// stays shareable and survives a reload. Duplicating any of that per surface
// is how filter systems drift into disagreeing with themselves.
// ---------------------------------------------------------------------------

export type SortKey = "recent" | "price-asc" | "price-desc" | "views";

/**
 * Human-readable label for ANY "min-max" price string, including ranges that
 * are not one of the predefined buckets.
 *
 * This matters because the price range arrives from the URL, which is
 * shareable and hand-editable, and because the rent and sale bucket sets are
 * different — a sale-scale range pasted onto /rent matches no bucket. Without
 * this the chip rendered the raw "0-2000000" and, worse, the Price select
 * fell back to showing "Any price" while results were in fact filtered.
 */
export function formatPriceRange(value: string): string {
  const [minStr, maxStr] = value.split("-");
  const fmt = (n: string) => `₦${new Intl.NumberFormat("en-NG").format(Number(n))}`;
  if (minStr && maxStr) return `${fmt(minStr)} – ${fmt(maxStr)}`;
  if (maxStr) return `Under ${fmt(maxStr)}`;
  if (minStr && Number(minStr) === 0) return "Any price";
  if (minStr) return `Above ${fmt(minStr)}`;
  return "Any price";
}

export interface ListingFilters {
  state: string;
  /** Local Government Area. Only meaningful with a state selected — an LGA
      name is not unique across Nigeria, so it is always scoped by its state. */
  lga: string;
  /** "min-max"; max omitted for open-ended ("2000000-"). */
  priceRange: string;
  /** Minimum, not exact — the control is labelled "2+". */
  bedrooms: string;
  bathrooms: string;
  /** Rent context only. */
  duration: string;
  propertyType: string;
  /** Rent context only. */
  furnishing: string;
  /** AND semantics: a listing must have every selected amenity. */
  amenities: Amenity[];
  verifiedOnly: boolean;
  sort: SortKey;
}

export const EMPTY_FILTERS: ListingFilters = {
  state: "",
  lga: "",
  priceRange: "",
  bedrooms: "",
  bathrooms: "",
  duration: "",
  propertyType: "",
  furnishing: "",
  amenities: [],
  verifiedOnly: false,
  sort: "recent",
};

export const SORT_LABELS: Record<SortKey, string> = {
  recent: "Most recent",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  views: "Most viewed",
};

/** Which controls make sense in which context. Furnishing and duration are
    rental concerns; showing them on /buy would be filter theatre. */
export function isRentOnlyFilter(key: keyof ListingFilters) {
  return key === "duration" || key === "furnishing";
}

// --- URL round-tripping -----------------------------------------------------
// Param names for the four pre-existing filters are unchanged (`state`,
// `price`, `bedrooms`, `duration`) so links already in the wild — the
// homepage SearchBar, the facet tiles, the /search redirect shim — keep
// working untouched.

export function filtersFromParams(params: URLSearchParams): ListingFilters {
  const amenities = (params.get("amenities") ?? "")
    .split(",")
    .filter((a): a is Amenity => a in AMENITY_LABELS);

  const sort = params.get("sort");

  const state = params.get("state") ?? "";
  // An LGA without its state, or paired with the wrong one, is dropped rather
  // than applied: a hand-edited or stale link would otherwise filter on a
  // location the state select cannot even display.
  const lgaParam = params.get("lga") ?? "";
  const lga = state && isLgaInState(state, lgaParam) ? lgaParam : "";

  return {
    state,
    lga,
    priceRange: params.get("price") ?? "",
    bedrooms: params.get("bedrooms") ?? "",
    bathrooms: params.get("baths") ?? "",
    duration: params.get("duration") ?? "",
    propertyType: params.get("ptype") ?? "",
    furnishing: params.get("furnishing") ?? "",
    amenities,
    verifiedOnly: params.get("verified") === "1",
    sort: sort && sort in SORT_LABELS ? (sort as SortKey) : "recent",
  };
}

export function filtersToParams(f: ListingFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.state) p.set("state", f.state);
  if (f.state && f.lga) p.set("lga", f.lga);
  if (f.priceRange) p.set("price", f.priceRange);
  if (f.bedrooms) p.set("bedrooms", f.bedrooms);
  if (f.bathrooms) p.set("baths", f.bathrooms);
  if (f.duration) p.set("duration", f.duration);
  if (f.propertyType) p.set("ptype", f.propertyType);
  if (f.furnishing) p.set("furnishing", f.furnishing);
  if (f.amenities.length) p.set("amenities", f.amenities.join(","));
  if (f.verifiedOnly) p.set("verified", "1");
  if (f.sort !== "recent") p.set("sort", f.sort);
  return p;
}

// --- The predicate ----------------------------------------------------------

/**
 * Every active filter must pass — filters combine with AND, which is what
 * "narrow my results" means to a user.
 *
 * A listing missing an optional field NEVER satisfies a filter on that field.
 * The alternative (treat unknown as a match) would surface a home with no
 * recorded bathroom count under "2+ bathrooms", which is worse than omitting
 * it: it makes results untrustworthy in a product whose whole positioning is
 * trust.
 */
export function matchesFilters(listing: PropertyListing, mode: ListingType, f: ListingFilters) {
  if (listing.type !== mode) return false;

  if (f.state && listing.state !== f.state) return false;
  if (f.lga && listing.lga !== f.lga) return false;

  if (f.priceRange) {
    const [minStr, maxStr] = f.priceRange.split("-");
    const min = minStr ? Number(minStr) : undefined;
    const max = maxStr ? Number(maxStr) : undefined;
    if (min !== undefined && listing.price < min) return false;
    if (max !== undefined && listing.price > max) return false;
  }

  // Minimum-match, not equality. The control has always been labelled "2+",
  // but the original implementation compared with `!==`, so choosing "2+"
  // silently excluded every 3- and 4-bedroom home. Fixed here.
  if (f.bedrooms && listing.bedrooms < Number(f.bedrooms)) return false;

  if (f.bathrooms) {
    if (listing.bathrooms === undefined) return false;
    if (listing.bathrooms < Number(f.bathrooms)) return false;
  }

  if (mode === "rent" && f.duration && listing.rentDuration !== f.duration) return false;
  if (mode === "rent" && f.furnishing && listing.furnishing !== f.furnishing) return false;

  if (f.propertyType && listing.propertyType !== f.propertyType) return false;

  if (f.amenities.length) {
    const have = listing.amenities ?? [];
    if (!f.amenities.every((a) => have.includes(a))) return false;
  }

  if (f.verifiedOnly && !listing.verified) return false;

  return true;
}

export function sortListings(listings: PropertyListing[], sort: SortKey) {
  const out = [...listings];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.price - b.price);
    case "price-desc":
      return out.sort((a, b) => b.price - a.price);
    case "views":
      return out.sort((a, b) => b.viewCount - a.viewCount);
    default:
      return out; // catalog order — the closest thing to "most recent" we have
  }
}

// --- Active-filter summary (drives the removable chips) ---------------------

export interface ActiveChip {
  /** Identifies which filter to clear when the chip's × is pressed. */
  key: keyof ListingFilters;
  /** For amenities, which specific value to remove. */
  value?: string;
  label: string;
}

export function activeChips(f: ListingFilters, mode: ListingType, priceLabel: (v: string) => string): ActiveChip[] {
  const chips: ActiveChip[] = [];
  if (f.state) chips.push({ key: "state", label: f.state });
  if (f.lga) chips.push({ key: "lga", label: f.lga });
  if (f.priceRange) chips.push({ key: "priceRange", label: priceLabel(f.priceRange) });
  if (f.bedrooms) chips.push({ key: "bedrooms", label: `${f.bedrooms}+ bed` });
  if (f.bathrooms) chips.push({ key: "bathrooms", label: `${f.bathrooms}+ bath` });
  if (f.propertyType)
    chips.push({ key: "propertyType", label: PROPERTY_TYPE_LABELS[f.propertyType as PropertyType] });
  if (mode === "rent" && f.duration)
    chips.push({ key: "duration", label: f.duration === "short-term" ? "Short-Term" : "Long-Term" });
  if (mode === "rent" && f.furnishing)
    chips.push({ key: "furnishing", label: FURNISHING_LABELS[f.furnishing as FurnishingStatus] });
  f.amenities.forEach((a) => chips.push({ key: "amenities", value: a, label: AMENITY_LABELS[a] }));
  if (f.verifiedOnly) chips.push({ key: "verifiedOnly", label: "Verified only" });
  return chips;
}

/**
 * Count of active filters that live in the collapsed "More filters" section.
 *
 * This must stay in step with what FilterPanel actually renders there —
 * `duration` is displayed inside that section, so it has to be counted here
 * too. When it wasn't, arriving at /rent?duration=short-term produced a badge
 * reading plain "More filters" over a collapsed panel that was hiding an
 * active control: the disclosure disagreed with the filter state.
 */
export function advancedCount(f: ListingFilters, mode: ListingType) {
  let n = 0;
  if (f.propertyType) n++;
  if (f.bathrooms) n++;
  if (mode === "rent" && f.duration) n++;
  if (mode === "rent" && f.furnishing) n++;
  if (f.verifiedOnly) n++;
  n += f.amenities.length;
  return n;
}
