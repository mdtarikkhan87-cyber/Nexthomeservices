"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mockServices } from "@/lib/mock-data";

const NIGERIAN_STATES = ["Lagos", "Abuja (FCT)", "Rivers", "Oyo", "Kano", "Enugu"];

// Service categories are read from the catalog, not hard-coded, so this list
// and the /services directory can never disagree about what exists.
const SERVICE_TYPES = Array.from(new Set(mockServices.map((s) => s.category))).sort();

// PRD §4 approves price range, state, and bedrooms as filters (state must
// stay a fixed dropdown, never free text). Buckets are mode-specific since
// rent and sale prices operate on entirely different scales.
// TASK 3 adds a third tab. The mode union widens, but PRICE_RANGES stays
// keyed on "rent" | "sale" ONLY — FilterPanel and PropertyBrowser index it
// with ListingType, so widening its key would break both at the type level
// and hand them a `undefined` bucket list at runtime.
export type SearchMode = "rent" | "sale" | "services";

export const PRICE_RANGES: Record<"rent" | "sale", { value: string; label: string }[]> = {
  rent: [
    { value: "0-1000000", label: "Under ₦1,000,000" },
    { value: "1000000-2000000", label: "₦1,000,000 – ₦2,000,000" },
    { value: "2000000-", label: "Above ₦2,000,000" },
  ],
  sale: [
    { value: "0-50000000", label: "Under ₦50,000,000" },
    { value: "50000000-100000000", label: "₦50,000,000 – ₦100,000,000" },
    { value: "100000000-", label: "Above ₦100,000,000" },
  ],
};

const TABS: { value: SearchMode; label: string; icon: React.ReactNode }[] = [
  {
    value: "sale",
    label: "Buy",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L3.24 9.59A2 2 0 0 0 3.83 11l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z" />
        <circle cx="8.5" cy="8.5" r="1.5" />
      </svg>
    ),
  },
  {
    value: "rent",
    label: "Rent",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="8" cy="15" r="4" />
        <path d="M10.85 12.15 19 4M19 4h-4M19 4v4" />
      </svg>
    ),
  },
  {
    value: "services",
    label: "Services",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14.7 6.3a3.5 3.5 0 0 0 4.6 4.6l-8 8a2.3 2.3 0 0 1-3.2-3.2l8-8Z" />
        <path d="m6.5 6.5 3 3" />
      </svg>
    ),
  },
];

