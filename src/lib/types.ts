// Shared domain types, modeling the account/role/content-item state layers
// defined in PRODUCT_DECISIONS.md §6. Kept separate and named explicitly so
// UI code can never collapse these three distinct layers into one generic
// "status" — see DESIGN_SYSTEM.md §7.

export type RoleName = "landlord" | "tenant-buyer" | "service-provider" | "advertiser";

// Role-level verification state (PRODUCT_DECISIONS.md §6)
export type RoleState =
  | "role-added" // account-level verified, role-specific requirements outstanding (Landlord/Service Provider only)
  | "pending-admin-document-review" // Landlord/Service Provider only
  | "role-verified";

// Landlord-only subscription state, layered on top of RoleState
export type SubscriptionState = "inactive" | "pending-confirmation" | "active";

// Content-item-level state (a specific listing / service listing / ad)
export type ContentItemState = "pending-review" | "live" | "rejected";

export type ListingType = "rent" | "sale";

// ---------------------------------------------------------------------------
// SHARED PROPERTY (added 31 Aug 2026)
//
// Whether a listing is let as one whole unit or room by room.
//
// NAMING — this is `occupancyType`, NOT `propertyType`. `propertyType` already
// exists below and means the physical form of the building (apartment, duplex,
// bungalow…). It is used by the mock catalog, the wizard, matchesFilters, the
// `?ptype=` URL param, the filter chips and the detail Specification block.
// Reusing that name would have collided with all of it; renaming the existing
// field would have been a refactor across eight files for no user benefit.
// Two different questions, two different fields.
//
// BACKWARD COMPATIBILITY — `occupancyType` is OPTIONAL and absent means
// "entire". Every listing written before this field existed stays valid with
// no migration, and any caller that omits it gets the previous behaviour. Read
// it through `isShared()` in lib/shared-property.ts rather than comparing
// directly, so the absent case is handled in one place.
//
// RENTALS ONLY — a shared property is a tenancy arrangement; there is no such
// thing as buying one room of a house on this platform. Enforced in
// validateStep() and by the wizard, which only offers the choice on a rent
// listing.
// ---------------------------------------------------------------------------

export type OccupancyType = "entire" | "shared";

/** Whether the room's occupant has their own bathroom or shares one. */
export type BathroomType = "private" | "shared";

/**
 * Room-level availability. LANDLORD-MANAGED: an enquiry names a room but
 * never claims it — only the landlord marks a room occupied or available,
 * from the same management page that already handles listing status. This
 * keeps the product inside the approved messaging model (PRODUCT_DECISIONS.md
 * §4.2) instead of introducing the booking lifecycle the PRD deferred (§14).
 */
export type RoomStatus = "available" | "occupied";

/**
 * One lettable room. Rooms are individual records with their own ids so a
 * renter can enquire about a SPECIFIC room, and so availability is a fact per
 * room rather than a counter that can drift away from reality. The available
 * count is always DERIVED from these — see availableRooms() in
 * lib/shared-property.ts — never stored separately.
 */
export interface SharedRoom {
  /** Unique across the catalog: `${listingId}-r${n}`. */
  id: string;
  /** What the renter picks from — "Room 1", "Room 2". */
  label: string;
  status: RoomStatus;
}

/** Everything that only exists when `occupancyType === "shared"`. */
export interface SharedDetails {
  totalRooms: number;
  bathroomType: BathroomType;
  kitchenShared: boolean;
  maxOccupantsPerRoom: number;
  /** Annual rent for ONE room. Mirrored into `PropertyListing.price` on
      creation so price filters, sorting and cards keep working unchanged —
      the number a renter of a shared property actually pays is the room
      rent, so filtering on it is the honest behaviour. */
  rentPerRoom: number;
  rooms: SharedRoom[];
}

export const BATHROOM_TYPE_LABELS: Record<BathroomType, string> = {
  private: "Private bathroom",
  shared: "Shared bathroom",
};

/**
 * The public, pre-registration view of a listing (Website Revision Spec §3B).
 *
 * This is a hard boundary, not a convenience type. The server passes ONLY these
 * fields to the anonymous property-detail view, so the gated fields
 * (description, specification, amenities, full gallery) are never serialised
 * into the HTML or the RSC payload an unregistered visitor receives. Widening
 * this type widens what an anonymous visitor can read — treat any addition as
 * a product decision, not a refactor.
 *
 * The field list is deliberately identical to what the public listing CARD
 * already shows, which is the defensible interim while Spec §4 item 3 (the
 * exact teaser scope) is still open with the client.
 */
export interface ListingTeaser {
  id: string;
  type: ListingType;
  title: string;
  price: number;
  currency: string;
  state: string;
  /** See PropertyListing.lga. */
  lga?: string;
  bedrooms: number;
  photoUrl: string;
  verified: boolean;
  viewCount: number;
  rentDuration?: RentDuration;
  /**
   * WIDENED DELIBERATELY, 31 Aug 2026 — recorded in REVISION_LOG.md §15 as a
   * product decision, per the rule stated above.
   *
   * Whether the listing is shared is a CATEGORY LABEL, the same class of fact
   * as type, bedrooms and rentDuration, which this teaser already carries. The
   * public card shows the badge, so withholding it here would make the card
   * and the page it links to disagree — which reads as a bug, not as privacy.
   *
   * Nothing room-LEVEL crosses this boundary: available count, rent per room,
   * bathroom type, kitchen sharing and occupants per room are all gated, and
   * none of them appear in this type.
   */
  occupancyType?: OccupancyType;
  /** A COUNT, never the URLs — "3 more photos" is a fact about the listing;
      the photos themselves are part of what registration unlocks. */
  galleryCount: number;
}
export type RentDuration = "short-term" | "long-term";

