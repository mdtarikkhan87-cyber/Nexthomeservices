import Link from "next/link";
import { IconClock, IconHome, IconShield } from "@/components/ui/icons";
import { mockListings } from "@/lib/mock-data";

// EDITORIAL REDESIGN — the page's one deliberately DENSE band.
//
// Every other section on the homepage is spacious; this one is tight and
// information-rich on purpose. Varying content density between sections is
// what stops a page reading as a stack of identical slabs, and it was the
// single biggest thing missing from the previous homepage (eight sections,
// one rhythm).
//
// PRODUCT NOTE: NextHome has no property-type taxonomy (no "Villa",
// "Duplex", "Prefab" — see lib/types.ts). Rather than invent one, every
// tile here is built from a facet the data actually has — state, and
// rent duration — and links to a real pre-filtered result set on /rent.
// Counts are computed from the live catalog, so no tile can advertise
// inventory that isn't there.
export function FacetGrid() {
  const liveRentals = mockListings.filter((l) => l.status === "live" && l.type === "rent");

  const states = Array.from(new Set(liveRentals.map((l) => l.state)))
    .map((state) => ({
      key: state,
      label: state,
      count: liveRentals.filter((l) => l.state === state).length,
      href: `/listings?mode=rent&state=${encodeURIComponent(state)}`,
      Icon: IconHome,
    }))
    .sort((a, b) => b.count - a.count);

  const durations = (["short-term", "long-term"] as const)
    .map((duration) => ({
      key: duration,
      label: duration === "short-term" ? "Short-Term" : "Long-Term",
      count: liveRentals.filter((l) => l.rentDuration === duration).length,
      href: `/listings?mode=rent&duration=${duration}`,
      Icon: IconClock,
    }))
    .filter((d) => d.count > 0);

  const tiles = [...states, ...durations].slice(0, 8);

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="u-label text-[var(--color-brand-primary-text)]">Browse by</p>
          <h2 className="u-heading mt-2 text-2xl text-[var(--color-text-primary)] sm:text-3xl">
            Where you&rsquo;re looking
          </h2>
        </div>
        <Link
          href="/listings?mode=rent"
          className="u-ui text-[13px] font-semibold text-[var(--color-brand-primary-text)] hover:underline"
        >
          All rentals
        </Link>
      </div>

      {/* 3-up at desktop, 2-up on phones — never a single column, since
          these tiles are small and scannable and stacking them would waste
          the density this section exists for.
          Three columns (not four) because the catalog yields six rental
          facets, which fills 3 × 2 exactly. A 4-column track would leave a
          ragged two-tile second row, and a half-empty final row is the
          fastest way to make a grid look unconsidered. */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {tiles.map(({ key, label, count, href, Icon }, i) => {
          // One inverted tile anchors the grid, echoing the reference's
          // single dark tile among light ones. It marks the largest real
          // inventory rather than being decorative.
          const anchored = i === 0;
          return (
            <Link
              key={key}
              href={href}
              className={`group flex items-center gap-3 rounded-[var(--radius-control)] border px-3.5 py-3 transition-colors duration-[var(--motion-duration-short)] ${
                anchored
                  ? "border-transparent bg-[var(--color-surface-inverted)] text-white hover:bg-[var(--color-deep-blue)]"
                  : "border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand-primary)]"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${anchored ? "text-[var(--color-brand-accent)]" : "text-[var(--color-brand-primary)]"}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold leading-tight">{label}</span>
                <span
                  className={`u-numeric block text-[11px] leading-tight ${
                    anchored ? "text-white/60" : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {count} home{count !== 1 ? "s" : ""}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      {/* A quiet third row of context rather than another card grid —
          keeps the band dense without repeating the tile shape. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--color-border-hairline)] pt-4">
        <span className="inline-flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
          <IconShield className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" />
          <span className="u-ui">Every listing reviewed before it goes live</span>
        </span>
        <Link
          href="/listings?mode=sale"
          className="u-ui text-[13px] font-semibold text-[var(--color-brand-primary-text)] hover:underline"
        >
          Looking to buy instead?
        </Link>
      </div>
    </section>
  );
}
