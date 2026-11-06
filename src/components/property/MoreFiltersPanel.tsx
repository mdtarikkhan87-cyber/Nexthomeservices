"use client";

import { ComponentType, ReactNode, SVGProps, useId, useState } from "react";
import { Overlay } from "@/components/ui/Overlay";
import { Select } from "@/components/ui/Input";
import {
  IconBath,
  IconBuilding,
  IconBungalow,
  IconCalendar,
  IconCheck,
  IconHome,
  IconInfo,
} from "@/components/ui/icons";
import { ListingFilters, NEW_LISTING_DAYS, PROPERTY_GROUPS, PropertyGroup } from "@/lib/listing-filters";
import { AMENITY_LABELS, Amenity, ListingType } from "@/lib/types";

// The "More filters" panel: the filters that sit behind the primary four
// (state, area, price, bedrooms). It edits a DRAFT and only changes the
// results when "Apply Filters" is pressed; "Clear all" empties the draft.
//
// Only filters the data can actually answer are here. Not built, because the
// listing data has nothing to filter on: a Land property type, the Garden, Pet
// friendly and Wheelchair access features, and the Reduced price and Featured
// listing types.

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const SECTION_LABEL = "u-ui mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-[var(--color-text-primary)]";

// Property type: single-select buttons. "" is "Any".
const TYPE_OPTIONS: { value: "" | PropertyGroup; label: string; Icon: Icon }[] = [
  { value: "", label: "Any", Icon: IconCheck },
  { value: "house", label: PROPERTY_GROUPS.house.label, Icon: IconHome },
  { value: "flat", label: PROPERTY_GROUPS.flat.label, Icon: IconBuilding },
  { value: "bungalow", label: PROPERTY_GROUPS.bungalow.label, Icon: IconBungalow },
];

// Features: the three the client asked for that the data supports, then the
// other amenities listings already carry (kept so no existing filter is lost).
const FEATURE_AMENITIES: Amenity[] = [
  "parking",
  "balcony",
  "borehole",
  "power-backup",
  "gated-security",
  "air-conditioning",
  "fitted-kitchen",
  "swimming-pool",
];

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--color-text-secondary)]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-[var(--motion-duration-short)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-brand-primary)] ${
          checked
            ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white"
            : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)]"
        }`}
      >
        {checked && <IconCheck className="h-3 w-3" />}
      </span>
      <span className="u-ui">{children}</span>
    </label>
  );
}

function Radio({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--color-text-secondary)]">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors duration-[var(--motion-duration-short)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-brand-primary)] ${
          checked ? "border-[var(--color-brand-primary)]" : "border-[var(--color-border-default)]"
        }`}
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-brand-primary)]" />}
      </span>
      <span className="u-ui">{children}</span>
    </label>
  );
}

/** Select with an icon on its left. */
function IconSelect({ id, Icon, value, onChange, children }: { id: string; Icon: Icon; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <div className="relative">
      <Icon aria-hidden className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[var(--color-deep-blue)]" />
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="pl-12!">
        {children}
      </Select>
    </div>
  );
}