// VISUAL REFINEMENT (structural layout inspired by a reference image,
// restyled entirely with approved NextHome tokens — see chat for what was
// intentionally NOT carried over from the reference: "Shortlet" and "Joint
// Venture" tabs, and a literal "Property Type" filter, none of which exist
// in the approved PRD/PRODUCT_DECISIONS.md scope. The reference's 4th
// filter slot is used instead for the already-approved Short-Term/
// Long-Term rent duration tag (PRD §4/§14), shown only in Rent mode.
//
// SPACING PASS: fields were reading cramped/congested — root cause was
// two-fold: (1) the hero layout squeezed this into ~50% of the page width
// (fixed at the call site, not here), and (2) the fields themselves used a
// near-zero vertical padding (py-1) with an 11px label and 14px value.
// Both fixed: generous per-field padding and larger label/value type so
// the selected value is the most prominent thing in each column.
//
// OVERFLOW FIX: that pass also gave each field a hard `min-width` (260 /
// 240 / 180 / 200px) and relied on `overflow-x-auto` as a fallback when
// they didn't all fit — which is exactly backwards: those floors summed
// to ~900px of hard minimums plus padding/dividers/button, easily
// exceeding the available width below very wide viewports, so the
// "fallback" was firing constantly and showing a scrollbar instead of a
// genuinely fitted row. Replaced with CSS Grid `fr` columns at `lg`: by
// definition a set of `fr` tracks always sums to exactly 100% of the
// container, so this can't overflow. `min-w-0` on each field lets its
// `<select>` shrink/ellipsis instead of forcing its column wider than its
// fr share. No `overflow-x` anywhere in this component anymore.
export function SearchBar({ initialMode = "rent" }: { initialMode?: SearchMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [state, setState] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [duration, setDuration] = useState("");
  const [serviceType, setServiceType] = useState("");

  // The Buy/Rent tabs choose the DESTINATION ROUTE now — `mode` is no
  // longer carried as a query param into a shared /search page, it selects
  // /buy or /rent. The filter params themselves are unchanged.
  const handleSearch = () => {
    // Services routes to its own directory. Location is intentionally NOT
    // carried: ServiceListing has no location field yet (see the disabled
    // field below), so sending a `state` param would be a filter that
    // silently does nothing.
    if (mode === "services") {
      const qs = serviceType ? `?category=${encodeURIComponent(serviceType)}` : "";
      router.push(`/services${qs}`);
      return;
    }

    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (priceRange) params.set("price", priceRange);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (mode === "rent" && duration) params.set("duration", duration);
    // ROUTE MERGE (Website Revision Spec §3C): Buy and Rent are one page
    // now, so the tab selects a ?mode= on the shared /listings route rather
    // than a destination route. The filter params are unchanged.
    params.set("mode", mode);
    router.push(`/listings?${params.toString()}`);
  };

  // EDITORIAL REDESIGN: labels drop to a small tracked-out UI label and
  // values to a normal reading size. The previous pass had used a 20px bold
  // value, which shouted — a search panel should read as a precise
  // instrument, not as headline type. Values use the UI face so locations
  // and price ranges align cleanly across the columns.
  const fieldLabel = "u-label block text-[var(--color-text-secondary)] whitespace-nowrap";
  const fieldValue =
    "u-ui mt-2 w-full appearance-none bg-transparent text-[15px] font-semibold text-[var(--color-text-primary)] outline-none whitespace-nowrap overflow-hidden text-ellipsis [text-overflow:ellipsis]";

  return (
    <div className="w-full max-w-full rounded-[var(--radius-feature)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] shadow-[var(--elevation-lg)] [box-sizing:border-box]">
      {/* Top row: intent tabs — individual pills, not a single segmented
          track, per the reference's structure. Only Buy/Rent are real,
          approved search modes (PRODUCT_UNDERSTANDING.md §5, PRD §4).
          `flex-wrap` instead of `overflow-x-auto` — with only 2 tabs this
          never actually needs to wrap, but it's a safe fallback that
          can't produce a scrollbar if it ever did. */}
      <div className="flex flex-wrap items-center gap-2 px-5 pt-5 sm:px-7 sm:pt-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setMode(tab.value);
              setPriceRange(""); // rent/sale price buckets use different scales
            }}
            aria-pressed={mode === tab.value}
            className={`u-ui inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors duration-[var(--motion-duration-short)] ${
              mode === tab.value
                ? "bg-[var(--color-brand-primary)] text-white shadow-[var(--elevation-xs)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dense)]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mx-5 mt-5 border-t border-[var(--color-border-hairline)] sm:mx-7" />

      {/* Main row: Location gets the most visual weight (first, widest);
          fields are divided by a thin vertical rule, not individual boxes
          (DESIGN_SYSTEM.md §6: borders used sparingly, dividers subtle).
          At `lg`, `fr` grid columns replace the old flex+min-width
          combo — `fr` tracks always sum to exactly the container's width,
          so this literally cannot overflow it. `min-w-0` on every field
          lets its `<select>` shrink/ellipsis inside its column instead of
          forcing the column wider. Column count/ratio is conditional on
          `mode` since Duration only exists in Rent mode. */}
      <div
        className={`grid grid-cols-1 divide-y divide-[var(--color-border-hairline)] p-5 sm:p-7 lg:divide-x lg:divide-y-0 lg:items-stretch ${
          mode === "rent"
            ? "lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]"
            : mode === "sale"
              ? "lg:grid-cols-[1.3fr_1fr_1fr_auto]"
              : "lg:grid-cols-[1.3fr_1fr_auto]"
        }`}
      >
        <div className="min-w-0 py-5 lg:py-3 lg:pr-8">
          <label className={fieldLabel} htmlFor="sb-location">
            Location
          </label>
          {/* Kept a dropdown, not free text — PRD §4: "Location filtering
              uses a dropdown list of states rather than free text, so
              results stay accurate." */}
          {/* Rendered in every mode so the bar keeps a consistent shape, but
              DISABLED for Services: ServiceListing carries no location field
              yet, so an enabled control here would collect input that the
              directory cannot act on. Disabled rather than hidden — the user
              asked for the field to be present — and it is removed from the
              tab order, with the reason stated in the label instead of
              leaving it mysteriously dead. */}
          <select
            id="sb-location"
            value={mode === "services" ? "" : state}
            onChange={(e) => setState(e.target.value)}
            disabled={mode === "services"}
            aria-describedby={mode === "services" ? "sb-location-note" : undefined}
            className={`${fieldValue} disabled:cursor-not-allowed disabled:text-[var(--color-text-secondary)]/50`}
          >
            <option value="">{mode === "services" ? "Any location" : "State, locality or area"}</option>
            {mode !== "services" &&
              NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
          </select>
          {mode === "services" && (
            <p id="sb-location-note" className="u-ui mt-1 text-[11px] text-[var(--color-text-secondary)]/70">
              Location filtering for services is coming soon
            </p>
          )}
        </div>

        {/* Property-only fields. `PRICE_RANGES[mode]` is indexed here, which
            is exactly why the services mode must not reach this branch —
            PRICE_RANGES has no "services" key. */}
        {mode !== "services" && (
          <>
            <div className="min-w-0 py-5 lg:py-3 lg:px-8">
              <label className={fieldLabel} htmlFor="sb-price">
                Price Range
              </label>
              <select id="sb-price" value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className={fieldValue}>
                <option value="">Any price</option>
                {PRICE_RANGES[mode].map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0 py-5 lg:py-3 lg:px-8">
              <label className={fieldLabel} htmlFor="sb-bedrooms">
                Bedrooms
              </label>
              <select id="sb-bedrooms" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={fieldValue}>
                <option value="">Any beds</option>
                {[1, 2, 3, 4].map((b) => (
                  <option key={b} value={b}>
                    {b}+ beds
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Service Type — the one Services field that genuinely filters.
            Options come from the live catalog, so the dropdown can never
            offer a category with no providers behind it. */}
        {mode === "services" && (
          <div className="min-w-0 py-5 lg:py-3 lg:px-8">
            <label className={fieldLabel} htmlFor="sb-service-type">
              Service Type
            </label>
            <select
              id="sb-service-type"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className={fieldValue}
            >
              <option value="">Any service</option>
              {SERVICE_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === "rent" && (
          <div className="min-w-0 py-5 lg:py-3 lg:px-8">
            <label className={fieldLabel} htmlFor="sb-duration">
              Duration
            </label>
            <select id="sb-duration" value={duration} onChange={(e) => setDuration(e.target.value)} className={fieldValue}>
              <option value="">Any duration</option>
              <option value="short-term">Short-Term</option>
              <option value="long-term">Long-Term</option>
            </select>
          </div>
        )}

        <div className="flex min-w-0 items-center pt-6 lg:py-3 lg:pl-8">
          <button
            onClick={handleSearch}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand-primary)] px-7 py-3.5 text-sm font-bold text-white transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-brand-primary-hover)] lg:w-auto lg:px-8"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
