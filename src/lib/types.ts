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
}

export interface ServiceListing {
  id: string;
  category: string;
  providerName: string;
  description: string;
  photoUrl?: string;
  verified: boolean;
  status: ContentItemState;
}
