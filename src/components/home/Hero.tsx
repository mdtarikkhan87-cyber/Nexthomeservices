import Image from "next/image";
import Link from "next/link";
import { IconShield } from "@/components/ui/icons";
import { PropertyListing } from "@/lib/types";

// ============================================================================
// HERO — calm editorial composition: type left, architecture right and low
// ============================================================================
// REWRITTEN AGAIN, to a different brief. The previous version was a stack of
// rotated overlapping panels. This reference is the opposite temperament:
// still, spacious and architectural — a single large photograph anchored to
// the right and bottom of a light field, with the type held quietly on the
// left. Tilt and layering would fight it, so they are gone.
//
// The photograph runs to the section's right and bottom edges rather than
// sitting in a padded box, which is what makes the hero read as one
// composition instead of "text column + picture". Below `lg` it returns to a
// contained block above the copy, since a bleeding image on a phone just
// crops the subject.
//
// CONTENT: same eyebrow, same headline wording, same description, same
// featured listing. The two CTAs the redesign preserved were removed on 31
// Aug 2026 — see the note at the foot of the type column for why, and for
// where their destinations still live.
//
// TASK 1: the floating dark "Services" card that used to sit over the
// photograph has been DELETED, not restyled. The hero image is now clean.
// /services remains reachable from the navbar and from the Services band
// further down the page, so no destination was lost.
export function Hero({ listing }: { listing: PropertyListing }) {
  return (
    <section className="relative overflow-hidden bg-[var(--color-surface-raised)]">
      {/* Soft field behind the type so the left half never reads as flat
          white against the photograph's density. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 0% 10%, color-mix(in srgb, var(--color-surface-dense) 60%, transparent) 0%, transparent 62%)",
        }}
      />

      {/* ---------- The photograph ------------------------------------- */}
      {/* At `lg` it is anchored to the right and bottom edges of the section
          and slightly overshoots the container, so it feels part of the page
          rather than placed on it. */}
      {/* `lg:pb-14` is load-bearing, not decoration: it extends the section
          (and with it the inset-anchored photograph) far enough below the type
          for the search card to be pulled up into a true half-on/half-off
          straddle. It originally existed to keep that straddle off the
          "Browse rentals" button; with the buttons gone it still sets the
          section's bottom edge, which is what the card's negative margin at
          the call site is measured against. Kept, with its reason updated. */}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:pb-14">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[56%] lg:block">
          <Link
            href={`/listing/${listing.id}`}
            aria-label={`View ${listing.title}`}
            className="group pointer-events-auto absolute inset-y-8 left-0 right-[-6vw] overflow-hidden rounded-l-[var(--radius-feature)]"
          >
            <Image
              src={listing.photoUrl}
              alt={listing.title}
              fill
              priority
              sizes="60vw"
              className="object-cover transition-transform duration-[var(--motion-duration-rich)] ease-[var(--motion-easing-warm)] group-hover:scale-[1.03]"
            />
            {/* Very light scrim on the left edge only — the type sits beside
                the image, not on it, so this exists purely to stop a bright
                sky butting hard against the copy. */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, color-mix(in srgb, var(--color-dark-blue) 22%, transparent) 0%, transparent 28%)",
              }}
            />
          </Link>
        </div>

        {/* ---------- The type ------------------------------------------ */}
        <div className="relative z-10 py-12 sm:py-16 lg:min-h-[38rem] lg:w-[46%] lg:py-28">
          <p className="u-label inline-flex items-center gap-2 text-[var(--color-brand-primary-text)]">
            <IconShield className="h-4 w-4" />
            Verified listings, reviewed before they go live
          </p>

          {/* Same words, same order. Scale and line breaks only. */}
          <h1 className="u-display mt-6 text-[2.75rem] text-[var(--color-text-primary)] sm:text-[3.5rem] lg:text-[4rem]">
            Find your next home,
            <br />
            <span className="text-[var(--color-brand-primary)]">with confidence.</span>
          </h1>

          <p className="mt-6 max-w-md text-[var(--color-text-secondary)]">
            Verified landlords, real listings, and one place to message, save and follow up — instead of
            scattered groups and unreliable agents.
          </p>

          {/* THE TWO CTAs THAT SAT HERE ARE GONE (client, 31 Aug 2026).
              "Browse rentals" and "Homes for sale" were a second way to do
              what the search panel directly below already does better: they
              chose a mode and nothing else, so anyone who used one landed on
              an unfiltered list and had to start filtering anyway. The search
              card is now the single entry point, and it carries the whole
              query — mode, state, LGA, price, bedrooms, duration.

              NO DESTINATION WAS LOST. /listings?mode=rent and ?mode=sale are
              still reached from the search panel's Rent/Buy tabs, the header's
              Listings link, and the footer. */}
        </div>

        {/* ---------- Photograph, compact viewports ---------------------- */}
        {/* Contained and above the fold-line rather than bleeding, so the
            subject is never cropped to a sliver on a narrow screen. */}
        <Link
          href={`/listing/${listing.id}`}
          className="group relative -mt-2 block aspect-[16/11] w-full overflow-hidden rounded-[var(--radius-feature)] bg-[var(--color-surface-dense)] sm:aspect-[16/9] lg:hidden"
        >
          <Image
            src={listing.photoUrl}
            alt={listing.title}
            fill
            sizes="100vw"
            className="object-cover transition-transform duration-[var(--motion-duration-rich)] ease-[var(--motion-easing-warm)] group-hover:scale-[1.03]"
          />
        </Link>

      </div>
    </section>
  );
}
