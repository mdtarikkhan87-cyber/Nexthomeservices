"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { IconArrowRight, IconBath, IconBed, IconCheck, IconStar } from "@/components/ui/icons";
import { useAuthGate } from "@/components/shared/AuthGate";
import { PropertyListing } from "@/lib/types";
import { isShared } from "@/lib/shared-property";
import { formatLocation } from "@/lib/nigeria-locations";

function formatPrice(listing: PropertyListing) {
  const amount = new Intl.NumberFormat("en-NG").format(listing.price);
  // A shared listing's price is the rent for ONE room, so the card has to say
  // so: "₦700,000/yr" beside a four-bedroom flat reads as the whole flat, and
  // that is the one misreading this feature must not cause. The annual basis
  // is stated in full on the detail page, where the number is acted on.
  const suffix = listing.type === "rent" ? (isShared(listing) ? "/room" : "/yr") : "";
  return `${listing.currency === "NGN" ? "₦" : "$"}${amount}${suffix}`;
}

/** The secondary tag on the photo, in priority order. Verified is its own
    pill now, so this covers only what is being let: Shared outranks the
    duration, because it changes what is being let rather than describing it. */
function secondaryTag(listing: PropertyListing): string | null {
  if (isShared(listing)) return "Shared Property";
  if (listing.rentDuration) return listing.rentDuration === "short-term" ? "Short-Term" : "Long-Term";
  return null;
}

