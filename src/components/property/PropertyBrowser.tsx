"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { FilterPanel } from "@/components/property/FilterPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconClose } from "@/components/ui/icons";
import { PRICE_RANGES } from "@/components/shared/SearchBar";
import { ListingModeToggle } from "@/components/property/ListingModeToggle";
import { mockListings } from "@/lib/mock-data";
import {
  DEFAULT_MODE,
  MODE_COPY,
  modeFromParam,
  readStoredMode,
  serverStoredMode,
  subscribeStoredMode,
  writeStoredMode,
} from "@/lib/listings-mode";
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

// ---------------------------------------------------------------------------
// ROUTE MERGE (Website Revision Spec §3C, 24 Aug 2026)
//
// Rent and Buy were two dedicated routes (/rent, /buy) sharing this one
// implementation. They are now ONE route — /listings — and `mode` is in-page
// state driven by a toggle, exactly as the spec requires ("one URL, not two
// separate pages"; "a toggle control, not tabs and not separate routes").
//
// Three things had to hold for that to be a merge rather than a regression:
//
//   1. Shareability. A filtered view still has to survive being copied into a
//      message, so mode is mirrored into ?mode= alongside the filters. The URL
//      reflects state; it no longer *is* the state.
//   2. Memory. Spec: the toggle "is remembered ... for the duration of their
//      visit ... rather than resetting on every navigation" — handled by
//      lib/listings-mode.ts, which this file reads once on mount and writes to
//      on every change.
//   3. Price. Rent and sale prices are different scales, so a rent bucket
//      carried into sale mode would silently return nothing. Price is cleared
//      on mode change; every other filter (state, bedrooms, baths, type,
//      amenities, verified) means the same thing in both modes and is kept —
//      which is exactly what the old cross-route link did, now without the
//      navigation.
//
// FILTER EXPANSION: the filter shape, URL encoding, predicate and sort live in
// lib/listing-filters.ts so the sidebar, the drawer and the chips cannot
// disagree with one another. This file owns state, URL sync and layout only.
// ---------------------------------------------------------------------------

