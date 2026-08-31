"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IconCheck, IconLock, IconMessageCircle, IconStar } from "@/components/ui/icons";
import { ListingTeaser } from "@/lib/types";
import { formatLocation } from "@/lib/nigeria-locations";

// ---------------------------------------------------------------------------
// The anonymous view of a property detail page (Website Revision Spec §3B).
//
// Spec, verbatim: anonymous visitors "can browse the Listings page and see
// which properties are listed (property cards / thumbnails)" but "cannot open
// a full property detail page ... Registration is required to unlock full
// property info and all interactive features."
//
// WHAT THIS SHOWS, AND WHY EXACTLY THIS:
// Spec §4 item 3 leaves the teaser field list open ("photo / price / location
// / headline" — not yet specified). Rather than guess a new set, this shows
// EXACTLY the fields the public listing card already shows: photo, headline,
// price, state, bedrooms, view count, verified badge. That gives a defensible
// interim rule — *an anonymous visitor never sees more here than they already
// saw on the card they clicked* — so no gated information leaks while the
// field list is pending, and no new information is invented either. When the
// client confirms the list, this component is the single place it changes.
//
// WHAT IS GENUINELY WITHHELD: the gallery beyond the lead photo, the full
// description, the specification table, amenities, and every action
// (message / save). None of it is rendered into the DOM for a signed-out
// visitor — the gated sections below are placeholders, not hidden real
// content, so "gated" means gated rather than merely invisible.
//
// FLAGGED, NOT SILENT: this reverses PRODUCT_DECISIONS.md §2 ("No
// authentication is required to: view a listing's full detail page, photos,
// and view count"), which was a deliberate public/SEO decision. It is
// implemented because the Website Revision Spec states it as a requirement in
// three separate places — but it needs the formal amendment the revision
// request calls for, and the SEO consequence is real: detail pages stop being
// indexable content. See REVISION_LOG.md.
// ---------------------------------------------------------------------------

function formatPrice(listing: ListingTeaser) {
  const amount = new Intl.NumberFormat("en-NG").format(listing.price);
  // Matches PropertyCard's suffix exactly. Card parity is this component's
  // whole contract — a card reading "/room" and the page it links to reading
  // "/yr" for the same number is the kind of small disagreement that makes a
  // listing look untrustworthy, which is the one thing this product cannot
  // afford. The per-room amount itself is public because the PRICE is public;
  // what stays gated is how many rooms are left and what they include.
  const suffix =
    listing.type === "rent" ? (listing.occupancyType === "shared" ? "/room" : "/yr") : "";
  return `${listing.currency === "NGN" ? "₦" : "$"}${amount}${suffix}`;
}

/** What registration unlocks, stated as facts about this listing rather than
    as marketing. A wall that does not say what is behind it is just a dead
    end, and the user cannot judge whether registering is worth it. */
const UNLOCKS = [
  { icon: IconCheck, label: "Every photo in the gallery, full size" },
  { icon: IconCheck, label: "The full description, specification and amenities" },
  { icon: IconMessageCircle, label: "Message the landlord directly, in-app" },
  { icon: IconStar, label: "Save this home and follow it up later" },
];

/** A redacted stand-in for a gated section. Deliberately built from empty
    bars rather than blurred real text: a CSS blur is a visual effect, not a
    security boundary, and the words would still be sitting in the DOM. */
