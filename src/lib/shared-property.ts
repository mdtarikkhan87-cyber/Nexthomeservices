import { PropertyListing, SharedRoom } from "./types";

// ---------------------------------------------------------------------------
// Shared-property derivations, in one place.
//
// Every one of these is a READ over data that already exists on the listing.
// Nothing here stores a count, because a stored count is a second source of
// truth that drifts from the rooms the moment a landlord marks one occupied.
// Ask the rooms.
//
// Room availability is landlord-managed and lives in lib/listings-context.tsx
// (see setRoomOccupied there). These helpers take whatever room list the
// caller has resolved, so they work identically on the catalog's base rooms
// and on rooms with this session's landlord changes applied.
// ---------------------------------------------------------------------------

/**
 * The single place "is this shared?" is decided.
 *
 * Call this rather than comparing `occupancyType` directly: the field is
 * optional and absent means "entire", and having one function own that
 * default is what keeps every pre-existing listing valid without a migration.
 */
export function isShared(listing: { occupancyType?: string; type?: string }): boolean {
  return listing.occupancyType === "shared";
}

/** Rooms a renter can still enquire about. */
export function availableRooms(rooms: SharedRoom[]): SharedRoom[] {
  return rooms.filter((r) => r.status === "available");
}

/**
 * True when a shared listing has no rooms left.
 *
 * The listing stays fully viewable in this state — it is only new enquiries
 * that stop. A page that 404s or hides itself the moment the last room goes
 * would break every shared link pointing at it.
 */
export function isFullyOccupied(rooms: SharedRoom[]): boolean {
  return rooms.length > 0 && availableRooms(rooms).length === 0;
}

/** "3 of 4 rooms available" — always says the total, so "1 available" cannot
    be misread as "1 room in total". */
export function roomAvailabilityLabel(rooms: SharedRoom[]): string {
  const free = availableRooms(rooms).length;
  if (rooms.length === 0) return "No rooms listed";
  if (free === 0) return `All ${rooms.length} rooms occupied`;
  return `${free} of ${rooms.length} room${rooms.length === 1 ? "" : "s"} available`;
}

/**
 * Builds the room records for a newly created shared listing.
 *
 * Ids embed the listing id so they are unique across the whole catalog, which
 * is what lets the session room store key on room id alone.
 */
export function buildRooms(listingId: string, totalRooms: number): SharedRoom[] {
  return Array.from({ length: totalRooms }, (_, i) => ({
    id: `${listingId}-r${i + 1}`,
    label: `Room ${i + 1}`,
    status: "available" as const,
  }));
}

/** The rooms on a listing, or an empty list for an entire-property listing. */
export function roomsOf(listing: PropertyListing): SharedRoom[] {
  return isShared(listing) ? (listing.shared?.rooms ?? []) : [];
}
