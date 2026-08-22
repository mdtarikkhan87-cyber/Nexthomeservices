"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { IconArrowRight } from "@/components/ui/icons";
import { mockListings } from "@/lib/mock-data";
import { ListingType } from "@/lib/types";

// EDITORIAL REDESIGN — a curated, deliberately UNEVEN grid.
//
// The previous version placed same-size cards in a row, which is the
// "boring 3-column" shape. Here one listing is promoted to a feature plate
// spanning two columns while the rest run as smaller supporting cards, so
// the eye enters at a clear point and then scans. The asymmetry is the
// point: it mirrors how a property magazine spreads one hero image against
// a gutter of smaller plates.
//
// The Rent/Buy control filters this preview in place — it is NOT a
// substitute for the dedicated /rent and /buy routes, which remain the real
// destinations (and are linked from "View all" beside it).
export function CuratedListings() {
  const [mode, setMode] = useState<ListingType>("rent");

  const listings = useMemo(
    () => mockListings.filter((l) => l.status === "live" && l.type === mode).slice(0, 5),
    [mode]
  );

  const [feature, ...supporting] = listings;
  if (!feature) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="u-label text-[var(--color-brand-primary-text)]">Recently listed</p>
          <h2 className="u-heading mt-2 max-w-md text-3xl text-[var(--color-text-primary)] sm:text-[2.5rem]">
            Homes worth a closer look
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Segmented control, echoing the reference's Buying/Selling
              switch. Real radio semantics, not two styled divs. */}
          <div
            role="radiogroup"
            aria-label="Filter recently listed homes"
            className="inline-flex rounded-[var(--radius-control)] bg-[var(--color-surface-dense)] p-1"
          >
            {(["rent", "sale"] as const).map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={`u-ui rounded-[var(--radius-control)] px-4 py-2 text-[13px] font-semibold transition-colors duration-[var(--motion-duration-short)] ${
                  mode === m
                    ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-[var(--elevation-xs)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {m === "rent" ? "Renting" : "Buying"}
              </button>
            ))}
          </div>

          <Link
            href={mode === "rent" ? "/rent" : "/buy"}
            className="group u-ui inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-brand-primary-text)] hover:underline"
          >
            View all
            <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* One feature plate (2 cols) + a supporting gutter, then a lower run
          of three. Falls back to a plain single column on phones, where any
          asymmetry would just be arbitrary. */}
      <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <PropertyCard listing={feature} featured />
        </div>
        {supporting.slice(0, 1).map((l) => (
          <PropertyCard key={l.id} listing={l} />
        ))}
        {supporting.slice(1, 4).map((l) => (
          <PropertyCard key={l.id} listing={l} />
        ))}
      </div>
    </section>
  );
}