// ---------------------------------------------------------------------------
// FILTERING EXTENSION (added for the expanded filter system)
//
// SCOPE NOTE — these four dimensions are NOT in the approved source docs.
// PRODUCT_UNDERSTANDING.md §88/§189 and PRODUCT_DECISIONS.md §40 both
// enumerate the approved filter set as exactly "state, price, bedrooms,
// Short-Term/Long-Term". Property type, bathrooms, amenities and furnishing
// were requested directly and are implemented here, but they EXTEND the
// approved model rather than implement it — flagged, not silently added
// (CLAUDE.md: "Do not invent product requirements").
//
// All four are optional so existing listings, the dashboard, and any future
// backend payload remain valid without them, and every filter treats a
// missing value as "unknown" rather than as a match.
// ---------------------------------------------------------------------------

/** Physical form of the property. Values chosen to match the Nigerian
    market the catalog already describes (Lekki flats, Abuja duplexes). */
export type PropertyType = "apartment" | "duplex" | "bungalow" | "terrace" | "studio" | "detached";

/** Rental-market concern primarily — a buyer rarely filters on it, so the
    UI exposes this on /rent only (see PropertyBrowser). */
export type FurnishingStatus = "furnished" | "semi-furnished" | "unfurnished";

/** Fixed vocabulary, not free text — same reasoning the PRD applies to the
    state dropdown (§4: "so results stay accurate"). A free-text amenity
    field cannot be filtered on reliably. */
export type Amenity =
  | "borehole"
  | "power-backup"
  | "gated-security"
  | "parking"
  | "air-conditioning"
  | "fitted-kitchen"
  | "swimming-pool"
  | "balcony";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment",
  duplex: "Duplex",
  bungalow: "Bungalow",
  terrace: "Terrace",
  studio: "Studio",
  detached: "Detached House",
};

export const FURNISHING_LABELS: Record<FurnishingStatus, string> = {
  furnished: "Furnished",
  "semi-furnished": "Semi-Furnished",
  unfurnished: "Unfurnished",
};

export const AMENITY_LABELS: Record<Amenity, string> = {
  borehole: "Borehole / Water",
  "power-backup": "Power Backup",
  "gated-security": "Gated Security",
  parking: "Parking",
  "air-conditioning": "Air Conditioning",
  "fitted-kitchen": "Fitted Kitchen",
  "swimming-pool": "Swimming Pool",
  balcony: "Balcony",
};

// ROLE_EXPERIENCE_AUDIT.md §4, Option C (approved via PRODUCT_DECISIONS.md
// "Renter/Buyer Context" decision): Tenant/Buyer stays ONE role — renting
// vs. buying is a switchable CONTEXT within it, not a separate role. Reuses
// the existing rent/sale vocabulary rather than inventing new terms.
export type TenantBuyerContext = ListingType;

export interface PropertyListing {
  id: string;
  type: ListingType;
  title: string;
  price: number;
  currency: "USD" | "NGN";
  state: string;
  /** Local Government Area within `state`. Optional on the type so listings
      created before LGAs existed still parse; a listing without one simply
      cannot match an LGA filter. See lib/nigeria-locations.ts. */
  lga?: string;
  bedrooms: number;
  rentDuration?: RentDuration;
  /** See the FILTERING EXTENSION note above — optional by design, and a
      missing value never counts as a match against an active filter. */
  propertyType?: PropertyType;
  bathrooms?: number;
  furnishing?: FurnishingStatus;
  amenities?: Amenity[];
  photoUrl: string;
  /** Additional gallery images beyond the primary photoUrl — presentational
      only (COMPONENT_ARCHITECTURE.md's "Property Image Gallery" was already
      approved scope, just not previously populated with data). */
  galleryUrls?: string[];
  verified: boolean;
  status: ContentItemState;
  viewCount: number;
  description: string;
  /** Absent means "entire" — see the SHARED PROPERTY note above. */
  occupancyType?: OccupancyType;
  /** Present only when `occupancyType === "shared"`, and only on rentals. */
  shared?: SharedDetails;
}

export interface ServiceListing {
  id: string;
  category: string;
  providerName: string;
  description: string;
  /** The state the provider works in. Same vocabulary as
      PropertyListing.state, read from lib/nigeria-locations.ts, so one
      location filter can serve both sides of the product. */
  state: string;
  /**
   * COVERAGE AREA — every LGA within `state` this provider will travel to.
   *
   * A trade is not "at" an address the way a property is: an electrician
   * based in Lagos Mainland may work across Surulere, Yaba and Ikeja, and
   * modelling that as one base LGA hid them from every customer in the other
   * three. So this is a list, and the filter asks "do you cover here?", not
   * "are you here?".
   *
   * An EMPTY list means the provider covers the whole state — that is a real
   * answer (a mobile mechanic taking calls anywhere in Lagos), not missing
   * data, and it matches every LGA filter within that state.
   */
  lgas: string[];
  photoUrl?: string;
  verified: boolean;
  status: ContentItemState;
}