/** White pill, readable on any photograph (the tinted StatusBadge is not). */
function VerifiedPill({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)]/95 px-3 py-1.5 text-xs font-bold text-[var(--color-deep-blue)] shadow-[var(--elevation-xs)] backdrop-blur-sm ${className}`}
    >
      <IconCheck className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" />
      Verified
    </span>
  );
}

// DESIGN_SYSTEM.md §11: same card anatomy (status → facts → action) in both
// variants — `public` is photography-led and spacious (Direction B),
// `dashboard` is compact and status-column-first (Direction C). Status,
// price, location, bedrooms are never omitted in either variant (§11's
// non-negotiable floor).
//
// REDESIGN PASS: `public`/`featured` moved the save control off the text
// footer onto a floating chip over the photo (a considered, single-Link
// card — the button sits as a sibling of the Link, not nested inside it,
// so the whole card stays one navigation target). `dashboard` gains a real
// Button affordance for Manage instead of a bare text link, matching the
// button-hierarchy rule used everywhere else in the product.
export function PropertyCard({
  listing,
  variant = "public",
  featured = false,
}: {
  listing: PropertyListing;
  variant?: "public" | "dashboard";
  /** Editorial, image-forward composition for a single highlighted card
      (homepage). Same anatomy/facts as the standard card — status+price
      colocated, location/bedrooms, save — just text-on-image instead of
      text-below-image (DESIGN_SYSTEM.md §11 floor still applies). */
  featured?: boolean;
}) {
  const { requireAuth } = useAuthGate();
  const [saved, setSaved] = useState(false);

  const toggleSave = () => {
    requireAuth({
      actionLabel: `Log in to save "${listing.title}"`,
      suggestedRole: "tenant-buyer",
      onResume: () => setSaved((v) => !v),
    });
  };

  const saveLabel = saved ? `Remove "${listing.title}" from saved homes` : `Save "${listing.title}"`;

  if (variant === "dashboard") {
    return (
      <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-4 py-3.5 shadow-[var(--elevation-xs)] transition-shadow duration-[var(--motion-duration-standard)] hover:shadow-[var(--elevation-sm)]">
        <StatusBadge kind={listing.status === "live" ? "live" : listing.status === "rejected" ? "rejected" : "pending"} dense />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate font-bold text-[var(--color-text-primary)]">
            <span className="truncate">{listing.title}</span>
            {/* The landlord's own row says it too — which listings are let
                room by room is the first thing they need to tell apart here,
                since only those have rooms to manage. */}
            {isShared(listing) && (
              <span className="u-label shrink-0 rounded-full bg-[var(--color-surface-dense)] px-2 py-1 text-[var(--color-text-secondary)]">
                Shared
              </span>
            )}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            <span className="font-bold text-[var(--color-text-primary)]">{formatPrice(listing)}</span> · {formatLocation(listing.state, listing.lga)} · {listing.bedrooms} bd
          </p>
        </div>
        <p className="hidden shrink-0 text-sm text-[var(--color-text-secondary)] sm:block">{listing.viewCount} views</p>
        <Link href={`/dashboard/listings/${listing.id}`} className="shrink-0">
          <Button variant="secondary" size="dense">
            Manage
          </Button>
        </Link>
      </div>
    );
  }

  if (featured) {
    return (
      <div className="group relative h-full min-h-[420px] overflow-hidden rounded-2xl bg-[var(--color-dark-blue)] shadow-[var(--elevation-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[var(--elevation-card-hover)]">
        <Link href={`/listing/${listing.id}`} className="absolute inset-0">
          <Image
            src={listing.photoUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, color-mix(in srgb, var(--color-dark-blue) 95%, transparent) 0%, color-mix(in srgb, var(--color-dark-blue) 45%, transparent) 42%, color-mix(in srgb, var(--color-dark-blue) 8%, transparent) 68%, transparent 85%)",
          }}
        />
        <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-center gap-2 p-5 sm:p-7">
          {listing.verified && <VerifiedPill />}
          {isShared(listing) && (
            <span className="u-label rounded-full bg-white/15 px-3 py-1.5 text-white backdrop-blur-sm">
              Shared Property
            </span>
          )}
          {listing.rentDuration && !isShared(listing) && (
            <span className="u-label rounded-full bg-white/15 px-3 py-1.5 text-white backdrop-blur-sm">
              {listing.rentDuration === "short-term" ? "Short-Term" : "Long-Term"}
            </span>
          )}
        </div>
        <button
          onClick={toggleSave}
          className="absolute right-5 top-16 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors duration-[var(--motion-duration-short)] hover:bg-white/25"
          aria-pressed={saved}
          aria-label={saveLabel}
        >
          <IconStar filled={saved} className="h-[18px] w-[18px]" />
        </button>
        {/* Title leads at feature scale, price follows on a hairline rule —
            the inverse of the small card, where price leads. A feature plate
            is being *read*, not scanned against siblings. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-7">
          <p className="u-heading max-w-md text-2xl text-white sm:text-3xl">{listing.title}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/20 pt-4">
            <p className="u-numeric text-xl font-bold text-white">{formatPrice(listing)}</p>
            <p className="u-ui text-[13px] text-white/75">
              {formatLocation(listing.state, listing.lga)} · {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? "s" : ""} · {listing.viewCount} views
            </p>
          </div>
        </div>
      </div>
    );
  }

  // PUBLIC CARD. A white rounded-2xl surface with a layered shadow instead of
  // a border; on hover it lifts 4px and the photo zooms inside its own clip.
  // The §11 floor (status, price, location, bedrooms) is all present: the
  // Verified pill sits on the photo, price leads the text block in Deep Blue,
  // and the facts row carries the counts with icons.
  //
  // Only facts the data has are shown: bathrooms are optional on the type and
  // there is no floor-area field, so neither an area nor a placeholder for it
  // is rendered.
  const tag = secondaryTag(listing);
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl bg-[var(--color-surface-raised)] shadow-[var(--elevation-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[var(--elevation-card-hover)]">
      <Link href={`/listing/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-surface-dense)]">
          <Image
            src={listing.photoUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {listing.verified && <VerifiedPill className="absolute left-3 top-3" />}

          {/* Derived from real listing facts, never a marketing claim. */}
          {tag && (
            <span className="u-label absolute bottom-3 left-3 rounded-full bg-[var(--color-dark-blue)]/70 px-3 py-1.5 text-white backdrop-blur-sm">
              {tag}
            </span>
          )}

          {/* Reveal-on-hover affordance. Hover is an enhancement only — the
              whole card is already a link, so nothing here is hover-dependent
              for access. */}
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex translate-y-1 items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)] px-3 py-1.5 text-xs font-bold text-[var(--color-text-primary)] opacity-0 shadow-[var(--elevation-sm)] transition-[opacity,transform] duration-300 ease-[var(--motion-easing-warm)] group-hover:translate-y-0 group-hover:opacity-100">
            View
            <IconArrowRight className="h-3 w-3" />
          </span>
        </div>

        <div className="p-5">
          <p className="truncate font-bold leading-snug text-[var(--color-text-primary)]">{listing.title}</p>
          <p className="u-ui mt-1 truncate text-sm text-[var(--color-text-body)]">
            {formatLocation(listing.state, listing.lga)} · {listing.viewCount} views
          </p>
          <p className="u-numeric mt-3 text-xl font-bold text-[var(--color-deep-blue)]">{formatPrice(listing)}</p>

          <ul className="u-ui mt-4 flex items-center gap-5 border-t border-[var(--color-border-hairline)] pt-4 text-sm text-[var(--color-text-body)]">
            <li className="inline-flex items-center gap-2">
              <IconBed className="h-[18px] w-[18px] text-[var(--color-deep-blue)]" />
              {listing.bedrooms} bed{listing.bedrooms !== 1 ? "s" : ""}
            </li>
            {listing.bathrooms !== undefined && (
              <li className="inline-flex items-center gap-2">
                <IconBath className="h-[18px] w-[18px] text-[var(--color-deep-blue)]" />
                {listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}
              </li>
            )}
          </ul>
        </div>
      </Link>

      {/* Always visible on touch (there is no hover to reveal it there);
          the quiet hover-reveal is a pointer-fine enhancement only. */}
      <button
        onClick={toggleSave}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-dark-blue)]/45 text-white backdrop-blur-sm transition-[background-color,opacity] duration-[var(--motion-duration-short)] hover:bg-[var(--color-dark-blue)]/75 focus-visible:opacity-100 aria-pressed:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
        aria-pressed={saved}
        aria-label={saveLabel}
      >
        <IconStar filled={saved} className="h-4 w-4" />
      </button>
    </div>
  );
}
