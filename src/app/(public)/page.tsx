import Link from "next/link";
import { SearchBar } from "@/components/shared/SearchBar";
import { ProtectedLink } from "@/components/shared/AuthGate";
import { Hero } from "@/components/home/Hero";
import { FeatureBar } from "@/components/home/FeatureBar";
import { Reveal } from "@/components/home/Reveal";
import { FacetGrid } from "@/components/home/FacetGrid";
import { CuratedListings } from "@/components/home/CuratedListings";
import { TrustEditorial } from "@/components/home/TrustEditorial";
import { ServicesBand } from "@/components/home/ServicesBand";
import { mockListings } from "@/lib/mock-data";

// ============================================================================
// EDITORIAL REDESIGN — homepage composition
// ============================================================================
// The previous homepage had eight sections that all shared one container
// (max-w-6xl), one vertical rhythm (py-16 sm:py-20) and one heading unit
// (uppercase eyebrow + 3xl/4xl h2). It was competently built, but that
// uniformity is precisely what made it read as a template: nothing on the
// page told the eye what mattered more than anything else.
//
// The fix is a deliberate SCALE AND DENSITY SEQUENCE, not more decoration:
//
//   1. Hero          — asymmetric split, contained     (spacious, type-led)
//   2. Search        — overlapping panel               (functional, dense)
//   3. Facet tiles   — 4-up compact grid               (DENSEST band)
//   4. Curated grid  — one feature + supporting cards  (spacious, image-led)
//   5. Trust         — inverted split, image small     (medium, reading)
//   6. Services      — near full-bleed plate           (WIDEST, immersive)
//   7. Close         — compact bar                     (tightest, decisive)
//
// No two adjacent sections share a shape, a width, or a density. Section
// order follows the verified `marketplace-directory` pattern (Hero → search,
// Categories, Featured listings, Trust/Safety, CTA).
//
// Brand: palette, logo and Quicksand are unchanged. The reference's
// black-and-white identity is NOT imported — Dark Blue plays the role its
// black tiles played. The only addition is Inter as a UI-data face
// (see layout.tsx), which never touches display type.
export default function HomePage() {
  const live = mockListings.filter((l) => l.status === "live");
  // A verified home with gallery depth makes the strongest hero plate; fall
  // back through progressively looser criteria rather than hard-coding an id.
  const heroListing =
    live.find((l) => l.verified && (l.galleryUrls?.length ?? 0) > 2) ?? live[0] ?? mockListings[0];

  return (
    <div>
      <Hero listing={heroListing} />

      {/* ---- TASK 2: Rent / Buy / Services search — its own section, pulled
           up so it STRADDLES the hero's bottom edge: roughly half the card
           sits over the photograph, half below it.

           The overlap is scaled per breakpoint rather than fixed. The card is
           much taller on a phone (fields stack), so a single -6rem that reads
           as a neat straddle on desktop would swallow the mobile image
           whole. `z-20` keeps it above the hero's photograph.

           The component itself is untouched — this is placement only. ---- */}
      <div className="relative z-20 -mt-10 sm:-mt-14 lg:-mt-[8.5rem]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SearchBar />
        </div>
      </div>

      {/* TASK 4 — dark feature bar, directly below the search section. */}
      <FeatureBar />

      <Reveal><FacetGrid /></Reveal>

      {/* Hairline instead of a filled divider — the section change is
          carried by scale and density, so the rule only needs to whisper. */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-t border-[var(--color-border-hairline)]" />
      </div>

      <Reveal><CuratedListings /></Reveal>

      <Reveal><TrustEditorial /></Reveal>

      <Reveal><ServicesBand /></Reveal>

      {/* ---- Close: the tightest band on the page. Deliberately not another
           full-height dark chapter — the trust section already carried the
           inverted weight, and repeating it would flatten the sequence. ---- */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col gap-6 border-t border-[var(--color-border-hairline)] pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="u-heading max-w-sm text-2xl text-[var(--color-text-primary)] sm:text-3xl">
              Ready to find your next home?
            </h2>
            <p className="u-ui mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">
              Browsing is free and open — no account needed until you save, message or list.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Link
              href="/rent"
              className="inline-flex items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand-primary)] px-5 py-3 text-sm font-bold text-white transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-brand-primary-hover)]"
            >
              Browse listings
            </Link>
            {/* Posting is a protected action — ProtectedLink prompts in
                place for guests instead of bouncing them into a gated route. */}
            <ProtectedLink
              href="/dashboard/listings/new"
              actionLabel="Log in to post a property"
              suggestedRole="landlord"
              className="inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border-default)] px-5 py-3 text-sm font-bold text-[var(--color-text-primary)] transition-colors duration-[var(--motion-duration-short)] hover:border-[var(--color-deep-blue)]"
            >
              Post a property
            </ProtectedLink>
          </div>
        </div>
      </section>
    </div>
  );
}
