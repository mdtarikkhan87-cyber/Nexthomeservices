"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { apiFetchListingById, apiSetRoomStatus, apiUpdateListing } from "@/lib/listings-client";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { useListings } from "@/lib/listings-context";
import { ListingAvailability, PropertyListing, SharedRoom } from "@/lib/types";
import { isShared, roomAvailabilityLabel, roomsOf, unavailableLabel } from "@/lib/shared-property";
import { formatLocation } from "@/lib/nigeria-locations";

export default function ListingManagementDetail({ params }: PageProps<"/dashboard/listings/[id]">) {
  const { id } = use(params);
  const [listing, setListing] = useState<PropertyListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishNotice, setPublishNotice] = useState<string | null>(null);
  // Which room is mid-request, so its own button shows a busy state without
  // disabling every other room on the list.
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const { refetchMyListings } = useListings();

  // Edit mode — form values are strings so a field can be cleared while typing.
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ description: "", price: "", bedrooms: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetchListingById(id, { countView: false })
      .then((l) => {
        if (!cancelled) setListing(l);
      })
      .catch(() => {
        if (!cancelled) setNotFoundState(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (notFoundState) notFound();
  if (loading || !listing) return null;

  const shared = isShared(listing) ? listing.shared : undefined;
  const rooms = roomsOf(listing);

  // Toggling a room calls the real backend, then updates this page's own
  // copy of the listing so the UI reflects it immediately — no shared
  // context needed, since this is the only page that manages room status.
  const toggleRoom = async (room: SharedRoom) => {
    const nextStatus = room.status === "available" ? "occupied" : "available";
    setRoomError(null);
    setPendingRoomId(room.id);
    try {
      const updated = await apiSetRoomStatus(listing.id, room.id, nextStatus);
      setListing((prev) => {
        if (!prev || !prev.shared) return prev;
        return {
          ...prev,
          shared: {
            ...prev.shared,
            rooms: prev.shared.rooms.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r)),
          },
        };
      });
    } catch (err) {
      setRoomError(err instanceof Error ? err.message : "Couldn't update that room. Try again.");
    } finally {
      setPendingRoomId(null);
    }
  };

  // Moderation status (live/pending/rejected) is admin-controlled and not
  // touched here — this only says whether the property is still on the market.
  const setAvailability = async (availability: ListingAvailability) => {
    setAvailabilityError(null);
    setAvailabilityBusy(true);
    try {
      await apiUpdateListing(listing.id, { availability });
      setListing((prev) => (prev ? { ...prev, availability } : prev));
      void refetchMyListings();
    } catch (err) {
      setAvailabilityError(err instanceof Error ? err.message : "Couldn't update availability. Try again.");
    } finally {
      setAvailabilityBusy(false);
    }
  };

  // Owner-controlled visibility, separate from moderation status and from
  // rented/sold. Unpublishing hides the listing from everyone but the owner
  // and admins without deleting it; publishing again needs no re-review
  // because the listing was already approved.
  const unpublished = listing.isPublished === false;

  const setPublished = async (isPublished: boolean) => {
    setPublishError(null);
    setPublishNotice(null);
    setPublishBusy(true);
    try {
      await apiUpdateListing(listing.id, { isPublished });
      setListing((prev) => (prev ? { ...prev, isPublished } : prev));
      void refetchMyListings();
      setPublishNotice(isPublished ? "Your listing is published again." : "Your listing is unpublished and hidden from public view.");
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Couldn't update the listing. Try again.");
    } finally {
      setPublishBusy(false);
    }
  };

  const offMarket = listing.availability === "rented" || listing.availability === "sold";
  const offMarketAction: { value: ListingAvailability; label: string } =
    listing.type === "rent" ? { value: "rented", label: "Mark as rented" } : { value: "sold", label: "Mark as sold" };

  const startEdit = () => {
    setForm({
      description: listing.description ?? "",
      price: String(listing.price),
      bedrooms: String(listing.bedrooms),
    });
    setEditError(null);
    setEditing(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const description = form.description.trim();
    if (description.length < 10) return setEditError("Description must be at least 10 characters.");
    // A shared listing's price and bedroom count are derived from its rooms
    // (see the create wizard), so they aren't editable here.
    const patch: { description: string; price?: number; bedrooms?: number } = { description };
    if (!shared) {
      const price = Number(form.price);
      const bedrooms = Number(form.bedrooms);
      if (!Number.isInteger(price) || price < 0) return setEditError("Enter a valid price.");
      if (!Number.isInteger(bedrooms) || bedrooms < 0) return setEditError("Enter a valid number of bedrooms.");
      patch.price = price;
      patch.bedrooms = bedrooms;
    }
    setEditError(null);
    setSaving(true);
    try {
      const updated = await apiUpdateListing(listing.id, patch);
      // Merge rather than replace: the PATCH response doesn't include the
      // shared-room details this page also renders. The title comes from the
      // response because the server derives it (e.g. a new bedroom count
      // changes it).
      setListing((prev) => (prev ? { ...prev, ...patch, title: updated.title } : prev));
      void refetchMyListings();
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Couldn't save your changes. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3">
        {/* "Live" (approved) beside "Unpublished" (hidden) reads as a
            contradiction, so while it's hidden only the visible state shows. */}
        {unpublished && listing.status === "live" ? (
          <StatusBadge kind="unavailable" label="Unpublished" />
        ) : (
          <>
            <StatusBadge kind={listing.status === "live" ? "live" : listing.status === "rejected" ? "rejected" : "pending"} />
            {unpublished && <StatusBadge kind="unavailable" label="Unpublished" />}
          </>
        )}
        {unavailableLabel(listing) && <StatusBadge kind="unavailable" label={unavailableLabel(listing)!} />}
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
          {roomError && <p className="mt-2 text-sm font-bold text-red-600">{roomError}</p>}

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
                    loading={pendingRoomId === room.id}
                    onClick={() => toggleRoom(room)}
                  >
                    {free ? "Mark occupied" : "Mark available"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {editing ? (
        <form onSubmit={saveEdit} className="mt-6 flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]">
          {!shared && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Price</Label>
                <Input id="edit-price" type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-bedrooms">Bedrooms</Label>
                <Input id="edit-bedrooms" type="number" min={0} value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))} />
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea id="edit-description" rows={8} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          {editError && <p role="alert" className="text-sm font-bold text-red-600">{editError}</p>}
          <div className="flex gap-3">
            <Button type="submit" size="dense" loading={saving}>
              Save changes
            </Button>
            <Button type="button" variant="secondary" size="dense" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" size="dense" onClick={startEdit}>
          Edit Listing
        </Button>
        {offMarket ? (
          <Button variant="secondary" size="dense" loading={availabilityBusy} onClick={() => setAvailability("available")}>
            Mark as available
          </Button>
        ) : (
          <Button variant="secondary" size="dense" loading={availabilityBusy} onClick={() => setAvailability(offMarketAction.value)}>
            {offMarketAction.label}
          </Button>
        )}
        {unpublished ? (
          <Button variant="secondary" size="dense" loading={publishBusy} onClick={() => setPublished(true)}>
            Publish again
          </Button>
        ) : (
          // Only an approved (live) listing is publicly visible, so only
          // that one has anything to unpublish.
          listing.status === "live" && (
            <Button variant="destructive" size="dense" loading={publishBusy} onClick={() => setConfirmOpen(true)}>
              Unpublish
            </Button>
          )
        )}
      </div>
      )}
      {publishError && <p role="alert" className="mt-3 text-sm font-bold text-red-600">{publishError}</p>}
      {publishNotice && !publishError && <p role="status" className="mt-3 text-sm font-bold text-[var(--color-status-verified)]">{publishNotice}</p>}
      {unpublished && (
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          This listing is hidden from search, direct links and other people&rsquo;s saved lists. Only you and admins can see it.
        </p>
      )}
      {availabilityError && <p role="alert" className="mt-3 text-sm font-bold text-red-600">{availabilityError}</p>}
      {offMarket && (
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          This listing is hidden from public search but still opens from direct and saved links.
        </p>
      )}

      <ConfirmationDialog
        open={confirmOpen}
        title="Unpublish this listing?"
        description="It will be hidden from tenants and buyers — search, direct links and saved lists. Your listing, views and history are kept, and you can publish it again anytime."
        confirmLabel="Unpublish"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void setPublished(false);
        }}
      />
    </div>
  );
}