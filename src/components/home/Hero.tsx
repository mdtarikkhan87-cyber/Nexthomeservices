import Image from "next/image";
import Link from "next/link";
import { IconShield } from "@/components/ui/icons";
import { PropertyListing } from "@/lib/types";

// Fixed hero photograph — deliberately NOT tied to any listing's photoUrl.
// The hero previously showed whatever property happened to be "featured",
// which read as if that specific listing was being promoted. This is a
// permanent brand image and should not change when the featured listing does.
const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1600&auto=format&fit=crop";

// ============================================================================
// HERO — calm editorial composition: type left, architecture right and low
// ============================================================================
// REDESIGNED to a contained-card brief: the photograph is a single rounded
// panel that fills the section's full height (flush top and bottom, rounded
// on every corner) rather than bleeding off the page edge. The search bar
// that used to be pulled up to straddle the hero's bottom edge now sits in
// its own section below, in normal flow — see page.tsx.
//
// CONTENT: same eyebrow, same headline wording, same description, same
// featured listing.
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

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        {/* ---------- The photograph --------------------------------------- */}
        {/* A contained card — flush to the section's own top/bottom edge and
            rounded on all four corners, rather than bleeding past the page. */}
        <div className="pointer-events-none absolute inset-y-6 right-4 hidden w-[54%] overflow-hidden rounded-[var(--radius-feature)] sm:right-6 lg:block lg:inset-y-10">
          <Link
            href={`/listing/${listing.id}`}
            aria-label={`View ${listing.title}`}
            className="group pointer-events-auto absolute inset-0"
          >
            <Image
              src={HERO_IMAGE_URL}
              alt=""
              fill
              priority
              sizes="55vw"
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
                  "linear-gradient(90deg, color-mix(in srgb, var(--color-dark-blue) 18%, transparent) 0%, transparent 24%)",
              }}
            />
          </Link>
        </div>

        {/* ---------- The type ------------------------------------------ */}
        <div className="relative z-10 py-2 sm:py-4 lg:min-h-[32rem] lg:w-[44%] lg:py-16">
          <p className="u-label inline-flex items-center gap-2 text-[var(--color-brand-primary-text)]">
            <IconShield className="h-4 w-4" />
            Verified listings, reviewed before they go live
          </p>

          <h1 className="u-display mt-6 text-[2.75rem] text-[var(--color-text-primary)] sm:text-[3.5rem] lg:text-[4rem]">
            Find your next home,
            <br />
            <span className="text-[var(--color-brand-primary)]">with confidence.</span>
          </h1>

          <p className="mt-6 max-w-md text-[var(--color-text-secondary)]">
            Verified landlords, real listings, and one place to message, save and follow up — instead of
            scattered groups and unreliable agents.
          </p>
        </div>

        {/* ---------- Photograph, compact viewports ---------------------- */}
        {/* Contained and above the fold-line rather than bleeding, so the
            subject is never cropped to a sliver on a narrow screen. */}
        <Link
          href={`/listing/${listing.id}`}
          className="group relative mt-6 block aspect-[16/11] w-full overflow-hidden rounded-[var(--radius-feature)] bg-[var(--color-surface-dense)] sm:aspect-[16/9] lg:hidden"
        >
          <Image
            src={HERO_IMAGE_URL}
            alt=""
            fill
            sizes="100vw"
            className="object-cover transition-transform duration-[var(--motion-duration-rich)] ease-[var(--motion-easing-warm)] group-hover:scale-[1.03]"
          />
        </Link>
      </div>
    </section>
  );
}
