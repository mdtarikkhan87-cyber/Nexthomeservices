import type { HeldRole } from "./auth-context";
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
//
// ---------------------------------------------------------------------------
// ROLE-SELECTION REVISION (31 Aug 2026) — roles vs. activeRole
// ---------------------------------------------------------------------------
// This file now also owns the two route tables that make the distinction
// operational, so no component can invent a third answer:
//
//   ROLE_LANDING_HREF   — where a role LANDS (post-login / post-switch
//                         destination). NOT an access boundary.
//   ROLE_SCOPED_ROUTES  — which routes require `user.roles.includes(role)`.
//                         THIS is the access boundary, and it reads the
//                         permanent role list, never `activeRole`.
//
// Keeping them in one file is what stops "where you land" and "what you may
// open" from quietly becoming the same check again — which is the bug this
// revision exists to fix.
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

// ---------------------------------------------------------------------------
// LANDING PAGES — a destination, never a permission.
//
// These are where a user is sent after login, after answering the "Act as"
// prompt, after switching role, and after adding a role. Being sent somewhere
// says nothing about what you may open: a Landlord landing on the landlord
// dashboard can still browse /listings freely, and a Renter landing on
// /listings can still open any shared route. Access is decided by
// ROLE_SCOPED_ROUTES below, and by nothing else.
// ---------------------------------------------------------------------------
export const ROLE_LANDING_HREF: Record<RoleName, string> = {
  landlord: "/dashboard/landlord",
  "tenant-buyer": "/listings",
  "service-provider": "/dashboard/services",
  advertiser: "/dashboard/ads",
};

export function roleLandingHref(role: RoleName): string {
  return ROLE_LANDING_HREF[role];
}

/** Said plainly in the "Act as" prompt — a choice that does not tell you
    where it takes you is a quiz, not a control. */
export const ROLE_DESTINATION_LABEL: Record<RoleName, string> = {
  "tenant-buyer": "Takes you to Listings",
  landlord: "Takes you to your Landlord dashboard",
  "service-provider": "Takes you to your Service dashboard",
  advertiser: "Takes you to your Advertisements",
};

/**
 * The role's home INSIDE the dashboard shell — what the sidebar's "Overview"
 * item points at.
 *
 * Distinct from ROLE_LANDING_HREF for exactly two roles, and deliberately:
 * a Renter lands on public /listings (not a dashboard page at all) and an
 * Advertiser lands on their ads list, but both still have a dashboard
 * overview to come back to. The client named landing pages, not sidebars, so
 * no route was invented for the two they did not name.
 */
export const ROLE_DASHBOARD_HOME: Record<RoleName, string> = {
  landlord: "/dashboard/landlord",
  "tenant-buyer": "/dashboard",
  "service-provider": "/dashboard/services",
  advertiser: "/dashboard",
};

// ---------------------------------------------------------------------------
// ROUTE ACCESS BUCKETS
//
//   public      — home, listings grid, partial listing detail. Anyone.
//   shared      — full listing detail, enquire, save, /dashboard,
//                 /dashboard/messages, /dashboard/notifications, /account.
//                 ANY logged-in user, whatever role they are acting as.
//   role-scoped — the four dashboards, below.
//
// LISTINGS IS SHARED, NOT TENANT-SCOPED. It is absent from this table on
// purpose: a Landlord-only account must be able to browse listings freely,
// and the Listings nav link stays visible to every logged-in user.
//
// Matching is exact-or-child (`=== prefix || startsWith(prefix + "/")`) rather
// than a bare startsWith, so /dashboard/services and /dashboard/service-listing
// cannot capture one another.
// ---------------------------------------------------------------------------
const ROLE_SCOPED_ROUTES: { prefix: string; role: RoleName }[] = [
  { prefix: "/dashboard/landlord", role: "landlord" },
  { prefix: "/dashboard/listings", role: "landlord" },
  { prefix: "/dashboard/subscription", role: "landlord" },
  { prefix: "/dashboard/saved", role: "tenant-buyer" },
  { prefix: "/dashboard/services", role: "service-provider" },
  { prefix: "/dashboard/service-listing", role: "service-provider" },
  { prefix: "/dashboard/ads", role: "advertiser" },
];

/** The role a path requires, or null if the path is shared/public. */
export function requiredRoleForPath(pathname: string): RoleName | null {
  const match = ROLE_SCOPED_ROUTES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  return match?.role ?? null;
}
