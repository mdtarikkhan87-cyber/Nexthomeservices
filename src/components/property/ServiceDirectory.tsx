"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IconArrowRight } from "@/components/ui/icons";
import { mockServices } from "@/lib/mock-data";

// The card treatment below is unchanged from the previous flat list — only
// a category filter was added in front of it, so the directory stays
// scannable as more trades are added rather than growing into one long
// undifferentiated grid. Chips reuse the SearchBar tab pill styling
// (brand-primary when selected, dense surface on hover) rather than
// introducing a new control.
export function ServiceDirectory() {
  const categories = useMemo(() => Array.from(new Set(mockServices.map((s) => s.category))).sort(), []);

  // Seeded from the URL so the homepage Services search actually lands on a
  // filtered directory. Validated against the real category list — an
  // unknown ?category= falls back to "all" rather than rendering an empty
  // grid the chips give no way to escape.
  const searchParams = useSearchParams();
  const requested = searchParams.get("category") ?? "";
  const [category, setCategory] = useState<string>(
    categories.includes(requested) ? requested : ""
  );

  const results = useMemo(
    () => (category ? mockServices.filter((s) => s.category === category) : mockServices),
    [category],
  );

  const chipClass =
    "u-ui inline-flex shrink-0 items-center rounded-full px-4 py-2 text-[13px] font-semibold transition-colors duration-[var(--motion-duration-short)]";

  return (
    <>
      <div className="mt-7 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by service category">
        {[{ value: "", label: "All services" }, ...categories.map((c) => ({ value: c, label: c }))].map((chip) => (
          <button
            key={chip.value || "all"}
            onClick={() => setCategory(chip.value)}
            aria-pressed={category === chip.value}
            className={`${chipClass} ${
              category === chip.value
                ? "bg-[var(--color-brand-primary)] text-white shadow-[var(--elevation-xs)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dense)]"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <p className="u-ui mt-6 text-[13px] font-semibold text-[var(--color-text-secondary)]">
        <span className="u-numeric text-[var(--color-text-primary)]">{results.length}</span> provider{results.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {results.map((s) => (
          <Link
            key={s.id}
            href={`/services/${s.id}`}
            className="group flex gap-4 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 transition-colors duration-[var(--motion-duration-standard)] hover:border-[var(--color-brand-primary)]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10 text-lg font-bold text-[var(--color-brand-primary)]">
              {s.category[0]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="u-label text-[var(--color-brand-primary-text)]">{s.category}</span>
                {s.verified && <StatusBadge kind="verified" dense />}
              </div>
              <p className="mt-1.5 font-bold text-[var(--color-text-primary)]">{s.providerName}</p>
              <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">{s.description}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-brand-primary-text)] opacity-0 transition-opacity duration-[var(--motion-duration-short)] group-hover:opacity-100">
                View details
                <IconArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
