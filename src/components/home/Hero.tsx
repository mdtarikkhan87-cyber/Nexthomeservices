import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

// Two gradients intersected: one fades the top edge, the other the left and
// right edges, so the photograph melts into the white page on three sides and
// has no hard edge at any width. (The bottom meets the search bar.)
const PHOTO_MASK = [
  "linear-gradient(to bottom, transparent, black 25%)",
  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
].join(", ");

// Static by design: no listing data, so it renders with zero listings or the
// backend down. The photo is a brand placeholder and is not a link.
// The photo is a PLACEHOLDER — Archidea X on Unsplash
// (unsplash.com/photos/QfIIsMOAuMM), cropped wide. Swap for client photography.
export function Hero() {
  return (
    <section className="bg-[var(--color-white)]">
      {/* Same container as the header, search bar and sections. */}
      <Container className="pb-8 pt-10 md:pb-10 md:pt-14 lg:pt-16">
        <div className="lg:flex lg:items-start lg:justify-between lg:gap-8">
          {/* Two clamps, one per tier, so both lines always fit beside the
              paragraph: 40–60px on phones and tablets, 56–80px from `lg`. */}
          <h1 className="text-balance text-[clamp(2.5rem,9vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.02em] text-[var(--color-text-primary)] lg:shrink-0 lg:text-[clamp(3.5rem,6vw,5rem)]">
            Find your next home,
            <br className="hidden md:block" /> with confidence.
          </h1>

          <p className="mt-5 max-w-[30ch] text-base text-[var(--color-text-secondary)] lg:mt-3 lg:shrink-0">
            Connect with verified landlords, explore property listings, and manage your enquiries, saved
            properties, and conversations all in one convenient place.
          </p>
        </div>

        <Link
          href="/listings"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--color-dark-blue)] px-6 text-sm font-bold text-white transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-deep-blue)] lg:mt-10"
        >
          Browse listings
        </Link>
      </Container>

      {/* Centred and capped at 1600px, so on a wide or zoomed-out screen the
          photograph never stretches. From `lg` the height is 60vh, capped at
          640px, and never shorter than the width needs to keep the roofline
          below the top fade (it is the 37.5vw term that matters at 1366px).
          No scrim, no text, not a link. Phones and tablets keep the fixed
          4:3 / 2:1 plate. */}
      <div
        className="relative mx-auto aspect-[4/3] w-full max-w-[1600px] md:aspect-[2/1] lg:aspect-auto lg:h-[min(max(60vh,37.5vw),640px)]"
        style={{
          maskImage: PHOTO_MASK,
          maskComposite: "intersect",
          WebkitMaskImage: PHOTO_MASK,
          WebkitMaskComposite: "source-in",
        }}
      >
        <Image
          src="/images/hero-home.jpg"
          alt="A modern single-storey home with timber cladding and a white wing, set in a green garden"
          fill
          preload
          sizes="(min-width: 1600px) 1600px, 100vw"
          className="object-cover object-[62%_100%] lg:object-bottom"
        />
      </div>
    </section>
  );
}
