"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Input";
import { IconChevronDown, IconCheck } from "@/components/ui/icons";
import { PRICE_RANGES } from "@/components/shared/SearchBar";
import { ListingFilters, advancedCount, formatPriceRange } from "@/lib/listing-filters";
import {
  AMENITY_LABELS,
  Amenity,
  FURNISHING_LABELS,
  FurnishingStatus,
  ListingType,
  PROPERTY_TYPE_LABELS,
  PropertyType,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// The filter controls, rendered once and reused by both the desktop sidebar
// and the mobile drawer.
//
// TWO TIERS, deliberately:
//   Primary (always visible)  — mode, State, Price, Bedrooms.
//   Advanced (collapsed)      — Property type, Bathrooms, Furnishing,
//                               Amenities, Verified only.
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
  toggleAmenity,
  states,
}: {
  mode: ListingType;
  filters: ListingFilters;
  set: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void;
  toggleAmenity: (a: Amenity) => void;
  states: string[];
}) {
  const advCount = advancedCount(filters, mode);
  const isCustomRange =
    !!filters.priceRange && !PRICE_RANGES[mode].some((p) => p.value === filters.priceRange);
  // Open by default when advanced filters are already applied (e.g. arriving
  // from a shared URL) — a collapsed panel hiding active filters would be
  // actively misleading.
  const [advOpen, setAdvOpen] = useState(advCount > 0);

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
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
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

      {/* ---------------- Advanced ---------------- */}
      <div className="border-t border-[var(--color-border-hairline)] pt-4">
        <button
          type="button"
          onClick={() => setAdvOpen((v) => !v)}
          aria-expanded={advOpen}
          aria-controls="advanced-filters"
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="u-ui text-[13px] font-semibold text-[var(--color-text-primary)]">
            More filters
            {advCount > 0 && (
              <span className="u-numeric ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1.5 text-[11px] font-bold text-white">
                {advCount}
              </span>
            )}
          </span>
          <IconChevronDown
            className={`h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-transform duration-[var(--motion-duration-short)] ${
              advOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {advOpen && (
          <div id="advanced-filters" className="mt-5 flex flex-col gap-5">
            <div>
              <label className={FIELD_LABEL} htmlFor="f-ptype">
                Property type
              </label>
              <Select
                id="f-ptype"
                value={filters.propertyType}
                onChange={(e) => set("propertyType", e.target.value)}
              >
                <option value="">Any type</option>
                {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
                  <option key={t} value={t}>
                    {PROPERTY_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className={FIELD_LABEL} htmlFor="f-baths">
                Bathrooms
              </label>
              <Select id="f-baths" value={filters.bathrooms} onChange={(e) => set("bathrooms", e.target.value)}>
                <option value="">Any</option>
                {[1, 2, 3, 4].map((b) => (
                  <option key={b} value={b}>
                    {b}+
                  </option>
                ))}
              </Select>
            </div>

            {/* Rent-only controls — a buyer filtering by lease duration or
                furnishing would be filtering on fields sale listings don't
                carry, so they simply aren't rendered on /buy. */}
            {mode === "rent" && (
              <>
                <div>
                  <label className={FIELD_LABEL} htmlFor="f-duration">
                    Rental duration
                  </label>
                  <Select id="f-duration" value={filters.duration} onChange={(e) => set("duration", e.target.value)}>
                    <option value="">Any</option>
                    <option value="short-term">Short-Term</option>
                    <option value="long-term">Long-Term</option>
                  </Select>
                </div>

                <div>
                  <label className={FIELD_LABEL} htmlFor="f-furnishing">
                    Furnishing
                  </label>
                  <Select
                    id="f-furnishing"
                    value={filters.furnishing}
                    onChange={(e) => set("furnishing", e.target.value)}
                  >
                    <option value="">Any</option>
                    {(Object.keys(FURNISHING_LABELS) as FurnishingStatus[]).map((k) => (
                      <option key={k} value={k}>
                        {FURNISHING_LABELS[k]}
                      </option>
                    ))}
                  </Select>
                </div>
              </>
            )}

            <fieldset>
              <legend className={FIELD_LABEL}>Amenities</legend>
              <div className="flex flex-col gap-2.5">
                {(Object.keys(AMENITY_LABELS) as Amenity[]).map((a) => {
                  const checked = filters.amenities.includes(a);
                  return (
                    <label
                      key={a}
                      className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[var(--color-text-secondary)]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAmenity(a)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-[var(--motion-duration-short)] ${
                          checked
                            ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white"
                            : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)]"
                        }`}
                      >
                        {checked && <IconCheck className="h-2.5 w-2.5" />}
                      </span>
                      <span className="u-ui">{AMENITY_LABELS[a]}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label className="flex cursor-pointer items-center gap-2.5 border-t border-[var(--color-border-hairline)] pt-4 text-[13px] text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) => set("verifiedOnly", e.target.checked)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-[var(--motion-duration-short)] ${
                  filters.verifiedOnly
                    ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white"
                    : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)]"
                }`}
              >
                {filters.verifiedOnly && <IconCheck className="h-2.5 w-2.5" />}
              </span>
              <span className="u-ui font-semibold text-[var(--color-text-primary)]">Verified listings only</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
