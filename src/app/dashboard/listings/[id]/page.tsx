"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { mockListings } from "@/lib/mock-data";
import { useListings } from "@/lib/listings-context";
import { isShared, roomAvailabilityLabel } from "@/lib/shared-property";
import { formatLocation } from "@/lib/nigeria-locations";

export default function ListingManagementDetail({ params }: PageProps<"/dashboard/listings/[id]">) {
  const { id } = use(params);
  const listing = mockListings.find((l) => l.id === id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unpublished, setUnpublished] = useState(false);
  // Room availability is managed from this page — the same page that already
  // owns listing status — rather than from a screen of its own.
  const { resolveRooms, setRoomOccupied, setRoomAvailable } = useListings();

  if (!listing) notFound();

  const shared = isShared(listing) ? listing.shared : undefined;
  const rooms = resolveRooms(listing);

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3">
        <StatusBadge kind={unpublished ? "pending" : listing.status === "live" ? "live" : listing.status === "rejected" ? "rejected" : "pending"} />
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">{listing.title}</h1>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)] sm:grid-cols-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Price</p>
          <p className="mt-1 font-bold text-[var(--color-text-primary)]">
            {listing.currency === "NGN" ? "₦" : "$"}
            {new Intl.NumberFormat("en-NG").format(listing.price)}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Bedrooms</p>
          <p className="mt-1 font-bold text-[var(--color-text-primary)]">{listing.bedrooms}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Views</p>
          <p className="mt-1 font-bold text-[var(--color-text-primary)]">{listing.status === "live" ? listing.viewCount : "—"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Location</p>
          <p className="mt-1 font-bold text-[var(--color-text-primary)]">
            {formatLocation(listing.state, listing.lga)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-[var(--color-text-secondary)]">{listing.description}</p>

      {/* ROOM AVAILABILITY — landlord-managed, and the only thing that moves
          the available count a renter sees. Enquiries never change it: a
          renter names a room, the landlord decides.

          No confirmation dialog here on purpose. DESIGN_SYSTEM.md §13 reserves
          those for destructive or irreversible actions; marking a room occupied
          is neither, and is undone by the button that replaces it. */}
      {shared && (
        <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Rooms</h2>
            <span className="u-ui text-sm font-bold text-[var(--color-text-secondary)]">
              {roomAvailabilityLabel(rooms)}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
            Renters enquire about one room at a time. Marking a room occupied removes it from new
            enquiries — the listing itself stays visible either way.
          </p>

          <ul className="mt-4 flex flex-col gap-2.5">
            {rooms.map((room) => {
              const free = room.status === "available";
              return (
                <li
                  key={room.id}
                  className="flex items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] px-3.5 py-2.5"
                >
                  <StatusBadge
                    kind={free ? "live" : "pending"}
                    label={free ? "Available" : "Occupied"}
                    dense
                  />
                  <p className="min-w-0 flex-1 font-bold text-[var(--color-text-primary)]">{room.label}</p>
                  <Button
                    variant="secondary"
                    size="dense"
                    onClick={() => (free ? setRoomOccupied(room) : setRoomAvailable(room))}
                  >
                    {free ? "Mark occupied" : "Mark available"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" size="dense">
          Edit Listing
        </Button>
        {!unpublished && (
          <Button variant="destructive" size="dense" onClick={() => setConfirmOpen(true)}>
            Unpublish
          </Button>
        )}
      </div>

      <ConfirmationDialog
        open={confirmOpen}
        title="Unpublish this listing?"
        description="It will no longer be visible to tenants or buyers. You can resubmit it later."
        confirmLabel="Unpublish"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setUnpublished(true);
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
