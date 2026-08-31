"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { IconStar } from "@/components/ui/icons";
import { useAuthGate } from "@/components/shared/AuthGate";
import { useAuth } from "@/lib/auth-context";
import { availableRooms } from "@/lib/shared-property";
import { SharedRoom } from "@/lib/types";

// PRD §6.4 / DESIGN_INTENT.md §5: Message Landlord is the dominant CTA on
// this screen. Unauthenticated users hit the gated-action flow
// (PRODUCT_DECISIONS.md §9); authenticated users get the composer directly.
//
// TRACKED ITEM #4 (IMPLEMENTATION_NOTES.md): messaging is gated on
// authentication only here, NOT on role-verified state. Whether a
// Landlord/Service Provider role in "pending admin document review" should
// be able to message/be messaged is unresolved — do not add a stricter
// gate here without resolving that question first.
//
// ---------------------------------------------------------------------------
// SHARED PROPERTIES (31 Aug 2026)
//
// When `rooms` is passed, this is a room-by-room listing and the renter picks
// WHICH room they are asking about. That selection travels with the enquiry —
// it does not reserve anything. Room availability is landlord-managed
// (lib/listings-context.tsx); an enquiry never changes it. No booking
// lifecycle was introduced, so PRODUCT_DECISIONS.md §4.2's messaging model is
// intact and PRD §14's deferral of booking still holds.
//
// The picker sits INSIDE the existing composer shell rather than in a new
// panel of its own: "which room" is part of composing the enquiry, and giving
// it separate chrome would make the shared path look like a different product.
// ---------------------------------------------------------------------------
export function ListingActions({
  listingTitle,
  rooms,
}: {
  listingTitle: string;
  /** Present only for a shared listing. Already resolved to current status. */
  rooms?: SharedRoom[];
}) {
  const { requireAuth } = useAuthGate();
  const { isAuthenticated } = useAuth();
  const [composerOpen, setComposerOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [saved, setSaved] = useState(false);

  const isSharedListing = rooms !== undefined;
  const free = rooms ? availableRooms(rooms) : [];
  const noRoomsLeft = isSharedListing && free.length === 0;

  // Preselected rather than left empty: the first available room is a sane
  // default, and it means the CTA is never dead on arrival. Changing it is one
  // tap. Kept as an id so a room going occupied elsewhere cannot leave a stale
  // object selected.
  const [roomId, setRoomId] = useState<string | null>(free[0]?.id ?? null);
  const selectedRoom = free.find((r) => r.id === roomId) ?? free[0] ?? null;

  const enquiryLabel = selectedRoom
    ? `Log in to message the landlord about ${selectedRoom.label} at "${listingTitle}"`
    : `Log in to message the landlord about "${listingTitle}"`;

  const openComposer = () =>
    requireAuth({
      actionLabel: enquiryLabel,
      onResume: () => setComposerOpen(true),
    });

  const toggleSave = () =>
    requireAuth({
      actionLabel: `Log in to save "${listingTitle}"`,
      suggestedRole: "tenant-buyer",
      onResume: () => setSaved((v) => !v),
    });

  if (sent) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-status-verified)] bg-[color-mix(in_srgb,var(--color-status-verified)_8%,transparent)] p-4">
        <p className="font-bold text-[var(--color-status-verified)]">Message sent</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {selectedRoom
            ? `The landlord will see your enquiry about ${selectedRoom.label} in their dashboard and can reply from there.`
            : "The landlord will see your message in their dashboard and can reply from there."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ROOM PICKER — available rooms only. An occupied room is not offered,
          because offering it and then rejecting the enquiry is a worse
          experience than never showing it. */}
      {isSharedListing && !noRoomsLeft && (
        <fieldset>
          <legend className="u-label text-[var(--color-text-secondary)]">Which room?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {free.map((room) => {
              const selected = selectedRoom?.id === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setRoomId(room.id)}
                  className={`min-h-11 rounded-[var(--radius-control)] border px-4 text-sm font-bold transition-[border-color,background-color] duration-[var(--motion-duration-short)] ${
                    selected
                      ? "border-[var(--color-brand-primary)] bg-[color-mix(in_srgb,var(--color-brand-primary)_10%,transparent)] text-[var(--color-text-primary)]"
                      : "border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-deep-blue)]"
                  }`}
                >
                  {room.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* FULLY OCCUPIED — the listing stays entirely viewable, only new
          enquiries stop. Saving is still offered: following a full house until
          a room frees up is exactly what Saved Homes is for. */}
      {noRoomsLeft ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface-dense)]/60 p-4">
          <p className="font-bold text-[var(--color-text-primary)]">All rooms are currently occupied</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            There is nothing to enquire about right now. Save it and you can come back if the landlord
            frees a room.
          </p>
        </div>
      ) : !composerOpen ? (
        <Button onClick={openComposer} size="default">
          {selectedRoom ? `Message about ${selectedRoom.label}` : "Message Landlord"}
        </Button>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] p-4">
          <p className="mb-2 text-xs text-[var(--color-text-secondary)]">
            For your safety, keep communication in the app — this is the only way we can help resolve a
            dispute if something goes wrong (PRD §6.4).
          </p>
          {selectedRoom && (
            <p className="mb-2 text-sm font-bold text-[var(--color-text-primary)]">
              Enquiring about {selectedRoom.label}
            </p>
          )}
          <Textarea
            placeholder={
              selectedRoom
                ? `Hi, I'm interested in ${selectedRoom.label}. Is it still available?`
                : "Hi, I'm interested in this property. Is it still available?"
            }
            rows={3}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" size="dense" onClick={() => setComposerOpen(false)}>
              Cancel
            </Button>
            <Button size="dense" onClick={() => setSent(true)}>
              Send
            </Button>
          </div>
        </div>
      )}
      <button
        onClick={toggleSave}
        className="-mx-2.5 -my-1 inline-flex min-h-11 items-center gap-1.5 self-start rounded-[var(--radius-control)] px-2.5 py-1 text-sm font-bold text-[var(--color-brand-primary)] hover:underline"
        aria-pressed={saved}
      >
        <IconStar filled={saved} className="h-4 w-4" />
        {saved ? "Saved to your Saved Homes" : "Save this home"}
      </button>
      {!isAuthenticated && (
        <p className="text-xs text-[var(--color-text-secondary)]">You&apos;ll be asked to log in or register to continue.</p>
      )}
    </div>
  );
}
