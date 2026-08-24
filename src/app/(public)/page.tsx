import { SearchBar } from "@/components/shared/SearchBar";
import { ClosingCta } from "@/components/home/ClosingCta";
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
// black tiles played. (An earlier pass had added Inter as a second UI face;
// that has been removed — Quicksand Bold/Medium is the whole type system
// again, per the Brand Guidelines and Website Revision Spec §3E.)
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
           inverted weight, and repeating it would flatten the sequence.

           Now role-aware (see ClosingCta.tsx): what it offers depends on who
           is reading it, so it can never invite an anonymous visitor to do
           something the revised access model no longer lets them do. ---- */}
      <ClosingCta />

    </div>
  );
}
