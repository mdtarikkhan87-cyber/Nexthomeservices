import { SearchBar } from "@/components/shared/SearchBar";
import { ClosingCta } from "@/components/home/ClosingCta";
import { Hero } from "@/components/home/Hero";
import { FacetGrid } from "@/components/home/FacetGrid";
import { CuratedListings } from "@/components/home/CuratedListings";
import { TrustEditorial } from "@/components/home/TrustEditorial";
import { ServicesBand } from "@/components/home/ServicesBand";
import { Container } from "@/components/ui/Container";

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
export default function HomePage() {
  return (
    <div className="bg-[var(--color-white)]">
      {/* The top block is white all the way to the screen edge (u-bleed-white),
          so the hero photograph fades into white at any width. The hero is
          static — no listing data — so it renders even if the catalog is empty
          or the backend is down. z-20 keeps the search dropdowns above the
          section below. */}
      <div className="u-bleed-white relative z-20">
        <Hero />

        {/* The search card floats over the photograph's bottom edge, in the
            same container as everything else. */}
        <div className="relative z-10 -mt-10 pb-8 lg:pb-10">
          <Container>
            <SearchBar />
          </Container>
        </div>
      </div>

      <FacetGrid />
      <CuratedListings />
      <TrustEditorial />
      <ServicesBand />

      {/* Role-aware (see ClosingCta.tsx): what it offers depends on who is
          reading it, so it never invites an anonymous visitor to do
          something the access model no longer allows. */}
      <ClosingCta />
    </div>
  );
}