export function PropertyBrowser() {

  const searchParams = useSearchParams();

  // Initialised from the URL so a filtered view is shareable and survives a
  // reload, and so links from the homepage SearchBar and facet tiles land
  // with their filters already applied.
  const [filters, setFilters] = useState<ListingFilters>(() => filtersFromParams(searchParams));
  const [filtersOpen, setFiltersOpen] = useState(false);

  // MODE RESOLUTION, in precedence order:
  //
  //   1. `chosen`   — a toggle press in this page instance. Local state, so
  //                    the switch is instant and never waits on a navigation.
  //   2. `?mode=`   — an explicit, shareable intent in the URL.
  //   3. `remembered` — what this visitor last chose during this visit.
  //   4. DEFAULT_MODE — first visit (see lib/listings-mode.ts; still an open
  //                     item with the client).
  //
  // `remembered` is read through useSyncExternalStore rather than in a
  // useState initialiser or a mount effect. sessionStorage does not exist on
  // the server, and this is precisely the hook React provides for that: it
  // renders the server snapshot (null) during SSR and hydration, then swaps in
  // the real value — no mismatch, and no post-mount setState cascade.
  const [chosen, setChosen] = useState<ListingType | null>(null);
  const remembered = useSyncExternalStore(subscribeStoredMode, readStoredMode, serverStoredMode);
  const urlMode = modeFromParam(searchParams.get("mode"));
  const mode: ListingType = chosen ?? urlMode ?? remembered ?? DEFAULT_MODE;

  const copy = MODE_COPY[mode];

  /**
   * Switching Buy/Rent. Price is dropped because rent and sale operate on
   * entirely different scales — carrying "Under ₦1,000,000" into sale mode
   * would silently match nothing and read as an empty catalog rather than as
   * a stale filter. Everything else means the same thing on both sides and is
   * deliberately preserved, so switching mode is a change of intent, not a
   * reset of the work the user has already done narrowing things down.
   *
   * State is set synchronously here and never waits on the toggle's animation
   * — rapid switching can reorder or interrupt motion, but it can never leave
   * the results showing one mode while the control shows the other.
   */
  const changeMode = useCallback((next: ListingType) => {
    setChosen(next);
    writeStoredMode(next);
    setFilters((prev) => (prev.priceRange ? { ...prev, priceRange: "" } : prev));
  }, []);

  // Mirror state back into the URL so a filtered view stays shareable, and
  // mode rides along so a filtered Buy view is as linkable as it was when it
  // had its own route.
  //
  // This uses history.replaceState rather than router.replace deliberately.
  // router.replace is a real Next.js navigation: because this route is
  // statically prerendered and reads useSearchParams, every filter keystroke
  // and every mode flip re-suspended the page, which left the previous tree
  // mounted-but-hidden in the DOM and remounted this component from scratch —
  // discarding its local state (so the toggle's own transition never got to
  // play) and doing a full re-render to change a query string nothing on the
  // server depends on.
  //
  // replaceState updates the address bar and nothing else, which is exactly
  // and only what is wanted here: the URL reflects state, it is not the
  // source of it. No history entry per keystroke either, so Back still means
  // "the previous page", not "the previous filter tweak".
  useEffect(() => {
    const params = filtersToParams(filters);
    params.set("mode", mode);
    const next = `/listings?${params.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [filters, mode]);

  // Changing the state drops the LGA with it. LGAs are state-scoped, so
  // "Lagos / Ikeja" -> "Oyo" would otherwise leave an Ikeja filter applied
  // that the Oyo LGA list cannot even display — a hidden filter matching
  // nothing.
  const set = useCallback(
    <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) =>
      setFilters((prev) => (key === "state" ? { ...prev, state: value as string, lga: "" } : { ...prev, [key]: value })),
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
      // Same reasoning as `set`: an LGA cannot outlive its state.
      if (chip.key === "state") return { ...prev, state: "", lga: "" };
      return { ...prev, [chip.key]: "" };
    });
  }, []);

  const results = useMemo(() => {
    const matched = mockListings.filter((l) => matchesFilters(l, mode, filters));
    return sortListings(matched, filters.sort);
  }, [mode, filters]);

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
    />
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* One page, one H1, one mode control. The eyebrow/heading/intro are
          keyed on `mode` so the page states plainly which side of the toggle
          is showing — a toggle whose only feedback is the pill position makes
          the reader verify the control instead of reading the page.

          The copy is keyed on `mode` so switching genuinely replaces it and
          Motion can animate the arrival, rather than the text changing
          character-by-character under the reader. `min-h` reserves the
          block's height so the results grid below it cannot jump while the
          two-line and three-line intros swap. */}
      <div className="mb-9 border-b border-[var(--color-border-hairline)] pb-8">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-5">
          <div className="min-h-[9.5rem] sm:min-h-[11.5rem]">
            {/* No AnimatePresence, and no exit animation, on purpose.
                The heading is the page telling you which mode you are in —
                required state, not decoration. Any presence-based exit makes
                the removal of the OLD heading dependent on an animation
                completing, and a stalled frame loop then leaves two
                contradictory headings on screen at once. A plain keyed
                element is swapped by React synchronously, so the text is
                always right; Motion then animates only the arrival.

                `initial` is false until the user has actually pressed the
                toggle, for the same reason as the results grid below: page
                content must never start invisible on first paint. */}
            <motion.div
              key={mode}
              initial={chosen === null ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="u-label text-[var(--color-brand-primary-text)]">{copy.eyebrow}</p>
              <h1 className="u-display mt-3 text-[2.25rem] text-[var(--color-text-primary)] sm:text-5xl">
                {copy.heading}
              </h1>
              <p className="mt-4 max-w-lg text-[var(--color-text-secondary)]">{copy.intro}</p>
            </motion.div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <ListingModeToggle mode={mode} onChange={changeMode} />
            <Button
              variant="secondary"
              size="dense"
              className="shrink-0 lg:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              Filters{chips.length > 0 ? ` (${chips.length})` : ""}
            </Button>
          </div>
        </div>
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
            /* Results are keyed on `mode`, so flipping the toggle replaces the
               grid rather than mutating it in place — a short lift-and-fade,
               lightly staggered, which reads as "a different set of homes"
               instead of prices silently changing under the cursor.

               The stagger is capped at the first row's worth of cards: a
               per-card delay applied to twenty results would still be
               animating long after the user has started scanning.

               CRITICAL: `initial` is false until the user has actually pressed
               the toggle (`chosen === null` means they have not). The listings
               are the page's content, and content must never be invisible
               until an animation agrees to reveal it — a backgrounded tab, a
               starved rAF loop or any JS hiccup during the entrance would
               otherwise leave the grid stuck at opacity 0 with nothing to
               recover it. So first paint renders the cards outright, and the
               entrance animation exists only for the mode SWITCH, which is
               the only moment it actually communicates anything. */
            <motion.div
              key={mode}
              initial={chosen === null ? false : "hidden"}
              animate="shown"
              variants={{ shown: { transition: { staggerChildren: 0.035 } } }}
              className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 xl:grid-cols-3"
            >
              {results.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  variants={{
                    hidden: { opacity: 0, y: i < 6 ? 14 : 0 },
                    shown: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                >
                  <PropertyCard listing={listing} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
