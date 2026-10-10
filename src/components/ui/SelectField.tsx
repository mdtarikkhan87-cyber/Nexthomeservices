"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { IconCheck, IconChevronDown } from "@/components/ui/icons";

export interface SelectOption {
  value: string;
  label: string;
}

// Ring for every control in the search card. The global :focus-visible rule
// (Light Blue + a Dark Blue halo, and an 8px radius) is unlayered, so it beats
// plain utilities; the trailing `!` is what lets this Blue ring and the card's
// own radius win.
export const FOCUS_RING =
  "focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-[color:var(--color-brand-primary)]! focus-visible:shadow-none!";

interface SelectFieldProps {
  /** Visible small uppercase label. Omit for the compact `inline` variant. */
  label?: string;
  /** Accessible name when there is no visible label. */
  ariaLabel?: string;
  /** Used to find the field from tests and scripts. */
  fieldName?: string;
  value: string;
  /** The first option is the "any" choice, with value "". */
  options: SelectOption[];
  /** What the button shows while the "any" choice is selected, if that should
      read differently from the option in the list ("Any state"). */
  placeholder?: string;
  onChange: (value: string) => void;
  /** Adds a filter box to the panel, for the long lists. */
  searchable?: boolean;
  searchPlaceholder?: string;
  variant?: "field" | "inline";
  /** Extra classes for the panel, e.g. to right-align it. */
  panelClassName?: string;
  className?: string;
}

