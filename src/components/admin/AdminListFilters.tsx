"use client";

import { motion } from "motion/react";
import { Input } from "@/components/ui/Input";
import { ContentItemState } from "@/lib/types";

const STATUS_FILTERS = ["all", "pending-review", "live", "rejected"] as const;
export type AdminStatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_FILTER_LABELS: Record<AdminStatusFilter, string> = {
  all: "All",
  "pending-review": "Pending",
  live: "Live",
  rejected: "Rejected",
};

/**
 * Search + status filter bar shared by admin/listings and admin/ads — both
 * pages' rows are { title, status: ContentItemState }, so the same matching
 * rule and the same controls apply to both rather than being redefined per
 * page. Pill visual style copied from AdminListingKindToggle.tsx (see its
 * note on why that one isn't imported directly here — different axis,
 * property/service vs. status — same pattern, so copied rather than forced
 * into one over-generic component).
 */
export function AdminListFilters({
  search,
  onSearchChange,
  searchPlaceholder = "Search by title",
  status,
  onStatusChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  status: AdminStatusFilter;
  onStatusChange: (status: AdminStatusFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="max-w-xs"
      />
      <div
        role="group"
        aria-label="Filter by status"
        className="relative inline-flex shrink-0 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-dense)] p-1"
      >
        {STATUS_FILTERS.map((s) => {
          const selected = s === status;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={selected}
              onClick={() => onStatusChange(s)}
              className={`relative z-10 min-h-9 min-w-[88px] rounded-full px-4 text-center text-sm font-bold transition-colors duration-[var(--motion-duration-short)] ${
                selected
                  ? "text-white"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {selected && (
                <motion.span
                  aria-hidden
                  layoutId="admin-status-filter-indicator"
                  transition={{ type: "spring", stiffness: 480, damping: 38, mass: 0.7 }}
                  className="absolute inset-0 -z-10 rounded-full bg-[var(--color-brand-primary)] shadow-[var(--elevation-xs)]"
                />
              )}
              {STATUS_FILTER_LABELS[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function filterAdminRows<T extends { title: string; status: ContentItemState }>(
  rows: T[],
  search: string,
  status: AdminStatusFilter
): T[] {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (status !== "all" && row.status !== status) return false;
    if (query && !row.title.toLowerCase().includes(query)) return false;
    return true;
  });
}
