"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentType, type KeyboardEvent, type SVGAttributes } from "react";
import PhoneInputBase, { type Country, getCountries, getCountryCallingCode } from "react-phone-number-input";
import { getExampleNumber } from "libphonenumber-js/min";
import examples from "libphonenumber-js/examples.mobile.json";
import rawFlags from "react-phone-number-input/flags";
import en from "react-phone-number-input/locale/en.json";
import { Label, FieldError } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

// The library's own types only declare `title` on flag components, but at
// runtime every flag forwards the rest of its props straight onto the <svg>
// (see country-flag-icons/react/3x2) — this recasts them so `className` and
// `aria-hidden` type-check without touching runtime behavior.
type FlagComponent = ComponentType<SVGAttributes<SVGSVGElement> & { title?: string }>;
const flags = rawFlags as Partial<Record<Country, FlagComponent>>;

// ===========================================================================
// INTERNATIONAL PHONE FIELD
// ===========================================================================
// Built on react-phone-number-input (wraps libphonenumber-js) rather than a
// hand-rolled country/code list, per the brief. Three things it does NOT
// give us out of the box, so they're added here:
//
//   1. A SEARCHABLE country dropdown — its default country select is a plain
//      native <select> (browser type-ahead only). `SearchableCountrySelect`
//      below replaces it with a text-filterable listbox, still passed in
//      through the library's own `countrySelectComponent` extension point.
//   2. A country-specific PLACEHOLDER — the library formats what you type,
//      but doesn't supply an example number to show before you start typing.
//      `libphonenumber-js`'s example-numbers dataset fills that in.
//   3. Locale-based default country detection (browser `navigator.language`),
//      since the library only accepts a fixed `defaultCountry`.
//
// The value this component hands back is always either `undefined` or a
// complete E.164 string (e.g. "+2348001234567") — that's the library's
// native internal representation, not a conversion step we perform.
// ===========================================================================

const ALL_COUNTRIES = getCountries();

function detectDefaultCountry(): Country {
  if (typeof navigator === "undefined") return "NG";
  const tags = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  for (const tag of tags) {
    const region = tag?.split("-")[1]?.toUpperCase();
    if (region && (ALL_COUNTRIES as readonly string[]).includes(region)) {
      return region as Country;
    }
  }
  // NextHome's home market — the same fallback the rest of the product
  // already assumes (see the old hard-coded "+234" placeholder this replaces).
  return "NG";
}

function countryPlaceholder(country?: Country): string {
  if (!country) return "Phone number";
  const example = getExampleNumber(country, examples);
  return example ? example.formatNational() : "Phone number";
}

interface CountryOption {
  value?: Country;
  label: string;
  divider?: boolean;
}

