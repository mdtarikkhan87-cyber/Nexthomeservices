"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { FOCUS_RING, SelectField } from "@/components/ui/SelectField";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";
import { NIGERIAN_STATES, lgasForState } from "@/lib/nigeria-locations";

// Same list the provider signup form and the /services directory filter use,
// so this dropdown and the directory can never disagree about what exists.
const SERVICE_TYPES = [...SERVICE_CATEGORIES].sort();

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

const TABS: { value: SearchMode; label: string }[] = [
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "services", label: "Services" },
];

const BEDROOM_OPTIONS = [
  { value: "", label: "Any beds" },
  ...[1, 2, 3, 4].map((b) => ({ value: String(b), label: `${b}+ beds` })),
];

const DURATION_OPTIONS = [
  { value: "", label: "Any duration" },
  { value: "short-term", label: "Short-Term" },
  { value: "long-term", label: "Long-Term" },
];

const STATE_OPTIONS_BASE = NIGERIAN_STATES.map((s) => ({ value: s, label: s }));

// One floating card: the mode toggle on top, then the fields, then Search.
// Layout follows RESPONSIVE_STRATEGY.md's tiers —
//   Compact / Medium (<lg)  stacked: Location full width, Price and Bedrooms
//                           side by side, Duration full width, Search full
//                           width; every control at least 48px tall.
//   Wide (lg)               one row: Location (widest) · Price · Bedrooms ·
//                           Duration · Search, with hairline dividers.
// Only the markup changed in the redesign; the state, the option lists, the
// resets and the URLs built below are exactly what they were.
export function SearchBar({ initialMode = "rent" }: { initialMode?: SearchMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [state, setState] = useState("");
  // LGA is state-scoped, so it is cleared whenever the state changes rather
  // than being allowed to go stale against a state that does not contain it.
  const [lga, setLga] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [duration, setDuration] = useState("");
  const [serviceType, setServiceType] = useState("");

  // The Buy/Rent tabs choose the DESTINATION ROUTE now — `mode` is no
  // longer carried as a query param into a shared /search page, it selects
  // /buy or /rent. The filter params themselves are unchanged.
  const handleSearch = () => {
    // Services routes to its own directory, and now carries location with it:
    // ServiceListing has a state and an LGA (added when the directory gained
    // its location filter), so these params land as real, applied filters
    // rather than the no-op they would have been before.
    if (mode === "services") {
      const p = new URLSearchParams();
      if (serviceType) p.set("category", serviceType);
      if (state) p.set("state", state);
      if (state && lga) p.set("lga", lga);
      const qs = p.toString();
      router.push(`/services${qs ? `?${qs}` : ""}`);
      return;
    }

    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (state && lga) params.set("lga", lga);
    if (priceRange) params.set("price", priceRange);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (mode === "rent" && duration) params.set("duration", duration);
    // ROUTE MERGE (Website Revision Spec §3C): Buy and Rent are one page
    // now, so the tab selects a ?mode= on the shared /listings route rather
    // than a destination route. The filter params are unchanged.
    params.set("mode", mode);
    router.push(`/listings?${params.toString()}`);
  };

  // Rent and sale prices are on different scales, so the bucket list (and the
  // selected bucket) follow the mode. Services has no price.
  const priceOptions = useMemo(
    () => (mode === "services" ? [] : [{ value: "", label: "Any price" }, ...PRICE_RANGES[mode]]),
    [mode]
  );
  const stateOptions = useMemo(
    () => [{ value: "", label: "Any state" }, ...STATE_OPTIONS_BASE],
    []
  );
  const lgaOptions = useMemo(
    () => (state ? [{ value: "", label: `All LGAs in ${state}` }, ...lgasForState(state).map((l) => ({ value: l, label: l }))] : []),
    [state]
  );
  const serviceOptions = useMemo(
    () => [{ value: "", label: "Any service" }, ...SERVICE_TYPES.map((c) => ({ value: c, label: c }))],
    []
  );

  // Switching mode clears the price: rent/sale buckets use different scales.
  const selectMode = (next: SearchMode) => {
    setMode(next);
    setPriceRange("");
  };

  // Segmented control keyboard: arrows (and Home/End) move and select, with a
  // roving tab stop so Tab passes through the control once.
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % TABS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    selectMode(TABS[next].value);
    tabRefs.current[next]?.focus();
  };
  const modeIndex = TABS.findIndex((t) => t.value === mode);

  // From `lg`, the field columns depend on the mode: Duration exists only in
  // Rent, and Services swaps price/beds/duration for a service type. The
  // Location column is always the widest.
  const columns =
    mode === "rent"
      ? "lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)]"
      : mode === "sale"
        ? "lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1.1fr)_minmax(0,0.9fr)]"
        : "lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]";

  // A hairline divider before every field after the first, from `lg`.
  const cell =
    "relative min-w-0 lg:px-1 lg:before:absolute lg:before:inset-y-3 lg:before:left-0 lg:before:w-px lg:before:bg-[color-mix(in_srgb,var(--color-dark-blue)_12%,transparent)] lg:first:before:hidden";

  return (
    <div
      role="search"
      aria-label="Search homes and services"
      className="w-full max-w-full rounded-3xl border border-[color-mix(in_srgb,var(--color-dark-blue)_8%,transparent)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--elevation-float)] sm:p-5 lg:p-6"
    >
      {/* Mode toggle. Only Buy/Rent/Services are real, approved search modes
          (PRODUCT_UNDERSTANDING.md §5, PRD §4). The Blue pill slides under
          the active label. */}
      <div
        role="radiogroup"
        aria-label="Search for"
        className="relative grid w-full grid-cols-3 rounded-full bg-[var(--color-surface-base)] p-1 md:w-[22rem]"
      >
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-[var(--color-brand-primary)] shadow-[0_2px_8px_-2px_rgba(4,146,194,0.5)] transition-transform duration-200 ease-out"
          style={{ transform: `translateX(${modeIndex * 100}%)` }}
        />
        {TABS.map((tab, i) => {
          const isActive = mode === tab.value;
          return (
            <button
              key={tab.value}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectMode(tab.value)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={`u-ui relative z-10 min-h-12 rounded-full! px-4 text-[15px] font-bold transition-colors duration-200 ${FOCUS_RING} ${
                isActive ? "text-white" : "text-[var(--color-dark-blue)] hover:text-[var(--color-deep-blue)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:mt-5 lg:flex-row lg:items-center lg:gap-4">
        <div className={`grid min-w-0 grid-cols-2 gap-3 lg:flex-1 lg:gap-0 ${columns}`}>
          {/* Location. Kept a dropdown, not free text — PRD §4: "Location
              filtering uses a dropdown list of states rather than free text,
              so results stay accurate." Live in every mode, Services included.
              The LGA picker sits INSIDE this field and appears only once a
              state is chosen: an LGA name is only unambiguous within its
              state. */}
          <div className={`${cell} col-span-2 flex flex-col gap-3 lg:col-span-1 lg:gap-0`}>
            <SelectField
              label="Location"
              value={state}
              options={stateOptions}
              // The old prompt, kept as the field's resting text in Rent and Buy.
              placeholder={mode === "services" ? "Any state" : "State, locality or area"}
              searchable
              searchPlaceholder="Search states"
              onChange={(v) => {
                setState(v);
                setLga("");
              }}
            />
            {state && (
              <SelectField
                variant="inline"
                ariaLabel="Local Government Area"
                fieldName="Local Government Area"
                value={lga}
                options={lgaOptions}
                searchable
                searchPlaceholder="Search areas"
                onChange={setLga}
              />
            )}
          </div>

          {/* Property-only fields. `PRICE_RANGES[mode]` is indexed above, which
              is exactly why the services mode must not reach this branch —
              PRICE_RANGES has no "services" key. */}
          {mode !== "services" && (
            <>
              <div className={cell}>
                <SelectField label="Price" value={priceRange} options={priceOptions} onChange={setPriceRange} />
              </div>
              <div className={cell}>
                <SelectField
                  label="Bedrooms"
                  value={bedrooms}
                  options={BEDROOM_OPTIONS}
                  onChange={setBedrooms}
                  panelClassName="right-0 left-auto lg:left-0 lg:right-auto"
                />
              </div>
            </>
          )}

          {/* Service Type — the one Services field that genuinely filters.
              Options come from the live catalog, so the dropdown can never
              offer a category with no providers behind it. */}
          {mode === "services" && (
            <div className={`${cell} col-span-2 lg:col-span-1`}>
              <SelectField label="Service type" value={serviceType} options={serviceOptions} onChange={setServiceType} />
            </div>
          )}

          {mode === "rent" && (
            <div className={`${cell} col-span-2 lg:col-span-1`}>
              <SelectField label="Duration" value={duration} options={DURATION_OPTIONS} onChange={setDuration} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSearch}
          className={`inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl! bg-[var(--color-brand-primary)] px-8 text-base font-bold text-white shadow-[0_8px_20px_-8px_rgba(4,146,194,0.6)] transition-[background-color,transform,box-shadow] duration-200 hover:bg-[var(--color-deep-blue)] active:scale-[0.97] lg:w-auto lg:shrink-0 ${FOCUS_RING}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Search
        </button>
      </div>
    </div>
  );
}
