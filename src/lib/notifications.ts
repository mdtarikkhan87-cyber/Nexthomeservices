import { RoleName } from "./types";
import { StatusKind } from "@/components/ui/StatusBadge";

// ---------------------------------------------------------------------------
// Notification vocabulary and seed feed.
//
// ARCHITECTURE NOTE — this project has no backend: no API routes, no server
// actions, no database, and auth itself is in-memory React state that resets
// on reload (lib/auth-context.tsx). Notifications therefore CANNOT be
// persistent or cross-user here. What follows is deliberately shaped like the
// payload a real endpoint would return, so the swap to `GET /notifications`
// is a change to notification-context.tsx alone.
//
// EVENT SCOPE — every notification below corresponds to a state transition
// the product ALREADY models (PRODUCT_DECISIONS.md §6):
//   ContentItemState   pending-review → live | rejected   (listings/services/ads)
//   RoleState          role-added → pending-admin-document-review → role-verified
//   SubscriptionState  inactive → pending-confirmation → active
//   plus on-platform messaging (PRD §6.4)
//
// Deliberately NOT modelled: property visits / booking updates. No booking
// system exists — PRODUCT_UNDERSTANDING.md §203 records Short-/Long-Term as
// "a filter tag only — not a separate booking system… a booking calendar
// would be a separately scoped addition". Inventing those events would mean
// inventing the subsystem behind them.
// ---------------------------------------------------------------------------

export type NotificationKind =
  | "enquiry" // someone messaged you about a listing / service
  | "content-status" // a listing, service listing or ad changed state
  | "account" // account- or role-level verification update
  | "subscription"; // landlord subscription state

export interface AppNotification {
  id: string;
  /** Which role's feed this belongs to. A user holding several roles sees
      the feed for whichever role is active, matching how the dashboard
      already scopes everything else. */
  role: RoleName;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Deep link to the screen that resolves the notification. */
  href?: string;
  /** Reuses the shared StatusBadge vocabulary so a "Live"/"Rejected"
      notification reads identically to the badge on the item itself
      (DESIGN_SYSTEM.md §7: one state, one label, everywhere). */
  status?: StatusKind;
  /**
   * Pre-formatted relative time rather than a timestamp.
   *
   * Deliberate: a Date.now() computed while rendering would produce one value
   * during SSR and a different one on hydration, which React reports as a
   * mismatch. With no backend to supply real timestamps there is nothing to
   * gain from live-calculating them, so the seed carries static labels and
   * genuinely-triggered notifications are stamped "Just now".
   */
  ago: string;
  read: boolean;
}

export const KIND_LABELS: Record<NotificationKind, string> = {
  enquiry: "Enquiry",
  "content-status": "Listing status",
  account: "Account",
  subscription: "Subscription",
};

/**
 * Seed feed — events that already happened before this session.
 *
 * Kept deliberately small (2–4 per role). The brief was explicit about not
 * padding the page, and a notification feed's credibility comes from every
 * row being actionable, not from volume. Each entry names a real listing or
 * provider from mock-data.ts and links to the screen that resolves it.
 */
export const SEED_NOTIFICATIONS: AppNotification[] = [
  // ---- Landlord -----------------------------------------------------------
  {
    id: "n-ll-1",
    role: "landlord",
    kind: "enquiry",
    title: "New enquiry received",
    body: "Adaeze Okafor asked about “2-Bedroom Flat, Lekki Phase 1”.",
    href: "/dashboard/messages",
    ago: "12m ago",
    read: false,
  },
  {
    id: "n-ll-2",
    role: "landlord",
    kind: "content-status",
    title: "Listing approved",
    body: "“3-Bedroom Bungalow, Ibadan” passed review and is now live.",
    href: "/dashboard/listings",
    status: "live",
    ago: "3h ago",
    read: false,
  },
  {
    id: "n-ll-3",
    role: "landlord",
    kind: "content-status",
    title: "Listing needs changes",
    body: "“Studio Apartment, Yaba” was rejected in review. Edit it and resubmit.",
    href: "/dashboard/listings",
    status: "rejected",
    ago: "Yesterday",
    read: true,
  },
  {
    id: "n-ll-4",
    role: "landlord",
    kind: "subscription",
    title: "Subscription awaiting confirmation",
    body: "We've received your payment details and are confirming them.",
    href: "/dashboard/subscription",
    status: "pending",
    ago: "2d ago",
    read: true,
  },

  // ---- Tenant / Buyer -----------------------------------------------------
  {
    id: "n-tb-1",
    role: "tenant-buyer",
    kind: "enquiry",
    title: "Landlord replied",
    body: "You have a reply about “2-Bedroom Flat, Lekki Phase 1”.",
    href: "/dashboard/messages",
    ago: "1h ago",
    read: false,
  },
  {
    id: "n-tb-2",
    role: "tenant-buyer",
    kind: "account",
    title: "Your account is verified",
    body: "Phone and email confirmed — you can message landlords and save homes.",
    href: "/account",
    status: "verified",
    ago: "2d ago",
    read: true,
  },

  // ---- Service provider ---------------------------------------------------
  {
    id: "n-sp-1",
    role: "service-provider",
    kind: "enquiry",
    title: "New contact request",
    body: "A homeowner in Lagos asked about your electrical services.",
    href: "/dashboard/messages",
    ago: "40m ago",
    read: false,
  },
  {
    id: "n-sp-2",
    role: "service-provider",
    kind: "content-status",
    title: "Service listing is live",
    body: "Your listing passed review and is now visible in the directory.",
    href: "/dashboard/service-listing",
    status: "live",
    ago: "4h ago",
    read: false,
  },
  {
    id: "n-sp-3",
    role: "service-provider",
    kind: "account",
    title: "Documents under review",
    body: "Our team is checking the ID you uploaded. We'll let you know either way.",
    href: "/account",
    status: "pending",
    ago: "2d ago",
    read: true,
  },

  // ---- Advertiser ---------------------------------------------------------
  {
    id: "n-ad-1",
    role: "advertiser",
    kind: "content-status",
    title: "Advertisement is live",
    body: "Your campaign passed content review and is now running.",
    href: "/dashboard/ads",
    status: "live",
    ago: "5h ago",
    read: false,
  },
  {
    id: "n-ad-2",
    role: "advertiser",
    kind: "content-status",
    title: "Advertisement in review",
    body: "We're reviewing your submission and will confirm placement and terms.",
    href: "/dashboard/ads",
    status: "pending",
    ago: "3d ago",
    read: true,
  },
];
