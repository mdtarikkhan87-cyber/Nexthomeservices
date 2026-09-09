"use client";

import { motion } from "motion/react";

const KINDS = ["property", "service"] as const;
type ListingKind = (typeof KINDS)[number];

const KIND_LABELS: Record<ListingKind, string> = {
  property: "Properties",
  service: "Services",
};

/**
 * Scoped copy of the pill-toggle pattern in
 * src/components/property/ListingModeToggle.tsx, for the admin Listings page
 * only. Not imported directly — that component is typed to ListingType
 * ("rent" | "sale") for the public Buy/Rent switch, a different axis than
 * property-vs-service, so reusing it would mean loosening its type for an
 * unrelated caller rather than a real shared abstraction.
 */
export function AdminListingKindToggle({
  kind,
  onChange,
}: {
  kind: ListingKind;
  onChange: (kind: ListingKind) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Show property or service listings"
      className="relative inline-flex shrink-0 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-dense)] p-1"
    >
      {KINDS.map((k) => {
        const selected = k === kind;
        return (
          <button
            key={k}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(k)}
            className={`relative z-10 min-h-9 min-w-[104px] rounded-full px-4 text-center text-sm font-bold transition-colors duration-[var(--motion-duration-short)] ${
              selected
                ? "text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {selected && (
              <motion.span
                aria-hidden
                layoutId="admin-listing-kind-indicator"
                transition={{ type: "spring", stiffness: 480, damping: 38, mass: 0.7 }}
                className="absolute inset-0 -z-10 rounded-full bg-[var(--color-brand-primary)] shadow-[var(--elevation-xs)]"
              />
            )}
            {KIND_LABELS[k]}
          </button>
        );
      })}
    </div>
  );
}

export type { ListingKind };
