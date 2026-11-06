"use client";

import { Select } from "@/components/ui/Input";
import { IconArrowRight, IconFilter } from "@/components/ui/icons";
import { PRICE_RANGES } from "@/components/shared/SearchBar";
import { ListingFilters, advancedCount, formatPriceRange } from "@/lib/listing-filters";
import { NIGERIAN_STATES, lgasForState } from "@/lib/nigeria-locations";
import { ListingType } from "@/lib/types";

// ---------------------------------------------------------------------------
// The filter controls, rendered once and reused by both the desktop sidebar
// and the mobile drawer.
//
// TWO TIERS, deliberately:
//   Primary (always visible)  — mode, State, LGA, Price, Bedrooms.
//   More filters (a panel)    — Property type, Bathrooms, Features and
//                               amenities, Availability, Listing type,
//                               Verified only (see MoreFiltersPanel).
//
// The brief was not to overload the search area, and a sidebar showing
// fourteen controls at rest is exactly that. The primary four are the ones
// the PRD has always shipped and the ones most searches actually use; the
// rest stay one click away behind a disclosure that reports how many of them
// are active, so nothing hidden is ever silently narrowing the results.
// ---------------------------------------------------------------------------

const FIELD_LABEL = "u-ui mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]";

export function FilterPanel({
  mode,
  filters,
  set,
  onOpenMore,
}: {
  mode: ListingType;
  filters: ListingFilters;
  set: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void;
  onOpenMore: () => void;
}) {
  const advCount = advancedCount(filters, mode);
  // The LGA list is whatever the chosen state actually contains — empty until
  // a state is picked, because an LGA name on its own is ambiguous (several
  // states have an "Obi", an "Ifelodun", a "Bassa").
  const lgas = lgasForState(filters.state);
  const isCustomRange =
    !!filters.priceRange && !PRICE_RANGES[mode].some((p) => p.value === filters.priceRange);
  return (
    <div className="flex flex-col gap-5">
      {/* REVISION (Website Revision Spec §3C): the Rent/Buy switch used to
          live here as a pair of links, because Rent and Buy were two routes.
          They are now one /listings route with one toggle, and that toggle
          belongs in the page header where it reads as "what am I browsing",
          not buried in the sidebar alongside "how am I narrowing it".
          Removing it from here is what keeps there being exactly ONE mode
          control on the page — two would be two sources of truth. */}

      {/* ---------------- Primary ---------------- */}
      <div>
        <label className={FIELD_LABEL} htmlFor="f-state">
          State
        </label>
        <Select id="f-state" value={filters.state} onChange={(e) => set("state", e.target.value)}>
          <option value="">Any state</option>
          {NIGERIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {/* LGA sits directly under State and is driven by it. It stays visible
          (disabled) with no state chosen rather than appearing out of nowhere:
          a control that materialises mid-column shifts every filter below it
          and hides the fact that the product can narrow this far at all.
          Clearing or changing the state clears this — see PropertyBrowser. */}
      <div>
        <label className={FIELD_LABEL} htmlFor="f-lga">
          Local Government Area
        </label>
        <Select
          id="f-lga"
          value={filters.lga}
          disabled={!filters.state}
          onChange={(e) => set("lga", e.target.value)}
        >
          <option value="">{filters.state ? "Any LGA" : "Select a state first"}</option>
          {lgas.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className={FIELD_LABEL} htmlFor="f-price">
          Price range
        </label>
        <Select id="f-price" value={filters.priceRange} onChange={(e) => set("priceRange", e.target.value)}>
          <option value="">Any price</option>
          {PRICE_RANGES[mode].map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
          {/* A price range can arrive from the URL that matches no bucket —
              a shared link, a hand-edited one, or a sale-scale range pasted
              onto /rent. Without an option to select, the control falls back
              to displaying "Any price" while results are demonstrably
              filtered: the control would be lying about the result set.
              Rendering the actual value keeps the panel truthful. */}
          {isCustomRange && (
            <option value={filters.priceRange}>{formatPriceRange(filters.priceRange)}</option>
          )}
        </Select>
      </div>

      <div>
        <label className={FIELD_LABEL} htmlFor="f-beds">
          Bedrooms
        </label>
        <Select id="f-beds" value={filters.bedrooms} onChange={(e) => set("bedrooms", e.target.value)}>
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((b) => (
            <option key={b} value={b}>
              {b}+
            </option>
          ))}
        </Select>
      </div>

      {/* ---------------- More filters ---------------- */}
      {/* Everything past the four above lives in the More filters panel, which
          edits a draft and applies on "Apply Filters". The count says how many
          of its filters are narrowing the results, so nothing hidden behind
          the button is ever silently active. */}
      <div className="border-t border-[var(--color-border-hairline)] pt-4">
        <button
          type="button"
          onClick={onOpenMore}
          className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] px-4 py-3 text-left transition-colors duration-[var(--motion-duration-short)] hover:border-[var(--color-deep-blue)]/40"
        >
          <span className="u-ui flex items-center gap-2 text-[13px] font-semibold text-[var(--color-text-primary)]">
            <IconFilter className="h-[18px] w-[18px] text-[var(--color-deep-blue)]" />
            More filters
            {advCount > 0 && (
              <span className="u-numeric inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1.5 text-[11px] font-bold text-white">
                {advCount}
              </span>
            )}
          </span>
          <IconArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
        </button>
      </div>
    </div>
  );
}
