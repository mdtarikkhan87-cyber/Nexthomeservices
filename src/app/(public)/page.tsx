import { SearchBar } from "@/components/shared/SearchBar";
import { ClosingCta } from "@/components/home/ClosingCta";
import { Hero } from "@/components/home/Hero";
import { FacetGrid } from "@/components/home/FacetGrid";
import { CuratedListings } from "@/components/home/CuratedListings";
import { TrustEditorial } from "@/components/home/TrustEditorial";
import { ServicesBand } from "@/components/home/ServicesBand";
import { AdBanner } from "@/components/home/AdBanner";
import { Container } from "@/components/ui/Container";
import { apiSearchListings } from "@/lib/listings-client";
import type { PropertyListing } from "@/lib/types";
import { apiSearchAds } from "@/lib/ads-client";

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

// Homepage composition. Everything sits on one shared 1280px container inside
// the 1600px page wrapper (see providers.tsx), so on a very wide or zoomed-out
// screen the layout stays centred and proportionate.
//
// Background sequence, alternating so adjacent sections never merge:
//   Hero + search (White, full-bleed) → Browse by (Off-white) →
//   Recently listed (White) → Trust (Dark Blue chapter) → Services (White) →
//   Closing CTA (Off-white)
//
// Each section owns its background and fades up its own content, so a coloured
// band never fades in as a block.
//
// REAL BACKEND (6 Sept 2026): listings are fetched ONCE here, server-side, and
// passed down to FacetGrid and CuratedListings as props. A single fetch avoids
// duplicating the request, and keeps this the one place that decides what a
// visitor's first view of the catalog contains.
export default async function HomePage() {
  // A backend outage (or a missing NEXT_PUBLIC_API_URL, which makes fetch
  // throw on an "undefined/listings" URL) must degrade the page, not 500
  // the whole site. The static sections still render; the listing-driven
  // ones just come up empty with a notice.
  let allListings: PropertyListing[] = [];
  let listingsUnavailable = false;
  try {
    ({ listings: allListings } = await apiSearchListings({ limit: 50 }));
  } catch (err) {
    console.error("Homepage: failed to load listings from the backend:", err);
    listingsUnavailable = true;
  }
  // Every listing returned is already "live" — the backend's search endpoint
  // only ever returns that status (see listings.routes.js) — so no further
  // status filtering is needed here.

  // The one ad slot that exists today. Caught separately from the listings
  // fetch above: an ad is decorative, not core content, so a flaky ads
  // endpoint should never take the whole homepage down with it — worst case
  // is AdBanner renders nothing, same as when there's genuinely no live ad.
  let bannerAd = null;
  try {
    const { ads } = await apiSearchAds({ placement: "homepage-banner", limit: 1 });
    bannerAd = ads[0] ?? null;
  } catch {
    bannerAd = null;
  }

  return (
    <div className="bg-[var(--color-white)]">
      {/* The top block is white all the way to the screen edge (u-bleed-white),
          so the hero photograph fades into white at any width. The hero is
          static artwork, so it renders even if the catalog is empty or the
          backend is down. z-20 keeps the search dropdowns above the section
          below. */}
      <div className="u-bleed-white relative z-20">
        <Hero />

        {/* The search card floats over the photograph's bottom edge, in the
            same container as everything else. */}
        <div className="relative z-10 -mt-10 pb-8 lg:pb-10">
          <Container>
            <SearchBar />

            {listingsUnavailable && (
              <div role="status" className="mt-6">
                <p className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  We couldn&rsquo;t load listings just now. Please refresh in a moment — you can still search above.
                </p>
              </div>
            )}
          </Container>
        </div>

        {/* The one ad slot on the site — renders nothing when there's no live
            ad for this placement, so it costs nothing when empty. */}
        {bannerAd && (
          <div className="pb-8 lg:pb-10">
            <AdBanner ad={bannerAd} />
          </div>
        )}
      </div>

      <FacetGrid listings={allListings} />
      <CuratedListings listings={allListings} />
      <TrustEditorial />
      <ServicesBand />

      {/* Role-aware (see ClosingCta.tsx): what it offers depends on who is
          reading it, so it never invites an anonymous visitor to do
          something the access model no longer allows. */}
      <ClosingCta />
    </div>
  );
}
