"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PropertyCard } from "@/components/property/PropertyCard";
import { FilterPanel } from "@/components/property/FilterPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconClose } from "@/components/ui/icons";
import { PRICE_RANGES } from "@/components/shared/SearchBar";
import { mockListings } from "@/lib/mock-data";
import { Amenity, ListingType } from "@/lib/types";
import {
  ActiveChip,
  EMPTY_FILTERS,
  ListingFilters,
  SORT_LABELS,
  SortKey,
  activeChips,
  filtersFromParams,
  filtersToParams,
  formatPriceRange,
  matchesFilters,
  sortListings,
} from "@/lib/listing-filters";

// ROUTE SPLIT: Rent and Buy are two dedicated routes (`/rent`, `/buy`) and
// this component is the single shared implementation behind both.
//
// FILTER EXPANSION: the filter shape, URL encoding, predicate and sort now
// live in lib/listing-filters.ts so the sidebar, the drawer and the chips
// cannot disagree with one another. This file owns state, URL sync and
// layout only.
const MODE_COPY: Record<
  ListingType,
  { eyebrow: string; heading: string; intro: string; label: string; href: string }
> = {
  rent: {
    eyebrow: "For rent",
    heading: "Properties for Rent",
    intro:
      "Verified rental homes, reviewed by our team before they go live. Filter by state, budget, bedrooms, and rental duration.",
    label: "Rent",
    href: "/rent",
  },
  sale: {
    eyebrow: "For sale",
    heading: "Properties for Sale",
    intro:
      "Verified homes available to buy, reviewed by our team before they go live. Filter by state, budget, and bedrooms.",
    label: "Buy",
    href: "/buy",
  },
};