export function MoreFiltersPanel({
  mode,
  initial,
  onApply,
  onClose,
}: {
  mode: ListingType;
  initial: ListingFilters;
  onApply: (next: ListingFilters) => void;
  onClose: () => void;
}) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const tipId = `${uid}-tip`;
  const [draft, setDraft] = useState<ListingFilters>(initial);
  const set = <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const toggleAmenity = (a: Amenity, on: boolean) =>
    setDraft((d) => ({ ...d, amenities: on ? [...d.amenities, a] : d.amenities.filter((x) => x !== a) }));

  const clearAll = () =>
    setDraft((d) => ({
      ...d,
      propertyType: "",
      bathrooms: "",
      duration: "",
      furnishing: "",
      amenities: [],
      verifiedOnly: false,
      listingType: "",
    }));

  const rent = mode === "rent";

  return (
    <Overlay onDismiss={onClose} labelledBy={titleId} align="bottom-on-mobile" maxWidth="max-w-lg">
      <div className="-m-6 flex max-h-[85dvh] flex-col">
        <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] px-6 py-4">
          <h2 id={titleId} className="text-lg font-bold text-[var(--color-text-primary)]">
            More filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full! text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)]"
          >
            <span aria-hidden className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
          <fieldset>
            <legend className={SECTION_LABEL}>Property Type</legend>
            <div role="radiogroup" aria-label="Property Type" className="grid grid-cols-4 gap-2">
              {TYPE_OPTIONS.map(({ value, label, Icon }) => {
                const selected = draft.propertyType === value;
                return (
                  <button
                    key={value || "any"}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set("propertyType", value)}
                    className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-center text-xs font-bold leading-tight transition-colors duration-[var(--motion-duration-short)] ${
                      selected
                        ? "border-[var(--color-brand-primary)] bg-[color-mix(in_srgb,var(--color-brand-primary)_10%,transparent)] text-[var(--color-brand-primary-text)]"
                        : "border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-deep-blue)]/40"
                    }`}
                  >
                    <Icon aria-hidden className="h-5 w-5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label className={SECTION_LABEL} htmlFor={`${uid}-baths`}>
              Bathrooms
            </label>
            <IconSelect id={`${uid}-baths`} Icon={IconBath} value={draft.bathrooms} onChange={(v) => set("bathrooms", v)}>
              <option value="">Any bathrooms</option>
              {[1, 2, 3, 4].map((b) => (
                <option key={b} value={b}>
                  {b}+ bathrooms
                </option>
              ))}
            </IconSelect>
          </div>

          <fieldset>
            <legend className={SECTION_LABEL}>Features &amp; Amenities</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              {rent && (
                <Check checked={draft.furnishing === "furnished"} onChange={(on) => set("furnishing", on ? "furnished" : "")}>
                  Furnished
                </Check>
              )}
              {FEATURE_AMENITIES.map((a) => (
                <Check key={a} checked={draft.amenities.includes(a)} onChange={(on) => toggleAmenity(a, on)}>
                  {AMENITY_LABELS[a]}
                </Check>
              ))}
            </div>
          </fieldset>

          {rent && (
            <div>
              <label className={SECTION_LABEL} htmlFor={`${uid}-duration`}>
                Availability <span className="font-medium text-[var(--color-text-secondary)]">(Rent only)</span>
              </label>
              <IconSelect id={`${uid}-duration`} Icon={IconCalendar} value={draft.duration} onChange={(v) => set("duration", v)}>
                <option value="">Any rental period</option>
                <option value="short-term">Short-Term</option>
                <option value="long-term">Long-Term</option>
              </IconSelect>
            </div>
          )}

          <fieldset>
            <legend className={SECTION_LABEL}>
              Listing Type
              <span className="group relative inline-flex">
                <button
                  type="button"
                  aria-describedby={tipId}
                  aria-label="About listing types"
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-deep-blue)]"
                >
                  <IconInfo className="h-4 w-4" />
                </button>
                <span
                  id={tipId}
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg bg-[var(--color-dark-blue)] px-3 py-2 text-xs font-medium leading-snug text-white opacity-0 shadow-[var(--elevation-md)] transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
                >
                  New listings are ones added in the last {NEW_LISTING_DAYS} days.
                </span>
              </span>
            </legend>
            <div className="flex flex-col gap-3">
              <Radio name={`${uid}-listing-type`} checked={draft.listingType === ""} onChange={() => set("listingType", "")}>
                Any listing
              </Radio>
              <Radio name={`${uid}-listing-type`} checked={draft.listingType === "new"} onChange={() => set("listingType", "new")}>
                New listings only
              </Radio>
            </div>
          </fieldset>

          <div className="border-t border-[var(--color-border-hairline)] pt-4">
            <Check checked={draft.verifiedOnly} onChange={(on) => set("verifiedOnly", on)}>
              <span className="font-semibold text-[var(--color-text-primary)]">Verified listings only</span>
            </Check>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border-hairline)] px-6 py-4">
          <button
            type="button"
            onClick={clearAll}
            className="u-ui min-h-11 text-sm font-bold text-[var(--color-brand-primary-text)] hover:underline"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand-primary)] px-6 text-base font-bold text-white shadow-[var(--elevation-xs)] transition-[background-color,box-shadow] duration-[var(--motion-duration-short)] hover:bg-[var(--color-brand-primary-hover)] hover:shadow-[var(--elevation-sm)]"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </Overlay>
  );
}