function RedactedBlock({ title, lines, className = "" }: { title: string; lines: number[]; className?: string }) {
  return (
    <div className={`border-t border-[var(--color-border-hairline)] pt-8 ${className}`}>
      <div className="flex items-center gap-2">
        <IconLock className="h-4 w-4 text-[var(--color-text-secondary)]" aria-hidden />
        <h2 className="text-lg font-bold text-[var(--color-text-secondary)]">{title}</h2>
      </div>
      <div aria-hidden className="mt-4 flex flex-col gap-2.5">
        {lines.map((w, i) => (
          <div
            key={i}
            className="h-3.5 rounded-full bg-[var(--color-surface-dense)]"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
      <p className="sr-only">{title} is available after you register.</p>
    </div>
  );
}

export function ListingRegistrationWall({ teaser }: { teaser: ListingTeaser }) {
  const router = useRouter();
  const listing = teaser;
  const hiddenPhotos = Math.max(listing.galleryCount - 1, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-6 text-sm text-[var(--color-text-secondary)]">
        <Link
          href={`/listings?mode=${listing.type}`}
          className="font-bold hover:text-[var(--color-brand-primary-text)] hover:underline"
        >
          Listings
        </Link>
        <span className="mx-1.5">/</span>
        <span>{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          {/* The lead photo — the same image the card showed, nothing more.
              The remaining gallery is represented by a count, not by the
              images themselves. */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-surface-dense)]">
            <Image
              src={listing.photoUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
              priority
            />
            {hiddenPhotos > 0 && (
              <div className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-dark-blue)]/75 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm">
                <IconLock className="h-4 w-4" aria-hidden />
                {hiddenPhotos} more photo{hiddenPhotos !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Card-parity facts. Status and price stay co-located and never
              demoted, exactly as on the card (DESIGN_SYSTEM.md §11). */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <p className="u-numeric text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {formatPrice(listing)}
            </p>
            {listing.verified ? (
              <StatusBadge kind="verified" />
            ) : (
              <StatusBadge kind="pending" label="Not yet verified" />
            )}
            {/* Card parity, and nothing more. The badge is a category label —
                the same class of fact as type, bedrooms and duration, all of
                which this wall already shows. Room-level facts (how many are
                free, what one costs, the bathroom and kitchen arrangement)
                stay behind the wall; see the redacted Rooms block below. */}
            {listing.occupancyType === "shared" && (
              <span className="rounded-full bg-[var(--color-surface-dense)] px-3 py-1 text-sm font-bold text-[var(--color-text-secondary)]">
                Shared Property
              </span>
            )}
            {listing.rentDuration && (
              <span className="rounded-full bg-[var(--color-surface-dense)] px-3 py-1 text-sm font-bold text-[var(--color-text-secondary)]">
                {listing.rentDuration === "short-term" ? "Short-Term" : "Long-Term"}
              </span>
            )}
          </div>

          <h1 className="mt-2.5 text-2xl font-bold text-[var(--color-text-primary)]">{listing.title}</h1>
          <p className="u-ui mt-1.5 text-[var(--color-text-secondary)]">
            {formatLocation(listing.state, listing.lga)} · {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? "s" : ""} ·{" "}
            {listing.viewCount} views
          </p>

          <div className="mt-8 flex flex-col gap-8">
            <RedactedBlock title="About this property" lines={[100, 96, 88, 62]} />
            {/* The room detail is gated, so it is shown as redacted rather
                than omitted — the whole point of these blocks is to say that
                more exists, and for a shared listing this is the part a
                renter most wants. */}
            {listing.occupancyType === "shared" && (
              <RedactedBlock title="Rooms and facilities" lines={[82, 60, 74]} className="border-t-0 pt-0" />
            )}
            <RedactedBlock title="Specification" lines={[70, 55]} className="border-t-0 pt-0" />
            <RedactedBlock title="Amenities" lines={[64, 78, 48]} className="border-t-0 pt-0" />
          </div>
        </div>

        {/* The wall itself. Sticky on desktop so it stays with the reader as
            they scroll the redacted sections — the point of those sections is
            to show there IS more, and the way out has to stay in reach. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--elevation-sm)]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-dense)] text-[var(--color-brand-primary-text)]">
              <IconLock className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-bold text-[var(--color-text-primary)]">
              Register to see the full listing
            </h2>
            <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
              Browsing is open to everyone. Full property details and contact are for registered
              members — it takes a minute and it&apos;s free.
            </p>

            <ul className="mt-5 flex flex-col gap-2.5">
              {UNLOCKS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-brand-primary)_12%,transparent)]"
                  >
                    <Icon className="h-3 w-3 text-[var(--color-brand-primary-text)]" />
                  </span>
                  <span className="u-ui text-sm text-[var(--color-text-secondary)]">{label}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-2.5">
              {/* Registration carries the return path, so finishing the flow
                  lands the user back on THIS listing rather than on a generic
                  dashboard — the same "preserve original context" rule the
                  gated-action modal already follows (PRODUCT_DECISIONS.md §10). */}
              <Button
                className="w-full"
                onClick={() =>
                  router.push(`/register?role=tenant-buyer&next=${encodeURIComponent(`/listing/${listing.id}`)}`)
                }
              >
                Create a free account
              </Button>
              <Link href="/login" className="w-full">
                <Button variant="secondary" className="w-full">
                  I already have an account
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-center text-xs text-[var(--color-text-secondary)]">
              Or keep browsing —{" "}
              <Link
                href={`/listings?mode=${listing.type}`}
                className="font-bold text-[var(--color-brand-primary-text)] hover:underline"
              >
                back to listings
              </Link>
            </p>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