export function PropertyBrowser({ mode }: { mode: ListingType }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialised from the URL so a filtered view is shareable and survives a
  // reload, and so links from the homepage SearchBar and facet tiles land
  // with their filters already applied.
  const [filters, setFilters] = useState<ListingFilters>(() => filtersFromParams(searchParams));
  const [filtersOpen, setFiltersOpen] = useState(false);

  const copy = MODE_COPY[mode];
  const otherCopy = MODE_COPY[mode === "rent" ? "sale" : "rent"];

  // Mirror state back into the URL without adding a history entry per
  // keystroke — `replace` keeps the Back button meaning "the previous page",
  // not "the previous filter tweak".
  useEffect(() => {
    const qs = filtersToParams(filters).toString();
    router.replace(qs ? `${copy.href}?${qs}` : copy.href, { scroll: false });
  }, [filters, copy.href, router]);

  const set = useCallback(
    <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) =>
      setFilters((prev) => ({ ...prev, [key]: value })),
    []
  );

  const toggleAmenity = useCallback((a: Amenity) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }));
  }, []);

  const clearAll = useCallback(() => setFilters({ ...EMPTY_FILTERS }), []);

  const clearChip = useCallback((chip: ActiveChip) => {
    setFilters((prev) => {
      if (chip.key === "amenities") {
        return { ...prev, amenities: prev.amenities.filter((a) => a !== chip.value) };
      }
      if (chip.key === "verifiedOnly") return { ...prev, verifiedOnly: false };
      return { ...prev, [chip.key]: "" };
    });
  }, []);

  // Switching intent is a route change. State and Bedrooms mean the same in
  // both modes so they carry across; Price does not (different scales) and
  // Duration/Furnishing are rent-only.
  const otherModeHref = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.state) p.set("state", filters.state);
    if (filters.bedrooms) p.set("bedrooms", filters.bedrooms);
    if (filters.bathrooms) p.set("baths", filters.bathrooms);
    if (filters.propertyType) p.set("ptype", filters.propertyType);
    if (filters.amenities.length) p.set("amenities", filters.amenities.join(","));
    if (filters.verifiedOnly) p.set("verified", "1");
    const qs = p.toString();
    return qs ? `${otherCopy.href}?${qs}` : otherCopy.href;
  }, [filters, otherCopy.href]);

  const results = useMemo(() => {
    const matched = mockListings.filter((l) => matchesFilters(l, mode, filters));
    return sortListings(matched, filters.sort);
  }, [mode, filters]);

  const states = useMemo(() => Array.from(new Set(mockListings.map((l) => l.state))).sort(), []);

  // Prefer the bucket's own wording; fall back to formatting the raw range
  // so an off-bucket value from a shared URL still reads as a price, not as
  // "0-2000000".
  const priceLabel = useCallback(
    (v: string) => PRICE_RANGES[mode].find((p) => p.value === v)?.label ?? formatPriceRange(v),
    [mode]
  );

  const chips = useMemo(() => activeChips(filters, mode, priceLabel), [filters, mode, priceLabel]);

  const panel = (
    <FilterPanel
      mode={mode}
      filters={filters}
      set={set}
      toggleAmenity={toggleAmenity}
      states={states}
      otherModeHref={otherModeHref}
      otherModeLabel={otherCopy.label}
      modeLabel={copy.label}
      onNavigateAway={() => setFiltersOpen(false)}
    />
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-9 flex items-end justify-between gap-4 border-b border-[var(--color-border-hairline)] pb-8">
        <div>
          <p className="u-label text-[var(--color-brand-primary-text)]">{copy.eyebrow}</p>
          <h1 className="u-display mt-3 text-[2.25rem] text-[var(--color-text-primary)] sm:text-5xl">
            {copy.heading}
          </h1>
          <p className="mt-4 max-w-lg text-[var(--color-text-secondary)]">{copy.intro}</p>
        </div>
        <Button
          variant="secondary"
          size="dense"
          className="shrink-0 lg:hidden"
          onClick={() => setFiltersOpen(true)}
        >
          Filters{chips.length > 0 ? ` (${chips.length})` : ""}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        {/* Persistent sidebar at Wide; drawer at Compact/Medium (RESPONSIVE_STRATEGY.md) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5">
            {panel}
          </div>
        </aside>

        {/* Mobile drawer. Height-capped and scrollable because the advanced
            section can now exceed a phone viewport — without this the
            amenity list and its Done control would be unreachable. */}
        {filtersOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end bg-[var(--color-dark-blue)]/45 backdrop-blur-[2px] lg:hidden"
            onClick={() => setFiltersOpen(false)}
          >
            <div
              className="flex max-h-[85vh] w-full flex-col rounded-t-[var(--radius-modal)] bg-[var(--color-surface-raised)] shadow-[var(--elevation-lg)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] px-5 py-4">
                <p className="font-bold text-[var(--color-text-primary)]">Filters</p>
                <div className="flex items-center gap-1">
                  {chips.length > 0 && (
                    <Button variant="text" size="dense" onClick={clearAll}>
                      Reset
                    </Button>
                  )}
                  <Button size="dense" onClick={() => setFiltersOpen(false)}>
                    Show {results.length}
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">{panel}</div>
            </div>
          </div>
        )}

        <div>
          {/* Results bar: count, sort, and the active-filter chips. Chips are
              the whole "applied and reset clearly" story — every narrowing
              filter is visible here and individually removable, including the
              ones set from a shared URL or hidden inside the collapsed
              advanced section. */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="u-ui text-[13px] font-semibold text-[var(--color-text-secondary)]">
              <span className="u-numeric text-[var(--color-text-primary)]">{results.length}</span> result
              {results.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="u-ui text-[13px] text-[var(--color-text-secondary)]">
                Sort
              </label>
              {/* Width set on a wrapper, not via a className on Select —
                  this repo's `cn` is a plain join with no tailwind-merge, so
                  passing `w-auto` against the field base's `w-full` would
                  leave the winner to stylesheet order rather than intent. */}
              <div className="w-[184px]">
                <Select
                  id="sort"
                  value={filters.sort}
                  onChange={(e) => set("sort", e.target.value as SortKey)}
                >
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                    <option key={k} value={k}>
                      {SORT_LABELS[k]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <button
                  key={`${chip.key}-${chip.value ?? ""}`}
                  onClick={() => clearChip(chip)}
                  className="u-ui group inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] py-1.5 pl-3 pr-2 text-[13px] font-semibold text-[var(--color-text-primary)] transition-colors duration-[var(--motion-duration-short)] hover:border-[var(--color-deep-blue)]"
                >
                  {chip.label}
                  <IconClose className="h-3 w-3 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
                  <span className="sr-only">Remove filter</span>
                </button>
              ))}
              <button
                onClick={clearAll}
                className="u-ui ml-1 text-[13px] font-semibold text-[var(--color-brand-primary-text)] hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <EmptyState
              title="No listings match your filters"
              description="Try widening your price range, removing an amenity, or clearing a filter."
              action={
                <Button variant="secondary" size="dense" onClick={clearAll}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((listing) => (
                <PropertyCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
