"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Container } from "@/components/ui/Container";
import { IconArrowRight } from "@/components/ui/icons";
import { ListingType, PropertyListing } from "@/lib/types";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";

// A curated, deliberately UNEVEN grid: one listing is promoted to a feature
// plate spanning two columns while the rest run as smaller supporting cards,
// so the eye enters at a clear point and then scans.
//
// The Rent/Buy control filters this preview in place — it is NOT a
// substitute for the dedicated /listings route, which stays the real
// destination (linked from "View all" beside it).
//
// `listings` comes from the homepage's single server-side fetch (see
// app/(public)/page.tsx) — every entry is already "live", so only the
// rent/sale split needs to happen here.
export function CuratedListings({ listings }: { listings: PropertyListing[] }) {
  const [mode, setMode] = useState<ListingType>("rent");

  const filtered = useMemo(
    () => listings.filter((l) => l.type === mode).slice(0, 5),
    [listings, mode]
  );

  const [feature, ...supporting] = filtered;
  if (!feature) return null;

  return (
    <section className="bg-[var(--color-surface-raised)] py-20 md:py-24 lg:py-28">
      <Container>
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div>
              <Eyebrow>Recently listed</Eyebrow>
              <h2 className="u-heading mt-3 max-w-md text-3xl text-[var(--color-text-primary)] sm:text-4xl">
                Homes worth a closer look
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Segmented control. Real radio semantics, not two styled divs. */}
              <div
                role="radiogroup"
                aria-label="Filter recently listed homes"
                className="inline-flex rounded-xl bg-[var(--color-surface-dense)] p-1"
              >
                {(["rent", "sale"] as const).map((m) => (
                  <button
                    key={m}
                    role="radio"
                    aria-checked={mode === m}
                    onClick={() => setMode(m)}
                    className={`u-ui min-h-11 rounded-lg px-4 text-sm font-bold transition-colors duration-[var(--motion-duration-short)] ${
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
                href={`/listings?mode=${mode}`}
                className="group u-ui inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[var(--color-brand-primary-text)] hover:underline"
              >
                View all
                <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* One feature plate (2 cols) + supporting cards. A plain single
              column on phones, where any asymmetry would just be arbitrary. */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            <div className="md:col-span-2">
              <PropertyCard listing={feature} featured />
            </div>
            {supporting.slice(0, 4).map((l) => (
              <PropertyCard key={l.id} listing={l} />
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
