import { HeldRole } from "./auth-context";
import { RoleName } from "./types";

// ---------------------------------------------------------------------------
// One vocabulary for roles, in one file.
//
// TERMINOLOGY (Website Revision Spec §3B): the client consistently says
// "Renter". The internal role has always been `tenant-buyer`, because the same
// role also covers buying via a switchable rent/sale context
// (ROLE_EXPERIENCE_AUDIT.md §4 Option C). Renaming the role id would ripple
// through types, mock data and every dashboard branch for no product gain, and
// would lose the buying half of the role.
//
// So: the ROLE ID stays `tenant-buyer`; the LABEL the user reads is now the
// client's own word. When the context is known the label is exactly "Renter"
// or "Buyer"; where it is not, "Renter / Buyer" names both halves honestly.
// This is the terminology-alignment the revision request asked for, resolved
// at the presentation layer rather than by renaming the domain.
//
// Header.tsx and the account page each used to carry their own private copy of
// this map, which is how two surfaces drift into calling the same role two
// different things. There is now one copy.
// ---------------------------------------------------------------------------

export const ROLE_LABELS: Record<RoleName, string> = {
  landlord: "Landlord",
  "tenant-buyer": "Renter / Buyer",
  "service-provider": "Service Provider",
  advertiser: "Advertiser",
};

/** Short form for tight chrome (the header switcher), where the full
    "Renter / Buyer" string is wider than the control it sits in. */
export const ROLE_LABELS_SHORT: Record<RoleName, string> = {
  landlord: "Landlord",
  "tenant-buyer": "Renter",
  "service-provider": "Services",
  advertiser: "Advertiser",
};

export const ROLE_BLURBS: Record<RoleName, string> = {
  landlord: "List a property for rent or sale, and manage enquiries.",
  "tenant-buyer": "Search listings, save homes, and message landlords — free.",
  "service-provider": "Offer a trade service to people moving home — free to join.",
  advertiser: "Promote a business, property, or service on NextHome.",
};

/**
 * The label a user actually reads for a role they hold. For Renter/Buyer the
 * active context resolves the slash: someone browsing rentals is a "Renter",
 * full stop — which is the word the client used throughout the review.
 */
export function roleDisplay(role: RoleName, context?: HeldRole["context"]) {
  if (role === "tenant-buyer") {
    if (context === "rent") return "Renter";
    if (context === "sale") return "Buyer";
  }
  return ROLE_LABELS[role];
}

/**
 * Where a role lands by default.
 *
 * Spec §3B: "Active role determines the default landing view ... Renter →
 * listings-oriented view; Landlord → landlord dashboard." Advertiser and
 * Service Provider are dashboard-shaped roles for the same reason Landlord is
 * — their work lives in a dashboard, not in public browsing.
 */
export function roleLandingHref(role: RoleName): string {
  return role === "tenant-buyer" ? "/listings" : "/dashboard";
}