// A single-select dropdown built as a button + listbox, so the panel can be
// styled (a native <select> popup cannot be) while keeping real select
// behaviour: Enter/Space/ArrowDown open it; arrows, Home/End, PageUp/Down and
// type-ahead move; Enter chooses; Escape or an outside click closes.
// Focus moves into the panel while it is open and returns to the button on
// Escape or a choice.
export function SelectField({
  label,
  ariaLabel,
  fieldName,
  value,
  options,
  placeholder,
  onChange,
  searchable = false,
  searchPlaceholder = "Type to filter",
  variant = "field",
  panelClassName = "",
  className = "",
}: SelectFieldProps) {
  const uid = useId();
  const ids = {
    trigger: `${uid}-trigger`,
    label: `${uid}-label`,
    value: `${uid}-value`,
    list: `${uid}-list`,
    option: (i: number) => `${uid}-option-${i}`,
  };

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ buffer: "", at: 0 });

  const selected = options.find((o) => o.value === value) ?? options[0];
  const isPlaceholder = value === "";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // Names that start with what was typed come first ("riv" → Rivers), then
    // names that merely contain it (Cross River).
    const starts = options.filter((o) => o.label.toLowerCase().startsWith(q));
    const contains = options.filter((o) => !starts.includes(o) && o.label.toLowerCase().includes(q));
    return [...starts, ...contains];
  }, [options, query]);

  const openPanel = () => {
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const closePanel = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };
  const choose = (index: number) => {
    const option = visible[index];
    if (!option) return;
    onChange(option.value);
    closePanel(true);
  };

  // Move focus into the panel once it is mounted.
  useEffect(() => {
    if (!open) return;
    (searchable ? inputRef.current : listRef.current)?.focus();
  }, [open, searchable]);

  // Close on a press outside this field.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (open) document.getElementById(ids.option(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, query]);

  const last = visible.length - 1;
  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        return;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        return;
      case "PageDown":
        e.preventDefault();
        setActive((i) => Math.min(last, i + 8));
        return;
      case "PageUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 8));
        return;
      case "Home":
        if (!searchable) {
          e.preventDefault();
          setActive(0);
        }
        return;
      case "End":
        if (!searchable) {
          e.preventDefault();
          setActive(Math.max(0, last));
        }
        return;
      case "Enter":
        e.preventDefault();
        choose(active);
        return;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        closePanel(true);
        return;
      case "Tab":
        // Hand focus back to the button first, so the browser's own Tab then
        // moves on from there instead of from a panel that is about to unmount.
        closePanel(true);
        return;
    }

    // Type-ahead for the short lists, like a native select.
    if (!searchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now();
      const t = typeahead.current;
      t.buffer = (now - t.at > 600 ? "" : t.buffer) + e.key.toLowerCase();
      t.at = now;
      const from = t.buffer.length === 1 ? active + 1 : active;
      for (let n = 0; n < visible.length; n++) {
        const i = (from + n) % visible.length;
        if (visible[i].label.toLowerCase().startsWith(t.buffer)) {
          setActive(i);
          break;
        }
      }
    }
  };

  const activeId = visible[active] ? ids.option(active) : undefined;
  const isField = variant === "field";
  const accessibleName = label ? undefined : ariaLabel;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        id={ids.trigger}
        type="button"
        data-field={fieldName ?? label ?? ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? ids.list : undefined}
        aria-labelledby={label ? `${ids.label} ${ids.value}` : undefined}
        aria-label={accessibleName ? `${accessibleName}: ${isPlaceholder && placeholder ? placeholder : selected.label}` : undefined}
        onClick={() => (open ? closePanel(false) : openPanel())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openPanel();
          }
        }}
        className={`group flex w-full items-center justify-between gap-2 rounded-2xl! bg-[var(--color-surface-base)] text-left transition-colors duration-200 hover:bg-[var(--color-surface-base)] aria-expanded:bg-[var(--color-surface-base)] lg:bg-transparent lg:hover:bg-[var(--color-surface-base)] lg:aria-expanded:bg-[var(--color-surface-base)] ${FOCUS_RING} ${
          isField ? "min-h-14 px-4 py-2 lg:px-3.5" : "min-h-12 px-4 lg:min-h-9 lg:px-3.5 lg:py-1"
        }`}
      >
        <span className="min-w-0 flex-1">
          {label && (
            <span
              id={ids.label}
              className="block text-[11px] font-bold uppercase leading-none tracking-[0.12em] text-[var(--color-text-body)]"
            >
              {label}
            </span>
          )}
          <span
            id={ids.value}
            className={`block break-words leading-snug ${label ? "mt-1.5 text-base" : "text-sm"} font-medium ${
              isPlaceholder ? "text-[var(--color-text-body)]" : "text-[var(--color-dark-blue)]"
            }`}
          >
            {isPlaceholder && placeholder ? placeholder : selected.label}
          </span>
        </span>
        <IconChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 text-[var(--color-deep-blue)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          // Keep focus where it is when the panel's own padding is pressed.
          onMouseDown={(e) => {
            if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
          }}
          className={`u-pop absolute left-0 top-full z-50 mt-2 w-max min-w-full max-w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[color-mix(in_srgb,var(--color-dark-blue)_8%,transparent)] bg-[var(--color-surface-raised)] p-2 shadow-[0_20px_50px_-12px_rgba(23,42,58,0.3),0_2px_6px_rgba(23,42,58,0.06)] ${panelClassName}`}
        >
          {searchable && (
            <div className="px-1 pb-2">
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={ids.list}
                aria-activedescendant={activeId}
                aria-autocomplete="list"
                aria-label={searchPlaceholder}
                autoComplete="off"
                spellCheck={false}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onPanelKeyDown}
                className={`min-h-11 w-full rounded-xl bg-[var(--color-surface-base)] px-3 text-sm font-medium text-[var(--color-dark-blue)] placeholder:text-[var(--color-text-body)] outline-none ${FOCUS_RING}`}
              />
            </div>
          )}

          <ul
            ref={listRef}
            id={ids.list}
            role="listbox"
            aria-label={label ?? ariaLabel}
            tabIndex={searchable ? undefined : -1}
            aria-activedescendant={searchable ? undefined : activeId}
            onKeyDown={searchable ? undefined : onPanelKeyDown}
            className="max-h-64 overflow-y-auto overscroll-contain outline-none focus-visible:shadow-none!"
          >
            {visible.map((option, i) => {
              const isSelected = option.value === value;
              const isActive = i === active;
              return (
                <li
                  key={option.value || "__any"}
                  id={ids.option(i)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => choose(i)}
                  onMouseMove={() => active !== i && setActive(i)}
                  className={`flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl border-l-[3px] px-3 py-2 text-[15px] font-medium text-[var(--color-dark-blue)] transition-colors duration-150 ${
                    isActive ? "border-[var(--color-brand-primary)]" : "border-transparent"
                  } ${
                    isSelected
                      ? "bg-[color-mix(in_srgb,var(--color-light-blue)_28%,transparent)]"
                      : isActive
                        ? "bg-[var(--color-surface-base)]"
                        : ""
                  }`}
                >
                  <span className={isSelected ? "font-bold" : ""}>{option.label}</span>
                  {isSelected && <IconCheck aria-hidden className="h-4 w-4 shrink-0 text-[var(--color-deep-blue)]" />}
                </li>
              );
            })}
          </ul>

          {visible.length === 0 && (
            <p role="status" className="px-3 py-3 text-sm text-[var(--color-text-body)]">
              No matches
            </p>
          )}
        </div>
      )}
    </div>
  );
}