function SearchableCountrySelect({
  value,
  onChange,
  options,
  disabled,
  "aria-label": ariaLabel,
}: {
  value?: Country;
  onChange: (country?: Country) => void;
  options: CountryOption[];
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const realOptions = useMemo(
    () => options.filter((o): o is { value: Country; label: string } => !!o.value && !o.divider),
    [options]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return realOptions;
    return realOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [realOptions, query]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Focusing the search box is a DOM side effect, not a state sync, so it
  // stays in an effect — but resetting `query`/`activeIndex` moves to
  // `openMenu` below instead of living here, so opening never fires a
  // setState-in-effect cascade.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const selected = realOptions.find((o) => o.value === value);
  const SelectedFlag = value ? flags[value] : undefined;

  function openMenu() {
    setQuery("");
    setActiveIndex(Math.max(0, realOptions.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function onSearchChange(next: string) {
    setQuery(next);
    setActiveIndex(0);
  }

  function selectCountry(country: Country) {
    onChange(country);
    setOpen(false);
  }

  function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt?.value) selectCountry(opt.value);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || "Country calling code"}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="flex h-full min-h-11 items-center gap-1.5 rounded-l-[var(--radius-control)] border-r border-[var(--color-border-hairline)] px-3 text-sm font-bold text-[var(--color-text-primary)] transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-surface-dense)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {SelectedFlag ? (
          <SelectedFlag title={selected?.label ?? ""} aria-hidden className="h-4 w-6 shrink-0 rounded-[2px]" />
        ) : (
          <span aria-hidden className="h-4 w-6 shrink-0" />
        )}
        <span className="u-numeric">{value ? `+${getCountryCallingCode(value)}` : "+--"}</span>
        <svg aria-hidden viewBox="0 0 20 20" className={cn("h-3.5 w-3.5 text-[var(--color-text-secondary)] transition-transform duration-[var(--motion-duration-short)]", open && "rotate-180")}>
          <path d="M5 7l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="presentation"
          className="absolute left-0 top-full z-50 mt-1.5 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] shadow-[var(--elevation-lg)]"
        >
          <input
            ref={searchRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search country…"
            className="w-full border-b border-[var(--color-border-hairline)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]/60"
          />
          <ul id={listboxId} role="listbox" aria-label="Countries" className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-[var(--color-text-secondary)]">No matching countries</li>
            )}
            {filtered.map((o, i) => {
              const OptFlag = o.value ? flags[o.value] : undefined;
              return (
                <li key={o.value} role="option" aria-selected={o.value === value}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => o.value && selectCountry(o.value)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 text-left text-sm",
                      i === activeIndex && "bg-[var(--color-surface-dense)]",
                      o.value === value ? "font-bold text-[var(--color-brand-primary-text)]" : "text-[var(--color-text-primary)]"
                    )}
                  >
                    {OptFlag ? (
                      <OptFlag title={o.label} aria-hidden className="h-4 w-6 shrink-0 rounded-[2px]" />
                    ) : (
                      <span aria-hidden className="h-4 w-6 shrink-0" />
                    )}
                    <span className="flex-1 truncate">{o.label}</span>
                    <span className="u-numeric shrink-0 text-[var(--color-text-secondary)]">
                      +{getCountryCallingCode(o.value as Country)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export interface PhoneNumberFieldProps {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  error?: string;
  hint?: string;
  required?: boolean;
}

/** Same label/helper-text/error styling as every other field in `Input.tsx`. */
export function PhoneNumberField({ id, label, value, onChange, error, hint, required }: PhoneNumberFieldProps) {
  // Locale-derived default, computed once on mount (not during SSR, where
  // there's no `navigator`) — the library itself owns country state after
  // that, including whatever the user picks from the dropdown.
  const [defaultCountry] = useState<Country>(() => detectDefaultCountry());
  const [country, setCountry] = useState<Country | undefined>(defaultCountry);

  return (
    <div>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-[var(--color-status-rejected)]"> *</span>}
      </Label>
      <PhoneInputBase
        id={id}
        defaultCountry={defaultCountry}
        countries={ALL_COUNTRIES}
        labels={en}
        value={value}
        onChange={onChange}
        onCountryChange={setCountry}
        countrySelectComponent={SearchableCountrySelect}
        numberInputProps={{
          placeholder: countryPlaceholder(country),
          className:
            "min-w-0 flex-1 rounded-r-[var(--radius-control)] border-none bg-transparent px-3 py-3 text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]/60",
        }}
        className={cn(
          "flex items-stretch rounded-[var(--radius-control)] border bg-[var(--color-surface-raised)] transition-[border-color,box-shadow] duration-[var(--motion-duration-short)]",
          "focus-within:border-[var(--color-brand-accent)] focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-dark-blue)_12%,transparent)]",
          error
            ? "border-[var(--color-status-rejected)]"
            : "border-[var(--color-border-default)] hover:border-[var(--color-deep-blue)]/40"
        )}
      />
      {hint && !error && <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{hint}</p>}
      <FieldError error={error} />
    </div>
  );
}
