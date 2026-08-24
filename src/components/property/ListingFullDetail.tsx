"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ListingActions } from "@/components/property/ListingActions";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { IconCheck } from "@/components/ui/icons";
import { mockListings } from "@/lib/mock-data";
import { AMENITY_LABELS, FURNISHING_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/types";

function formatPrice(price: number, currency: string, type: string) {
  const amount = new Intl.NumberFormat("en-NG").format(price);
  return `${currency === "NGN" ? "₦" : "$"}${amount}${type === "rent" ? "/yr" : ""}`;
}

// The full, unredacted property detail — lifted out of the page component
// unchanged so that ListingDetailGate can choose between rendering THIS and
// rendering the registration wall.
//
// The split matters: because the two are separate components rather than one
// component with conditional sections, none of the gated content below is ever
// serialised into the markup an anonymous visitor receives.
export function ListingFullDetail({ id }: { id: string }) {
  // Looked up here rather than passed in as a prop: a prop would be serialised
  // into the RSC payload of every request, including the anonymous ones this
  // component is not rendered for (see ListingDetailGate). Resolving by id on
  // the client means the gated fields are only ever read after the auth check.
  const listing = mockListings.find((l) => l.id === id);
  if (!listing) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* /rent and /buy are gone — one Listings route now, with the mode
          carried as a param so "back to listings" returns to the same side of
          the toggle the reader came from. */}
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
          <PropertyGallery images={listing.galleryUrls ?? [listing.photoUrl]} alt={listing.title} />

          {/* Status + price co-located, immediately after the image — never buried (DESIGN_SYSTEM.md §11) */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <p className="u-numeric text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {formatPrice(listing.price, listing.currency, listing.type)}
            </p>
            {listing.verified ? <StatusBadge kind="verified" /> : <StatusBadge kind="pending" label="Not yet verified" />}
            {listing.rentDuration && (
              <span className="rounded-full bg-[var(--color-surface-dense)] px-3 py-1 text-sm font-bold text-[var(--color-text-secondary)]">
                {listing.rentDuration === "short-term" ? "Short-Term" : "Long-Term"}
              </span>
            )}
          </div>

          <h1 className="mt-2.5 text-2xl font-bold text-[var(--color-text-primary)]">{listing.title}</h1>
          <p className="mt-1.5 text-[var(--color-text-secondary)]">
            {listing.state} · {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? "s" : ""} · {listing.viewCount} views
          </p>

          <div className="mt-8 border-t border-[var(--color-border-hairline)] pt-8">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">About this property</h2>
            <p className="mt-3 leading-relaxed text-[var(--color-text-secondary)]">{listing.description}</p>
          </div>

          {/* FILTER EXPANSION: every dimension a buyer can now filter on is
              stated here too. A filter that silently matches on data the
              listing never shows is unverifiable by the person reading it —
              in a product built on trust, the filterable facts and the
              published facts have to be the same set. Each block renders
              only when the listing actually carries that data. */}
          {(listing.propertyType || listing.bathrooms !== undefined || listing.furnishing) && (
            <div className="mt-8 border-t border-[var(--color-border-hairline)] pt-8">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Specification</h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                {listing.propertyType && (
                  <div>
                    <dt className="u-label text-[var(--color-text-secondary)]">Type</dt>
                    <dd className="u-ui mt-1.5 font-semibold text-[var(--color-text-primary)]">
                      {PROPERTY_TYPE_LABELS[listing.propertyType]}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="u-label text-[var(--color-text-secondary)]">Bedrooms</dt>
                  <dd className="u-numeric mt-1.5 font-semibold text-[var(--color-text-primary)]">
                    {listing.bedrooms}
                  </dd>
                </div>
                {listing.bathrooms !== undefined && (
                  <div>
                    <dt className="u-label text-[var(--color-text-secondary)]">Bathrooms</dt>
                    <dd className="u-numeric mt-1.5 font-semibold text-[var(--color-text-primary)]">
                      {listing.bathrooms}
                    </dd>
                  </div>
                )}
                {listing.furnishing && (
                  <div>
                    <dt className="u-label text-[var(--color-text-secondary)]">Furnishing</dt>
                    <dd className="u-ui mt-1.5 font-semibold text-[var(--color-text-primary)]">
                      {FURNISHING_LABELS[listing.furnishing]}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {listing.amenities && listing.amenities.length > 0 && (
            <div className="mt-8 border-t border-[var(--color-border-hairline)] pt-8">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Amenities</h2>
              <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {listing.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10">
                      <IconCheck className="h-3 w-3 text-[var(--color-brand-primary-text)]" />
                    </span>
                    <span className="u-ui text-sm text-[var(--color-text-secondary)]">{AMENITY_LABELS[a]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--elevation-sm)]">
            <ListingActions listingTitle={listing.title} />
          </div>
        </aside>
      </div>
    </div>
  );
}
