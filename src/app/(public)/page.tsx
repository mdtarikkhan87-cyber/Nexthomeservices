import { SearchBar } from "@/components/shared/SearchBar";
import { ClosingCta } from "@/components/home/ClosingCta";
import { Hero } from "@/components/home/Hero";
import { FeatureBar } from "@/components/home/FeatureBar";
import { Reveal } from "@/components/home/Reveal";
import { FacetGrid } from "@/components/home/FacetGrid";
import { CuratedListings } from "@/components/home/CuratedListings";
import { TrustEditorial } from "@/components/home/TrustEditorial";
import { ServicesBand } from "@/components/home/ServicesBand";
import { apiSearchListings } from "@/lib/listings-client";

// Forces this page to render per-request instead of being statically
// prerendered at build time. Without this, Next tries to fetch live
// listings from the backend WHILE BUILDING — which means every deploy
// needs a reachable backend just to compile, and the homepage's listings
// would be frozen at whatever they were at that build rather than actually
// live. Every other page that reads live backend data (listing/[id],
// search, rent, buy) is already dynamic for the same reason; this one
// wasn't, because nothing about its route forces Next to infer that
// automatically the way a dynamic route segment ([id]) does.
export const dynamic = "force-dynamic";

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
// black tiles played. (An earlier pass had added Inter as a second UI face;
// that has been removed — Quicksand Bold/Medium is the whole type system
// again, per the Brand Guidelines and Website Revision Spec §3E.)
//
// REAL BACKEND (6 Sept 2026): fetched ONCE here, server-side, and passed
// down to FacetGrid and CuratedListings as props — both used to import
// mock-data.ts directly and separately. A single fetch avoids duplicating
// the request, and keeps this the one place that decides what a visitor's
// first view of the catalog contains.
export default async function HomePage() {
  const { listings: allListings } = await apiSearchListings({ limit: 50 });
  // Every listing returned is already "live" — the backend's search
  // endpoint only ever returns that status (see listings.routes.js) — so
  // no further status filtering is needed here, unlike the old mock catalog.
  const live = allListings;
  // A verified home with gallery depth makes the strongest hero plate; fall
  // back through progressively looser criteria rather than hard-coding an id.
  const heroListing = live.find((l) => l.verified && (l.galleryUrls?.length ?? 0) > 2) ?? live[0];

  return (
    <div>
      {heroListing && <Hero listing={heroListing} />}

      {/* ---- Rent / Buy / Services search — its own section, in normal flow
           directly below the hero (no straddle/overlap now that the hero's
           photograph is a contained card rather than a bleeding one). ---- */}
      <div className="relative z-20 mt-8 sm:mt-10 lg:mt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SearchBar />
        </div>
      </div>

      {/* TASK 4 — dark feature bar, directly below the search section. */}
      <FeatureBar />

      <Reveal><FacetGrid listings={allListings} /></Reveal>

      {/* Hairline instead of a filled divider — the section change is
          carried by scale and density, so the rule only needs to whisper. */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-t border-[var(--color-border-hairline)]" />
      </div>

      <Reveal><CuratedListings listings={allListings} /></Reveal>

      <Reveal><TrustEditorial /></Reveal>

      <Reveal><ServicesBand /></Reveal>

      {/* ---- Close: the tightest band on the page. Deliberately not another
           full-height dark chapter — the trust section already carried the
           inverted weight, and repeating it would flatten the sequence.

           Now role-aware (see ClosingCta.tsx): what it offers depends on who
           is reading it, so it can never invite an anonymous visitor to do
           something the revised access model no longer lets them do. ---- */}
      <ClosingCta />

    </div>
  );
}